/**
 * OFFLINE / STAGING Marcus cue player.
 * These are the owner's existing accepted Marcus – Warm & Friendly recordings.
 * This module NEVER synthesizes a substitute voice and never claims to
 * perform all prescribed on-screen repetitions.
 */
export const MARCUS_VOICE_ID = "0fadce1e82af494a93873aa38ea8d106" as const;
const TECHNIQUE = "https://resource2.heygen.ai/text_to_speech/2f2323079d3c414087f76bbfd67fb0f5/0fadce1e82af494a93873aa38ea8d106/id=c18e177c-7551-4541-91ce-c34e25ad16b6.wav";
const LATER_SETS = "https://resource2.heygen.ai/text_to_speech/2f2323079d3c414087f76bbfd67fb0f5/0fadce1e82af494a93873aa38ea8d106/id=87deaa52-e40f-4609-8702-ca8cf89d9646.wav";

type Slice = { src: string; start: number; end: number };
const firstSet: Record<string, [number, number]> = {
  lateralRaise: [0, 7.82],
  hammerCurl: [8.42, 13.5],
  shrugs: [13.95, 18.47],
  tricepsPressdown: [19.3, 25.04],
  shadowboxPunches: [25.57, 31.88],
  shadowboxPunches60: [25.57, 31.88],
  chestPress: [32.44, 40.2],
  frontRaise: [40.92, 46.49],
  dumbbellFrontRaise: [40.92, 46.49],
  alternatingCurl: [47.13, 51.7],
  bandPullApart: [51.73, 58.15],
  breathing: [58.48, 62.7],
  cooldownBreathing: [63.17, 68.76],
};
const laterSets: Record<number, [number, number]> = {
  1: [0.28, 5.35], // second set
  2: [5.66, 8.39], // third set
  3: [8.57, 11.6], // fourth set
};
type CueSession = {
  stepKey: string;
  element: HTMLAudioElement;
  start: number;
  end: number;
  requested: boolean;
  finished: boolean;
  seekReady: boolean;
};
let active: CueSession | null = null;

function startIfReady(session: CueSession) {
  if (active !== session || !session.requested || session.finished || !session.seekReady) return;
  if (!session.element.paused) return;
  void session.element.play().catch(() => {
    // Mobile audio permission may still require a direct user gesture.
    // Never substitute a different voice or count an unheard cue as spoken.
  });
}

export function getMarcusCue(stepKey: string, mirror: string | undefined, setIndex: number): Slice | null {
  const intro = mirror ? firstSet[mirror] : undefined;
  if (!intro) return null; // No invented cue for an unmatched movement.
  if (setIndex === 0) return { src: TECHNIQUE, start: intro[0], end: intro[1] };
  const next = laterSets[Math.min(setIndex, 3)];
  return next ? { src: LATER_SETS, start: next[0], end: next[1] } : null;
}

/** Called only after the matching VIDEO has fired the genuine playing event. */
export function playMarcusWorkCue(stepKey: string, mirror: string | undefined, setIndex: number): boolean {
  if (typeof Audio === "undefined") return false;
  const clip = getMarcusCue(stepKey, mirror, setIndex);
  if (!clip) { stopMarcusWorkCue(); return false; }
  if (active?.stepKey === stepKey) {
    active.requested = true;
    startIfReady(active); // Resume the same sentence, never start another copy.
    return true;
  }
  stopMarcusWorkCue();
  const element = new Audio();
  element.preload = "auto";
  const session: CueSession = {
    stepKey, element, start: clip.start, end: clip.end,
    requested: true, finished: false, seekReady: false,
  };
  active = session;
  // Do not call play() until metadata is loaded AND the segment has been
  // seeked to its correct start. This prevents the beginning of the long
  // recorded voice file leaking into a completely different exercise cue.
  const seekAndStart = () => {
    if (active !== session || element.readyState < 1 || session.seekReady) return;
    if (clip.start <= 0.001) {
      session.seekReady = true;
      startIfReady(session);
      return;
    }
    try {
      element.currentTime = clip.start;
      // Wait for onseeked; setting currentTime may trigger another request,
      // and starting while still seeking can leak the wrong audio phrase.
    } catch { /* retry when the stream becomes seekable */ }
  };
  element.onloadedmetadata = seekAndStart;
  element.oncanplay = seekAndStart;
  element.onseeked = () => {
    if (active !== session || Math.abs(element.currentTime - clip.start) > 0.35) return;
    session.seekReady = true;
    startIfReady(session);
  };
  element.ontimeupdate = () => {
    if (active !== session) return;
    if (element.currentTime >= clip.end - 0.06) {
      session.finished = true;
      session.requested = false;
      element.pause();
    }
  };
  element.onended = () => {
    if (active !== session) return;
    session.finished = true;
    session.requested = false;
  };
  element.src = clip.src;
  element.load();
  return true;
}
export function pauseMarcusWorkCue() {
  if (!active) return;
  active.requested = false;
  active.element.pause();
}
export function stopMarcusWorkCue() {
  if (!active) return;
  const element = active.element;
  active = null;
  element.pause();
  element.ontimeupdate = null;
  element.onloadedmetadata = null;
  element.oncanplay = null;
  element.onseeked = null;
  element.onended = null;
  element.removeAttribute("src");
  element.load();
}
