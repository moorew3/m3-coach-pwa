import type { V2Workout } from "./types";

/**
 * Deterministic actual V2 player sequence.
 * - Straight sets: each planned set is followed by its prescribed rest.
 * - Optional supersets: A1 -> B1 -> rest -> A2 -> B2 -> rest.
 * - Unequal group counts: extra A or B set is never skipped.
 * - The final completed set ends the session (no meaningless end-of-workout rest).
 *
 * This is planning only: no set is marked completed here.
 */
export interface V2PlannedSet {
  exerciseIndex: number;
  setIndex: number;
  restAfterSeconds: number;
  supersetId?: string;
}
const validRest = (v: number | undefined) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.ceil(v) : 0;
const restFor = (category: string, rest: number | undefined) =>
  Math.max(category === "mobility" ? 15 : 30, validRest(rest));

export function buildV2SetSequence(workout: V2Workout): V2PlannedSet[] {
  const xs = workout.exercises;
  const visited = new Set<number>();
  const groups: number[][] = [];
  xs.forEach((ex, index) => {
    if (visited.has(index)) return;
    visited.add(index);
    const group = [index];
    if (workout.useSupersets && ex.supersetId) {
      for (let i = index + 1; i < xs.length; i++) {
        if (visited.has(i) || xs[i].supersetId !== ex.supersetId) continue;
        visited.add(i);
        group.push(i);
      }
    }
    groups.push(group);
  });
  const ordered: V2PlannedSet[] = [];
  groups.forEach((indices) => {
    const rounds = Math.max(0, ...indices.map(i => xs[i].sets));
    for (let round = 0; round < rounds; round++) {
      const active = indices.filter(i => round < xs[i].sets);
      active.forEach((exerciseIndex, pos) => {
        const ex = xs[exerciseIndex];
        const endOfRound = pos === active.length - 1;
        const prescribed = active.length > 1
          ? Math.max(...active.map(i => validRest(xs[i].supersetRestSeconds ?? xs[i].restSeconds)))
          : validRest(ex.restSeconds);
        ordered.push({
          exerciseIndex,
          setIndex: round,
          restAfterSeconds: endOfRound ? restFor(ex.category, prescribed) : 0,
          ...(indices.length > 1 ? { supersetId: ex.supersetId } : {}),
        });
      });
    }
  });
  if (ordered.length) ordered[ordered.length - 1].restAfterSeconds = 0;
  return ordered;
}
