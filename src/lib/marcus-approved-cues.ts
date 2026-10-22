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
  tricepsPressdown: [19.3, 25.04],
  shadowboxPunches: [25.57, 31.88],
  shadowboxPunches60: [25.57, 31.88],
  frontRaise: [40.92, 46.49],
  dumbbellFrontRaise: [40.92, 46.49],
  alternatingCurl: [47.13, 51.7],
  bandPullApart: [51.73, 58.15],
};
const laterSets: Record<number, [number, number]> = {
  1: [0.28, 5.35], // second set
  2: [5.66, 8.39], // third set
  3: [8.57, 11.6], // fourth set
};
let active: { stepKey: string; element: HTMLAudioElement; end: number } | null = null;

export function getMarcusCue(stepKey: string, mirror: string | undefined, setIndex: number): Slice | null {
  const intro = mirror ? firstSet[mirror] : undefined;
  if (!intro) return null; // No invented cue for an unmatched movement.
  if (setIndex === 0) return { src: TECHNIQUE, start: intro[0], end: intro[1] };
  const next = laterSets[Math.min(setIndex, 3)];
  return next ? { src: LATER_SETS, start: next[0], end: next[1] } : null;
}

/** Called only after the exact work-set video has fired 'playing'. */
export function playMarcusWorkCue(stepKey: string, mirror: string | undefined, setIndex: number): boolean {
  if (typeof Audio === "undefined") return false;
  const clip = getMarcusCue(stepKey, mirror, setIndex);
  if (!clip) { stopMarcusWorkCue(); return false; }
  if (active?.stepKey === stepKey) {
    if (active.element.paused && active.element.currentTime < active.end) {
      void active.element.play().catch(() => undefined);
    }
    return true;
  }
  stopMarcusWorkCue();
  const element = new Audio(clip.src);
  element.preload = "auto";
  element.onloadedmetadata = () => {
    try { if (element.currentTime < clip.start) element.currentTime = clip.start; } catch { /* browser not seekable yet */ }
  };
  element.currentTime = clip.start;
  const session = { stepKey, element, end: clip.end };
  active = session;
  element.ontimeupdate = () => {
    if (element.currentTime >= clip.end && active === session) {
      element.pause();
      element.ontimeupdate = null;
    }
  };
  void element.play().catch(() => undefined);
  return true;
}
export function pauseMarcusWorkCue() { active?.element.pause(); }
export function stopMarcusWorkCue() {
  if (!active) return;
  const element = active.element;
  active = null;
  element.pause();
  element.ontimeupdate = null;
  element.onloadedmetadata = null;
  element.removeAttribute("src");
  element.load();
}
