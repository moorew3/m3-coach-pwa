/**
 * COACH VOICE — mobile-first coaching audio
 * ------------------------------------------------------------------
 * Real-device lesson (Samsung Android): streamed PCM on a forced 24 kHz
 * AudioContext is NOT reliable. Some Android builds refuse a non-native
 * sample rate, and a context created/awaited after a `fetch` loses the
 * user-gesture activation and stays suspended — silently.
 *
 * ORDER OF PLAY (all user-visible through the diagnostics panel):
 *   0. TAP        AudioContext created + resumed SYNCHRONOUSLY inside the
 *                 tap, HTMLAudioElements unlocked in the same tick, then a
 *                 local confirmation tone before any network work.
 *   1. FILE       Complete MP3 from /api/public/coach-speech, played with a
 *                 pre-unlocked HTMLAudioElement. Primary path.
 *   2. STREAM     Streamed PCM over Web Audio (desktop-friendly, low latency).
 *   3. BROWSER    speechSynthesis, fallback only.
 *   4. NONE       Reported loudly — never a silent failure.
 */

export type VoiceStatus = "unsupported" | "locked" | "ready" | "blocked";

/** Emotional delivery phase — drives the TTS style prompt. */
export type CoachTone =
  | "calm"
  | "instructional"
  | "assertive"
  | "urgent"
  | "reassuring"
  | "attentive"
  | "hype"
  | "settle"
  | "proud";

export type VoicePath = "file" | "stream" | "browser" | "none";

export interface VoiceDiagnostics {
  status: VoiceStatus;
  path: VoicePath;
  unlocked: boolean;
  ctxState: string;
  ctxSampleRate: number | null;
  elementUnlocked: boolean;
  localTone: "untested" | "played" | "failed";
  lastHttpStatus: number | null;
  lastFormat: "mp3" | "pcm" | null;
  bytes: number;
  chunks: number;
  scheduled: boolean;
  fallbackFired: string | null;
  speechSynthesis: boolean;
  lastLine: string | null;
  lastError: string | null;
}

let status: VoiceStatus = "locked";
const diag: VoiceDiagnostics = {
  status: "locked",
  path: "none",
  unlocked: false,
  ctxState: "none",
  ctxSampleRate: null,
  elementUnlocked: false,
  localTone: "untested",
  lastHttpStatus: null,
  lastFormat: null,
  bytes: 0,
  chunks: 0,
  scheduled: false,
  fallbackFired: null,
  speechSynthesis: false,
  lastLine: null,
  lastError: null,
};

const listeners = new Set<() => void>();
let version = 0;
const emit = () => {
  version += 1;
  diag.status = status;
  diag.ctxState = ctx?.state ?? "none";
  diag.ctxSampleRate = ctx?.sampleRate ?? null;
  listeners.forEach((l) => l());
};

function setStatus(s: VoiceStatus) {
  status = s;
  emit();
}

function note(patch: Partial<VoiceDiagnostics>) {
  Object.assign(diag, patch);
  emit();
}

/* --------------------------- capability check -------------------------- */

function AC(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  );
}

const browserSpeechAvailable = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof window.SpeechSynthesisUtterance === "function";

export function voiceAvailable(): boolean {
  if (typeof window === "undefined") return false;
  return !!AC() || typeof Audio === "function" || browserSpeechAvailable();
}

export function getVoiceStatus(): VoiceStatus {
  if (typeof window === "undefined") return "locked";
  if (!voiceAvailable()) return "unsupported";
  return status;
}

export function voicePath(): VoicePath {
  return diag.path;
}

export function voiceError(): string | null {
  return diag.lastError;
}

export function getDiagnostics(): VoiceDiagnostics {
  return diag;
}

export function diagnosticsVersion(): number {
  return version;
}

export function subscribeVoice(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/* ------------------------------ Web Audio ------------------------------ */

const PCM_RATE = 24000;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let generation = 0;
let live: AudioBufferSourceNode[] = [];
let playhead = 0;
let analyser: AnalyserNode | null = null;
let levelBuf: Uint8Array | null = null;
const cache = new Map<string, Float32Array>();

/**
 * Never force a sample rate: Android refuses rates the output device does
 * not support, and the resulting context is dead on arrival. PCM buffers
 * are created at 24 kHz and resampled by the browser at playback time.
 */
function ensureContext(): AudioContext | null {
  const Ctor = AC();
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    /* A PASSIVE TAP for the coach's mouth animation. The analyser is a
       side branch off the master gain and is never connected onward, so
       it cannot alter, delay or silence a single sample of playback. */
    try {
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.35;
      master.connect(analyser);
      levelBuf = new Uint8Array(analyser.fftSize);
    } catch {
      analyser = null;
    }
  }
  return ctx;
}

/* ------------------- coach volume + speech activity ------------------- */

let coachVol = 1;

/** 0–1 output level for the coach voice on every playback path. */
export function setCoachVolume(v: number) {
  coachVol = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = coachVol;
  if (elMain) elMain.volume = coachVol;
  if (elOverlay) elOverlay.volume = coachVol;
  emit();
}

export function getCoachVolume(): number {
  return coachVol;
}

/**
 * Music ducking hook: anything that plays alongside the coach subscribes
 * here and lowers itself while he talks instead of being stopped.
 */
const speechListeners = new Set<(on: boolean) => void>();
let speechOn = false;
let speechGuard: ReturnType<typeof setTimeout> | null = null;

export function onCoachSpeech(cb: (on: boolean) => void) {
  speechListeners.add(cb);
  return () => speechListeners.delete(cb);
}

export function isCoachSpeaking(): boolean {
  return speechOn;
}

function setSpeechActive(on: boolean, capMs = 0) {
  if (speechGuard) {
    clearTimeout(speechGuard);
    speechGuard = null;
  }
  if (on && capMs > 0) speechGuard = setTimeout(() => setSpeechActive(false), capMs);
  if (on === speechOn) return;
  speechOn = on;
  if (on) startLevelLoop();
  else stopLevelLoop();
  speechListeners.forEach((l) => l(on));
}

/* --------------------------- MOUTH LEVEL BUS ---------------------------
 * Drives the coach's mouth. It is ONLY ever non-zero while a playback path
 * has verified that sound is actually coming out of the phone, because it
 * is started and stopped by setSpeechActive() — the same honest signal the
 * "Coach speaking" state uses. Silence therefore always means a still mouth.
 *
 * Two sources:
 *  · analyser  — real amplitude, tapped off the Web Audio master gain
 *                (the streamed-PCM path).
 *  · envelope  — a syllable-timed approximation used when the audio is
 *                played by an <audio> element or the browser's own speech
 *                engine, neither of which exposes its waveform without
 *                re-routing (and risking) the audio itself.
 */
const levelListeners = new Set<(v: number) => void>();
let coachLevel = 0;
let levelRaf: ReturnType<typeof setInterval> | null = null;
let levelMode: "analyser" | "envelope" = "envelope";
let levelSeed = 0;
let levelStart = 0;

/** Which source the mouth should follow for the line about to play. */
function setLevelSource(mode: "analyser" | "envelope", text = "") {
  levelMode = mode;
  levelSeed = text.length % 7;
  levelStart = Date.now();
}

function pushLevel(v: number) {
  const next = Math.max(0, Math.min(1, v));
  if (Math.abs(next - coachLevel) < 0.02) return;
  coachLevel = next;
  levelListeners.forEach((l) => l(coachLevel));
}

function startLevelLoop() {
  if (levelRaf) return;
  levelStart = levelStart || Date.now();
  levelRaf = setInterval(() => {
    if (levelMode === "analyser" && analyser && levelBuf) {
      analyser.getByteTimeDomainData(levelBuf as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (let i = 0; i < levelBuf.length; i += 4) {
        const d = (levelBuf[i] - 128) / 128;
        sum += d * d;
      }
      const rms = Math.sqrt(sum / (levelBuf.length / 4));
      pushLevel(Math.min(1, rms * 5.5));
      return;
    }
    // Syllable-paced envelope: ~4.6 syllables/sec with phrase-level shaping
    // and a little jitter, so it reads as speech rather than a metronome.
    const t = (Date.now() - levelStart) / 1000;
    const syll = 0.5 - 0.5 * Math.cos(2 * Math.PI * 4.6 * t + levelSeed);
    const phrase = 0.62 + 0.38 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 0.33 * t));
    const jitter = 0.5 - 0.5 * Math.cos(2 * Math.PI * 11.7 * t + levelSeed * 1.7);
    const gap = Math.sin(2 * Math.PI * 0.21 * t + levelSeed) < -0.86 ? 0.08 : 1;
    pushLevel(Math.pow(syll, 1.35) * phrase * (0.82 + 0.18 * jitter) * gap);
  }, 55);
}

function stopLevelLoop() {
  if (levelRaf) clearInterval(levelRaf);
  levelRaf = null;
  coachLevel = 0;
  levelListeners.forEach((l) => l(0));
}

/** Subscribe to the coach's live mouth level (0–1). */
export function onCoachLevel(cb: (v: number) => void) {
  levelListeners.add(cb);
  return () => levelListeners.delete(cb);
}

export function getCoachLevel(): number {
  return coachLevel;
}

function stopSources() {
  for (const s of live) {
    try {
      s.onended = null;
      s.stop();
    } catch {
      /* already finished */
    }
  }
  live = [];
  playhead = 0;
}

function scheduleFloats(floats: Float32Array, gen: number) {
  const c = ctx;
  if (!c || !master || gen !== generation || floats.length === 0) return;
  const buf = c.createBuffer(1, floats.length, PCM_RATE);
  (buf.copyToChannel as (f: Float32Array, ch: number) => void)(floats, 0);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(master);
  if (playhead === 0) playhead = c.currentTime + 0.06;
  else playhead = Math.max(playhead, c.currentTime);
  src.start(playhead);
  playhead += buf.duration;
  live.push(src);
  diag.scheduled = true;
  src.onended = () => {
    live = live.filter((s) => s !== src);
  };
}

/** Local confirmation tone / countdown beep on the unlocked context. */
export function playTone(freq = 720, ms = 180, gain = 0.16): boolean {
  const c = ensureContext();
  if (!c) {
    note({ localTone: "failed", lastError: "No AudioContext on this browser." });
    return false;
  }
  try {
    if (c.state === "suspended") void c.resume().catch(() => {});
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
    o.connect(g).connect(c.destination);
    o.start(t);
    o.stop(t + ms / 1000 + 0.02);
    note({ localTone: "played" });
    return true;
  } catch (err) {
    note({
      localTone: "failed",
      lastError: err instanceof Error ? err.message : "Tone failed.",
    });
    return false;
  }
}

const pcmToFloats = (bytes: Uint8Array): Float32Array => {
  const usable = bytes.length - (bytes.length % 2);
  const out = new Float32Array(usable / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, usable);
  for (let i = 0; i < out.length; i++) out[i] = view.getInt16(i * 2, true) / 32768;
  return out;
};

const b64 = (s: string): Uint8Array => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const cacheable = (text: string) => text.length <= 90;

/** Rough spoken length — used to pace speech-led steps when no `onended` fires. */
export function estimateSpeechSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const pauses = (text.match(/[.!?…—]/g) ?? []).length;
  return Math.max(1.5, words / 2.6 + pauses * 0.28 + 0.6);
}

/** Per-request completion hook; only the newest generation may fire it. */
let endHook: { gen: number; cb: () => void } | null = null;
function fireEnd(gen: number) {
  setSpeechActive(false);
  if (endHook && endHook.gen === gen) {
    const cb = endHook.cb;
    endHook = null;
    cb();
  }
}

/* --------------------- PATH 1: complete MP3 file ---------------------- */

const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=";

let elMain: HTMLAudioElement | null = null;
let elOverlay: HTMLAudioElement | null = null;
/** Bounded LRU of object URLs so a whole session can be pre-buffered. */
const urlCache = new Map<string, string>();
const URL_CACHE_MAX = 120;
function remember(key: string, url: string) {
  if (urlCache.has(key)) urlCache.delete(key);
  urlCache.set(key, url);
  while (urlCache.size > URL_CACHE_MAX) {
    const oldest = urlCache.keys().next().value as string | undefined;
    if (!oldest) break;
    const u = urlCache.get(oldest);
    urlCache.delete(oldest);
    if (u) URL.revokeObjectURL(u);
  }
}
const inflight = new Map<string, Promise<string | null>>();

/** Fetch one MP3 segment into the cache (deduped). Never throws. */
async function fetchMp3(text: string, tone: CoachTone): Promise<string | null> {
  const key = `mp3::${tone}::${text}`;
  const hit = urlCache.get(key);
  if (hit) return hit;
  const running = inflight.get(key);
  if (running) return running;
  const p = (async () => {
    try {
      const res = await fetchSpeech(text, tone, "mp3");
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        note({ lastError: detail.slice(0, 200) || `Coach voice error ${res.status}` });
        return null;
      }
      const blob = await res.blob();
      note({ bytes: blob.size, chunks: 1 });
      if (!blob.size) {
        note({ lastError: "Coach voice returned an empty audio file." });
        return null;
      }
      const url = URL.createObjectURL(blob);
      remember(key, url);
      return url;
    } catch (err) {
      note({ lastError: err instanceof Error ? err.message : "Coach voice request failed." });
      return null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

/**
 * PRE-BUFFER upcoming coaching so transitions never wait on the network.
 * Runs sequentially in the background; only meaningful on the file path.
 */
const prefetchQueue: { text: string; tone: CoachTone }[] = [];
let prefetching = false;
export function prefetchSpeech(lines: { text: string; tone: CoachTone }[]) {
  if (status !== "ready" || diag.path === "browser" || diag.path === "stream") return;
  for (const l of lines) {
    if (!l.text) continue;
    const key = `mp3::${l.tone}::${l.text}`;
    if (urlCache.has(key) || inflight.has(key)) continue;
    if (!prefetchQueue.some((q) => q.text === l.text && q.tone === l.tone)) prefetchQueue.push(l);
  }
  if (prefetching) return;
  prefetching = true;
  void (async () => {
    while (prefetchQueue.length) {
      const next = prefetchQueue.shift()!;
      await fetchMp3(next.text, next.tone);
    }
    prefetching = false;
  })();
}

/** Diagnostics: how many segments are buffered and ready to play instantly. */
export function bufferedSegments(): number {
  return urlCache.size;
}

function makeElement(): HTMLAudioElement | null {
  if (typeof Audio !== "function") return null;
  const el = new Audio();
  el.preload = "auto";
  el.volume = coachVol;
  el.crossOrigin = "anonymous";
  (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
  return el;
}

/** Called INSIDE the tap: a played-then-paused element stays playable. */
function unlockElements() {
  elMain = elMain ?? makeElement();
  elOverlay = elOverlay ?? makeElement();
  let ok = false;
  for (const el of [elMain, elOverlay]) {
    if (!el) continue;
    try {
      el.src = SILENT_WAV;
      const p = el.play();
      ok = true;
      if (p && typeof p.catch === "function") {
        p.then(() => el.pause()).catch(() => {
          /* still counts: src is primed */
        });
      }
    } catch {
      /* ignore */
    }
  }
  note({ elementUnlocked: ok });
}

async function fetchSpeech(text: string, tone: CoachTone, format: "mp3" | "pcm") {
  const res = await fetch("/api/public/coach-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, tone, format }),
  });
  note({ lastHttpStatus: res.status, lastFormat: format, lastLine: text.slice(0, 80) });
  return res;
}

/**
 * Resolve only when the element is VERIFIABLY producing audio: the
 * `playing` event fired AND the playhead actually advanced. Android
 * Chrome can resolve `play()` on an element it never renders (blocked
 * autoplay, lost gesture, muted output route) — that used to be reported
 * as success, which is exactly how "Coach speaking" ended up silent.
 */
function verifyStart(el: HTMLAudioElement, ms = 2500): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok: boolean) => {
      if (settled) return;
      settled = true;
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
      clearTimeout(timer);
      resolve(ok);
    };
    const onPlaying = () => {
      // Give the playhead a moment to prove it is really moving.
      const t0 = el.currentTime;
      setTimeout(() => done(!el.paused && (el.currentTime > t0 || el.currentTime > 0.05)), 320);
    };
    const onError = () => done(false);
    const timer = setTimeout(() => done(false), ms);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);
  });
}

async function playFile(
  text: string,
  tone: CoachTone,
  gen: number,
  interrupt: boolean,
): Promise<boolean> {
  const el = interrupt
    ? (elMain ?? (elMain = makeElement()))
    : (elOverlay ?? (elOverlay = makeElement()));
  if (!el) return false;
  try {
    const url = await fetchMp3(text, tone);
    if (!url) return false;
    if (gen !== generation) return true; // superseded by a newer line
    el.onended = null;
    el.src = url;
    el.volume = coachVol;
    el.muted = false;
    try {
      el.currentTime = 0;
    } catch {
      /* not seekable yet */
    }
    el.onended = () => {
      el.onended = null;
      // The line is over: the mouth must close on the same event.
      if (gen === generation) setSpeechActive(false);
      fireEnd(gen);
    };
    // Anything that stops this element — a pause, an interrupt, the OS
    // pulling audio away — also stops the mouth. Never lip movement over
    // a silent phone.
    el.onpause = () => {
      if (gen === generation) setSpeechActive(false);
    };
    const started = verifyStart(el);
    await el.play();
    const audible = await started;
    if (!audible) {
      note({
        lastError:
          diag.lastError ?? "Audio element reported no audible playback (blocked or muted output).",
      });
      try {
        el.pause();
      } catch {
        /* ignore */
      }
      return false;
    }
    setLevelSource("envelope", text);
    if (gen === generation) setSpeechActive(true, estimateSpeechSeconds(text) * 1800 + 5000);
    note({ scheduled: true, lastError: null });
    return true;
  } catch (err) {
    note({
      lastError: err instanceof Error ? `${err.name}: ${err.message}` : "Audio element failed.",
    });
    return false;
  }
}

/* ------------------- PATH 2: streamed PCM (Web Audio) ------------------ */

async function playStreamed(text: string, tone: CoachTone, gen: number): Promise<boolean> {
  const c = ensureContext();
  if (!c) return false;
  if (c.state === "suspended") await c.resume().catch(() => {});
  // A suspended context schedules buffers that are never heard. Treat that
  // as a failure so the next path gets a chance instead of faking success.
  if (c.state !== "running") {
    note({ lastError: `AudioContext is ${c.state}; Web Audio would be silent.` });
    return false;
  }

  const key = `${tone}::${text}`;
  const hit = cache.get(key);
  if (hit) {
    scheduleFloats(hit, gen);
    setLevelSource("analyser");
    setSpeechActive(true, estimateSpeechSeconds(text) * 1800 + 5000);
    setTimeout(() => fireEnd(gen), Math.max(0, (playhead - c.currentTime) * 1000) + 80);
    return true;
  }

  try {
    const res = await fetchSpeech(text, tone, "pcm");
    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      note({ lastError: detail.slice(0, 200) || `Coach voice error ${res.status}` });
      return false;
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    let carry = new Uint8Array(0);
    const collected: Float32Array[] = [];
    let got = false;
    let bytes = 0;
    let chunks = 0;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      if (gen !== generation) {
        await reader.cancel().catch(() => {});
        return true;
      }
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === "[DONE]") continue;
        let payload: { type?: string; audio?: string; delta?: string };
        try {
          payload = JSON.parse(raw);
        } catch {
          continue;
        }
        // Accept both the documented delta event and a bare `delta` field.
        const audio = payload.audio ?? payload.delta;
        if (!audio || (payload.type && !payload.type.includes("audio"))) continue;
        const incoming = b64(audio);
        bytes += incoming.length;
        chunks += 1;
        const merged = new Uint8Array(carry.length + incoming.length);
        merged.set(carry);
        merged.set(incoming, carry.length);
        const usable = merged.length - (merged.length % 2);
        carry = merged.slice(usable);
        if (usable === 0) continue;
        const floats = pcmToFloats(merged.subarray(0, usable));
        if (!got) setLevelSource("analyser");
        if (!got) setSpeechActive(true, estimateSpeechSeconds(text) * 1800 + 5000);
        got = true;
        collected.push(floats);
        scheduleFloats(floats, gen);
      }
    }
    note({ bytes, chunks });

    if (!got) {
      note({ lastError: "Coach voice stream returned no audio chunks." });
      return false;
    }
    if (cacheable(text)) {
      const total = collected.reduce((n, f) => n + f.length, 0);
      const all = new Float32Array(total);
      let o = 0;
      for (const f of collected) {
        all.set(f, o);
        o += f.length;
      }
      cache.set(key, all);
    }
    note({ lastError: null });
    setTimeout(() => fireEnd(gen), Math.max(0, (playhead - c.currentTime) * 1000) + 80);
    return true;
  } catch (err) {
    note({ lastError: err instanceof Error ? err.message : "Coach voice request failed." });
    return false;
  }
}

/* ------------------- PATH 3: browser speech (fallback) ----------------- */

let chosen: SpeechSynthesisVoice | null = null;
let watchdog: ReturnType<typeof setInterval> | null = null;

const VOICE_KEY = "agt.coach.browservoice.v1";

/**
 * FALLBACK VOICE IDENTITY. The coach is a mature, deeper-voiced man, so a
 * bright female or child preset is never acceptable — even when the browser
 * engine is all that is left. Voices are SCORED (male markers up, female and
 * novelty markers hard down, known deeper presets up) and the winner is
 * persisted per device so every line of the session comes from one voice.
 */
function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${v.voiceURI}`.toLowerCase();
  let s = 0;
  if (/^en(-|_|$)/i.test(v.lang)) s += 40;
  if (/en[-_]us/i.test(v.lang)) s += 6;
  if (/\bmale\b|\bman\b/.test(n)) s += 30;
  if (/female|woman|\bwomen\b/.test(n)) s -= 80;
  // Common lighter / female-default presets on Android, Samsung and iOS.
  if (
    /samantha|aria|zira|susan|karen|moira|tessa|fiona|joana|serena|victoria|jenny|salli|kendra/.test(
      n,
    )
  )
    s -= 70;
  // Deeper, mature male presets, best first.
  if (
    /\bguy\b|\bdavid\b|\bmatthew\b|\bbrian\b|\bdaniel\b|\balex\b|\bfred\b|\bgordon\b|\baaron\b|\bjoey\b|\bethan\b/.test(
      n,
    )
  )
    s += 22;
  if (/\bmale 1\b|\bmale1\b|#male|_m\b/.test(n)) s += 12;
  if (/novelty|whisper|bells|bubbles|cellos|organ|trinoids|zarvox|robot|kid|child/.test(n)) s -= 90;
  if (v.localService) s += 8; // installed voices survive offline and are stable
  if (v.default) s += 2;
  return s;
}

function pick(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;
  // Same device, same coach: reuse the stored choice when it still exists.
  try {
    const saved = window.localStorage.getItem(VOICE_KEY);
    const hit = saved ? voices.find((v) => v.voiceURI === saved) : null;
    if (hit) return hit;
  } catch {
    /* storage unavailable — score fresh */
  }
  const best = [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] ?? null;
  if (best) {
    try {
      window.localStorage.setItem(VOICE_KEY, best.voiceURI);
    } catch {
      /* ignore */
    }
  }
  return best;
}

/** The browser-fallback voice actually in use, for diagnostics. */
export function selectedBrowserVoice(): string | null {
  return chosen ? `${chosen.name} (${chosen.lang})` : null;
}

export function loadVoices(timeoutMs = 3000): Promise<SpeechSynthesisVoice[]> {
  if (!browserSpeechAvailable()) return Promise.resolve([]);
  diag.speechSynthesis = true;
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) {
    chosen = chosen ?? pick(now);
    return Promise.resolve(now);
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const v = synth.getVoices();
      chosen = chosen ?? pick(v);
      resolve(v);
    };
    synth.addEventListener?.("voiceschanged", finish, { once: true });
    setTimeout(finish, timeoutMs);
  });
}

function startWatchdog() {
  if (watchdog || !browserSpeechAvailable()) return;
  watchdog = setInterval(() => {
    try {
      const s = window.speechSynthesis;
      if (s.speaking && s.paused) s.resume();
    } catch {
      /* ignore */
    }
  }, 4000);
}

// Browser-speech FALLBACK only. Pitch is kept in the lower register across
// every tone so the fallback voice still reads as the same mature coach.
const BROWSER_STYLE: Record<CoachTone, { rate: number; pitch: number; volume: number }> = {
  calm: { rate: 0.96, pitch: 0.82, volume: 1 },
  instructional: { rate: 0.98, pitch: 0.84, volume: 1 },
  assertive: { rate: 1.02, pitch: 0.84, volume: 1 },
  urgent: { rate: 1.1, pitch: 0.9, volume: 1 },
  reassuring: { rate: 0.93, pitch: 0.8, volume: 0.9 },
  attentive: { rate: 0.96, pitch: 0.84, volume: 0.95 },
  hype: { rate: 1.06, pitch: 0.88, volume: 1 },
  settle: { rate: 0.88, pitch: 0.78, volume: 0.85 },
  proud: { rate: 0.95, pitch: 0.82, volume: 1 },
};

/**
 * Browser speech, verified. `synth.speak()` returning without throwing
 * proves nothing on Android — the utterance is queued and can die silently
 * if no voice is installed yet or the engine is still waking up. We only
 * report success once `onstart` actually fires.
 */
async function speakBrowser(
  text: string,
  tone: CoachTone,
  interrupt: boolean,
  gen = generation,
): Promise<boolean> {
  if (!browserSpeechAvailable()) return false;
  try {
    const synth = window.speechSynthesis;
    // Voices load asynchronously on Android; speaking before they exist
    // is one of the classic silent failures.
    if (!chosen) await loadVoices(2000);
    if (gen !== generation) return true;
    if (interrupt) {
      synth.cancel();
      await new Promise((r) => setTimeout(r, 80)); // cancel() needs a tick
    }
    synth.resume?.();
    const style = BROWSER_STYLE[tone];
    const u = new SpeechSynthesisUtterance(text);
    if (chosen) u.voice = chosen;
    u.lang = chosen?.lang ?? "en-US";
    u.rate = Math.max(0.5, Math.min(1.5, style.rate));
    u.pitch = Math.max(0.5, Math.min(1.5, style.pitch));
    u.volume = Math.max(0, Math.min(1, style.volume * coachVol));

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(ok);
      };
      const timer = setTimeout(() => {
        // Never started: let the caller fall through instead of pretending.
        try {
          synth.cancel();
        } catch {
          /* ignore */
        }
        note({ lastError: "speechSynthesis never started (no voice available)." });
        done(false);
      }, 2200);
      u.onstart = () => {
        setLevelSource("envelope", text);
        setSpeechActive(true, estimateSpeechSeconds(text) * 1800 + 5000);
        note({ scheduled: true, lastError: null });
        done(true);
      };
      u.onend = () => {
        done(true);
        fireEnd(gen);
      };
      u.onerror = (e) => {
        const err = (e as SpeechSynthesisErrorEvent).error;
        if (err === "interrupted" || err === "canceled") return done(true);
        note({ lastError: `speechSynthesis: ${err}` });
        if (err === "not-allowed") {
          pending = { text, tone };
          setStatus("locked");
        }
        done(false);
      };
      try {
        synth.speak(u);
        startWatchdog();
      } catch {
        done(false);
      }
    });
  } catch {
    return false;
  }
}

/* ------------------------------ unlocking ----------------------------- */

let unlocking: Promise<VoiceStatus> | null = null;

/**
 * MUST be called from inside a real user gesture. Everything that needs
 * the gesture happens SYNCHRONOUSLY first — context, elements, local tone —
 * and only then do we touch the network.
 */
export function unlockVoice(
  confirmation = "Coach audio on. Let's begin.",
  tone: CoachTone = "calm",
): Promise<VoiceStatus> {
  if (!voiceAvailable()) {
    setStatus("unsupported");
    return Promise.resolve("unsupported");
  }
  if (unlocking) return unlocking;

  /* ---- synchronous, inside the tap ---- */
  const c = ensureContext();
  if (c) {
    void c.resume().catch(() => {});
    try {
      const silent = c.createBufferSource();
      silent.buffer = c.createBuffer(1, 1, c.sampleRate);
      silent.connect(c.destination);
      silent.start(0);
    } catch {
      /* ignore */
    }
  }
  unlockElements();
  playTone(660, 140);
  note({ unlocked: true, fallbackFired: null, scheduled: false });
  keepAlive();

  unlocking = (async () => {
    try {
      void loadVoices();
      generation += 1;
      stopSources();
      const gen = generation;

      if (await playFile(confirmation, tone, gen, true)) {
        note({ path: "file" });
        setStatus("ready");
        return "ready" as VoiceStatus;
      }

      note({ fallbackFired: "file -> stream" });
      if (c && (await playStreamed(confirmation, tone, gen))) {
        note({ path: "stream" });
        setStatus("ready");
        return "ready" as VoiceStatus;
      }

      note({ fallbackFired: "stream -> browser speech" });
      if (await speakBrowser(confirmation, tone, true)) {
        note({ path: "browser" });
        setStatus("ready");
        return "ready" as VoiceStatus;
      }

      note({ path: "none", fallbackFired: "all paths failed" });
      setStatus("blocked");
      return "blocked" as VoiceStatus;
    } finally {
      unlocking = null;
    }
  })();

  return unlocking;
}

/**
 * Android suspends the context when the screen locks or the tab blurs;
 * a suspended context plays nothing and reports no error.
 */
let keepAliveOn = false;
function keepAlive() {
  if (keepAliveOn || typeof document === "undefined") return;
  keepAliveOn = true;
  const resume = () => {
    if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
    emit();
  };
  document.addEventListener("visibilitychange", resume);
  window.addEventListener("focus", resume);
  window.addEventListener("pointerdown", resume);
  setInterval(resume, 5000);
}

/* ------------------------------ speaking ------------------------------ */

let pending: { text: string; tone: CoachTone } | null = null;

export function pendingLine(): string | null {
  return pending?.text ?? null;
}

export function dropPending() {
  pending = null;
}

export interface SpeakOptions {
  tone?: CoachTone;
  /** Cut off whatever is currently being said. Default true. */
  interrupt?: boolean;
  /**
   * Fires once this line has finished playing (any path). Lets the
   * session pace speech-led chapters instead of running a blind timer.
   * Not fired when the line is superseded, muted or fails outright.
   */
  onEnd?: () => void;
}

export function speak(text: string, enabled: boolean, opts: SpeakOptions = {}) {
  const tone = opts.tone ?? "assertive";
  const interrupt = opts.interrupt ?? true;
  if (!enabled || !text) return;
  if (!voiceAvailable()) {
    setStatus("unsupported");
    return;
  }
  if (status !== "ready") {
    pending = { text, tone };
    if (status !== "blocked") setStatus("locked");
    return;
  }

  if (interrupt) {
    generation += 1;
    stopSources();
    try {
      elMain?.pause();
    } catch {
      /* ignore */
    }
    if (browserSpeechAvailable()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* ignore */
      }
    }
  }
  const gen = generation;
  // NOTE: "speaking" is NOT set here. It is set by the playback path that
  // actually produces sound, so the UI can never claim the coach is talking
  // while the phone is silent.
  if (opts.onEnd) endHook = { gen, cb: opts.onEnd };
  else if (interrupt) endHook = null;
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});

  const order: VoicePath[] =
    diag.path === "browser"
      ? ["browser", "file", "stream"]
      : diag.path === "stream"
        ? ["stream", "file", "browser"]
        : ["file", "stream", "browser"];

  void (async () => {
    for (const p of order) {
      if (gen !== generation) return;
      let ok = false;
      if (p === "file") ok = await playFile(text, tone, gen, interrupt);
      else if (p === "stream") ok = await playStreamed(text, tone, gen);
      else ok = await speakBrowser(text, tone, interrupt, gen);
      if (ok) {
        if (diag.path !== p) note({ path: p, fallbackFired: `switched to ${p}` });
        return;
      }
      note({ fallbackFired: `${p} failed` });
    }
    note({ path: "none" });
    setSpeechActive(false);
    setStatus("blocked");
  })();
}

/** Speaks whatever cue was missed while audio was locked. */
export function flushPending(enabled: boolean) {
  if (!pending || status !== "ready") return;
  const line = pending;
  pending = null;
  speak(line.text, enabled, { tone: line.tone });
}

export function stopSpeech() {
  generation += 1;
  setSpeechActive(false);
  stopSources();
  try {
    elMain?.pause();
    elOverlay?.pause();
  } catch {
    /* ignore */
  }
  if (browserSpeechAvailable()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
}

/**
 * In-session self-test: local tone first, then a short coach phrase.
 * Reports exactly which stage failed so the user can say what their real
 * phone did.
 */
export async function testCoachAudio(): Promise<{
  tone: boolean;
  speech: boolean;
  path: VoicePath;
  detail: string;
}> {
  const c = ensureContext();
  if (c) void c.resume().catch(() => {});
  unlockElements();
  const toneOk = playTone(880, 220);
  generation += 1;
  const gen = generation;
  const line = "Coach audio test. If you can hear this, you're good to train.";

  let speechOk = await playFile(line, "calm", gen, true);
  let used: VoicePath = "file";
  if (!speechOk) {
    note({ fallbackFired: "test: file -> stream" });
    speechOk = await playStreamed(line, "calm", gen);
    used = "stream";
  }
  if (!speechOk) {
    note({ fallbackFired: "test: stream -> browser speech" });
    speechOk = await speakBrowser(line, "calm", true);
    used = "browser";
  }
  if (speechOk) {
    note({ path: used });
    setStatus("ready");
  } else {
    used = "none";
    note({ path: "none" });
  }

  const detail = !toneOk
    ? "Device audio is blocked: even a local tone could not play. Check silent mode, volume, Bluetooth output and site sound permissions."
    : !speechOk
      ? `Local tone played but coach speech failed (${diag.lastError ?? "unknown error"}).`
      : `Local tone and coach speech both played via the ${used} path.`;
  return { tone: toneOk, speech: speechOk, path: used, detail };
}

/* -------------------------------- react ------------------------------- */

import { useSyncExternalStore } from "react";

export function useVoiceStatus(): VoiceStatus {
  return useSyncExternalStore(subscribeVoice, getVoiceStatus, () => "locked" as VoiceStatus);
}

/** Re-renders the diagnostics panel whenever anything about audio changes. */
export function useVoiceDiagnostics(): VoiceDiagnostics {
  useSyncExternalStore(subscribeVoice, diagnosticsVersion, () => 0);
  return diag;
}

/**
 * TRUE only while audio is verifiably playing. Any "Coach speaking"
 * indicator must read from here, never from an optimistic flag.
 */
export function useCoachSpeaking(): boolean {
  return useSyncExternalStore(
    (cb) => onCoachSpeech(() => cb()),
    isCoachSpeaking,
    () => false,
  );
}

/**
 * Live mouth level (0–1) for the coach's face. Non-zero ONLY while a
 * playback path has verified audible speech, so the mouth can never move
 * over a silent phone.
 */
export function useCoachLevel(): number {
  return useSyncExternalStore(
    (cb) => onCoachLevel(() => cb()),
    getCoachLevel,
    () => 0,
  );
}