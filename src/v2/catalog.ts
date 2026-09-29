import type { V2Viewpoint, V2Workout } from "./types";

export const V2_VIEWPOINTS: V2Viewpoint[] = [
  {
    id: "coach",
    label: "Coach",
    camera: "trainer-facing",
    showCoach: true,
    showAthleteCamera: false,
    compactHud: false,
  },
  {
    id: "manual",
    label: "Manual",
    camera: "coach-eye",
    showCoach: false,
    showAthleteCamera: true,
    compactHud: false,
  },
  {
    id: "shadow",
    label: "Shadow",
    camera: "follow-along",
    showCoach: true,
    showAthleteCamera: false,
    compactHud: false,
  },
  {
    id: "glasses",
    label: "Glasses",
    camera: "first-person",
    showCoach: true,
    showAthleteCamera: false,
    compactHud: true,
  },
];

export const V2_WORKOUTS: V2Workout[] = [
  {
    id: "push-arms",
    title: "Push + Arm Finisher",
    focus: "Chest · shoulders · triceps",
    exercises: [
      {
        id: "incline-press",
        name: "Incline Press",
        category: "strength",
        sets: 3,
        reps: "8–10",
        restSeconds: 90,
        equipment: ["incline bench", "dumbbells"],
        motionKey: "inclinePress",
        cues: ["Shoulders down", "Control the bottom", "Drive evenly"],
      },
      {
        id: "chest-press",
        name: "Chest Press",
        category: "strength",
        sets: 3,
        reps: "10–12",
        restSeconds: 90,
        equipment: ["chest press"],
        motionKey: "chestPress",
        cues: ["Chest tall", "Wrists stacked", "Smooth lockout"],
      },
      {
        id: "lateral-raise",
        name: "Lateral Raise",
        category: "strength",
        sets: 3,
        reps: "12–15",
        restSeconds: 60,
        equipment: ["dumbbells"],
        motionKey: "lateralRaise",
        cues: ["Soft elbows", "No shrug", "Control the lowering"],
      },
      {
        id: "triceps-pressdown",
        name: "Rope Triceps Pressdown",
        category: "strength",
        sets: 3,
        reps: "10–15",
        restSeconds: 60,
        equipment: ["cable stack", "rope attachment"],
        motionKey: "tricepsPressdown",
        cues: ["Elbows pinned", "Spread the rope", "Full control"],
      },
    ],
  },
  {
    id: "shadow-boxing",
    title: "Shadow Boxing / Kickboxing",
    focus: "Continuous low-impact conditioning",
    exercises: [
      {
        id: "boxing-flow",
        name: "Boxing Combination Flow",
        category: "boxing",
        sets: 6,
        seconds: 60,
        restSeconds: 30,
        motionKey: "boxingCombination",
        cues: ["Guard home", "Hands return fast", "Move after the combination"],
      },
      {
        id: "front-kick",
        name: "Front Kick Flow",
        category: "kickboxing",
        sets: 3,
        seconds: 45,
        restSeconds: 30,
        motionKey: "frontKick",
        cues: ["Chamber first", "Stay balanced", "Set the foot down quietly"],
      },
      {
        id: "round-kick",
        name: "Round Kick Flow",
        category: "kickboxing",
        sets: 3,
        seconds: 45,
        restSeconds: 30,
        motionKey: "roundKick",
        cues: ["Pivot the base foot", "Keep the kick controlled", "Return to guard"],
      },
    ],
  },
];

export function viewpointFor(id: string) {
  return V2_VIEWPOINTS.find((v) => v.id === id) ?? V2_VIEWPOINTS[0];
}
