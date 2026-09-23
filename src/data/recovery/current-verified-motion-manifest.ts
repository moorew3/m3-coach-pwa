/**
 * RECOVERY SNAPSHOT — captured 2026-09-20, before the controlled rollback to
 * base commit a516c62b586bf9a052be9ba1d72e8223c86abce4 (2026-09-15).
 *
 * Every verified true-motion clip of the approved coach at snapshot time.
 * DATA ONLY: nothing imports this at runtime. After the restore these exact
 * URLs are transplanted back into COACH_MOTION / CANONICAL_IDENTITY_MOTION.
 * Never restore an old clip that is not listed here.
 */
export const SNAPSHOT_DATE = "2026-09-20" as const;
export const SNAPSHOT_ACTOR_ID = "approved-original-coach" as const;
export const SNAPSHOT_PRIMARY_REFERENCE =
  "src/assets/coach/identity/coach-primary-standing.png.asset.json";
export const SNAPSHOT_SUPPORT_REFERENCE =
  "src/assets/coach/identity/coach-face-tattoo-support.jpg.asset.json";

export interface VerifiedMotionRecord {
  id: string;
  title: string;
  motionUrl: string;
  posterAsset?: string;
  actorId: typeof SNAPSHOT_ACTOR_ID;
  status: "verified-motion";
}

export const CURRENT_VERIFIED_MOTION: readonly VerifiedMotionRecord[] = [
  {
    id: "lateralRaise",
    title: "Dumbbell Lateral Raise",
    motionUrl: "/__l5e/assets-v1/020398e8-c326-4c83-9bb8-f3ae4c43054f/lateralRaise.mp4",
    posterAsset: "@/assets/coach/frames/lateralRaise.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "tricepsPressdown",
    title: "Triceps Pressdown",
    motionUrl: "/__l5e/assets-v1/98e24436-bee9-42d3-9916-97abc73942a7/tricepsPressdown.mp4",
    posterAsset: "@/assets/coach/frames/tricepsPressdown.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "benchPress",
    title: "Bench Press",
    motionUrl: "/__l5e/assets-v1/5fe726c3-c084-49d2-8b92-7bff82caecef/benchPressV3.mp4",
    posterAsset: "@/assets/coach/frames/benchPress.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "inclineDumbbellPress",
    title: "Incline Dumbbell Press",
    motionUrl: "/__l5e/assets-v1/2d0cad85-aedc-4326-bbc6-2c3db57ea42e/inclineDumbbellPressV3.mp4",
    posterAsset: "@/assets/coach/frames/inclineDumbbellPress.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "latPulldown",
    title: "Lat Pulldown",
    motionUrl: "/__l5e/assets-v1/221d6f61-2d31-41f6-9287-15db32b16996/latPulldownV2.mp4",
    posterAsset: "@/assets/coach/frames/latPulldown.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "seatedRow",
    title: "Seated Row",
    motionUrl: "/__l5e/assets-v1/fb904bbb-9853-486a-997f-cae8fd811e93/seatedRowV3.mp4",
    posterAsset: "@/assets/coach/frames/seatedRow.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "squat",
    title: "Squat",
    motionUrl: "/__l5e/assets-v1/86ca5509-96be-4531-85ea-bc241319f293/squatV2.mp4",
    posterAsset: "@/assets/coach/frames/squat.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "romanianDeadlift",
    title: "Romanian Deadlift",
    motionUrl: "/__l5e/assets-v1/c406059f-cfce-4344-8d5d-ccc9d8c303e0/romanianDeadliftV2.mp4",
    posterAsset: "@/assets/coach/frames/romanianDeadlift.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "hamstringCurl",
    title: "Hamstring Curl",
    motionUrl: "/__l5e/assets-v1/dc585bcc-7aa8-445b-93b4-2f7a088ce975/hamstringCurlV2.mp4",
    posterAsset: "@/assets/coach/frames/hamstringCurl.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "suitcaseCarry",
    title: "Suitcase Carry",
    motionUrl: "/__l5e/assets-v1/4670b0c7-7068-40bd-8d9a-1ecde974b0ae/suitcaseCarry.mp4",
    posterAsset: "@/assets/coach/frames/suitcaseCarry.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "lightPunches",
    title: "Shadowbox Punches (no weights)",
    motionUrl: "/__l5e/assets-v1/882b696d-7323-4bdb-ae0f-cf6d081995b2/shadowboxPunchesV2.mp4",
    posterAsset: "@/assets/coach/frames/shadowboxPunches.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "controlledShoulderWork",
    title: "Controlled Shoulder Work",
    motionUrl: "/__l5e/assets-v1/bd8c08f2-f0f7-41a6-8286-0714fb017645/controlledShoulderWork.mp4",
    posterAsset: "@/assets/coach/frames/controlledShoulderWork.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "boxingStance",
    title: "Boxing Stance",
    motionUrl: "/__l5e/assets-v1/ba2daa61-d337-44ea-9fe0-12f6698cc43f/boxingStanceV2.mp4",
    posterAsset: "@/assets/coach/frames/boxingStance.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "jab",
    title: "Jab",
    motionUrl: "/__l5e/assets-v1/fea6c3ab-2ad2-4c0a-8380-432cc8496e49/jabV2.mp4",
    posterAsset: "@/assets/coach/frames/jab.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "cross",
    title: "Cross",
    motionUrl: "/__l5e/assets-v1/767f7369-4a91-4f1e-bbe3-ad429dc80d15/crossV2.mp4",
    posterAsset: "@/assets/coach/frames/cross.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "jabCross",
    title: "Jab–Cross Combination",
    motionUrl: "/__l5e/assets-v1/4a42a4f8-dc38-44ee-93fa-b62815263ebd/jabCrossV2.mp4",
    posterAsset: "@/assets/coach/frames/jabCross.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "defensiveReset",
    title: "Defensive Reset / Movement",
    motionUrl: "/__l5e/assets-v1/39d355b3-eb12-4628-98d6-107ebbd966c4/defensiveResetV2.mp4",
    posterAsset: "@/assets/coach/frames/defensiveReset.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "frontKick",
    title: "Front Kick",
    motionUrl: "/__l5e/assets-v1/ef4b2839-4898-4f96-bdc6-4c112be5142c/frontKick.mp4",
    posterAsset: "@/assets/coach/frames/frontKick.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "roundKick",
    title: "Round Kick",
    motionUrl: "/__l5e/assets-v1/9e7a71c5-c696-4d1d-beca-2d83963a6d11/roundKick.mp4",
    posterAsset: "@/assets/coach/frames/roundKick.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "kneeChamber",
    title: "Knee Chamber",
    motionUrl: "/__l5e/assets-v1/9458679e-92e5-49ea-aa70-f369aed89dc1/kneeChamberV2.mp4",
    posterAsset: "@/assets/coach/frames/kneeChamber.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "guardReset",
    title: "Guard / Reset Drill",
    motionUrl: "/__l5e/assets-v1/de47b48c-3ce6-4ebc-9ee8-56ac2acb0161/guardResetV2.mp4",
    posterAsset: "@/assets/coach/frames/guardReset.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "hipFlexorStretch",
    title: "Hip-Flexor Stretch",
    motionUrl: "/__l5e/assets-v1/63cdf4b4-32a8-493b-ba65-399172405412/hipFlexorStretchV3.mp4",
    posterAsset: "@/assets/coach/frames/hipFlexorStretch.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "shoulderMobility",
    title: "Shoulder Mobility",
    motionUrl: "/__l5e/assets-v1/ac623364-1584-4306-acef-c8460c3e2cdb/shoulderMobility.mp4",
    posterAsset: "@/assets/coach/frames/shoulderMobility.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "chestMobility",
    title: "Chest Mobility",
    motionUrl: "/__l5e/assets-v1/9afee772-bd52-48ce-a0c8-123544092990/chestMobilityV2.mp4",
    posterAsset: "@/assets/coach/frames/chestMobility.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "hamstringMobility",
    title: "Hamstring Mobility",
    motionUrl: "/__l5e/assets-v1/afa99947-ec33-4d47-976d-7788ad4b845d/hamstringMobilityV3.mp4",
    posterAsset: "@/assets/coach/frames/hamstringMobility.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "lowerBodyMobility",
    title: "Lower-Body Mobility Flow",
    motionUrl: "/__l5e/assets-v1/a2b9f071-159d-4362-8943-e95dcaf79a23/lowerBodyMobility.mp4",
    posterAsset: "@/assets/coach/frames/lowerBodyMobility.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "deadBug",
    title: "Dead Bug",
    motionUrl: "/__l5e/assets-v1/2c12477d-f5f5-48e8-9528-73ca1275cfb9/deadBugV3.mp4",
    posterAsset: "@/assets/coach/frames/deadBug.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "gluteBridge",
    title: "Glute Bridge",
    motionUrl: "/__l5e/assets-v1/a72a39b6-d28b-44e4-8d69-20d7dedadbe4/gluteBridgeV3.mp4",
    posterAsset: "@/assets/coach/frames/gluteBridge.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
  {
    id: "bandPullApart",
    title: "Band Pull-Apart",
    motionUrl: "/__l5e/assets-v1/e082ae2c-fe10-4b22-8966-b13e997665c5/bandPullApart.mp4",
    posterAsset: "@/assets/coach/frames/bandPullApart.jpg",
    actorId: SNAPSHOT_ACTOR_ID,
    status: "verified-motion",
  },
];

/** Must equal 29 after any restore. */
export const CURRENT_VERIFIED_MOTION_COUNT = 29;

/** Movements with NO verified motion: stay gaps until individually solved. */
export const CURRENT_MOTION_GAPS: readonly { id: string; title: string }[] = [
  { id: "shoulderPress", title: "Dumbbell Shoulder Press" },
  { id: "rearDeltFly", title: "Rear-Delt Fly" },
  { id: "dumbbellCurl", title: "Dumbbell Curl" },
  { id: "hammerCurl", title: "Hammer Curl" },
  { id: "chestSupportedRow", title: "Chest-Supported Row" },
  { id: "chestPress", title: "Chest Press" },
  { id: "trapBarDeadlift", title: "Trap-Bar Deadlift" },
  { id: "legPress", title: "Leg Press" },
  { id: "bulgarianSplitSquat", title: "Bulgarian Split Squat" },
  { id: "squatToCurl", title: "Squat-to-Curl" },
  { id: "stepAltCurl", title: "Step + Alternating Curl" },
  { id: "stepShoulderPress", title: "Step + Shoulder Press" },
  { id: "reverseStepRow", title: "Reverse Step + Row" },
  { id: "farmerMarch", title: "Farmer / Suitcase March" },
  { id: "cablePunch", title: "Cable Punch" },
  { id: "medBallChestPass", title: "Medicine-Ball Chest Pass" },
  { id: "easyWalk", title: "Easy Walk / Treadmill" },
  { id: "externalRotation", title: "Shoulder External Rotation" },
  { id: "battleRopeFinisher", title: "Boxing / Battle-Rope Finisher" },
];

export const CURRENT_MOTION_GAP_COUNT = 19;