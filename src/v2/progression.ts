import type { V2Exercise } from "./types";

export type WarmupStep = {
  label: string;
  percent: number | null;
  reps: string;
  weight: number | null;
  note?: string;
};

export type SetResult = {
  reps: number;
  cleanForm: boolean;
};

export type ProgressionDecision = {
  action: "increase" | "repeat" | "reduce";
  nextWeight: number;
  topRangeStreak: number;
  reason: string;
};

export function roundDownToIncrement(value: number, increment: number) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const safeIncrement = Math.max(0.5, increment);
  return Math.floor(value / safeIncrement) * safeIncrement;
}

export function warmupPlanFor(
  exercise: V2Exercise,
  targetWeight: number,
  increment = 5,
): WarmupStep[] {
  if (exercise.warmupStyle === "none" || targetWeight <= 0) return [];

  if (exercise.warmupStyle === "small") {
    return [
      {
        label: "Light warm-up",
        percent: null,
        reps: "10–12",
        weight: null,
        note: "Use one easy set. The source plan does not prescribe a fixed percentage for small moves.",
      },
    ];
  }

  return [
    {
      label: "Warm-up 1",
      percent: 40,
      reps: "8–10",
      weight: roundDownToIncrement(targetWeight * 0.4, increment),
    },
    {
      label: "Warm-up 2",
      percent: 55,
      reps: "5",
      weight: roundDownToIncrement(targetWeight * 0.55, increment),
    },
    {
      label: "Warm-up 3",
      percent: 70,
      reps: "3",
      weight: roundDownToIncrement(targetWeight * 0.7, increment),
    },
    {
      label: "Warm-up 4",
      percent: 85,
      reps: "1–2",
      weight: roundDownToIncrement(targetWeight * 0.85, increment),
      note: "Use this final warm-up only when the lift is heavy enough to need it.",
    },
  ];
}

export function defaultLoadIncrease(exercise: V2Exercise) {
  if (exercise.loadClass === "lower" || exercise.loadClass === "machine") return 10;
  if (exercise.loadClass === "upper") return 5;
  return 0;
}

export function recommendProgression({
  exercise,
  currentWeight,
  results,
  previousTopRangeStreak,
}: {
  exercise: V2Exercise;
  currentWeight: number;
  results: SetResult[];
  previousTopRangeStreak: number;
}): ProgressionDecision {
  const range = exercise.repRange;
  if (!range || exercise.loadClass === "bodyweight" || currentWeight <= 0) {
    return {
      action: "repeat",
      nextWeight: currentWeight,
      topRangeStreak: 0,
      reason: "This movement does not use load progression in the V2 strength rule.",
    };
  }

  if (!results.length) {
    return {
      action: "repeat",
      nextWeight: currentWeight,
      topRangeStreak: previousTopRangeStreak,
      reason: "Enter the working-set results before changing the load.",
    };
  }

  const [min, max] = range;
  const formBreak = results.some((set) => !set.cleanForm);
  const missedMinimum = results.some((set) => set.reps < min);
  const hitTopClean =
    results.length >= exercise.sets &&
    results.slice(0, exercise.sets).every((set) => set.cleanForm && set.reps >= max);

  if (formBreak) {
    return {
      action: "repeat",
      nextWeight: currentWeight,
      topRangeStreak: 0,
      reason: "Form broke on a working set, so V2 will not increase the load.",
    };
  }

  if (missedMinimum) {
    return {
      action: "repeat",
      nextWeight: currentWeight,
      topRangeStreak: 0,
      reason: "At least one set missed the minimum rep target. Repeat the load if manageable, or reduce 5–10% if needed.",
    };
  }

  if (hitTopClean) {
    const streak = previousTopRangeStreak + 1;
    if (streak >= 2) {
      const add = defaultLoadIncrease(exercise);
      return {
        action: "increase",
        nextWeight: currentWeight + add,
        topRangeStreak: 0,
        reason: `Top of the rep range was hit cleanly for two workouts. Increase by ${add} lb next time.`,
      };
    }
    return {
      action: "repeat",
      nextWeight: currentWeight,
      topRangeStreak: streak,
      reason: "Top of the rep range was hit cleanly. Repeat once more before increasing.",
    };
  }

  return {
    action: "repeat",
    nextWeight: currentWeight,
    topRangeStreak: 0,
    reason: "Stay at this load and build clean reps within the target range.",
  };
}
