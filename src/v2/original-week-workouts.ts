/**
 * Non-destructive V2 adapter for the owner's original seven-day program.
 * Read ONLY from the locked workout-integrity snapshot. Never alter/reorder
 * exercises to suit video availability, and never mark a missing clip approved.
 */
import { CURRENT_WORKOUT_DAYS, type SnapshotExercise } from "@/data/recovery/current-workout-integrity-manifest";
import type { V2Exercise, V2Workout } from "./types";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const BOXING = new Set([
  "boxingStance", "jab", "cross", "jabCross", "defensiveReset",
  "guardReset", "lightPunches", "shadowboxPunches",
]);
const KICKBOXING = new Set(["frontKick", "roundKick", "kneeChamber"]);

function categoryFor(exercise: SnapshotExercise, day: number): V2Exercise["category"] {
  const key = exercise.mirror ?? "";
  if (BOXING.has(key)) return "boxing";
  if (KICKBOXING.has(key)) return "kickboxing";
  if (/walk|treadmill|battle.rope/i.test(exercise.name) || key === "easyWalk" || day === 2)
    return "cardio";
  if (day === 4 || day === 7 || /mobility|stretch|rotation/i.test(exercise.name))
    return "mobility";
  if (key === "deadBug" || /core|crunch|plank/i.test(exercise.name))
    return "core";
  return "strength";
}

function prescribedSeconds(exercise: SnapshotExercise): number | undefined {
  const prescription = String(exercise.time ?? exercise.reps ?? "");
  const minutes = prescription.match(/(\d+)\s*min/i);
  if (minutes) return Number(minutes[1]) * 60;
  const seconds = prescription.match(/(\d+)\s*sec/i);
  if (!seconds) return undefined;
  const n = Number(seconds[1]);
  return /each side/i.test(prescription) ? n * 2 : n;
}

function repRangeFor(prescription: string): [number, number] | undefined {
  if (/sec|min/i.test(prescription)) return undefined;
  const matched = prescription.match(/^\s*(\d+)\s*[–-]\s*(\d+)/);
  return matched ? [Number(matched[1]), Number(matched[2])] : undefined;
}

export const ORIGINAL_WEEK_WORKOUTS: V2Workout[] = CURRENT_WORKOUT_DAYS.map((day, index) => ({
  id: "weekly-" + DAY_KEYS[index],
  title: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][index] + " · " + day.title,
  focus: "Original M3 Coach program · " + day.exercises.length + " movements in the prescribed order",
  exercises: day.exercises.map((original) => {
    const prescription = String(original.reps ?? original.time ?? "");
    const category = categoryFor(original, day.day);
    return {
      id: original.id,
      name: original.name,
      category,
      sets: Math.max(1, Number(original.sets ?? 1)),
      reps: prescription,
      repRange: repRangeFor(prescription),
      seconds: prescribedSeconds(original),
      restSeconds: Math.max(0, Number(original.rest ?? 0)),
      motionKey: original.mirror ?? "unavailable",
      cues: category === "cardio"
        ? ["Walk or work at the prescribed pace", "Stay controlled", "Complete the full interval"]
        : category === "boxing" || category === "kickboxing"
          ? ["Follow the approved demonstration", "Return to stance between repetitions", "Stay controlled"]
          : ["Set up for the named movement", "Use controlled, pain-free form", "Complete the prescribed work"],
      warmupStyle: original.id.startsWith("wu-") || category !== "strength" ? "none" : "compound",
      loadClass: day.day === 5 ? "lower" : "upper",
    };
  }),
}));

export function originalWorkoutForToday(): V2Workout {
  // Fixed Mountain Time prevents server/phone time-zone drift for this owner.
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short", timeZone: "America/Denver",
  }).format(new Date()).toLowerCase();
  const index = DAY_KEYS.findIndex((day) => day === weekday);
  return ORIGINAL_WEEK_WORKOUTS[index >= 0 ? index : 0];
}
