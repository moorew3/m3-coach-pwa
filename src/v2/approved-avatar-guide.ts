/**
 * Exact legacy avatar-guide fallbacks for V2.
 * These are the app's existing two-panel START/FINISH exercise cards.
 * They are static guides, not motion video, and are used only when the
 * exact exercise has no approved moving coach clip.
 */
import { EXERCISE_IMAGES, type ExerciseImage } from "@/data/exercise-images";
import type { V2Exercise } from "./types";

const RECOVERED_ORIGINAL_GUIDES: Readonly<Record<string, ExerciseImage>> = {
  romanianDeadlift: {
    src: "/media/recovered-avatar/romanian-deadlift.webp",
    title: "Romanian Deadlift",
    cues: ["Soft knees", "Hips back", "Long spine · weights stay close"],
    equipment: "Dumbbells or barbell",
  },
  hamstringCurl: {
    src: "/media/recovered-avatar/hamstring-curl.webp",
    title: "Hamstring Curl",
    cues: ["Hips stay pinned", "Curl smoothly", "Slow controlled return"],
    equipment: "Leg curl machine",
  },
};

const GUIDE_KEY_BY_MOTION: Record<string, string> = {
  easyWalk: "inclineTreadmillWalk",
  treadmillWalk: "inclineTreadmillWalk",
  externalRotation: "shoulderExternalRotation",
  chestSupportedRow: "chestSupportedRow",
  chestPress: "chestPress",
  rearDeltFly: "rearDeltFly",
  legPress: "legPress",
  hammerCurl: "hammerCurl",
  hamstringCurl: "legCurl",
  latPulldown: "latPulldown",
  seatedRow: "seatedRow",
  lateralRaise: "lateralRaise",
  inclineDumbbellPress: "inclineDumbbellPress",
  bandPullApart: "bandPullApart",
  deadBug: "deadBug",
  gluteBridge: "gluteBridge",
  tricepsPressdown: "tricepPushdown",
};

export function approvedAvatarGuide(exercise?: V2Exercise): ExerciseImage | undefined {
  if (!exercise) return undefined;
  const recovered = RECOVERED_ORIGINAL_GUIDES[exercise.motionKey];
  if (recovered) return recovered;
  const key = GUIDE_KEY_BY_MOTION[exercise.motionKey];
  return key ? EXERCISE_IMAGES[key] : undefined;
}
