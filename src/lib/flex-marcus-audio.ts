/**
 * Approved Marcus-only audio player for M3 FLEX.
 * Never synthesizes a different voice, never invokes a paid provider.
 * These are existing user-approved original Marcus recordings.
 */
export const MARCUS_VOICE_ID = "0fadce1e82af494a93873aa38ea8d106";
export const MARCUS_APPROVED_TEST_URL =
  "https://d2ol7oe51mr4n9.cloudfront.net/user_3K9xbNmff2bXeIoip4mpHRDh2md/9226f649-9808-4275-b269-bcc93d3b0342.mp3";

export interface MarcusPlaybackHandlers {
  onPlaying?: () => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

let active: HTMLAudioElement | null = null;
let generation = 0;
let watchdog: ReturnType<typeof setTimeout> | null = null;
function clearGuard() {
  if (watchdog !== null) clearTimeout(watchdog);
  watchdog = null;
}

/** Playback stops when users navigate away. No generic device speech fallback. */
export function stopApprovedMarcus() {
  generation++;
  clearGuard();
  if (!active) return;
  active.onplaying = null;
  active.onended = null;
  active.onerror = null;
  try { active.pause(); active.currentTime = 0; } catch { /* unmounted */ }
  active = null;
}

export function marcusRecordedAudioAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.Audio === "function";
}

/**
 * Must be called directly from a user's click to comply with mobile autoplay.
 * This plays an approved clip, not a synthetic reading of arbitrary answers.
 */
export function playApprovedMarcusTest(handlers: MarcusPlaybackHandlers = {}): boolean {
  stopApprovedMarcus();
  if (!marcusRecordedAudioAvailable()) {
    handlers.onError?.("This browser cannot play approved Marcus recordings.");
    return false;
  }
  const token = generation;
  let started = false;
  let settled = false;
  const sound = new window.Audio(MARCUS_APPROVED_TEST_URL);
  active = sound;
  sound.preload = "auto";
  sound.loop = false;
  sound.volume = 1;
  const fail = (message: string) => {
    if (generation !== token || settled) return;
    settled = true;
    clearGuard();
    handlers.onError?.(message);
    stopApprovedMarcus();
  };
  sound.onplaying = () => {
    if (generation !== token || settled) return;
    clearGuard();
    if (!started) { started = true; handlers.onPlaying?.(); }
  };
  sound.onended = () => {
    if (generation !== token || settled) return;
    settled = true;
    clearGuard();
    handlers.onDone?.();
    stopApprovedMarcus();
  };
  sound.onerror = () =>
    fail("The approved Marcus recording could not load. No substitute voice was used.");
  watchdog = setTimeout(() => {
    if (!started) fail("Marcus audio did not start. Check media volume and Chrome sound permissions.");
  }, 6500);
  try {
    const result = sound.play();
    if (result && typeof result.catch === "function") {
      result.catch(() => fail("Chrome blocked Marcus playback. Tap Test Marcus again or check your media volume."));
    }
  } catch {
    fail("Chrome could not start Marcus audio. No replacement voice was used.");
    return false;
  }
  return true;
}
