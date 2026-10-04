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
  boxingStance: "boxingStance",
  jab: "jab",
  cross: "cross",
  jabCross: "jabCross",
  defensiveReset: "defensiveReset",
  guardReset: "guardReset",
  kneeChamber: "kneeChamber",
  boxingCombination: "shadowboxPunches",
  frontKick: "frontKick",
  roundKick: "roundKick",
  backSquat: "squat",
};

export function approvedCoachMedia(exercise?: V2Exercise) {
  if (!exercise) return undefined;
  // Day 3 uses 60-second cardio rounds. The dedicated 40/20 boxing
  // workout uses the shorter complete-cycle flow. Neither loops mid-round.
  if (exercise.id === "boxing-flow" && exercise.motionKey === "boxingCombination")
    return coachMotionFor("shadowboxPunches60");
  // The complete original week already uses the audited legacy keys.
  // Preserve every verified original clip instead of limiting V2 to
  // the short demonstration catalog. coachMotionFor still enforces the
  // identity/movement quarantine; no missing clip is silently substituted.
  const legacyKey = LEGACY_MOTION_KEY[exercise.motionKey] ?? exercise.motionKey;
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
