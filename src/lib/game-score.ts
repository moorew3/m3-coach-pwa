/**
 * WORKOUT GAME LAYER — XP, missions and the end-of-session grade.
 * ------------------------------------------------------------------
 * Everything here is derived from the day's real log only. No backend,
 * no invented numbers: if a set was not marked done it earns nothing.
 *
 *   +10 XP  every set marked done (warm-up sets +5)
 *   +25 XP  every exercise with at least one set done ("cleared")
 *   +5  XP  bonus: camera-confirmed set (confidence >= 70%)
 *   +5  XP  bonus: reps landed inside the programmed target range
 *   +100 XP session finished (Save & mark day complete)
 *
 * Grade = share of planned sets actually done:
 *   S >= 100% · A >= 90% · B >= 75% · C >= 50% · D otherwise.
 */
import type { AppState, DayLog, SetEntry } from "@/lib/store";
import type { Exercise } from "@/data/program";

export const XP = {
  set: 10,
  warmupSet: 5,
  exercise: 25,
  camera: 5,
  target: 5,
  session: 100,
} as const;

export interface ScoreLine {
  label: string;
  count: number;
  xp: number;
}

export interface SessionScore {
  xp: number;
  lines: ScoreLine[];
  grade: "S" | "A" | "B" | "C" | "D";
  plannedSets: number;
  doneSets: number;
  clearedExercises: number;
  totalExercises: number;
  cameraSets: number;
  targetSets: number;
  /** Percentage of planned sets done, 0–100. */
  completion: number;
}

/** "8-12" → [8, 12]; "12" → [12, 12]; "45s" / "AMRAP" → null */
export function repRange(reps?: string): [number, number] | null {
  if (!reps) return null;
  if (/\b(s|sec|seconds?|min|minutes?)\b/i.test(reps)) return null;
  const nums = reps.match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return null;
  if (nums.length === 1) return [nums[0], nums[0]];
  return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
}

export function targetTop(reps?: string): number | null {
  const r = repRange(reps);
  return r ? r[1] : null;
}

export function hitTarget(set: SetEntry, planned?: string): boolean {
  const r = repRange(planned);
  const n = Number(set.reps);
  if (!r || !Number.isFinite(n) || n <= 0) return false;
  return n >= r[0] && n <= r[1];
}

export function cameraConfirmed(set: SetEntry): boolean {
  return !!set.vision && set.vision.confidence >= 0.7 && set.vision.reps > 0;
}

export function scoreSession(
  log: DayLog,
  exercises: Exercise[],
  opts: { completed?: boolean } = {},
): SessionScore {
  let workSets = 0;
  let warmSets = 0;
  let cameraSets = 0;
  let targetSets = 0;
  let cleared = 0;
  const plannedSets = exercises.reduce((n, e) => n + Math.max(1, e.sets), 0);

  for (const e of exercises) {
    const el = log.exercises[e.id];
    const done = el?.sets.filter((s) => s.done) ?? [];
    if (done.length) cleared++;
    for (const s of done) {
      if (s.warmup || s.kind === "warmup") warmSets++;
      else workSets++;
      if (cameraConfirmed(s)) cameraSets++;
      if (hitTarget(s, e.reps)) targetSets++;
    }
  }
  const doneSets = workSets + warmSets;
  const finished = opts.completed ?? log.completed;

  const lines: ScoreLine[] = [
    { label: "Sets done", count: workSets, xp: workSets * XP.set },
    { label: "Warm-up sets", count: warmSets, xp: warmSets * XP.warmupSet },
    { label: "Exercises cleared", count: cleared, xp: cleared * XP.exercise },
    { label: "Camera-confirmed sets", count: cameraSets, xp: cameraSets * XP.camera },
    { label: "Target range hit", count: targetSets, xp: targetSets * XP.target },
    { label: "Session finished", count: finished ? 1 : 0, xp: finished ? XP.session : 0 },
  ].filter((l) => l.count > 0);

  const xp = lines.reduce((n, l) => n + l.xp, 0);
  const completion = plannedSets ? Math.min(100, Math.round((doneSets / plannedSets) * 100)) : 0;
  const grade: SessionScore["grade"] =
    completion >= 100
      ? "S"
      : completion >= 90
        ? "A"
        : completion >= 75
          ? "B"
          : completion >= 50
            ? "C"
            : "D";

  return {
    xp,
    lines,
    grade,
    plannedSets,
    doneSets,
    clearedExercises: cleared,
    totalExercises: exercises.length,
    cameraSets,
    targetSets,
    completion,
  };
}

/** Consecutive completed days ending at `day` (or the day before if today is open). */
export function streakThrough(state: AppState, day: number): number {
  let n = 0;
  let d = state.days[day]?.completed ? day : day - 1;
  while (d >= 1 && state.days[d]?.completed) {
    n++;
    d--;
  }
  return n;
}

/** Lifetime XP from every logged day — local data only. */
export function totalXp(state: AppState, exercisesFor: (day: number) => Exercise[]): number {
  return Object.keys(state.days).reduce((sum, k) => {
    const day = Number(k);
    const log = state.days[day];
    if (!log) return sum;
    return sum + scoreSession(log, exercisesFor(day)).xp;
  }, 0);
}