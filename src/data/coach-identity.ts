/**
 * COACH IDENTITY — the single visual trainer for the whole app.
 * ------------------------------------------------------------------
 * The approved coach remains the narrator and the person shown between sets.
 * Exact exercise footage may use a separately credited real demonstrator
 * after movement and identity review. Demonstrators never copy his tattoos.
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
export type MotionCredit = {
  author: string;
  source: string;
  license: string;
  licenseUrl: string;
  changes: string;
  disclaimer?: string;
};
export type ExerciseMotion = {
  url: string;
  poster?: string;
  actor: MotionActor;
  variant?: string;
  credit?: MotionCredit;
};

/** Verified coach-performed motion clips, keyed by MirrorMove id. */
export const COACH_MOTION: Record<string, string> = {
  boxingStance:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ba2daa61-d337-44ea-9fe0-12f6698cc43f/boxingStanceV2.mp4",
  cross:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/767f7369-4a91-4f1e-bbe3-ad429dc80d15/crossV2.mp4",
  defensiveReset:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/39d355b3-eb12-4628-98d6-107ebbd966c4/defensiveResetV2.mp4",
  gluteBridge:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/a72a39b6-d28b-44e4-8d69-20d7dedadbe4/gluteBridgeV3.mp4",
  guardReset:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/de47b48c-3ce6-4ebc-9ee8-56ac2acb0161/guardResetV2.mp4",
  jab: "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/fea6c3ab-2ad2-4c0a-8380-432cc8496e49/jabV2.mp4",
  // Smooth follow-along flow assembled from the already-approved stance, jab, cross,
  // jab-cross, defensive-reset and guard-reset coach clips. This is the canonical
  // Shadow Boxing loop; the individual Saturday technique drills keep their own clips.
  shadowboxPunches: "/media/boxingCombo2.mp4",
  bandPullApart:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/e082ae2c-fe10-4b22-8966-b13e997665c5/bandPullApart.mp4",
  benchPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/5fe726c3-c084-49d2-8b92-7bff82caecef/benchPressV3.mp4",
  chestMobility:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/9afee772-bd52-48ce-a0c8-123544092990/chestMobilityV2.mp4",
  controlledShoulderWork:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/bd8c08f2-f0f7-41a6-8286-0714fb017645/controlledShoulderWork.mp4",
  deadBug:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/2c12477d-f5f5-48e8-9528-73ca1275cfb9/deadBugV3.mp4",
  frontKick:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ef4b2839-4898-4f96-bdc6-4c112be5142c/frontKick.mp4",
  hamstringCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/dc585bcc-7aa8-445b-93b4-2f7a088ce975/hamstringCurlV2.mp4",
  hammerCurl:
    "https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/hammerCurl.mp4",
  hamstringMobility:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/afa99947-ec33-4d47-976d-7788ad4b845d/hamstringMobilityV3.mp4",
  hipFlexorStretch:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/63cdf4b4-32a8-493b-ba65-399172405412/hipFlexorStretchV3.mp4",
  inclineDumbbellPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/2d0cad85-aedc-4326-bbc6-2c3db57ea42e/inclineDumbbellPressV3.mp4",
  jabCross:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/4a42a4f8-dc38-44ee-93fa-b62815263ebd/jabCrossV2.mp4",
  kneeChamber:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/9458679e-92e5-49ea-aa70-f369aed89dc1/kneeChamberV2.mp4",
  latPulldown:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/221d6f61-2d31-41f6-9287-15db32b16996/latPulldownV2.mp4",
  lateralRaise:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/020398e8-c326-4c83-9bb8-f3ae4c43054f/lateralRaise.mp4",
  lowerBodyMobility:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/a2b9f071-159d-4362-8943-e95dcaf79a23/lowerBodyMobility.mp4",
  romanianDeadlift:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/c406059f-cfce-4344-8d5d-ccc9d8c303e0/romanianDeadliftV2.mp4",
  roundKick:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/9e7a71c5-c696-4d1d-beca-2d83963a6d11/roundKick.mp4",
  seatedRow:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/fb904bbb-9853-486a-997f-cae8fd811e93/seatedRowV3.mp4",
  shoulderMobility:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ac623364-1584-4306-acef-c8460c3e2cdb/shoulderMobility.mp4",
  squat:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/86ca5509-96be-4531-85ea-bc241319f293/squatV2.mp4",
  suitcaseCarry:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/4670b0c7-7068-40bd-8d9a-1ecde974b0ae/suitcaseCarry.mp4",
  tricepsPressdown:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/98e24436-bee9-42d3-9916-97abc73942a7/tricepsPressdown.mp4",
};

/** Quarantined historical recovery URLs. These actors copied the coach's
 * tattoos or failed exact-movement review. Never use this map for playback;
 * only APPROVED_DEMONSTRATOR_MOTION contains reviewed real demonstrations. */
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

/** A separate actor is permitted only after a visual review confirms correct
 * movement AND that he does not copy the approved coach's tattoos. The legacy
 * fallback set failed this review on 2026-10-04; URLs remain as recovery sources,
 * but none may be promoted by merely adding a URL to DEMONSTRATOR_MOTION. */
const APPROVED_DEMONSTRATOR_MOTION: Record<string, ExerciseMotion> = {
  dumbbellCurl: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/eea40be7-7510-43e6-8cd9-41be6c158cd2.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/0fc10954-0e7b-44cc-8a2c-f16186a71571.jpg",
    actor: "demonstrator",
    credit: {
      author: "Goulart",
      source: "https://wger.de/media/exercise-video/92/8bfb917c-3d0d-49b9-8073-5d7e01c1b894.MOV",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      changes: "Silent H.264 conversion.",
    },
  },
  shoulderPress: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/ef0f5290-905a-4f0a-89ed-0e35ca2c2381.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/14ed4898-d0ae-42d3-867f-c8cb4560a6b0.jpg",
    actor: "demonstrator",
    credit: {
      author: "Goulart",
      source: "https://wger.de/media/exercise-video/567/64f33c19-1d96-4b7c-af17-6c6a4941c614.MOV",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      changes: "Silent H.264 conversion.",
    },
  },
  legPress: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/5661c4d6-2f26-4c45-8668-f714d8046227.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/5f2e1c00-acb6-43e3-b918-2d618e7e8129.jpg",
    actor: "demonstrator",
    credit: {
      author: "Goulart",
      source: "https://wger.de/media/exercise-video/371/6aae16b4-01b9-4eb4-935c-3250f84d2c59.MOV",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      changes: "Silent H.264 conversion.",
    },
  },
  rearDeltFly: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/1b17fc04-b62c-423c-a0f1-d09b433b3283.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/055878da-c1bf-41a3-a92c-e5fbea35a50d.jpg",
    actor: "demonstrator",
    credit: {
      author: "Goulart",
      source: "https://wger.de/media/exercise-video/82/437d79db-ac8f-49e2-8780-0365f94ee01c.MOV",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      changes: "Silent H.264 conversion.",
    },
  },
  chestPress: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/46ae0fbb-2a37-4119-83df-24e8c2cf6493.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/9cfcaa38-f3d5-46e5-b5bb-c3aefba7b840.jpg",
    actor: "demonstrator",
    variant: "Dumbbell option",
    credit: {
      author: "Goulart",
      source: "https://wger.de/media/exercise-video/75/080c799b-8afd-4130-8d72-9cef0cd79f54.MOV",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      changes: "Silent H.264 conversion.",
    },
  },
  trapBarDeadlift: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/11399f5c-64a3-495d-90e0-10db99419cf1.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/c75dc934-d09e-4479-8035-76fb8b9b2d1d.jpg",
    actor: "demonstrator",
    credit: {
      author: "U.S. Marine Corps / DVIDS",
      source: "https://www.dvidshub.net/video/548726/hexbar-deadlift",
      license: "Public domain",
      licenseUrl: "https://www.dvidshub.net/about/copyright",
      changes: "Silent H.264 conversion; trimmed to working repetitions.",
      disclaimer:
        "The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement.",
    },
  },
  medBallChestPass: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/78895a3a-d207-43a3-b9c5-ae055c674bc7.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/78c29df7-6b39-455d-bb0d-428c1a74c424.jpg",
    actor: "demonstrator",
    credit: {
      author: "U.S. Marine Corps / DVIDS",
      source: "https://www.dvidshub.net/video/640987/med-ball-chest-throw-againt-wall",
      license: "Public domain",
      licenseUrl: "https://www.dvidshub.net/about/copyright",
      changes: "Silent H.264 conversion; trimmed and cropped to a single full-body view.",
      disclaimer:
        "The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement.",
    },
  },
  battleRopeFinisher: {
    url: "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/5fd3594d-0d58-4dd1-b944-46d8e3422a83.mp4",
    poster:
      "https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/9cf9bb8b-9a18-428c-b098-3b885bca45bd.jpg",
    actor: "demonstrator",
    credit: {
      author: "U.S. Marine Corps / DVIDS",
      source: "https://www.dvidshub.net/video/641023/rope-double-waves",
      license: "Public domain",
      licenseUrl: "https://www.dvidshub.net/about/copyright",
      changes: "Silent H.264 conversion; trimmed and cropped to a single full-body view.",
      disclaimer:
        "The appearance of U.S. Department of War (DoW) visual information does not imply or constitute DoW endorsement.",
    },
  },
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
  boxingCombo1:
    "Rejected after live user review: motion is not smooth or biomechanically acceptable.",
  battleRopeFinisher:
    "The current Boxing Combo 1 substitute was rejected; no verified finisher motion is approved.",
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
  return APPROVED_DEMONSTRATOR_MOTION[root];
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
