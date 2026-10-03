import { playRecordedCoachAudio, preloadRecordedCoachAudio, stopRecordedCoachAudio } from "./recorded-coach-player";
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

export function preloadMarcusAudio() {
  preloadRecordedCoachAudio(INTRO_URL);
  preloadRecordedCoachAudio(PACK_URL);
}

export function stopMarcusCue() {
  stopRecordedCoachAudio("marcus");
}

export function playMarcusCue(cue: MarcusCue): Promise<boolean> {
  return playRecordedCoachAudio(
    cue === "intro" ? INTRO_URL : PACK_URL,
    "marcus",
    cue === "intro" ? undefined : SEGMENTS[cue],
  );
}
