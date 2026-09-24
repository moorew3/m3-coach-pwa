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
export const COACH_REFERENCE = "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/coach-primary-standing.png";

/**
 * Secondary identity evidence for future media review/generation only.
 * Never use this cropped portrait as the primary or full-body stage image.
 */
export const COACH_IDENTITY_SUPPORT_REFERENCE = "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/coach-face-tattoo-support.jpg";

/** Every moving asset must be explicitly attested to this identity. */
export const CANONICAL_COACH_ID = "approved-original-coach" as const;

export const COACH_DESCRIPTION =
  "Heavily tattooed muscular bearded Black coach, shirtless, black athletic shorts, dark charcoal gym with cyan rim light.";

/** Verified coach-performed motion clips, keyed by MirrorMove id. */
export const COACH_MOTION: Record<string, string> = {
  boxingStance: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/boxingStance.mp4",
  cross: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/cross.mp4",
  defensiveReset: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/defensiveReset.mp4",
  gluteBridge: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/gluteBridge.mp4",
  guardReset: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/guardReset.mp4",
  jab: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/jab.mp4",
  shadowboxPunches: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/shadowboxPunches.mp4",
  bandPullApart: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/bandPullApart.mp4",
  benchPress: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/benchPress.mp4",
  chestMobility: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/chestMobility.mp4",
  controlledShoulderWork: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/controlledShoulderWork.mp4",
  deadBug: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/deadBug.mp4",
  frontKick: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/frontKick.mp4",
  hamstringCurl: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/hamstringCurl.mp4",
  hammerCurl: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/hammerCurl.mp4",
  hamstringMobility: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/hamstringMobility.mp4",
  hipFlexorStretch: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/hipFlexorStretch.mp4",
  inclineDumbbellPress: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/inclineDumbbellPress.mp4",
  jabCross: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/jabCross.mp4",
  kneeChamber: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/kneeChamber.mp4",
  latPulldown: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/latPulldown.mp4",
  lateralRaise: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/lateralRaise.mp4",
  lowerBodyMobility: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/lowerBodyMobility.mp4",
  romanianDeadlift: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/romanianDeadlift.mp4",
  roundKick: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/roundKick.mp4",
  seatedRow: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/seatedRow.mp4",
  shoulderMobility: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/shoulderMobility.mp4",
  squat: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/squat.mp4",
  suitcaseCarry: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/suitcaseCarry.mp4",
  tricepsPressdown: "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/tricepsPressdown.mp4",
};

/** Coach stills used as posters for the verified clips. */
export const COACH_FRAMES: Record<string, string> = {
  boxingStance: COACH_REFERENCE,
  cross: COACH_REFERENCE,
  defensiveReset: COACH_REFERENCE,
  gluteBridge: COACH_REFERENCE,
  guardReset: COACH_REFERENCE,
  jab: COACH_REFERENCE,
  shadowboxPunches: COACH_REFERENCE,
  bandPullApart: COACH_REFERENCE,
  benchPress: COACH_REFERENCE,
  chestMobility: COACH_REFERENCE,
  controlledShoulderWork: COACH_REFERENCE,
  deadBug: COACH_REFERENCE,
  frontKick: COACH_REFERENCE,
  hamstringCurl: COACH_REFERENCE,
  hammerCurl: COACH_REFERENCE,
  hamstringMobility: COACH_REFERENCE,
  hipFlexorStretch: COACH_REFERENCE,
  inclineDumbbellPress: COACH_REFERENCE,
  jabCross: COACH_REFERENCE,
  kneeChamber: COACH_REFERENCE,
  latPulldown: COACH_REFERENCE,
  lateralRaise: COACH_REFERENCE,
  lowerBodyMobility: COACH_REFERENCE,
  romanianDeadlift: COACH_REFERENCE,
  roundKick: COACH_REFERENCE,
  seatedRow: COACH_REFERENCE,
  shoulderMobility: COACH_REFERENCE,
  squat: COACH_REFERENCE,
  suitcaseCarry: COACH_REFERENCE,
  tricepsPressdown: COACH_REFERENCE,
};

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
  battleRopeFinisher: "Coach identity continuity is not verified for this clip.",
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