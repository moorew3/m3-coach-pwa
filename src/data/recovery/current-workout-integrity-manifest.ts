/**
 * RECOVERY SNAPSHOT — workout integrity, captured 2026-09-20.
 *
 * Canonical day order, exercise identity, mirror (library) keys, logging ids
 * and prescriptions as served today. DATA ONLY: nothing imports this at
 * runtime. After the rollback, the restored program must reproduce this
 * structure exactly, or saved history stops matching.
 */
export interface SnapshotExercise {
  /** Logging identifier — progress history is keyed by this. */
  id: string;
  /** Canonical exercise-library key. */
  mirror?: string;
  name: string;
  sets?: number;
  reps?: string | number;
  time?: string | number;
  rest?: string | number;
}

export interface SnapshotDay {
  day: number;
  title: string;
  exercises: readonly SnapshotExercise[];
}

export const CURRENT_WORKOUT_DAYS: readonly SnapshotDay[] = [
  {
    day: 1,
    title: "Strength A",
    exercises: [
      { id: "wu-walk-3", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "3 min @ conversational pace", rest: 0 },
      { id: "wu-shoulder-mobility", mirror: "shoulderMobility", name: "Shoulder Mobility", sets: 1, reps: "30 sec", rest: 0 },
      { id: "wu-band-pull-apart", mirror: "bandPullApart", name: "Band Pull-Apart", sets: 2, reps: "15", rest: 30 },
      { id: "wu-external-rotation", mirror: "externalRotation", name: "Shoulder External Rotation", sets: 2, reps: "12 per side", rest: 30 },
      { id: "mon-shoulder-press", mirror: "shoulderPress", name: "Dumbbell Shoulder Press", sets: 3, reps: "8–12", rest: 90 },
      { id: "mon-lateral-raise", mirror: "lateralRaise", name: "Dumbbell Lateral Raise", sets: 3, reps: "12–15", rest: 60 },
      { id: "mon-rear-delt-fly", mirror: "rearDeltFly", name: "Rear-Delt Fly", sets: 3, reps: "12–15", rest: 60 },
      { id: "mon-db-curl", mirror: "dumbbellCurl", name: "Dumbbell Curl", sets: 3, reps: "8–12", rest: 60 },
      { id: "mon-hammer-curl", mirror: "hammerCurl", name: "Hammer Curl", sets: 3, reps: "10–12", rest: 60 },
      { id: "mon-triceps-pressdown", mirror: "tricepsPressdown", name: "Triceps Pressdown", sets: 3, reps: "10–15", rest: 60 },
      { id: "mon-finisher", mirror: "battleRopeFinisher", name: "Boxing / Battle-Rope Finisher", sets: 1, reps: "5–8 min · 30 sec work / 30 sec easy", rest: 0 },
    ],
  },
  {
    day: 2,
    title: "Weighted Cardio",
    exercises: [
      { id: "wu-walk-cardio", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "4 min @ conversational pace", rest: 0 },
      { id: "wu-cardio-shoulders", mirror: "controlledShoulderWork", name: "Controlled Shoulder Work", sets: 1, reps: "45 sec", rest: 0 },
      { id: "cardio-squat-curl", mirror: "squatToCurl", name: "Squat-to-Curl", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-step-curl", mirror: "stepAltCurl", name: "Step + Alternating Curl", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-step-press", mirror: "stepShoulderPress", name: "Step + Shoulder Press", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-reverse-row", mirror: "reverseStepRow", name: "Reverse Step + Row", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-punches", mirror: "lightPunches", name: "Shadowbox Punches (no weights)", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-farmer-march", mirror: "farmerMarch", name: "Farmer / Suitcase March", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-shoulder-work", mirror: "controlledShoulderWork", name: "Controlled Shoulder Work", sets: 3, reps: "40 sec work / 20 sec transition", rest: 20 },
      { id: "cardio-cooldown", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "5 min @ conversational pace", rest: 0 },
    ],
  },
  {
    day: 3,
    title: "Strength B",
    exercises: [
      { id: "wu-walk-3", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "3 min @ conversational pace", rest: 0 },
      { id: "wu-shoulder-mobility", mirror: "shoulderMobility", name: "Shoulder Mobility", sets: 1, reps: "30 sec", rest: 0 },
      { id: "wu-band-pull-apart", mirror: "bandPullApart", name: "Band Pull-Apart", sets: 2, reps: "15", rest: 30 },
      { id: "wu-external-rotation", mirror: "externalRotation", name: "Shoulder External Rotation", sets: 2, reps: "12 per side", rest: 30 },
      { id: "wed-bench", mirror: "benchPress", name: "Bench Press", sets: 4, reps: "6–10", rest: 120 },
      { id: "wed-chest-supported-row", mirror: "chestSupportedRow", name: "Chest-Supported Row", sets: 4, reps: "8–12", rest: 90 },
      { id: "wed-incline-press", mirror: "inclineDumbbellPress", name: "Incline Dumbbell Press", sets: 3, reps: "8–12", rest: 90 },
      { id: "wed-lat-pulldown", mirror: "latPulldown", name: "Lat Pulldown", sets: 3, reps: "8–12", rest: 90 },
      { id: "wed-seated-row", mirror: "seatedRow", name: "Seated Row", sets: 3, reps: "8–12", rest: 90 },
      { id: "wed-curl", mirror: "dumbbellCurl", name: "Biceps Curl", sets: 3, reps: "10–12", rest: 60 },
      { id: "wed-triceps", mirror: "tricepsPressdown", name: "Triceps Pressdown", sets: 3, reps: "10–12", rest: 60 },
    ],
  },
  {
    day: 4,
    title: "Recovery / Mobility",
    exercises: [
      { id: "thu-walk", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "5 min @ conversational pace", rest: 0 },
      { id: "mob-hip-flexor", mirror: "hipFlexorStretch", name: "Hip-Flexor Stretch", sets: 2, reps: "20–30 sec each side", rest: 0 },
      { id: "mob-shoulder", mirror: "shoulderMobility", name: "Shoulder Mobility", sets: 2, reps: "20–30 sec", rest: 0 },
      { id: "mob-chest", mirror: "chestMobility", name: "Chest Mobility", sets: 2, reps: "20–30 sec each side", rest: 0 },
      { id: "mob-hamstring", mirror: "hamstringMobility", name: "Hamstring Mobility", sets: 2, reps: "20–30 sec each side", rest: 0 },
      { id: "mob-lower-body", mirror: "lowerBodyMobility", name: "Lower-Body Mobility Flow", sets: 2, reps: "60–90 sec", rest: 0 },
      { id: "thu-dead-bug", mirror: "deadBug", name: "Dead Bug", sets: 2, reps: "8 each side", rest: 30 },
    ],
  },
  {
    day: 5,
    title: "Strength C",
    exercises: [
      { id: "wu-walk-4", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "4 min @ conversational pace", rest: 0 },
      { id: "wu-lower-mobility", mirror: "lowerBodyMobility", name: "Lower-Body Mobility Flow", sets: 1, reps: "2 min", rest: 0 },
      { id: "wu-glute-bridge", mirror: "gluteBridge", name: "Glute Bridge (activation)", sets: 2, reps: "12", rest: 30 },
      { id: "fri-squat", mirror: "squat", name: "Squat", sets: 3, reps: "8–12", rest: 120 },
      { id: "fri-rdl", mirror: "romanianDeadlift", name: "Romanian Deadlift", sets: 3, reps: "8–12", rest: 120 },
      { id: "fri-trap-bar", mirror: "trapBarDeadlift", name: "Trap-Bar Deadlift", sets: 3, reps: "5–8", rest: 150 },
      { id: "fri-leg-press", mirror: "legPress", name: "Leg Press", sets: 3, reps: "8–12", rest: 90 },
      { id: "fri-split-squat", mirror: "bulgarianSplitSquat", name: "Bulgarian Split Squat", sets: 3, reps: "8 each side", rest: 90 },
      { id: "fri-ham-curl", mirror: "hamstringCurl", name: "Hamstring Curl", sets: 3, reps: "10–12", rest: 60 },
      { id: "fri-chest-press", mirror: "chestPress", name: "Chest Press", sets: 3, reps: "8–12", rest: 90 },
      { id: "fri-row", mirror: "seatedRow", name: "Row", sets: 3, reps: "8–12", rest: 90 },
      { id: "fri-lateral-raise", mirror: "lateralRaise", name: "Lateral Raise", sets: 3, reps: "12–15", rest: 60 },
      { id: "fri-biceps", mirror: "dumbbellCurl", name: "Biceps", sets: 3, reps: "10–15", rest: 60 },
      { id: "fri-triceps", mirror: "tricepsPressdown", name: "Triceps", sets: 3, reps: "10–15", rest: 60 },
      { id: "fri-suitcase-carry", mirror: "suitcaseCarry", name: "Suitcase Carry", sets: 3, reps: "30 sec each side", rest: 60 },
    ],
  },
  {
    day: 6,
    title: "Boxing / Kickboxing",
    exercises: [
      { id: "wu-walk-cardio", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "4 min @ conversational pace", rest: 0 },
      { id: "wu-cardio-shoulders", mirror: "controlledShoulderWork", name: "Controlled Shoulder Work", sets: 1, reps: "45 sec", rest: 0 },
      { id: "box-stance", mirror: "boxingStance", name: "Boxing Stance", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-jab", mirror: "jab", name: "Jab", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-cross", mirror: "cross", name: "Cross", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-jab-cross", mirror: "jabCross", name: "Jab–Cross Combination", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-defense", mirror: "defensiveReset", name: "Defensive Reset / Movement", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-cable-punch", mirror: "cablePunch", name: "Cable Punch", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-front-kick", mirror: "frontKick", name: "Front Kick", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-round-kick", mirror: "roundKick", name: "Round Kick", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-knee", mirror: "kneeChamber", name: "Knee Chamber", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "box-guard-reset", mirror: "guardReset", name: "Guard / Reset Drill", sets: 3, reps: "40 sec work / 20 sec reset", rest: 20 },
      { id: "sat-med-ball", mirror: "medBallChestPass", name: "Medicine-Ball Chest Pass", sets: 3, reps: "8–10", rest: 60 },
      { id: "sat-cooldown", mirror: "easyWalk", name: "Easy Walk / Treadmill", sets: 1, reps: "5 min @ conversational pace", rest: 0 },
    ],
  },
  {
    day: 7,
    title: "Rest",
    exercises: [
      { id: "sun-mobility", mirror: "lowerBodyMobility", name: "Optional Easy Mobility", sets: 1, reps: "5–10 min", rest: 0 },
    ],
  },
];

/** Alias keys Coach Mode currently needs to resolve media for a movement. */
export const CURRENT_COACH_ALIASES: Readonly<Record<string, string>> = {
  "treadmillWalk": "easyWalk",
  "inclineWalk": "easyWalk",
  "hipFlexorMobility": "hipFlexorStretch",
  "jabCrossCombo": "jabCross",
  "lightPunches": "shadowboxPunches",
  "shoulderExternalRotation": "externalRotation",
  "legCurl": "hamstringCurl",
};

export const CURRENT_TOTAL_SCHEDULED_SLOTS = 69;