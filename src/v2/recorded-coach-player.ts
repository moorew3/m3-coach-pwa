/** One gesture-unlocked output for recorded coaching across every viewpoint. */
type Clip = { url: string; group: string; segment?: readonly [number, number]; waitForEnd: boolean; resolve: (started: boolean) => void };
let context: AudioContext | null = null;
let current: { clip: Clip; source: AudioBufferSourceNode | null } | null = null;
const queue: Clip[] = [];
const downloads = new Map<string, Promise<ArrayBuffer>>();

function download(url: string) {
  let pending = downloads.get(url);
  if (!pending) {
    pending = fetch(url, { signal: AbortSignal.timeout(15000) }).then(async (response) => {
      if (!response.ok) throw new Error('Coach audio unavailable');
      return response.arrayBuffer();
    });
    downloads.set(url, pending);
    void pending.catch(() => downloads.delete(url));
  }
  return pending;
}

export function preloadRecordedCoachAudio(url: string) {
  if (typeof window !== 'undefined') void download(url).catch(() => undefined);
}

export function unlockRecordedCoachAudio(): boolean {
  if (typeof window === 'undefined') return false;
  const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Constructor) return false;
  try {
    context ??= new Constructor();
    // Called synchronously inside Start; later network completions keep this output.
    void context.resume().catch(() => undefined);
    return true;
  } catch { return false; }
}

async function pump() {
  if (current || !queue.length || !context) return;
  const clip = queue.shift()!;
  const playback = { clip, source: null as AudioBufferSourceNode | null };
  current = playback;
  try {
    const bytes = await download(clip.url);
    if (current !== playback) return;
    const buffer = await context.decodeAudioData(bytes.slice(0));
    if (current !== playback) return;
    if (context.state !== 'running') throw new Error('Audio output locked');
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    playback.source = source;
    source.onended = () => {
      source.disconnect();
      if (clip.waitForEnd) clip.resolve(true);
      if (current === playback) { current = null; void pump(); }
    };
    if (clip.segment) source.start(0, clip.segment[0], clip.segment[1] - clip.segment[0]);
    else source.start();
    if (!clip.waitForEnd) clip.resolve(true);
  } catch {
    if (current === playback) {
      current = null;
      clip.resolve(false);
      void pump();
    }
  }
}

export function playRecordedCoachAudio(url: string, group: string, segment?: readonly [number, number], waitForEnd = false): Promise<boolean> {
  if (!unlockRecordedCoachAudio()) return Promise.resolve(false);
  return new Promise((resolve) => {
    // Keep the current sentence intact, while bounding stale queued instructions.
    // A deliberately discarded cue is handled; do not fire a fallback voice.
    while (queue.length >= 2) queue.shift()!.resolve(true);
    queue.push({ url, group, segment, waitForEnd, resolve });
    void pump();
  });
}

export function stopRecordedCoachAudio(group: string) {
  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].group === group) queue.splice(i, 1)[0].resolve(true);
  }
  if (current?.clip.group === group) {
    const previous = current;
    current = null;
    // Cancellation is intentional, not a playback failure.
    previous.clip.resolve(true);
    if (previous.source) {
      previous.source.onended = null;
      try { previous.source.stop(); previous.source.disconnect(); } catch { /* already ended */ }
    }
    void pump();
  }
}
