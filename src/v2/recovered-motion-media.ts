/**
 * RECOVERED MOTION MEDIA
 * ------------------------------------------------------------------
 * Exact movement clips recovered from the original Lovable workout project.
 *
 * These are NOT promoted to canonical coach-identity assets. They are a
 * second-tier movement reference: the exercise mechanics were previously
 * reviewed as usable, while the actor's identity was not consistently the
 * locked coach. V2 may show these as "Motion demo" rather than going blank
 * or falling back to a static board.
 *
 * Priority remains:
 *   1. canonical identity-approved coach clip
 *   2. exact recovered moving exercise demo
 *   3. approved static exercise guide
 *   4. honest no-media state
 */
import type { V2Exercise } from "@/v2/types";
import { isIdentityQuarantined } from "@/data/coach-identity";

export type RecoveredMotion = {
  url: string;
  label: "Motion demo";
  note: string;
};

const RECOVERED: Readonly<Record<string, RecoveredMotion>> = {
  dumbbellCurl: {
    url: "/media/recovered/dumbbellCurl.mp4",
    label: "Motion demo",
    note: "Recovered original Dumbbell Curl motion. Correct curl mechanics; coach identity is not promoted from this clip.",
  },
  chestPress: {
    url: "/media/recovered/chestPress.mp4",
    label: "Motion demo",
    note: "Recovered seated chest-press motion; identity remains reference-only.",
  },
  chestSupportedRow: {
    url: "/media/recovered/chestSupportedRow.mp4",
    label: "Motion demo",
    note: "Recovered incline-bench row motion; identity remains reference-only.",
  },
  easyWalk: {
    url: "/media/recovered/easyWalkV3.mp4",
    label: "Motion demo",
    note: "Recovered real treadmill-walk motion; identity is not promoted from the profile view.",
  },
  treadmillWalk: {
    url: "/media/recovered/easyWalkV3.mp4",
    label: "Motion demo",
    note: "Recovered real treadmill-walk motion; identity is not promoted from the profile view.",
  },
  inclineWalk: {
    url: "/media/recovered/easyWalkV3.mp4",
    label: "Motion demo",
    note: "Recovered real treadmill-walk motion; identity is not promoted from the profile view.",
  },
  bulgarianSplitSquat: {
    url: "/media/recovered/bulgarianSplitSquat.mp4",
    label: "Motion demo",
    note: "Recovered rear-foot-elevated split-squat motion; identity remains reference-only.",
  },
  reverseStepRow: {
    url: "/media/recovered/reverseStepRow.mp4",
    label: "Motion demo",
    note: "Recovered reverse-step plus row motion; identity remains reference-only.",
  },
  farmerMarch: {
    url: "/media/recovered/farmerMarch.mp4",
    label: "Motion demo",
    note: "Recovered dumbbell march motion; identity remains reference-only.",
  },
  squatToCurl: {
    url: "/media/recovered/squatToCurl.mp4",
    label: "Motion demo",
    note: "Recovered squat-to-curl motion; identity remains reference-only.",
  },
  stepAltCurl: {
    url: "/media/recovered/stepAltCurl.mp4",
    label: "Motion demo",
    note: "Recovered step plus alternating-curl motion; identity remains reference-only.",
  },
  stepShoulderPress: {
    url: "/media/recovered/stepShoulderPress.mp4",
    label: "Motion demo",
    note: "Recovered step plus shoulder-press motion; identity remains reference-only.",
  },
  cablePunch: {
    url: "/media/recovered/cablePunch.mp4",
    label: "Motion demo",
    note: "Recovered cable-punch motion; identity remains reference-only.",
  },
  rearDeltFly: {
    url: "/media/recovered/rearDeltFly.mp4",
    label: "Motion demo",
    note: "Recovered rear-delt fly motion; identity remains reference-only.",
  },
  legPress: {
    url: "/media/recovered/legPress.mp4",
    label: "Motion demo",
    note: "Recovered leg-press motion; identity remains reference-only.",
  },
  medBallChestPass: {
    url: "/media/recovered/medBallChestPass.mp4",
    label: "Motion demo",
    note: "Recovered medicine-ball chest-pass motion; identity remains reference-only.",
  },
  battleRopeFinisher: {
    url: "/media/recovered/battleRopeFinisher.mp4",
    label: "Motion demo",
    note: "Recovered double-wave battle-rope motion; identity remains reference-only.",
  },
};

export function recoveredMotionFor(exercise?: V2Exercise): RecoveredMotion | undefined {
  if (!exercise) return undefined;

  // The owner rejected mismatched workout avatars. If a movement is identity-
  // quarantined, do not show a recovered video with a different person at all.
  // V2 will use the saved original workout-avatar guide for that exact movement.
  if (isIdentityQuarantined(exercise.motionKey) || isIdentityQuarantined(exercise.id))
    return undefined;

  return RECOVERED[exercise.motionKey] ?? RECOVERED[exercise.id];
}
