/**
 * COACH MEMORY — multi-session pattern recognition
 * ------------------------------------------------------------------
 * A real trainer does not judge the athlete from one set or one workout.
 * This module derives longer-term memory from the existing AppState history:
 * no duplicate database, no hidden score, and no invented facts.
 *
 * Stronger interventions require repeated evidence across multiple sessions.
 * The output can be spoken by Coach Mode, shown on Progress, and used as a
 * conservative first-set prescription before the normal in-session logic
 * takes over.
 */
import type { Exercise } from "@/data/program";
import { findExercise } from "@/data/program";
import { kindOf } from "@/lib/exercise-kind";
import {
  formatWeight,
  incrementFor,
  repRange,
  roundTo,
  variationKey,
  weightValue,
} from "@/lib/progression";
import type { AppState, ExerciseLog, SetEntry } from "@/lib/store";

export type CoachMemoryKind =
  | "new"
  | "building"
  | "momentum"
  | "plateau"
  | "fatigue"
  | "technique"
  | "pain";

export interface MemorySession {
  day: number;
  metric: number;
  metricLabel: string;
  weight: number | null;
  weightLabel: string;
  reps: number[];
  repTotal: number;
  rpeMax: number | null;
  hard: boolean;
  formFault: boolean;
  pain: boolean;
  lateDropPct: number | null;
}

export interface ExerciseCoachMemory {
  exerciseId: string;
  kind: CoachMemoryKind;
  confidence: "low" | "medium" | "high";
  sessionsSeen: number;
  headline: string;
  detail: string;
  action: string;
  /** Optional conservative first-set load override. */
  suggestedWeight?: string;
  /** Extra rest suggested when repeated set falloff is part of the signal. */
  restSecondsDelta?: number;
  evidence: string[];
}

export interface CoachMemoryOverview {
  signals: ExerciseCoachMemory[];
  headline: string;
  detail: string;
}

const working = (sets: SetEntry[]) => sets.filter((x) => x.done && !x.warmup);
const numeric = (raw?: string) => {
  if (!raw || !/^\s*[\d.]+\s*$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

const positiveCue = (cue: string) => /^(good reps|that rep was cleaner|clean|nice|good rep)/i.test(cue.trim());

function cameraFault(set: SetEntry): boolean {
  const v = set.vision;
  if (!v || v.confidence < 0.55) return false;
  if (v.symmetry !== null && v.symmetry < 0.72) return true;
  return (v.cues ?? []).some((cue) => !positiveCue(cue));
}

function sessionRow(day: number, el: ExerciseLog, e: Exercise): MemorySession | null {
  const ws = working(el.sets);
  if (!ws.length) return null;

  const reps = ws.map((x) => numeric(x.reps) ?? 0).filter((n) => n > 0);
  const repTotal = reps.reduce((a, b) => a + b, 0);
  const loadedSets = ws
    .map((x) => ({ x, w: weightValue(x.weight), r: numeric(x.reps) ?? 0 }))
    .filter((x) => x.w !== null && x.r > 0);
  const e1rms = loadedSets.map(({ w, r }) => (w ?? 0) * (1 + r / 30));
  const metric =
    e1rms.length > 0
      ? Math.max(...e1rms)
      : repTotal > 0
        ? repTotal
        : ws.filter((x) => x.outcome === "completed").length;

  const heaviest = loadedSets.reduce<(typeof loadedSets)[number] | null>(
    (best, row) => (!best || (row.w ?? 0) > (best.w ?? 0) ? row : best),
    null,
  );
  const rpes = ws.map((x) => x.rpe ?? 0).filter((n) => n > 0);
  const rpeMax = rpes.length ? Math.max(...rpes) : null;
  const hard =
    (rpeMax ?? 0) >= 8.5 ||
    ws.filter((x) => x.feel === "hard" || x.feel === "form" || x.feel === "pain").length >=
      Math.max(1, Math.ceil(ws.length / 2));
  const formFault =
    el.formClean === false || ws.some((x) => x.feel === "form" || cameraFault(x));
  const pain = (el.pain ?? 0) >= 4 || ws.some((x) => x.feel === "pain");

  let lateDropPct: number | null = null;
  if (reps.length >= 2 && reps[0] > 0) {
    const first = reps[0];
    const last = reps[reps.length - 1];
    lateDropPct = Math.max(0, (first - last) / first);
  }

  const weight = heaviest?.w ?? null;
  const weightLabel = heaviest?.x.weight || (kindOf(e) === "bodyweight" ? "BW" : "");
  const metricLabel =
    e1rms.length > 0
      ? `est. strength ${Math.round(metric)}`
      : repTotal > 0
        ? `${repTotal} total reps`
        : `${Math.round(metric)} completed rounds`;

  return {
    day,
    metric,
    metricLabel,
    weight,
    weightLabel,
    reps,
    repTotal,
    rpeMax,
    hard,
    formFault,
    pain,
    lateDropPct,
  };
}

/** Same exercise variation only, oldest -> newest. */
export function memorySessions(
  s: AppState,
  e: Exercise,
  excludeDay?: number,
  limit = 6,
): MemorySession[] {
  const rows = Object.entries(s.days)
    .map(([d, log]) => ({ day: Number(d), el: log.exercises[e.id] }))
    .filter((r) => r.day !== excludeDay && !!r.el && working(r.el!.sets).length > 0)
    .sort((a, b) => a.day - b.day);

  if (!rows.length) return [];

  const current = excludeDay !== undefined ? s.days[excludeDay]?.exercises[e.id] : undefined;
  const latest = rows[rows.length - 1].el!;
  const key = variationKey(e.id, current?.replacedWith ?? latest.replacedWith, s.settings.units);

  return rows
    .filter((r) => variationKey(e.id, r.el!.replacedWith, s.settings.units) === key)
    .slice(-limit)
    .map((r) => sessionRow(r.day, r.el!, e))
    .filter((x): x is MemorySession => !!x);
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function lastWeight(rows: MemorySession[]) {
  return [...rows].reverse().find((r) => r.weight !== null)?.weight ?? null;
}

function reduceWeight(s: AppState, e: Exercise, rows: MemorySession[], factor: number) {
  const w = lastWeight(rows);
  if (w === null) return undefined;
  const step = incrementFor(e, s.settings);
  return formatWeight(roundTo(w * factor, step), s.settings.units);
}

/**
 * Multi-session memory for one exercise.
 * Strong labels require repeated evidence; otherwise the result stays
 * "building" instead of pretending the coach knows more than the logs show.
 */
export function exerciseMemoryFor(
  s: AppState,
  e: Exercise,
  excludeDay?: number,
): ExerciseCoachMemory {
  const rows = memorySessions(s, e, excludeDay);
  const last = rows[rows.length - 1];

  if (!last) {
    return {
      exerciseId: e.id,
      kind: "new",
      confidence: "low",
      sessionsSeen: 0,
      headline: "New movement",
      detail: "There is not enough logged history yet to call a trend.",
      action: "Establish a clean baseline.",
      evidence: [],
    };
  }

  const recent3 = rows.slice(-3);
  const painCount = recent3.filter((r) => r.pain).length;
  const formCount = recent3.filter((r) => r.formFault).length;

  if (recent3.length >= 2 && painCount >= 2) {
    const suggestedWeight = reduceWeight(s, e, rows, 0.9);
    return {
      exerciseId: e.id,
      kind: "pain",
      confidence: recent3.length >= 3 ? "high" : "medium",
      sessionsSeen: rows.length,
      headline: "Repeated pain flag",
      detail: `Pain was logged in ${painCount} of the last ${recent3.length} sessions for this movement.`,
      action: suggestedWeight
        ? `Do not progress the load. Start around ${suggestedWeight}, and substitute the exercise if pain repeats.`
        : "Do not progress this movement. Use a pain-free substitute if the problem repeats.",
      suggestedWeight,
      evidence: recent3
        .filter((r) => r.pain)
        .map((r) => `Day ${r.day}: pain was reported.`),
    };
  }

  if (recent3.length >= 2 && formCount >= 2) {
    return {
      exerciseId: e.id,
      kind: "technique",
      confidence: recent3.length >= 3 ? "high" : "medium",
      sessionsSeen: rows.length,
      headline: "Technique keeps breaking down",
      detail: `A form fault was logged in ${formCount} of the last ${recent3.length} sessions.`,
      action: `Hold ${last.weightLabel || "the current load"} and make the next session technique-first before adding weight.`,
      suggestedWeight: last.weightLabel || undefined,
      evidence: recent3
        .filter((r) => r.formFault)
        .map((r) => `Day ${r.day}: form breakdown or confident camera fault.`),
    };
  }

  const strengthRows = rows.filter((r) => r.metric > 0);
  const latest = strengthRows[strengthRows.length - 1];
  const previous2 = strengthRows.slice(-3, -1);
  const repeatedDrop =
    recent3.length >= 2 &&
    recent3.slice(-2).every((r) => (r.lateDropPct ?? 0) >= 0.2);

  if (latest && previous2.length >= 2) {
    const priorAvg = previous2.reduce((n, r) => n + r.metric, 0) / previous2.length;
    const regression = latest.metric < priorAvg * 0.93;
    if (regression && (latest.hard || repeatedDrop)) {
      const suggestedWeight = reduceWeight(s, e, rows, 0.95);
      return {
        exerciseId: e.id,
        kind: "fatigue",
        confidence: repeatedDrop ? "high" : "medium",
        sessionsSeen: rows.length,
        headline: "Performance is sliding",
        detail: `The latest ${latest.metricLabel} is ${pct((priorAvg - latest.metric) / priorAvg)} below the prior two-session average${repeatedDrop ? ", with repeated late-set rep drop-off" : ""}.`,
        action: suggestedWeight
          ? `Back the first work set down to about ${suggestedWeight} and take 30 seconds more rest. Rebuild clean output before pushing again.`
          : "Keep the load conservative and take 30 seconds more rest until output stabilizes.",
        suggestedWeight,
        restSecondsDelta: 30,
        evidence: [
          `Day ${latest.day}: ${latest.metricLabel}${latest.rpeMax ? `, top RPE ${latest.rpeMax}` : ""}.`,
          ...previous2.map((r) => `Day ${r.day}: ${r.metricLabel}.`),
        ],
      };
    }
  }

  if (recent3.length >= 3 && recent3.every((r) => r.metric > 0)) {
    const metrics = recent3.map((r) => r.metric);
    const hi = Math.max(...metrics);
    const lo = Math.min(...metrics);
    const spread = hi > 0 ? (hi - lo) / hi : 1;
    const hardEnough = recent3.some((r) => r.hard);
    if (spread <= 0.025 && !recent3.some((r) => r.pain || r.formFault)) {
      const range = repRange(e.reps);
      const target =
        range && last.reps.length
          ? Math.min(range.max * last.reps.length, last.repTotal + 1)
          : last.repTotal + 1;
      return {
        exerciseId: e.id,
        kind: "plateau",
        confidence: rows.length >= 4 ? "high" : "medium",
        sessionsSeen: rows.length,
        headline: "Three-session plateau",
        detail: `Performance has stayed within ${pct(spread)} across the last three sessions${hardEnough ? " while effort stayed high" : ""}.`,
        action:
          last.repTotal > 0
            ? `Keep ${last.weightLabel || "the current load"} and beat the last session by one clean total rep${target > last.repTotal ? ` (target ${target})` : ""}. If it stays flat again, change the exercise variation or run a lighter rebuild session.`
            : "Keep the prescription stable for one more quality session; if it stays flat again, change the variation or run a lighter rebuild session.",
        suggestedWeight: last.weightLabel || undefined,
        evidence: recent3.map((r) => `Day ${r.day}: ${r.metricLabel}.`),
      };
    }
  }

  if (latest && previous2.length >= 1) {
    const priorBest = Math.max(...previous2.map((r) => r.metric));
    if (priorBest > 0 && latest.metric > priorBest * 1.02 && !latest.pain && !latest.formFault) {
      return {
        exerciseId: e.id,
        kind: "momentum",
        confidence: previous2.length >= 2 ? "high" : "medium",
        sessionsSeen: rows.length,
        headline: "Momentum",
        detail: `Latest performance improved ${pct((latest.metric - priorBest) / priorBest)} over the recent best.`,
        action: "Keep the normal progression path. No special adjustment needed.",
        evidence: [
          `Day ${latest.day}: ${latest.metricLabel}.`,
          `Previous recent best: ${Math.round(priorBest)}.`,
        ],
      };
    }
  }

  return {
    exerciseId: e.id,
    kind: rows.length < 3 ? "new" : "building",
    confidence: rows.length < 3 ? "low" : "medium",
    sessionsSeen: rows.length,
    headline: rows.length < 3 ? "Building history" : "Stable progression",
    detail:
      rows.length < 3
        ? `${rows.length} logged ${rows.length === 1 ? "session" : "sessions"} — not enough evidence for a longer-term trend yet.`
        : "No repeated pain, technique, fatigue, or plateau pattern is strong enough to override normal progression.",
    action: "Follow the normal set-by-set progression.",
    evidence: [`Day ${last.day}: ${last.metricLabel}.`],
  };
}

/** Convert only strong memory signals into a conservative progression override. */
export function memoryProgressionOverride(
  s: AppState,
  e: Exercise,
  excludeDay?: number,
): {
  kind: "hold" | "reduce";
  weight: string;
  line: string;
  short: string;
} | null {
  const memory = exerciseMemoryFor(s, e, excludeDay);
  if (!["pain", "technique", "fatigue", "plateau"].includes(memory.kind)) return null;

  const rows = memorySessions(s, e, excludeDay);
  const current = memory.suggestedWeight || rows[rows.length - 1]?.weightLabel || "BW";
  return {
    kind: memory.kind === "pain" || memory.kind === "fatigue" ? "reduce" : "hold",
    weight: current,
    line: `${memory.headline}. ${memory.action}`,
    short: memory.action,
  };
}

/** Highest-value multi-exercise memories for the progress dashboard / coach context. */
export function coachMemoryOverview(s: AppState): CoachMemoryOverview {
  const ids = new Set<string>();
  for (const log of Object.values(s.days)) {
    for (const [id, el] of Object.entries(log.exercises)) {
      if (working(el.sets).length > 0) ids.add(id);
    }
  }

  const priority: Record<CoachMemoryKind, number> = {
    pain: 6,
    fatigue: 5,
    technique: 4,
    plateau: 3,
    momentum: 2,
    building: 1,
    new: 0,
  };

  const signals = [...ids]
    .map((id) => {
      const e = findExercise(id);
      return e ? exerciseMemoryFor(s, e) : null;
    })
    .filter((x): x is ExerciseCoachMemory => !!x)
    .filter((x) => !["new", "building"].includes(x.kind))
    .sort((a, b) => priority[b.kind] - priority[a.kind] || b.sessionsSeen - a.sessionsSeen)
    .slice(0, 5);

  if (!signals.length) {
    return {
      signals: [],
      headline: "Coach memory is building",
      detail: "Keep logging sets, effort and form. Multi-session patterns will appear here when the data supports them.",
    };
  }

  const urgent = signals[0];
  const exercise = findExercise(urgent.exerciseId);
  return {
    signals,
    headline: `${exercise?.name ?? "Training"}: ${urgent.headline}`,
    detail: urgent.action,
  };
}
