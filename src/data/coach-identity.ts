/**
 * COACH IDENTITY — the single visual trainer for the whole app.
 * ------------------------------------------------------------------
 * The coach who speaks the session is the SAME person who must be seen
 * performing every warm-up, working set, conditioning round and
 * cool-down movement. There is no separate "user avatar" demonstrator.
 *
 * `COACH_REFERENCE` is the canonical full-body likeness of the approved coach:
 * heavily tattooed muscular bearded Black athlete, shirtless, black shorts,
 * standing front-on in a gym. `COACH_IDENTITY_SUPPORT_REFERENCE` is the
 * approved close-up used only to reinforce face, beard, hairline, skin tone,
 * and chest-tattoo identity detail. It is not a user-avatar source.
 *
 * Only clips that pass the explicit canonical-identity allowlist below are
 * playable. A URL alone never makes a clip trusted. Movements without an
 * approved clip are reported honestly as "coach clip pending".
 */
/** Primary full-body identity source used across every coach surface. */
export const COACH_REFERENCE = "/coach-source/coach-primary-standing.png";

/**
 * Secondary identity evidence for future media review/generation only.
 * Never use this cropped portrait as the primary or full-body stage image.
 */
export const COACH_IDENTITY_SUPPORT_REFERENCE = COACH_REFERENCE;

/** Every moving asset must be explicitly attested to this identity. */
export const CANONICAL_COACH_ID = "approved-original-coach" as const;

export const COACH_DESCRIPTION =
  "Heavily tattooed muscular bearded Black coach, shirtless, black athletic shorts, dark charcoal gym with cyan rim light.";

export type MotionActor = "coach" | "demonstrator";
export type ExerciseMotion = { url: string; poster?: string; actor: MotionActor };

/** Verified coach-performed motion clips, keyed by MirrorMove id. */
export const COACH_MOTION: Record<string, string> = {
  boxingStance: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ba2daa61-d337-44ea-9fe0-12f6698cc43f/boxingStanceV2.mp4",
  cross: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/767f7369-4a91-4f1e-bbe3-ad429dc80d15/crossV2.mp4",
  defensiveReset: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/39d355b3-eb12-4628-98d6-107ebbd966c4/defensiveResetV2.mp4",
  gluteBridge: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/a72a39b6-d28b-44e4-8d69-20d7dedadbe4/gluteBridgeV3.mp4",
  guardReset: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/de47b48c-3ce6-4ebc-9ee8-56ac2acb0161/guardResetV2.mp4",
  jab: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/fea6c3ab-2ad2-4c0a-8380-432cc8496e49/jabV2.mp4",
  // Smooth follow-along flow assembled from the already-approved stance, jab, cross,\n  // jab-cross, defensive-reset and guard-reset coach clips. This is the canonical\n  // Shadow Boxing loop; the individual Saturday technique drills keep their own clips.\n  shadowboxPunches: "/media/boxingCombo2.mp4",
  bandPullApart: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/e082ae2c-fe10-4b22-8966-b13e997665c5/bandPullApart.mp4",
  benchPress: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/5fe726c3-c084-49d2-8b92-7bff82caecef/benchPressV3.mp4",
  chestMobility: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/9afee772-bd52-48ce-a0c8-123544092990/chestMobilityV2.mp4",
  controlledShoulderWork:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/bd8c08f2-f0f7-41a6-8286-0714fb017645/controlledShoulderWork.mp4",
  deadBug: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/2c12477d-f5f5-48e8-9528-73ca1275cfb9/deadBugV3.mp4",
  frontKick: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ef4b2839-4898-4f96-bdc6-4c112be5142c/frontKick.mp4",
  hamstringCurl: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/dc585bcc-7aa8-445b-93b4-2f7a088ce975/hamstringCurlV2.mp4",
  hammerCurl: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/hammerCurl.mp4",
  hamstringMobility:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/afa99947-ec33-4d47-976d-7788ad4b845d/hamstringMobilityV3.mp4",
  hipFlexorStretch: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/63cdf4b4-32a8-493b-ba65-399172405412/hipFlexorStretchV3.mp4",
  inclineDumbbellPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/2d0cad85-aedc-4326-bbc6-2c3db57ea42e/inclineDumbbellPressV3.mp4",
  jabCross: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/4a42a4f8-dc38-44ee-93fa-b62815263ebd/jabCrossV2.mp4",
  kneeChamber: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/9458679e-92e5-49ea-aa70-f369aed89dc1/kneeChamberV2.mp4",
  latPulldown: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/221d6f61-2d31-41f6-9287-15db32b16996/latPulldownV2.mp4",
  lateralRaise: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/020398e8-c326-4c83-9bb8-f3ae4c43054f/lateralRaise.mp4",
  lowerBodyMobility: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/a2b9f071-159d-4362-8943-e95dcaf79a23/lowerBodyMobility.mp4",
  romanianDeadlift: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/c406059f-cfce-4344-8d5d-ccc9d8c303e0/romanianDeadliftV2.mp4",
  roundKick: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/9e7a71c5-c696-4d1d-beca-2d83963a6d11/roundKick.mp4",
  seatedRow: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/fb904bbb-9853-486a-997f-cae8fd811e93/seatedRowV3.mp4",
  shoulderMobility: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ac623364-1584-4306-acef-c8460c3e2cdb/shoulderMobility.mp4",
  squat: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/86ca5509-96be-4531-85ea-bc241319f293/squatV2.mp4",
  suitcaseCarry: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/4670b0c7-7068-40bd-8d9a-1ecde974b0ae/suitcaseCarry.mp4",
  tricepsPressdown: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/98e24436-bee9-42d3-9916-97abc73942a7/tricepsPressdown.mp4",
};

/**
 * Existing exercise-specific motion performed by a WORKOUT PARTNER, not the
 * canonical coach. These clips were retained because the exercise mechanics
 * are correct even though the visible person is not the approved coach.
 *
 * Identity rule: these actors must remain visibly distinct demonstrators.
 * They are never used for coach presence, speech, intro, rest, transitions,
 * or still imagery, and they must never be described as the canonical coach.
 * A demonstrator that visibly copies the primary coach's distinctive tattoo
 * set must be removed from this map rather than treated as him.
 */
export const DEMONSTRATOR_MOTION: Readonly<Record<string, string>> = {
  chestPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ae3d443d-1b7e-4562-80e3-e44b54b55ac9/chestPressV3.mp4",
  dumbbellCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/0c6f7ce9-22f8-43cc-a979-1e2681e6f9ae/dumbbellCurl.mp4",
  chestSupportedRow:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/242f8087-efb6-4b71-bfd2-1b739cd081a2/chestSupportedRowV3.mp4",
  shoulderPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/332dd309-aaf6-4b52-8c61-c24b8a4ee596/shoulderPress.mp4",
  easyWalk:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/21e0072b-b44f-4e33-b732-1fda2790cb7b/easyWalkV3.mp4",
  bulgarianSplitSquat:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/160c1726-61b7-4f3b-8350-0399cb72d5f8/bulgarianSplitSquatV3.mp4",
  reverseStepRow:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/d700a842-1844-4813-9e6d-fb5a6985e0a2/reverseStepRow.mp4",
  farmerMarch:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/62335289-13e9-4390-b070-723cb2a9e376/farmerMarch.mp4",
  squatToCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/801f032b-7e52-4db2-9ea2-18a8a128ce26/squatToCurl.mp4",
  stepAltCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/0e600c10-dc11-42ef-8759-861ecf478f67/stepAltCurl.mp4",
  stepShoulderPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/881b3195-744f-4b0e-ad94-6b6e3d43fd11/stepShoulderPress.mp4",
  cablePunch:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/52121fcd-b4d3-4d8f-b486-23173ebea24e/cablePunch.mp4",
  rearDeltFly:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/dda4926f-4c1a-425d-b1fb-c11814ddf571/rearDeltFly.mp4",
  trapBarDeadlift:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/a83a7bf4-ee46-4a7c-be93-f492c7e3057f/trapBarDeadlift.mp4",
  legPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/cb6f3ffc-320a-4ffa-a105-d893aab8227f/legPress.mp4",
  medBallChestPass:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/e7d12aaf-9d28-4b2d-853f-09aff32af3df/medBallChestPass.mp4",
  battleRopeFinisher:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/e87a2f34-5473-45df-b40e-8963bc7a3a4d/battleRopeFinisher.mp4",
};

/** Coach stills used as posters for the verified clips.
 * The GitHub/Railway build uses the locked canonical coach still as a safe
 * fallback until exercise-specific poster files are migrated locally.
 */
export const COACH_FRAMES: Record<string, string> = Object.fromEntries(
  Object.keys(COACH_MOTION).map((key) => [key, COACH_REFERENCE]),
);

/**
 * Movements that reuse an identical coach demonstration. Only true
 * same-movement reuses live here — anything that would show a different
 * exercise has its own clip above.
 */
export const COACH_ALIASES: Record<string, string> = {
  treadmillWalk: "easyWalk",
  inclineWalk: "easyWalk",
  hipFlexorMobility: "hipFlexorStretch",
  jabCrossCombo: "jabCross",
  lightPunches: "shadowboxPunches",
  shoulderExternalRotation: "externalRotation",
  legCurl: "hamstringCurl",
};

/**
 * Identity gate: a motion key must be present here as well as in COACH_MOTION.
 * This separate, explicit attestation prevents a newly-added URL from silently
 * becoming a coach clip before its face, body, tattoos, clothing and motion
 * continuity have been reviewed against COACH_REFERENCE.
 *
 * A clip is quarantined whenever its visible movement or equipment does not
 * match the exercise, even if the coach identity itself is correct.
 */
/**
 * 2026-09-14 full visual re-audit: every one of the 48 clips was downloaded,
 * frames extracted at 1s and 4s, and compared against COACH_REFERENCE.
 * A clip is approved ONLY when a clear frame shows BOTH canonical markers:
 * the short-cropped fade (never braids/cornrows) AND the portrait tattoo on
 * the right pec. Anything else — braided hair, a different venue, a face that
 * is never clearly visible, or the athlete out of frame — is quarantined as
 * unverified. Uncertain is treated as wrong on purpose.
 */
const CANONICAL_IDENTITY_MOTION = new Set([
  "bandPullApart",
  "benchPress",
  "boxingStance",
  "chestMobility",
  "controlledShoulderWork",
  "cross",
  "deadBug",
  "defensiveReset",
  "frontKick",
  "gluteBridge",
  "guardReset",
  "hamstringCurl",
  "hammerCurl",
  "hamstringMobility",
  "hipFlexorStretch",
  "inclineDumbbellPress",
  "jab",
  "jabCross",
  "kneeChamber",
  "latPulldown",
  "lateralRaise",
  "lowerBodyMobility",
  "romanianDeadlift",
  "roundKick",
  "seatedRow",
  "shadowboxPunches",
  "shoulderMobility",
  "squat",
  "suitcaseCarry",
  "tricepsPressdown",
]);

/**
 * Quarantine list. Any uncertainty fails closed: generated resemblance is not
 * identity continuity. These clips/posters are withheld because the visible
 * person or movement cannot be verified against the locked reference.
 */
export const INVALID_COACH_MOTION: Readonly<Record<string, string>> = {
  boxingCombo1: "Rejected after live user review: motion is not smooth or biomechanically acceptable.",
  battleRopeFinisher: "The current Boxing Combo 1 substitute was rejected; no verified finisher motion is approved.",
  bulgarianSplitSquat: "Coach identity continuity is not verified for this clip.",
  cablePunch: "Coach identity continuity is not verified for this clip.",
  chestPress: "Coach identity continuity is not verified for this clip.",
  chestSupportedRow: "Coach identity continuity is not verified for this clip.",
  dumbbellCurl: "Coach identity continuity is not verified for this clip.",
  easyWalk: "Coach identity cannot be verified clearly throughout this clip.",
  externalRotation: "Coach identity continuity is not verified for this clip.",
  farmerMarch: "Coach identity continuity is not verified for this clip.",
  legPress: "Coach identity continuity is not verified for this clip.",
  medBallChestPass: "Coach identity continuity is not verified for this clip.",
  rearDeltFly: "Coach identity continuity is not verified for this clip.",
  reverseStepRow: "Coach identity continuity is not verified for this clip.",
  shoulderPress: "Coach identity continuity is not verified for this clip.",
  squatToCurl: "Coach identity continuity is not verified for this clip.",
  stepAltCurl: "Step + Alternating Curl needs a verified step-and-curl clip.",
  stepShoulderPress: "Step + Shoulder Press needs a verified overhead step-and-press clip.",
  trapBarDeadlift: "This clip shows a straight barbell, not the required trap bar.",
};

/**
 * Global quarantine. Any movement listed here has had non-canonical media
 * (a different man) found in at least one asset family, so NOTHING keyed to
 * it may render a human: not a clip, poster, phase board, or still card.
 */
export function isIdentityQuarantined(id?: string): boolean {
  if (!id) return false;
  const root = COACH_ALIASES[id] ?? id;
  return id in INVALID_COACH_MOTION || root in INVALID_COACH_MOTION;
}

const resolve = (id: string) => {
  if (isIdentityQuarantined(id)) return "";
  const key = COACH_MOTION[id] ? id : (COACH_ALIASES[id] ?? "");
  return key && CANONICAL_IDENTITY_MOTION.has(key) ? key : "";
};

/** Verified coach clip for a movement, if one exists. */
export function coachMotionFor(id: string): { url: string; poster?: string } | undefined {
  const key = resolve(id);
  const url = COACH_MOTION[key];
  return key && url ? { url, poster: COACH_FRAMES[key] } : undefined;
}

/**
 * Exact exercise motion for an active set. Prefer the canonical coach; when he
 * has no approved clip, use the audited workout-partner demonstration. This
 * function is intentionally NOT used by coach-presence/ambient surfaces.
 */
export function exerciseMotionFor(id: string): ExerciseMotion | undefined {
  const coach = coachMotionFor(id);
  if (coach) return { ...coach, actor: "coach" };

  const root = COACH_ALIASES[id] ?? id;
  const url = DEMONSTRATOR_MOTION[id] ?? DEMONSTRATOR_MOTION[root];
  return url ? { url, actor: "demonstrator" } : undefined;
}

/**
 * The exercise-specific still for a movement: the verified frame of the
 * approved coach performing that exact movement, or nothing. Exercise viewers
 * must not replace a missing frame with one universal person/image.
 */
export function coachStillFor(id?: string): string | undefined {
  if (!id) return undefined;
  const key = resolve(id);
  return key ? COACH_FRAMES[key] : undefined;
}

/** true when the person shown for this movement is verified as the coach. */
export const isCoachVerified = (id: string) => Boolean(coachMotionFor(id));

export type CoachStatus = "coach" | "pending";

export const coachStatusFor = (id: string): CoachStatus =>
  isCoachVerified(id) ? "coach" : "pending";