/**
 * INDIVIDUAL EXERCISE IMAGE LIBRARY
 * ------------------------------------------------------------------
 * One two-panel (START / FINISH) card per unique movement, using the
 * same athlete avatar in every image. Keyed by `Exercise.image`.
 * Reused across days — never duplicate a movement here.
 */
import { isIdentityQuarantined } from "@/data/coach-identity";

export interface ExerciseImage {
  src: string;
  title: string;
  /** 1–3 short technique cues printed on the card. */
  cues: string[];
  equipment: string;
}

export const EXERCISE_IMAGES: Record<string, ExerciseImage> = {
  bandPullApart: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/41e46478-4abf-40c8-98d3-e9683e5be3b0/bandPullApart.jpg",
    title: "Band Pull-Apart",
    cues: ["Arms straight", "Squeeze shoulder blades", "Ribs down"],
    equipment: "Resistance band",
  },
  shoulderExternalRotation: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4f4597ad-da0e-4313-a078-ffd4681edd57/shoulderExternalRotation.jpg",
    title: "Shoulder External Rotation",
    cues: ["Elbow pinned to the ribs", "Rotate, don't lift", "Light band"],
    equipment: "Band or light cable",
  },
  chestPress: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/45cef615-2f76-4ec1-8094-120fd4eb4f3b/chestPress.jpg",
    title: "Chest Press",
    cues: ["Elbows ~45°", "Full range", "Stop 1–2 reps shy"],
    equipment: "Machine or dumbbells",
  },
  inclineDumbbellPress: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/2cf8f565-6693-49fb-bba2-19c84a613a21/inclineDumbbellPress.jpg",
    title: "Incline Dumbbell Press",
    cues: ["Bench at 30°", "Control down", "No clanging"],
    equipment: "Incline bench + dumbbells",
  },
  cableFly: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/777293e9-1899-4285-a408-7177beee33fd/cableFly.jpg",
    title: "Cable / Dumbbell Fly",
    cues: ["Soft elbows", "Light load", "Stop before the pinch"],
    equipment: "Cables or dumbbells",
  },
  lateralRaise: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4672de1e-70fd-4bf4-a515-057da3d45944/lateralRaise.jpg",
    title: "Seated Lateral Raise",
    cues: ["Seated and supported", "Lead with the elbows", "Stop at shoulder height"],
    equipment: "Dumbbells",
  },
  facePull: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/36bda219-5015-490b-a6ca-14645e75ab1e/facePull.jpg",
    title: "Face Pull",
    cues: ["Pull to forehead height", "Thumbs back", "Light load"],
    equipment: "Cable rope or band",
  },
  inclineWaiterCurl: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/fccc4b59-2c51-4709-ba22-36b602747f0c/inclineWaiterCurl.jpg",
    title: "Incline Waiter Curl",
    cues: ["Chest on the incline pad", "One dumbbell, both palms", "3-second lower"],
    equipment: "Incline bench + one dumbbell",
  },
  inclineTreadmillWalk: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/a9e09791-cf70-4145-beb8-f02e7cd6d03d/inclineTreadmillWalk.jpg",
    title: "Incline Treadmill Walk",
    cues: ["Walk tall", "Hands off the rails", "Lower incline if the back complains"],
    equipment: "Treadmill",
  },
  deadBug: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/77d2c47c-099e-4df5-ae3a-e907ec27468b/deadBug.jpg",
    title: "Dead Bug",
    cues: ["Low back flat", "Exhale as limbs extend", "Slow"],
    equipment: "Bodyweight",
  },
  pallofPress: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/07e846c4-fded-4bb8-a36d-02ea165b998a/pallofPress.jpg",
    title: "Pallof Press",
    cues: ["Stand side-on", "Resist the twist", "Press straight out"],
    equipment: "Cable or band",
  },
  reverseCrunch: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/c5da1950-83fe-4546-95dd-7a3608596d72/reverseCrunch.jpg",
    title: "Reverse Crunch",
    cues: ["Curl the pelvis", "No leg swing", "Slow return"],
    equipment: "Bodyweight / mat",
  },
  closeGripPushup: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/38bfbc0c-3d79-48f0-98a5-3a31366544ce/closeGripPushup.jpg",
    title: "Close-Grip Push-Up",
    cues: ["Hands under the chest", "Elbows brush the ribs", "Elevate hands to reduce load"],
    equipment: "Bodyweight or bench",
  },
  squatToBench: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/b7c89341-92d7-4833-a6a1-aaed572b2c7a/squatToBench.jpg",
    title: "Squat to Bench",
    cues: ["Sit back to the bench", "Tap, don't crash", "Drive through mid-foot"],
    equipment: "Bench / box",
  },
  legPress: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/93069373-eb97-4979-8bee-572bd2d110a7/legPress.jpg",
    title: "Leg Press",
    cues: ["Low back flat on the pad", "Comfortable depth", "No hip curl"],
    equipment: "Leg press machine",
  },
  gobletSquatToBench: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/cb312e14-5dbf-4e4b-b9fe-06192e740ecf/gobletSquatToBench.jpg",
    title: "Goblet Squat to Bench",
    cues: ["Dumbbell at the chest", "Elbows inside the knees", "Stand tall"],
    equipment: "Dumbbell + bench",
  },
  legCurl: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/a288712e-992f-4e2f-814e-6b190c352af8/legCurl.jpg",
    title: "Leg Curl",
    cues: ["Hips stay down", "Squeeze the hamstrings", "Slow return"],
    equipment: "Leg curl machine",
  },
  calfRaise: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/25f5a609-65bc-44c8-92e0-426c5e6e31a4/calfRaise.jpg",
    title: "Standing Calf Raise",
    cues: ["Full stretch at the bottom", "Pause at the top", "No bouncing"],
    equipment: "Machine or step",
  },
  hipThrust: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/7d5d5b61-8490-4dc8-9001-076c711166b8/hipThrust.jpg",
    title: "Hip Thrust",
    cues: ["Ribs down, chin tucked", "Squeeze at the top", "Pad the bar"],
    equipment: "Bench + barbell / machine",
  },
  hammerCurl: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/c9ce3bcb-014e-4511-959c-12610d3569cf/hammerCurl.jpg",
    title: "Cross-Body Hammer Curl",
    cues: ["Thumb-up grip", "Curl across the body", "Elbow pinned"],
    equipment: "Dumbbells",
  },
  gluteBridge: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/855e2d4b-f5de-4c13-a1fa-74a73a5c272c/gluteBridge.jpg",
    title: "Glute Bridge",
    cues: ["Heels close", "Squeeze the glutes", "Ribs down"],
    equipment: "Bodyweight / mat",
  },
  bandPulldown: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e87230bc-863a-4ceb-b4e5-8e89b174c798/bandPulldown.jpg",
    title: "Band Pulldown",
    cues: ["Straight arms", "Drive to the thighs", "Chest tall"],
    equipment: "Band anchored high",
  },
  latPulldown: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/0674db72-0919-4f5c-8c02-e75dce1d56b5/latPulldown.jpg",
    title: "Lat Pulldown",
    cues: ["Chest tall", "Pull to the collarbone", "Control back up"],
    equipment: "Lat pulldown machine",
  },
  seatedRow: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/cdbda9c2-3f26-4d80-a953-c55884629fab/seatedRow.jpg",
    title: "Seated Cable Row",
    cues: ["Tall torso", "Elbows to the ribs", "No heavy lean-back"],
    equipment: "Cable row machine",
  },
  chestSupportedRow: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e609121a-097d-4e82-99e6-8c881b0152d7/chestSupportedRow.jpg",
    title: "Chest-Supported Row",
    cues: ["Chest stays on the pad", "Elbows to the ribs", "Squeeze"],
    equipment: "Incline bench + dumbbells",
  },
  oneArmRow: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/283d14be-98da-4af4-9aef-81970a0756a2/oneArmRow.jpg",
    title: "One-Arm Supported Row",
    cues: ["Flat back", "Row to the hip", "No twisting"],
    equipment: "Bench + dumbbell",
  },
  rearDeltFly: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/7346e0c4-3821-40c3-b755-51961b176c8b/rearDeltFly.jpg",
    title: "Rear-Delt Fly",
    cues: ["Light weight", "Soft elbows", "Lead with the pinkies"],
    equipment: "Dumbbells or reverse pec-deck",
  },
  tricepPushdown: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e3fa2640-396e-4995-ac22-4ab31c75bfe5/tricepPushdown.jpg",
    title: "Triceps Pushdown",
    cues: ["Elbows pinned", "Full lockout", "Slow return"],
    equipment: "Cable rope or band",
  },
  overheadExtension: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/05a69afd-aef4-45fb-963f-a73ab15c4c54/overheadExtension.jpg",
    title: "Overhead Triceps Extension",
    cues: ["Elbows narrow", "Ribs down", "Control the stretch"],
    equipment: "Dumbbell, rope or band",
  },
  assistedEccentricCurl: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/b3c5afea-371a-4e47-b70c-ae7db41a9de3/assistedEccentricCurl.jpg",
    title: "Assisted Eccentric Curl",
    cues: ["Two arms up", "One arm down", "3–5 second lower"],
    equipment: "Dumbbell",
  },
  pjrPullover: {
    src: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/5bc9e1bc-84b0-4cdd-a7fc-a3f9326b659a/pjrPullover.jpg",
    title: "PJR Pullover",
    cues: ["Deep stretch", "Elbows tucked", "Stop if elbows hurt"],
    equipment: "EZ bar or dumbbells",
  },
};

export const imageFor = (key?: string): ExerciseImage | undefined =>
  key && !isIdentityQuarantined(key) ? EXERCISE_IMAGES[key] : undefined;