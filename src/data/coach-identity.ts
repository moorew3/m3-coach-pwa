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

/** Verified coach-performed motion clips, keyed by MirrorMove id. */
export const COACH_MOTION: Record<string, string> = {
  boxingStance: "/media/approved/boxingStance.mp4",
  cross: "/media/approved/cross.mp4",
  defensiveReset: "/media/approved/defensiveReset.mp4",
  gluteBridge: "/media/approved/gluteBridge.mp4",
  easyWalk: "/media/approved/easyWalk.mp4",
  guardReset: "/media/approved/guardReset.mp4",
  jab: "/media/approved/jab.mp4",
  // Complete-cycle 40.7-second flow from the SAME previously approved coach clips.
  // Unlike Combo 2, source punches are NOT cut before extension/retraction.
  // This is a preview motion; athlete must still visually QA the transitions.
  shadowboxPunches: "/media/boxingFlow3.mp4",
  shadowboxPunches60: "/media/boxingFlow60.mp4",
  bandPullApart: "/media/approved/bandPullApart.mp4",
  benchPress: "/media/approved/benchPress.mp4",
  chestMobility: "/media/approved/chestMobility.mp4",
  controlledShoulderWork:
    "/media/approved/controlledShoulderWork.mp4",
  deadBug: "/media/approved/deadBug.mp4",
  frontKick: "/media/approved/frontKick.mp4",
  hamstringCurl: "/media/approved/hamstringCurl.mp4",
  hammerCurl: "/media/approved/hammerCurl.mp4",
  hamstringMobility:
    "/media/approved/hamstringMobility.mp4",
  hipFlexorStretch: "/media/approved/hipFlexorStretch.mp4",
  inclineDumbbellPress:
    "/media/approved/inclineDumbbellPress.mp4",
  jabCross: "/media/approved/jabCross.mp4",
  kneeChamber: "/media/approved/kneeChamber.mp4",
  latPulldown: "/media/approved/latPulldown.mp4",
  lateralRaise: "/media/approved/lateralRaise.mp4",
  lowerBodyMobility: "/media/approved/lowerBodyMobility.mp4",
  romanianDeadlift: "/media/approved/romanianDeadlift.mp4",
  roundKick: "/media/approved/roundKick.mp4",
  seatedRow: "/media/approved/seatedRow.mp4",
  shoulderMobility: "/media/approved/shoulderMobility.mp4",
  squat: "/media/approved/squat.mp4",
  suitcaseCarry: "/media/approved/suitcaseCarry.mp4",
  tricepsPressdown: "/media/approved/tricepsPressdown.mp4",
  cablePunch: "/media/recovered/cablePunch.mp4",
  // Restored original avatar clip after the owner's explicit correction.
  // Full-body standing dumbbell press, not a machine or a stock trainer.
  shoulderPress: "/media/approved/shoulderPress.mp4",
  trapBarDeadlift: "/media/approved/trapBarDeadlift.mp4",
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
  "easyWalk",
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
  "shadowboxPunches60",
  "shoulderMobility",
  "squat",
  "suitcaseCarry",
  "tricepsPressdown",
  "trapBarDeadlift",
  "cablePunch",
  "shoulderPress",
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
  chestPress: "Coach identity continuity is not verified for this clip.",
  chestSupportedRow: "Coach identity continuity is not verified for this clip.",
  dumbbellCurl: "Coach identity continuity is not verified for this clip.",
  externalRotation: "Coach identity continuity is not verified for this clip.",
  farmerMarch: "Coach identity continuity is not verified for this clip.",
  legPress: "Coach identity continuity is not verified for this clip.",
  medBallChestPass: "Coach identity continuity is not verified for this clip.",
  rearDeltFly: "Coach identity continuity is not verified for this clip.",
  reverseStepRow: "Coach identity continuity is not verified for this clip.",
  squatToCurl: "Coach identity continuity is not verified for this clip.",
  stepAltCurl: "Step + Alternating Curl needs a verified step-and-curl clip.",
  stepShoulderPress: "Step + Shoulder Press needs a verified overhead step-and-press clip.",
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
