/**
 * EXACT MARCUS CUE AUDIO
 * ------------------------------------------------------------------
 * These clips were generated in the owner's connected HeyGen workspace with
 * voice 0fadce1e82af494a93873aa38ea8d106 (Marcus - Warm & Friendly).
 *
 * The current HeyGen Free speech allowance is exhausted, so V2 uses this
 * compact reusable pack without substituting a different speaker. Detailed
 * coaching text remains on screen until a server-side HeyGen credential is
 * available for dynamic Marcus speech.
 */

export type MarcusCue = "intro" | "start" | "rest" | "next" | "setTwo" | "complete";

const INTRO_URL = "/media/marcus/intro.wav";
const PACK_URL = "/media/marcus/cues.wav";

const SEGMENTS: Record<Exclude<MarcusCue, "intro">, readonly [number, number]> = {
  start: [0.26, 0.80],
  rest: [1.07, 1.66],
  next: [2.04, 2.46],
  setTwo: [2.63, 3.28],
  complete: [3.52, 4.60],
};

let active: HTMLAudioElement | null = null;
let introPlayer: HTMLAudioElement | null = null;
let packPlayer: HTMLAudioElement | null = null;
let stopTimer: number | null = null;
let generation = 0;

function ensurePlayer(kind: "intro" | "pack"): HTMLAudioElement {
  const existing = kind === "intro" ? introPlayer : packPlayer;
  if (existing) return existing;

  const audio = new Audio(kind === "intro" ? INTRO_URL : PACK_URL);
  audio.preload = "auto";
  audio.volume = 1;
  audio.muted = false;

  if (kind === "intro") introPlayer = audio;
  else packPlayer = audio;
  return audio;
}

export function preloadMarcusAudio() {
  if (typeof window === "undefined") return;
  try {
    ensurePlayer("intro").load();
    ensurePlayer("pack").load();
  } catch {
    // Preloading is best-effort. The user gesture can still start playback.
  }
}

export function stopMarcusCue() {
  generation += 1;
  if (stopTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (active) {
    try {
      active.pause();
      active.currentTime = 0;
    } catch {
      // Ignore media teardown failures.
    }
    active = null;
  }
}

function waitForMetadata(audio: HTMLAudioElement): Promise<void> {
  if (Number.isFinite(audio.duration) && audio.duration > 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const done = () => {
      cleanup();
      resolve();
    };
    const fail = () => {
      cleanup();
      reject(new Error("Marcus cue audio could not load."));
    };
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", done);
      audio.removeEventListener("error", fail);
    };
    audio.addEventListener("loadedmetadata", done, { once: true });
    audio.addEventListener("error", fail, { once: true });
    audio.load();
  });
}

export async function playMarcusCue(cue: MarcusCue): Promise<boolean> {
  if (typeof window === "undefined") return false;
  stopMarcusCue();
  const myGeneration = generation;
  const audio = ensurePlayer(cue === "intro" ? "intro" : "pack");
  // Coach clarity takes priority. The same persistent player is preloaded
  // before Start, and playback is full volume with microphone capture separate.
  audio.volume = 1;
  audio.muted = false;
  active = audio;

  try {
    if (cue === "intro") {
      // Important on Android: call play() before the first await so this runs
      // inside the user's actual tap and permanently unlocks site audio.
      await audio.play();
      audio.addEventListener("ended", () => {
        if (active === audio && myGeneration === generation) active = null;
      }, { once: true });
      return true;
    }

    await waitForMetadata(audio);
    if (myGeneration !== generation || active !== audio) return false;

    const [start, end] = SEGMENTS[cue];
    audio.currentTime = start;
    await audio.play();
    if (myGeneration !== generation || active !== audio) return false;
    stopTimer = window.setTimeout(() => {
      if (active === audio && myGeneration === generation) {
        audio.pause();
        active = null;
        stopTimer = null;
      }
    }, Math.max(150, (end - start) * 1000));
    return true;
  } catch {
    if (active === audio) active = null;
    return false;
  }
}
