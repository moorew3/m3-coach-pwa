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

export type RecoveredMotion = {
  url: string;
  label: "Motion demo";
  note: string;
};

const ORIGIN = "https://twenty-two-gainz-tracker.lovable.app";

const RECOVERED: Readonly<Record<string, RecoveredMotion>> = {
  dumbbellCurl: {
    url: "/media/recovered/dumbbellCurl.mp4",
    label: "Motion demo",
    note: "Recovered original Dumbbell Curl motion. Correct curl mechanics; coach identity is not promoted from this clip.",
  },
  chestPress: {
    url: ORIGIN + "/__l5e/assets-v1/ae3d443d-1b7e-4562-80e3-e44b54b55ac9/chestPressV3.mp4",
    label: "Motion demo",
    note: "Recovered seated chest-press motion; identity remains reference-only.",
  },
  chestSupportedRow: {
    url: ORIGIN + "/__l5e/assets-v1/242f8087-efb6-4b71-bfd2-1b739cd081a2/chestSupportedRowV3.mp4",
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
    url: ORIGIN + "/__l5e/assets-v1/160c1726-61b7-4f3b-8350-0399cb72d5f8/bulgarianSplitSquatV3.mp4",
    label: "Motion demo",
    note: "Recovered rear-foot-elevated split-squat motion; identity remains reference-only.",
  },
  reverseStepRow: {
    url: ORIGIN + "/__l5e/assets-v1/d700a842-1844-4813-9e6d-fb5a6985e0a2/reverseStepRow.mp4",
    label: "Motion demo",
    note: "Recovered reverse-step plus row motion; identity remains reference-only.",
  },
  farmerMarch: {
    url: ORIGIN + "/__l5e/assets-v1/62335289-13e9-4390-b070-723cb2a9e376/farmerMarch.mp4",
    label: "Motion demo",
    note: "Recovered dumbbell march motion; identity remains reference-only.",
  },
  squatToCurl: {
    url: ORIGIN + "/__l5e/assets-v1/801f032b-7e52-4db2-9ea2-18a8a128ce26/squatToCurl.mp4",
    label: "Motion demo",
    note: "Recovered squat-to-curl motion; identity remains reference-only.",
  },
  stepAltCurl: {
    url: ORIGIN + "/__l5e/assets-v1/0e600c10-dc11-42ef-8759-861ecf478f67/stepAltCurl.mp4",
    label: "Motion demo",
    note: "Recovered step plus alternating-curl motion; identity remains reference-only.",
  },
  stepShoulderPress: {
    url: ORIGIN + "/__l5e/assets-v1/881b3195-744f-4b0e-ad94-6b6e3d43fd11/stepShoulderPress.mp4",
    label: "Motion demo",
    note: "Recovered step plus shoulder-press motion; identity remains reference-only.",
  },
  cablePunch: {
    url: ORIGIN + "/__l5e/assets-v1/52121fcd-b4d3-4d8f-b486-23173ebea24e/cablePunch.mp4",
    label: "Motion demo",
    note: "Recovered cable-punch motion; identity remains reference-only.",
  },
  rearDeltFly: {
    url: ORIGIN + "/__l5e/assets-v1/dda4926f-4c1a-425d-b1fb-c11814ddf571/rearDeltFly.mp4",
    label: "Motion demo",
    note: "Recovered rear-delt fly motion; identity remains reference-only.",
  },
  legPress: {
    url: ORIGIN + "/__l5e/assets-v1/cb6f3ffc-320a-4ffa-a105-d893aab8227f/legPress.mp4",
    label: "Motion demo",
    note: "Recovered leg-press motion; identity remains reference-only.",
  },
  medBallChestPass: {
    url: ORIGIN + "/__l5e/assets-v1/e7d12aaf-9d28-4b2d-853f-09aff32af3df/medBallChestPass.mp4",
    label: "Motion demo",
    note: "Recovered medicine-ball chest-pass motion; identity remains reference-only.",
  },
  battleRopeFinisher: {
    url: ORIGIN + "/__l5e/assets-v1/e87a2f34-5473-45df-b40e-8963bc7a3a4d/battleRopeFinisher.mp4",
    label: "Motion demo",
    note: "Recovered double-wave battle-rope motion; identity remains reference-only.",
  },
};

export function recoveredMotionFor(exercise?: V2Exercise): RecoveredMotion | undefined {
  if (!exercise) return undefined;
  return RECOVERED[exercise.motionKey] ?? RECOVERED[exercise.id];
}
