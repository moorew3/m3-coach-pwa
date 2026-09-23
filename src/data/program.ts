/**
 * CENTRALIZED PROGRAM DATA — WEEKLY TRAINING SYSTEM
 * -------------------------------------------------------------
 * Fat-loss conditioning + arm growth + shoulder strength.
 *
 * Mon  Strength A — Shoulders + Arms
 * Tue  Weighted Cardio (low impact)
 * Wed  Strength B — Chest + Back + Arms
 * Thu  Recovery / Mobility
 * Fri  Strength C — Full Body + Arms
 * Sat  Weighted Cardio OR Boxing / Kickboxing conditioning
 * Sun  Rest
 *
 * Everything the app shows comes from this file. Edit here to change
 * exercises, sets, reps, rest, cues, substitutions or pairing.
 * The original 22-day arm plan lives in src/data/legacy-program.ts.
 */

export type DiagramKey = string;

export interface Exercise {
  id: string;
  name: string;
  target: string;
  sets: number;
  reps: string;
  rest: number; // seconds
  diagram: DiagramKey;
  /** Key into EXERCISE_IMAGES — the individual two-panel guide card. */
  image?: string;
  /** Key into MIRROR_MOVES — the Mirror Me animated demo. */
  mirror?: string;
  tracked?: boolean; // show weight input

  notes?: string;
  substitutions?: string[];
  /** Optional slot — can be skipped or swapped to keep the session practical. */
  optional?: boolean;
  /** Optional superset group label, e.g. "A". Paired exercises share it. */
  superset?: string;
  /** Slot inside the superset, e.g. "A1" / "A2". */
  supersetSlot?: string;
  /** Shared rest (seconds) taken AFTER the last slot of the group. */
  supersetRest?: number;
  /** Circuit label — exercises performed back to back in rounds. */
  circuit?: string;
  /** Shown when superset mode pairs this exercise. */
  supersetWarning?: string;
  /** Explicit coaching category for user-created movements. */
  category?: import("@/lib/store").ExerciseCategory;
}

export interface DayPlan {
  key: string;
  weekday: string;
  title: string;
  focus: string;
  type: "workout" | "cardio" | "boxing" | "recovery" | "measure";
  summary: string;
  warmup: Exercise[];
  main: Exercise[];
  finisher: Exercise[];
}

const ex = (e: Exercise): Exercise => ({ tracked: true, ...e });

/* ------------------------------ WARM-UPS ------------------------------ */

const walk = (mins: string, id: string): Exercise =>
  ex({
    id,
    name: "Easy Walk / Treadmill",
    target: "General warm-up",
    sets: 1,
    reps: `${mins} @ conversational pace`,
    rest: 0,
    diagram: "treadmill-walk",
    image: "inclineTreadmillWalk",
    mirror: "easyWalk",
    tracked: false,
    notes: "Nose-breathing pace. Zero impact.",
    substitutions: ["Marching in place", "Easy stationary bike"],
  });

const warmupUpper: Exercise[] = [
  walk("3 min", "wu-walk-3"),
  ex({
    id: "wu-shoulder-mobility",
    name: "Shoulder Mobility",
    target: "Shoulders",
    sets: 1,
    reps: "30 sec",
    rest: 0,
    diagram: "shoulder-mobility",
    mirror: "shoulderMobility",
    tracked: false,
    notes: "Slow arcs, pain-free range only.",
  }),
  ex({
    id: "wu-band-pull-apart",
    name: "Band Pull-Apart",
    target: "Upper back / rear delts",
    sets: 2,
    reps: "15",
    rest: 30,
    diagram: "band-pull-apart",
    image: "bandPullApart",
    mirror: "bandPullApart",
    tracked: false,
    notes: "Light band. Squeeze the shoulder blades, keep the ribs down.",
    substitutions: ["Reverse fly with light dumbbells", "Towel pull-apart"],
  }),
  ex({
    id: "wu-external-rotation",
    name: "Shoulder External Rotation",
    target: "Rotator cuff",
    sets: 2,
    reps: "12 per side",
    rest: 30,
    diagram: "external-rotation",
    image: "shoulderExternalRotation",
    mirror: "externalRotation",
    tracked: false,
    notes: "Elbow pinned to the ribs. Rotate the forearm out — do not lift the elbow.",
    substitutions: ["Side-lying dumbbell external rotation", "Cable external rotation"],
  }),
];

const warmupLower: Exercise[] = [
  walk("4 min", "wu-walk-4"),
  ex({
    id: "wu-lower-mobility",
    name: "Lower-Body Mobility Flow",
    target: "Hips, knees, ankles",
    sets: 1,
    reps: "2 min",
    rest: 0,
    diagram: "lower-mobility",
    mirror: "lowerBodyMobility",
    tracked: false,
    notes: "Comfortable ranges only — this is preparation, not a stretch session.",
  }),
  ex({
    id: "wu-glute-bridge",
    name: "Glute Bridge (activation)",
    target: "Glutes",
    sets: 2,
    reps: "12",
    rest: 30,
    diagram: "glute-bridge",
    image: "gluteBridge",
    mirror: "gluteBridge",
    tracked: false,
    notes: "Squeeze at the top for one count. Ribs down.",
  }),
];

const warmupCardio: Exercise[] = [
  walk("4 min", "wu-walk-cardio"),
  ex({
    id: "wu-cardio-shoulders",
    name: "Controlled Shoulder Work",
    target: "Shoulder prep",
    sets: 1,
    reps: "45 sec",
    rest: 0,
    diagram: "shoulder-mobility",
    mirror: "controlledShoulderWork",
    tracked: false,
    notes: "Very light dumbbells or nothing at all.",
  }),
];

/* -------------------------- MONDAY — STRENGTH A ------------------------ */

export const MONDAY: DayPlan = {
  key: "mon",
  weekday: "Monday",
  title: "Strength A",
  focus: "Shoulders + Arms",
  type: "workout",
  summary:
    "Free-weight shoulder pressing, delt work and direct arm training. Optional low-impact boxing or rope finisher.",
  warmup: warmupUpper,
  main: [
    ex({
      id: "mon-shoulder-press",
      name: "Dumbbell Shoulder Press",
      target: "Shoulders",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "shoulder-press",
      mirror: "shoulderPress",
      notes: "Seated and supported. Free weights only — no machine shoulder press.",
      substitutions: ["Landmine press", "Arnold press (light)", "Half-kneeling one-arm press"],
    }),
    ex({
      id: "mon-lateral-raise",
      name: "Dumbbell Lateral Raise",
      target: "Side delts",
      sets: 3,
      reps: "12–15",
      rest: 60,
      diagram: "lateral-raise",
      image: "lateralRaise",
      mirror: "lateralRaise",
      superset: "A",
      supersetSlot: "A1",
      supersetRest: 75,
      substitutions: ["Cable lateral raise", "Seated lateral raise"],
    }),
    ex({
      id: "mon-rear-delt-fly",
      name: "Rear-Delt Fly",
      target: "Rear delts / upper back",
      sets: 3,
      reps: "12–15",
      rest: 60,
      diagram: "rear-delt-fly",
      image: "rearDeltFly",
      mirror: "rearDeltFly",
      superset: "A",
      supersetSlot: "A2",
      supersetRest: 75,
      substitutions: ["Reverse pec-deck", "Cable rear-delt fly", "Band pull-apart"],
    }),
    ex({
      id: "mon-db-curl",
      name: "Dumbbell Curl",
      target: "Biceps",
      sets: 3,
      reps: "8–12",
      rest: 60,
      diagram: "db-curl",
      mirror: "dumbbellCurl",
      superset: "B",
      supersetSlot: "B1",
      supersetRest: 75,
      notes: "Strict. No swinging or cheat curls.",
      substitutions: ["Incline dumbbell curl", "Cable curl", "EZ-bar curl"],
    }),
    ex({
      id: "mon-hammer-curl",
      name: "Hammer Curl",
      target: "Biceps / brachialis",
      sets: 3,
      reps: "10–12",
      rest: 60,
      diagram: "hammer-curl",
      image: "hammerCurl",
      mirror: "hammerCurl",
      substitutions: ["Rope hammer curl", "Cross-body hammer curl"],
    }),
    ex({
      id: "mon-triceps-pressdown",
      name: "Triceps Pressdown",
      target: "Triceps",
      sets: 3,
      reps: "10–15",
      rest: 60,
      diagram: "pressdown",
      image: "tricepPushdown",
      mirror: "tricepsPressdown",
      superset: "B",
      supersetSlot: "B2",
      supersetRest: 75,
      substitutions: ["Overhead rope extension", "Band pressdown"],
      notes: "No bench dips — ever.",
    }),
  ],
  finisher: [
    ex({
      id: "mon-finisher",
      name: "Boxing / Battle-Rope Finisher",
      target: "Conditioning (optional)",
      sets: 1,
      reps: "5–8 min · 30 sec work / 30 sec easy",
      rest: 0,
      diagram: "boxing",
      mirror: "battleRopeFinisher",
      tracked: false,
      optional: true,
      notes: "Optional. Skip it if the shoulders are already cooked. No jumping.",
      substitutions: ["Shadow boxing", "Easy incline walk 8 min"],
    }),
  ],
};

/* ------------------------ TUESDAY — WEIGHTED CARDIO -------------------- */

const interval = (
  id: string,
  name: string,
  target: string,
  mirror: string,
  notes: string,
): Exercise =>
  ex({
    id,
    name,
    target,
    sets: 3,
    reps: "40 sec work / 20 sec transition",
    rest: 20,
    diagram: mirror,
    mirror,
    tracked: false,
    circuit: "C1",
    notes,
  });

export const TUESDAY: DayPlan = {
  key: "tue",
  weekday: "Tuesday",
  title: "Weighted Cardio",
  focus: "Low-impact conditioning",
  type: "cardio",
  summary:
    "35–45 min follow-along style with light dumbbells. Three rounds of the circuit, 40 sec work / 20 sec transition. No jumping at any point.",
  warmup: warmupCardio,
  main: [
    interval(
      "cardio-squat-curl",
      "Squat-to-Curl",
      "Legs + biceps",
      "squatToCurl",
      "Light dumbbells. Feet stay on the floor.",
    ),
    interval(
      "cardio-step-curl",
      "Step + Alternating Curl",
      "Legs + biceps",
      "stepAltCurl",
      "Step out and back — never hop.",
    ),
    interval(
      "cardio-step-press",
      "Step + Shoulder Press",
      "Legs + shoulders",
      "stepShoulderPress",
      "Ribs down as you press.",
    ),
    interval(
      "cardio-reverse-row",
      "Reverse Step + Row",
      "Legs + back",
      "reverseStepRow",
      "Short hinge, flat back.",
    ),
    interval(
      "cardio-punches",
      "Shadowbox Punches (no weights)",
      "Conditioning",
      "lightPunches",
      "Hands empty for fast punches. Never snap the elbow straight.",
    ),
    interval(
      "cardio-farmer-march",
      "Farmer / Suitcase March",
      "Core + grip",
      "farmerMarch",
      "Tall posture, quiet feet.",
    ),
    interval(
      "cardio-shoulder-work",
      "Controlled Shoulder Work",
      "Shoulder health",
      "controlledShoulderWork",
      "Very light. Quality over burn.",
    ),
  ],
  finisher: [walk("5 min", "cardio-cooldown")],
};

/* ------------------------- WEDNESDAY — STRENGTH B ---------------------- */

export const WEDNESDAY: DayPlan = {
  key: "wed",
  weekday: "Wednesday",
  title: "Strength B",
  focus: "Chest + Back + Arms",
  type: "workout",
  summary: "Pressing and supported pulling, finished with direct arm work.",
  warmup: warmupUpper,
  main: [
    ex({
      id: "wed-bench",
      name: "Bench Press",
      target: "Chest",
      sets: 4,
      reps: "6–10",
      rest: 120,
      diagram: "bench-press",
      mirror: "benchPress",
      notes: "Leave 1–2 reps in reserve. Use dumbbells if the shoulder complains.",
      substitutions: ["Dumbbell bench press", "Machine chest press", "Incline dumbbell press"],
    }),
    ex({
      id: "wed-chest-supported-row",
      name: "Chest-Supported Row",
      target: "Upper back",
      sets: 4,
      reps: "8–12",
      rest: 90,
      diagram: "chest-supported-row",
      image: "chestSupportedRow",
      mirror: "chestSupportedRow",
      notes: "Chest stays on the pad. No heavy unsupported bent-over rows.",
      substitutions: ["Machine row", "Seated cable row"],
    }),
    ex({
      id: "wed-incline-press",
      name: "Incline Dumbbell Press",
      target: "Upper chest",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "incline-press",
      image: "inclineDumbbellPress",
      mirror: "inclineDumbbellPress",
      substitutions: ["Incline machine press", "Low-incline dumbbell press"],
    }),
    ex({
      id: "wed-lat-pulldown",
      name: "Lat Pulldown",
      target: "Lats",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "lat-pulldown",
      image: "latPulldown",
      mirror: "latPulldown",
      substitutions: ["Assisted pull-up", "Band pulldown"],
    }),
    ex({
      id: "wed-seated-row",
      name: "Seated Row",
      target: "Mid back",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "seated-row",
      image: "seatedRow",
      mirror: "seatedRow",
      substitutions: ["Machine row", "Chest-supported dumbbell row"],
    }),
    ex({
      id: "wed-curl",
      name: "Biceps Curl",
      target: "Biceps",
      sets: 3,
      reps: "10–12",
      rest: 60,
      diagram: "db-curl",
      mirror: "dumbbellCurl",
      superset: "C",
      supersetSlot: "C1",
      supersetRest: 75,
      substitutions: ["Incline curl", "Cable curl", "Hammer curl"],
    }),
    ex({
      id: "wed-triceps",
      name: "Triceps Pressdown",
      target: "Triceps",
      sets: 3,
      reps: "10–12",
      rest: 60,
      diagram: "pressdown",
      image: "tricepPushdown",
      mirror: "tricepsPressdown",
      superset: "C",
      supersetSlot: "C2",
      supersetRest: 75,
      substitutions: ["Overhead rope extension", "Cable kickback"],
      notes: "No bench dips.",
    }),
  ],
  finisher: [],
};

/* ------------------------ THURSDAY — RECOVERY -------------------------- */

const hold = (id: string, name: string, target: string, mirror: string, reps: string): Exercise =>
  ex({
    id,
    name,
    target,
    sets: 2,
    reps,
    rest: 0,
    diagram: mirror,
    mirror,
    tracked: false,
    notes: "Easy, breathable stretch. Never push into pain.",
  });

export const THURSDAY: DayPlan = {
  key: "thu",
  weekday: "Thursday",
  title: "Recovery / Mobility",
  focus: "Restore and de-load",
  type: "recovery",
  summary: "Guided holds, generally 20–30 seconds each. Nothing here should burn or pinch.",
  warmup: [walk("5 min", "thu-walk")],
  main: [
    hold("mob-hip-flexor", "Hip-Flexor Stretch", "Hips", "hipFlexorStretch", "20–30 sec each side"),
    hold("mob-shoulder", "Shoulder Mobility", "Shoulders", "shoulderMobility", "20–30 sec"),
    hold(
      "mob-chest",
      "Chest Mobility",
      "Chest / front shoulder",
      "chestMobility",
      "20–30 sec each side",
    ),
    hold(
      "mob-hamstring",
      "Hamstring Mobility",
      "Hamstrings",
      "hamstringMobility",
      "20–30 sec each side",
    ),
    hold(
      "mob-lower-body",
      "Lower-Body Mobility Flow",
      "Hips, knees, ankles",
      "lowerBodyMobility",
      "60–90 sec",
    ),
  ],
  finisher: [
    ex({
      id: "thu-dead-bug",
      name: "Dead Bug",
      target: "Core (optional)",
      sets: 2,
      reps: "8 each side",
      rest: 30,
      diagram: "dead-bug",
      image: "deadBug",
      mirror: "deadBug",
      tracked: false,
      optional: true,
    }),
  ],
};

/* ------------------------- FRIDAY — STRENGTH C ------------------------- */

export const FRIDAY: DayPlan = {
  key: "fri",
  weekday: "Friday",
  title: "Strength C",
  focus: "Full Body + Arms",
  type: "workout",
  summary:
    "One squat pattern, one hinge, machine support work and arms. Optional slots keep the session a sensible length — pick, don't grind through everything.",
  warmup: warmupLower,
  main: [
    ex({
      id: "fri-squat",
      name: "Squat",
      target: "Quads / glutes",
      sets: 3,
      reps: "8–12",
      rest: 120,
      diagram: "squat",
      image: "squatToBench",
      mirror: "squat",
      notes: "Pain-free depth only. Box or goblet squat is a perfectly good version.",
      substitutions: ["Goblet squat to bench", "Hack squat machine", "Leg press"],
    }),
    ex({
      id: "fri-rdl",
      name: "Romanian Deadlift",
      target: "Hamstrings / glutes",
      sets: 3,
      reps: "8–12",
      rest: 120,
      diagram: "rdl",
      mirror: "romanianDeadlift",
      notes: "Primary hinge for the day.",
      substitutions: ["Dumbbell RDL", "Hip thrust", "Back extension"],
    }),
    ex({
      id: "fri-trap-bar",
      name: "Trap-Bar Deadlift",
      target: "Full body hinge (optional)",
      sets: 3,
      reps: "5–8",
      rest: 150,
      diagram: "trap-bar",
      mirror: "trapBarDeadlift",
      optional: true,
      notes:
        "OPTIONAL — swap with the Romanian deadlift rather than doing both heavy hinges in one session.",
      substitutions: ["Skip (RDL already covers the hinge)", "Hip thrust", "Kettlebell deadlift"],
    }),
    ex({
      id: "fri-leg-press",
      name: "Leg Press",
      target: "Quads / glutes (optional)",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "leg-press",
      image: "legPress",
      mirror: "legPress",
      optional: true,
      notes: "OPTIONAL — use it if you skipped one of the squat/split-squat slots.",
      substitutions: ["Skip", "Goblet squat"],
    }),
    ex({
      id: "fri-split-squat",
      name: "Bulgarian Split Squat",
      target: "Single-leg (optional)",
      sets: 3,
      reps: "8 each side",
      rest: 90,
      diagram: "split-squat",
      mirror: "bulgarianSplitSquat",
      optional: true,
      notes: "OPTIONAL — body weight first. Hold something for balance.",
      substitutions: ["Skip", "Split squat (both feet down)", "Step-up to a low box"],
    }),
    ex({
      id: "fri-ham-curl",
      name: "Hamstring Curl",
      target: "Hamstrings",
      sets: 3,
      reps: "10–12",
      rest: 60,
      diagram: "ham-curl",
      image: "legCurl",
      mirror: "hamstringCurl",
      substitutions: ["Seated leg curl", "Nordic-style eccentric (assisted)"],
    }),
    ex({
      id: "fri-chest-press",
      name: "Chest Press",
      target: "Chest",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "chest-press",
      image: "chestPress",
      mirror: "chestPress",
      superset: "D",
      supersetSlot: "D1",
      supersetRest: 90,
      substitutions: ["Dumbbell bench press", "Machine press"],
    }),
    ex({
      id: "fri-row",
      name: "Row",
      target: "Back",
      sets: 3,
      reps: "8–12",
      rest: 90,
      diagram: "seated-row",
      image: "seatedRow",
      mirror: "seatedRow",
      superset: "D",
      supersetSlot: "D2",
      supersetRest: 90,
      notes: "Supported row only.",
      substitutions: ["Chest-supported row", "Machine row"],
    }),
    ex({
      id: "fri-lateral-raise",
      name: "Lateral Raise",
      target: "Side delts",
      sets: 3,
      reps: "12–15",
      rest: 60,
      diagram: "lateral-raise",
      image: "lateralRaise",
      mirror: "lateralRaise",
      substitutions: ["Cable lateral raise"],
    }),
    ex({
      id: "fri-biceps",
      name: "Biceps",
      target: "Biceps",
      sets: 3,
      reps: "10–15",
      rest: 60,
      diagram: "db-curl",
      mirror: "dumbbellCurl",
      superset: "E",
      supersetSlot: "E1",
      supersetRest: 75,
      substitutions: ["Hammer curl", "Cable curl"],
    }),
    ex({
      id: "fri-triceps",
      name: "Triceps",
      target: "Triceps",
      sets: 3,
      reps: "10–15",
      rest: 60,
      diagram: "pressdown",
      image: "tricepPushdown",
      mirror: "tricepsPressdown",
      superset: "E",
      supersetSlot: "E2",
      supersetRest: 75,
      substitutions: ["Overhead rope extension"],
    }),
  ],
  finisher: [
    ex({
      id: "fri-suitcase-carry",
      name: "Suitcase Carry",
      target: "Core / grip",
      sets: 3,
      reps: "30 sec each side",
      rest: 60,
      diagram: "carry",
      mirror: "suitcaseCarry",
      notes: "One weight, stay square, short controlled steps.",
      substitutions: ["Farmer carry (both hands)", "Suitcase hold in place"],
    }),
  ],
};

/* ------------- SATURDAY — WEIGHTED CARDIO OR BOXING/KICKBOXING --------- */

const round = (id: string, name: string, target: string, mirror: string, notes: string): Exercise =>
  ex({
    id,
    name,
    target,
    sets: 3,
    reps: "40 sec work / 20 sec reset",
    rest: 20,
    diagram: mirror,
    mirror,
    tracked: false,
    circuit: "R1",
    notes,
  });

export const SATURDAY: DayPlan = {
  key: "sat",
  weekday: "Saturday",
  title: "Boxing / Kickboxing",
  focus: "Conditioning — or repeat Weighted Cardio",
  type: "boxing",
  summary:
    "Timed follow-along rounds with low-impact footwork. Prefer dumbbells today? Run the Tuesday Weighted Cardio session instead.",
  warmup: warmupCardio,
  main: [
    round(
      "box-stance",
      "Boxing Stance",
      "Foundation",
      "boxingStance",
      "Feet never leave the floor.",
    ),
    round("box-jab", "Jab", "Lead hand", "jab", "Out and back on the same line."),
    round("box-cross", "Cross", "Rear hand", "cross", "Pivot the back foot."),
    round(
      "box-jab-cross",
      "Jab–Cross Combination",
      "Combination",
      "jabCross",
      "Rhythm before speed.",
    ),
    round(
      "box-defense",
      "Defensive Reset / Movement",
      "Defence",
      "defensiveReset",
      "Bend the knees, not the back.",
    ),
    round(
      "box-cable-punch",
      "Cable Punch",
      "Rotational power",
      "cablePunch",
      "Soft elbow at the end.",
    ),
    round("box-front-kick", "Front Kick", "Kicking", "frontKick", "Chamber the knee first."),
    round(
      "box-round-kick",
      "Round Kick",
      "Kicking",
      "roundKick",
      "Pivot the base foot, keep it low.",
    ),
    round("box-knee", "Knee Chamber", "Core / knees", "kneeChamber", "Set the foot down quietly."),
    round(
      "box-guard-reset",
      "Guard / Reset Drill",
      "Control",
      "guardReset",
      "The reset is the drill.",
    ),
  ],
  finisher: [
    ex({
      id: "sat-med-ball",
      name: "Medicine-Ball Chest Pass",
      target: "Power (optional)",
      sets: 3,
      reps: "8–10",
      rest: 60,
      diagram: "med-ball",
      mirror: "medBallChestPass",
      tracked: false,
      optional: true,
      notes: "Light ball, feet planted, no jumping.",
    }),
    walk("5 min", "sat-cooldown"),
  ],
};

/* ----------------------------- SUNDAY — REST --------------------------- */

export const SUNDAY: DayPlan = {
  key: "sun",
  weekday: "Sunday",
  title: "Rest",
  focus: "Full rest day",
  type: "recovery",
  summary: "No training. Walk if you feel like it, eat well, sleep.",
  warmup: [],
  main: [],
  finisher: [
    ex({
      id: "sun-mobility",
      name: "Optional Easy Mobility",
      target: "Recovery",
      sets: 1,
      reps: "5–10 min",
      rest: 0,
      diagram: "lower-mobility",
      mirror: "lowerBodyMobility",
      tracked: false,
      optional: true,
    }),
  ],
};

export const WEEK: DayPlan[] = [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY];

/** Twelve weeks of the rolling schedule. History from earlier days is kept. */
export const TOTAL_DAYS = 84;

/** Session entry points shown on Program and Today. */
export const SESSIONS: { key: string; label: string; plan: DayPlan }[] = [
  { key: "mon", label: "Strength A", plan: MONDAY },
  { key: "tue", label: "Weighted Cardio", plan: TUESDAY },
  { key: "wed", label: "Strength B", plan: WEDNESDAY },
  { key: "thu", label: "Recovery", plan: THURSDAY },
  { key: "fri", label: "Strength C", plan: FRIDAY },
  { key: "sat", label: "Boxing / Kickboxing", plan: SATURDAY },
];

/** Returns the plan for a 1-based day number. */
export function planForDay(day: number): DayPlan {
  return WEEK[(day - 1) % 7];
}

export function weekOfDay(day: number): number {
  return Math.floor((day - 1) / 7) + 1;
}

export function exercisesForDay(day: number): Exercise[] {
  const p = planForDay(day);
  return [...p.warmup, ...p.main, ...p.finisher];
}

export function findExercise(id: string): Exercise | undefined {
  for (const p of WEEK) {
    const found = [...p.warmup, ...p.main, ...p.finisher].find((e) => e.id === id);
    if (found) return found;
  }
  return undefined;
}

/* ------------------------------ SAFETY ------------------------------- */

export const AVOID_LIST = [
  { item: "Bench dips", why: "Extreme shoulder extension — high risk for the shoulder joint." },
  { item: "Machine shoulder press", why: "Fixed path overloads the shoulder at a bad angle." },
  { item: "Burpees", why: "High-impact, high-fatigue, poor risk/reward for this goal." },
  {
    item: "Jumping of any kind",
    why: "Impact loading on knees, hips and low back. Weighted cardio and boxing stay low impact.",
  },
  {
    item: "Heavy unsupported rows",
    why: "Loads the low back. Use chest-supported or machine rows instead.",
  },
  { item: "Violent cheat curls", why: "Swinging shifts load to the low back and elbow tendons." },
  { item: "Painful squat depth", why: "Depth is not the goal. Stop where it feels strong." },
];

export const STOP_SIGNS = [
  "Sharp pain anywhere — stop the set immediately.",
  "Numbness or tingling down an arm or leg.",
  "Joint pain that gets worse set to set.",
  "Low back strain, pinching or 'tweaking'.",
];

export const NUTRITION_CARD = {
  title: "Nutrition & Recovery",
  points: [
    "Protein at every meal — aim for a palm-sized portion, 4x/day.",
    "Water: sip through the whole session, not just after.",
    "Sleep 7–9 hours. Growth and fat loss both happen while you rest.",
    "Eat something with protein + carbs within ~2 hours after training.",
    "Sore is fine. Sharp, joint or nerve pain is not — see the Safety page.",
  ],
};

export const MEASUREMENT_FIELDS = [
  { key: "rightRelaxed", label: "Right arm — relaxed" },
  { key: "rightFlexed", label: "Right arm — flexed" },
  { key: "leftRelaxed", label: "Left arm — relaxed" },
  { key: "leftFlexed", label: "Left arm — flexed" },
  { key: "waist", label: "Waist" },
  { key: "bodyweight", label: "Body weight" },
] as const;

/* --------------------------- SUPERSET HELPERS -------------------------- */

/** Ordered exercise list honouring the "use supersets" preference. */
export function orderedExercises(day: number, useSupersets: boolean): Exercise[] {
  const list = exercisesForDay(day);
  if (useSupersets) return list;
  return list.map((e) => ({ ...e, superset: undefined, supersetSlot: undefined }));
}

export const RECOVERY_CHECKLIST = [
  { key: "water", label: "Water — 500ml+ after training" },
  { key: "protein", label: "Whey / protein serving" },
  { key: "creatine", label: "Creatine (3–5g)" },
  { key: "cooldown", label: "Cool down — easy walk + shoulder rolls" },
] as const;

export const PHOTO_INSTRUCTIONS = [
  "Same spot, same light, same time of day.",
  "Front relaxed, front double-biceps, and one side shot per arm.",
  "Phone at chest height, arms fully in frame.",
  "Take a set every 3 weeks and compare side by side.",
];

/* --------------------------- PROGRESSION RULES ------------------------- */

export const PROGRESSION_RULES = [
  "Hit the top of the rep range on every prescribed set with clean form → add the smallest available increase next session.",
  "Form breaks before the bottom of the rep range → drop the weight and rebuild.",
  "Anywhere in between → repeat the same weight and add reps.",
  "Weighted cardio and boxing do not progress by load — keep the weights light and let the work capacity rise.",
];