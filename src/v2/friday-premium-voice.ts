import { playRecordedCoachAudio, preloadRecordedCoachAudio, stopRecordedCoachAudio } from "./recorded-coach-player";
const FRIDAY_KEYS = new Set([
  "easyWalk",
  "lowerBodyMobility",
  "gluteBridge",
  "squat",
  "romanianDeadlift",
  "trapBarDeadlift",
  "legPress",
  "bulgarianSplitSquat",
  "hamstringCurl",
  "chestPress",
  "seatedRow",
  "lateralRaise",
  "dumbbellCurl",
  "tricepsPressdown",
  "suitcaseCarry",
]);

const AUDIO_ALIASES: Record<string, string> = {
  treadmillWalk: "easyWalk",
  inclineWalk: "easyWalk",
  backSquat: "squat",
};
const audioKey = (key: string) => AUDIO_ALIASES[key] ?? key;
function endpoint(key: string) {
  return `/media/coaching/${audioKey(key)}.mp3`;
}

export function stopFridayPremiumCue() {
  stopRecordedCoachAudio("friday");
}

export function hasFridayPremiumCue(motionKey?: string): boolean {
  // These restored recordings have an unverified speaker. The owner requires
  // only the approved Marcus voice; retain the assets without playing them.
  return false;
}

export function preloadFridayPremiumCue(motionKey?: string) {
  if (hasFridayPremiumCue(motionKey)) preloadRecordedCoachAudio(endpoint(motionKey!));
}

export function playFridayPremiumCue(motionKey?: string): Promise<boolean> {
  if (!hasFridayPremiumCue(motionKey)) return Promise.resolve(false);
  return playRecordedCoachAudio(endpoint(motionKey!), "friday");
}
