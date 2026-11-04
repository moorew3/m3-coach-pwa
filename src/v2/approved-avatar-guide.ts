/**
 * Exact legacy avatar-guide fallbacks for V2.
 * These are the app's existing two-panel START/FINISH exercise cards.
 * They are static guides, not motion video, and are used only when the
 * exact exercise has no approved moving coach clip.
 */
import { EXERCISE_IMAGES, type ExerciseImage } from "@/data/exercise-images";
import type { V2Exercise } from "./types";

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
  const key = GUIDE_KEY_BY_MOTION[exercise.motionKey];
  return key ? EXERCISE_IMAGES[key] : undefined;
}
