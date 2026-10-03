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

function endpoint(key: string) {
  return `/api/public/friday-coach-audio?key=${encodeURIComponent(key)}`;
}

export function stopFridayPremiumCue() {
  stopRecordedCoachAudio("friday");
}

export function hasFridayPremiumCue(motionKey?: string): boolean {
  return Boolean(motionKey && FRIDAY_KEYS.has(motionKey));
}

export function preloadFridayPremiumCue(motionKey?: string) {
  if (hasFridayPremiumCue(motionKey)) preloadRecordedCoachAudio(endpoint(motionKey!));
}

export function playFridayPremiumCue(motionKey?: string): Promise<boolean> {
  if (!hasFridayPremiumCue(motionKey)) return Promise.resolve(false);
  return playRecordedCoachAudio(endpoint(motionKey!), "friday");
}
