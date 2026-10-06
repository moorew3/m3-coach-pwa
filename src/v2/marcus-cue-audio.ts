import { playRecordedCoachAudio, preloadRecordedCoachAudio, stopRecordedCoachAudio } from "./recorded-coach-player";
/** All clips use the owner's approved Marcus voice. Full trainer recordings
 * share the same gesture-unlocked output as the short control cues. */

export type MarcusCue = "intro" | "start" | "rest" | "next" | "setTwo" | "complete";

const INTRO_URL = "/media/marcus-trainer/intro.mp3";
const PACK_URL = "/media/marcus/cues.wav";

const SEGMENTS: Record<Exclude<MarcusCue, "intro">, readonly [number, number]> = {
  start: [0.26, 0.80],
  rest: [1.07, 1.66],
  next: [2.04, 2.46],
  setTwo: [2.63, 3.28],
  complete: [3.52, 4.60],
};

export function preloadMarcusAudio() {
  preloadRecordedCoachAudio(INTRO_URL);
  preloadRecordedCoachAudio(PACK_URL);
}

export function stopMarcusCue() {
  stopRecordedCoachAudio("marcus");
}

export function playMarcusCue(cue: MarcusCue, waitForEnd = false): Promise<boolean> {
  return playRecordedCoachAudio(
    cue === "intro" ? INTRO_URL : PACK_URL,
    "marcus",
    cue === "intro" ? undefined : SEGMENTS[cue],
    waitForEnd,
  );
}
