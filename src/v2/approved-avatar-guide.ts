/**
 * Exact legacy avatar-guide fallbacks for V2.
 * These are the app's existing two-panel START/FINISH exercise cards.
 * They are static guides, not motion video, and are used only when the
 * exact exercise has no approved moving coach clip.
 */
import { EXERCISE_IMAGES, type ExerciseImage } from "@/data/exercise-images";
import type { V2Exercise } from "./types";

const RELEASE = "https://github.com/moorew3/m3-coach-pwa/releases/download/app-static-media-v1";

const RECOVERED_ORIGINAL_GUIDES: Readonly<Record<string, ExerciseImage>> = {
  easyWalk: {
    src: RELEASE + "/f1b05112-ac00-4ee7-8d7d-13a6fcc3a2b9-easyWalk.jpg",
    title: "Easy Walk",
    cues: ["Walk tall", "Relax the shoulders", "Smooth controlled pace"],
    equipment: "Treadmill",
  },
  externalRotation: {
    src: RELEASE + "/4eec646f-3f80-412b-8676-01ac958fdf8b-externalRotation.jpg",
    title: "External Rotation",
    cues: ["Elbow pinned", "Rotate outward", "Use a light load"],
    equipment: "Band or cable",
  },
  shoulderPress: {
    src: RELEASE + "/5218b9e5-760c-4624-9f2b-4352aa155c4a-shoulderPress.png",
    title: "Shoulder Press",
    cues: ["Sit or stand tall", "Press straight up", "Do not lean back"],
    equipment: "Dumbbells",
  },
  rearDeltFly: {
    src: RELEASE + "/7de17e74-2654-4172-b13d-ea40cfb8dd73-rearDeltFly.png",
    title: "Rear-Delt Fly",
    cues: ["Soft elbows", "Open through the rear shoulders", "Control the return"],
    equipment: "Dumbbells",
  },
  dumbbellCurl: {
    src: RELEASE + "/e3806308-91e9-413a-b123-288852ee5a93-dumbbellCurl.png",
    title: "Dumbbell Curl",
    cues: ["Elbows stay close", "No swinging", "Lower slowly"],
    equipment: "Dumbbells",
  },
  battleRopeFinisher: {
    src: RELEASE + "/a1c85e3b-d2bf-4116-a75b-a1cb4036d003-battleRopeFinisher.jpg",
    title: "Battle Rope Finisher",
    cues: ["Athletic stance", "Keep the waves controlled", "Breathe continuously"],
    equipment: "Battle ropes",
  },
  squatToCurl: {
    src: RELEASE + "/d62a2338-5482-4a65-8e76-9ed6913d5055-squatToCurl.png",
    title: "Squat to Curl",
    cues: ["Sit into the squat", "Stand tall", "Curl without swinging"],
    equipment: "Dumbbells",
  },
  stepAltCurl: {
    src: RELEASE + "/1d98a3c2-229e-4c5b-924f-27983a50a075-tuesday_guide.png",
    title: "Step + Alternating Curl",
    cues: ["Step under control", "Alternate the curl", "Stay upright"],
    equipment: "Dumbbells",
  },
  stepShoulderPress: {
    src: RELEASE + "/1d98a3c2-229e-4c5b-924f-27983a50a075-tuesday_guide.png",
    title: "Step + Shoulder Press",
    cues: ["Balance before pressing", "Press overhead", "Keep ribs down"],
    equipment: "Dumbbells",
  },
  reverseStepRow: {
    src: RELEASE + "/1bc4153f-484f-4fa2-85a3-37883d1f1d38-reverseStepRow.png",
    title: "Reverse Step + Row",
    cues: ["Step back smoothly", "Brace before rowing", "Control the return"],
    equipment: "Dumbbells",
  },
  farmerMarch: {
    src: RELEASE + "/1e566bd1-4dd1-496a-a1e4-980d60c1bd22-farmerMarch.png",
    title: "Farmer March",
    cues: ["Stand tall", "March slowly", "Do not lean"],
    equipment: "Dumbbells",
  },
  chestSupportedRow: {
    src: RELEASE + "/c3771c29-7765-4fc3-bb93-dc0a07a88381-chestSupportedRow.png",
    title: "Chest-Supported Row",
    cues: ["Chest stays on the pad", "Drive elbows back", "Squeeze the upper back"],
    equipment: "Incline bench + dumbbells",
  },
  romanianDeadlift: {
    src: "/media/recovered-avatar/romanian-deadlift.webp",
    title: "Romanian Deadlift",
    cues: ["Soft knees", "Hips back", "Long spine · weights stay close"],
    equipment: "Dumbbells or barbell",
  },
  trapBarDeadlift: {
    src: RELEASE + "/eed22289-0647-40bf-a19e-d04caa2fd9d8-trapBarDeadlift.png",
    title: "Trap-Bar Deadlift",
    cues: ["Center inside the hex bar", "Brace before lifting", "Stand tall through the hips"],
    equipment: "Trap / hex bar",
  },
  legPress: {
    src: RELEASE + "/316cf984-30e9-4ac6-9376-5b5ae5957d87-legPress.png",
    title: "Leg Press",
    cues: ["Back stays on the pad", "Lower under control", "Press through the whole foot"],
    equipment: "Leg press machine",
  },
  bulgarianSplitSquat: {
    src: RELEASE + "/03eebf15-b135-4ed7-bac4-69caf1fb928f-bulgarianSplitSquat.png",
    title: "Bulgarian Split Squat",
    cues: ["Rear foot secure", "Lower straight down", "Drive through the front foot"],
    equipment: "Bench + dumbbells",
  },
  hamstringCurl: {
    src: "/media/recovered-avatar/hamstring-curl.webp",
    title: "Hamstring Curl",
    cues: ["Hips stay pinned", "Curl smoothly", "Slow controlled return"],
    equipment: "Leg curl machine",
  },
  chestPress: {
    src: RELEASE + "/2679019a-9790-4ed1-be5e-b6d030ddc83e-chestPress.png",
    title: "Chest Press",
    cues: ["Back supported", "Press smoothly", "Do not shrug"],
    equipment: "Chest press machine",
  },
  cablePunch: {
    src: RELEASE + "/89658984-1568-41e8-aa1b-946a0de63450-cablePunch.png",
    title: "Cable Punch",
    cues: ["Staggered stance", "Rotate through the punch", "Control the return"],
    equipment: "Cable",
  },
  medBallChestPass: {
    src: RELEASE + "/9c801c43-b869-4975-8205-102511a0d719-medBallChestPass.png",
    title: "Medicine-Ball Chest Pass",
    cues: ["Ball at chest", "Drive forward", "Stay balanced"],
    equipment: "Medicine ball",
  },
};

const GUIDE_KEY_BY_MOTION: Record<string, string> = {
  easyWalk: "inclineTreadmillWalk",
  treadmillWalk: "inclineTreadmillWalk",
  externalRotation: "shoulderExternalRotation",
  chestSupportedRow: "chestSupportedRow",
  chestPress: "chestPress",
  rearDeltFly: "rearDeltFly",
  legPress: "legPress",
  hammerCurl: "hammerCurl",
  hamstringCurl: "legCurl",
  latPulldown: "latPulldown",
  seatedRow: "seatedRow",
  lateralRaise: "lateralRaise",
  inclineDumbbellPress: "inclineDumbbellPress",
  bandPullApart: "bandPullApart",
  deadBug: "deadBug",
  gluteBridge: "gluteBridge",
  tricepsPressdown: "tricepPushdown",
};

export function approvedAvatarGuide(exercise?: V2Exercise): ExerciseImage | undefined {
  if (!exercise) return undefined;
  const recovered = RECOVERED_ORIGINAL_GUIDES[exercise.motionKey];
  if (recovered) return recovered;
  const key = GUIDE_KEY_BY_MOTION[exercise.motionKey];
  return key ? EXERCISE_IMAGES[key] : undefined;
}
