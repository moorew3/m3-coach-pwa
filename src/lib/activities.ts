import { exercisesForDay, planForDay, WEEK, type DayPlan, type Exercise } from "@/data/program";
import type {
  ActivityFields,
  ActivityType,
  AppState,
  SavedWorkout,
  SessionExercise,
  SessionPlan,
} from "@/lib/store";

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  programmed: "Today's program",
  walk: "Outdoor walk",
  treadmill: "Treadmill walk",
  "weighted-vest-walk": "Weighted-vest walk",
  cardio: "Cardio",
  boxing: "Boxing",
  "custom-exercise": "Custom exercise",
  "custom-workout": "Saved workout",
};

export const ACTIVITY_OPTIONS: ActivityType[] = [
  "programmed",
  "walk",
  "treadmill",
  "weighted-vest-walk",
  "cardio",
  "boxing",
  "custom-exercise",
  "custom-workout",
];

const quickMirror: Partial<Record<ActivityType, string>> = {
  walk: "easyWalk",
  treadmill: "treadmillWalk",
  "weighted-vest-walk": "weightedWalk",
  cardio: "easyWalk",
  boxing: "shadowboxPunches",
};

export function allLibraryExercises(): Exercise[] {
  const seen = new Set<string>();
  return WEEK.flatMap((p) => [...p.warmup, ...p.main, ...p.finisher]).filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function toSessionExercise(e: Exercise): SessionExercise {
  return {
    id: e.id,
    name: e.name,
    target: e.target,
    sets: e.sets,
    reps: e.reps,
    rest: e.rest,
    diagram: e.diagram,
    image: e.image,
    mirror: e.mirror,
    tracked: e.tracked,
    notes: e.notes,
    category: e.category,
  };
}

export function quickActivityPlan(
  type: Exclude<ActivityType, "programmed" | "custom-workout">,
  fields: ActivityFields,
  custom?: Partial<SessionExercise>,
): SessionPlan {
  const duration = Math.max(1, Number(fields.durationMin) || 30);
  const title =
    type === "custom-exercise" ? custom?.name?.trim() || "Custom exercise" : ACTIVITY_LABELS[type];
  const timed = type !== "custom-exercise";
  const details = [
    fields.vestLoad ? `${fields.vestLoad} load` : "",
    fields.incline ? `${fields.incline} incline` : "",
    fields.speed ? `${fields.speed} speed` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const exercise: SessionExercise = timed
    ? {
        id: `activity-${type}`,
        name: title,
        target: type === "boxing" ? "Conditioning / skill" : "Conditioning",
        sets: 1,
        reps: `${duration} min`,
        rest: 0,
        diagram: type,
        mirror: quickMirror[type],
        tracked: false,
        notes: [details, fields.notes].filter(Boolean).join(". "),
        category: type === "boxing" ? "boxing" : "cardio",
      }
    : {
        id: `custom-${crypto.randomUUID()}`,
        name: title,
        target: custom?.target || "Custom",
        sets: Math.max(1, Number(custom?.sets) || 3),
        reps: custom?.reps || "10",
        rest: Math.max(0, Number(custom?.rest) || 60),
        diagram: "custom",
        tracked: true,
        notes: fields.notes,
        load: custom?.load,
        category: custom?.category ?? "press",
      };
  return {
    id: crypto.randomUUID(),
    source: "quick",
    activityType: type,
    title,
    focus: type === "weighted-vest-walk" ? "Loaded walking conditioning" : exercise.target,
    fields,
    exercises: [exercise],
  };
}

export function savedWorkoutPlan(workout: SavedWorkout): SessionPlan {
  return {
    id: crypto.randomUUID(),
    source: "saved",
    activityType: "custom-workout",
    title: workout.name,
    focus: "Your custom sequence",
    fields: {},
    exercises: workout.exercises.map((e) => ({ ...e })),
  };
}

export function effectiveExercises(state: AppState, day: number): Exercise[] {
  const selected = state.days[day]?.sessionPlan;
  // Fail closed: an invalid/empty alternate plan must never erase the scheduled day.
  return selected?.exercises?.length
    ? selected.exercises.map((e) => ({ ...e }))
    : exercisesForDay(day);
}

export function effectivePlan(state: AppState, day: number): DayPlan {
  const selected = state.days[day]?.sessionPlan;
  // Keep the programmed day recoverable if a persisted custom/alternate plan is empty.
  if (!selected?.exercises?.length) return planForDay(day);
  return {
    key: `custom-${day}`,
    weekday: "Today",
    title: selected.title,
    focus: selected.focus,
    type:
      selected.activityType === "boxing"
        ? "boxing"
        : selected.activityType.includes("walk") || selected.activityType === "cardio"
          ? "cardio"
          : "workout",
    summary: selected.fields.notes || `Coach-led ${selected.title.toLowerCase()} session.`,
    warmup: [],
    main: selected.exercises.map((e) => ({ ...e })),
    finisher: [],
  };
}

export function effectiveExercise(state: AppState, day: number, id: string): Exercise | undefined {
  return effectiveExercises(state, day).find((e) => e.id === id);
}