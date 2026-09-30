/**
 * Only media that has already passed the approved-coach identity gate may be
 * shown. An equipment substitution or a different person is NOT a fallback.
 * V2 motion keys map to the exact, audited legacy movement identifiers.
 */
import { coachMotionFor } from "@/data/coach-identity";
import type { V2Exercise } from "./types";

const LEGACY_MOTION_KEY: Record<string, string> = {
  inclinePress: "inclineDumbbellPress",
  lateralRaise: "lateralRaise",
  tricepsPressdown: "tricepsPressdown",
  latPulldown: "latPulldown",
  seatedRow: "seatedRow",
  boxingCombination: "shadowboxPunches",
  frontKick: "frontKick",
  roundKick: "roundKick",
  backSquat: "squat",
};

export function approvedCoachMedia(exercise?: V2Exercise) {
  if (!exercise) return undefined;
  const legacyKey = LEGACY_MOTION_KEY[exercise.motionKey];
  if (!legacyKey) return undefined;
  return coachMotionFor(legacyKey);
}

export function nextApprovedCoachMedia(
  exercises: V2Exercise[],
  currentIndex: number,
) {
  for (let i = currentIndex + 1; i < exercises.length; i++) {
    const media = approvedCoachMedia(exercises[i]);
    if (media) return media;
  }
  return undefined;
}
