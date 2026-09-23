/**
 * ADAPTIVE WEIGHT & PROGRESSION ENGINE
 * -------------------------------------------------------------
 * Pure helpers: parse weights, build warm-up ladders, read exercise
 * history and produce double-progression suggestions.
 * Nothing here changes data — the UI always asks first.
 */
import type { Exercise } from "@/data/program";
import type { AppState, SetEntry, Settings } from "@/lib/store";

export type SetFeel = "easy" | "good" | "hard" | "form" | "pain";

export const FEEL_LABELS: { key: SetFeel; label: string }[] = [
  { key: "easy", label: "Too easy" },
  { key: "good", label: "Good" },
  { key: "hard", label: "Hard" },
  { key: "form", label: "Form broke" },
  { key: "pain", label: "Pain" },
];

/* ------------------------------ weights ------------------------------- */

/** Numeric part of a weight entry ("BW + 25 lb" → 25, "Band" → null). */
export function weightValue(raw?: string): number | null {
  if (!raw) return null;
  const m = raw.replace(",", ".").match(/-?\d+(\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

export const isPlainNumber = (raw?: string) => !!raw && /^\s*\d+(\.\d+)?\s*(lb|kg)?\s*$/i.test(raw);

/** Format keeping the original wrapper text where possible. */
export function formatWeight(n: number, unit: string) {
  const rounded = Math.round(n * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} ${unit}`;
}

const COMPOUND =
  /bench press|chest press|incline dumbbell press|squat|leg press|hip thrust|seated row|cable row|lat pulldown|chest-supported row|romanian deadlift|machine row/i;

export const isCompound = (e: Exercise, name?: string) => COMPOUND.test(name || e.name);
const isLower = (e: Exercise, name?: string) =>
  /squat|leg press|leg curl|calf|hip thrust|glute|deadlift/i.test(name || e.name);
const isMachine = (e: Exercise, name?: string) =>
  /machine|cable|pin|press machine/i.test(name || e.name);

/** Smallest practical increase for this exercise, in the user's units. */
export function incrementFor(e: Exercise, settings: Settings, name?: string): number {
  if (isLower(e, name)) return settings.incLower;
  if (isCompound(e, name) || isMachine(e, name)) return settings.incUpperComp;
  return settings.incUpperIso;
}

/** Round to the nearest practical increment. */
export const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);

/* ------------------------------ warm-ups ------------------------------- */

export interface WarmupSet {
  pct: number;
  weight: number;
  reps: string;
}

/** Warm-ups only make sense for loaded compound work. */
export function needsWarmup(e: Exercise, name?: string) {
  return e.tracked !== false && isCompound(e, name);
}

/** Warm-up ladder from the planned working weight. */
export function warmupPlan(
  workWeight: number,
  e: Exercise,
  settings: Settings,
  name?: string,
): WarmupSet[] {
  const step = incrementFor(e, settings, name);
  const plan: WarmupSet[] = [
    { pct: 0.45, weight: roundTo(workWeight * 0.45, step), reps: "8–12" },
    { pct: 0.65, weight: roundTo(workWeight * 0.65, step), reps: "5–8" },
  ];
  if (workWeight >= (settings.units === "kg" ? 60 : 135)) {
    plan.push({ pct: 0.8, weight: roundTo(workWeight * 0.8, step), reps: "2–5" });
  }
  return plan;
}

/* ------------------------------ history -------------------------------- */

/** Distinct memory per exercise variation (substitution + units). */
export function variationKey(exerciseId: string, replacedWith?: string, units = "lb") {
  return `${exerciseId}::${(replacedWith ?? "").trim().toLowerCase()}::${units}`;
}

export interface SessionResult {
  day: number;
  weight: number | null;
  weightLabel: string;
  reps: number[];
  feels: SetFeel[];
  formClean?: boolean;
  pain?: number;
}

const workingSets = (sets: SetEntry[]) => sets.filter((s) => s.done && !s.warmup);

/** Recent sessions for one exercise variation, oldest → newest. */
export function variationHistory(
  s: AppState,
  exerciseId: string,
  replacedWith?: string,
): SessionResult[] {
  const key = variationKey(exerciseId, replacedWith, s.settings.units);
  return Object.entries(s.days)
    .map(([day, log]) => ({ day: Number(day), el: log.exercises[exerciseId] }))
    .filter((r) => {
      if (!r.el) return false;
      if (variationKey(exerciseId, r.el.replacedWith, s.settings.units) !== key) return false;
      return workingSets(r.el.sets).length > 0;
    })
    .sort((a, b) => a.day - b.day)
    .slice(-5)
    .map(({ day, el }) => {
      const ws = workingSets(el!.sets);
      const heaviest = ws.reduce(
        (m, x) => ((weightValue(x.weight) ?? -1) > (weightValue(m.weight) ?? -1) ? x : m),
        ws[0],
      );
      return {
        day,
        weight: weightValue(heaviest.weight),
        weightLabel: heaviest.weight || "BW",
        reps: ws.map((x) => Number(x.reps) || 0),
        feels: ws.map((x) => x.feel).filter(Boolean) as SetFeel[],
        formClean: el!.formClean,
        pain: el!.pain,
      };
    });
}

/* ------------------------ previous-session values ---------------------- */

/**
 * The set list from the most recent session of the SAME variation
 * (exercise + substitution + units), excluding the day being trained.
 * Used to show "PREVIOUS" beside the live inputs.
 */
export function lastSessionSets(
  s: AppState,
  exerciseId: string,
  replacedWith: string | undefined,
  excludeDay: number,
): { day: number; sets: SetEntry[] } | null {
  const key = variationKey(exerciseId, replacedWith, s.settings.units);
  const rows = Object.entries(s.days)
    .map(([day, log]) => ({ day: Number(day), el: log.exercises[exerciseId] }))
    .filter(
      (r) =>
        r.day !== excludeDay &&
        !!r.el &&
        variationKey(exerciseId, r.el.replacedWith, s.settings.units) === key &&
        r.el.sets.some((x) => x.done),
    )
    .sort((a, b) => a.day - b.day);
  const last = rows[rows.length - 1];
  return last ? { day: last.day, sets: last.el!.sets.filter((x) => x.done) } : null;
}

/** Match by set number within the same class (warm-up sets vs working sets). */
export function previousSetFor(
  prev: { sets: SetEntry[] } | null,
  index: number,
  warmup: boolean,
): SetEntry | undefined {
  if (!prev) return undefined;
  const pool = prev.sets.filter((x) => !!x.warmup === warmup);
  return pool[index] ?? undefined;
}

/** Compact human label for a previous set, unit-aware and type-aware. */
export function describeSet(set: SetEntry | undefined, unit: string): string {
  if (!set) return "—";
  const parts: string[] = [];
  const cardio = [
    set.time,
    set.speed ? `${set.speed} mph` : "",
    set.incline ? `${set.incline}%` : "",
    set.distance ? `${set.distance} mi` : "",
  ].filter(Boolean);
  if (set.speed || set.incline || set.distance) return cardio.join(" · ");

  const load = set.band
    ? set.band
    : set.assist
      ? `−${set.assist}`
      : set.weight
        ? isPlainNumber(set.weight)
          ? `${set.weight.trim()} ${unit}`
          : set.weight
        : "";
  if (load) parts.push(load);
  if (set.reps) parts.push(`× ${set.reps}`);
  else if (set.time) parts.push(set.time);
  if (parts.length === 0) return "—";
  return parts.join(" ");
}

/* ---------------------------- rep targets ------------------------------ */

export function repRange(reps: string): { min: number; max: number } | null {
  const nums = reps.match(/\d+/g);
  if (!nums) return null;
  const min = Number(nums[0]);
  const max = Number(nums[nums.length - 1]);
  return { min, max: Math.max(min, max) };
}

/* --------------------------- suggestion core --------------------------- */

export interface SuggestOption {
  label: string;
  weight: string;
  reps: string;
  kind: "suggested" | "smaller" | "keep" | "reduce";
}

export interface Suggestion {
  workWeight: string;
  workWeightNum: number | null;
  repsTarget: string;
  reason: string;
  options: SuggestOption[];
  warmups: WarmupSet[];
  blocked?: boolean;
}

/** Double-progression recommendation for today, from recent history. */
export function suggestFor(s: AppState, e: Exercise, replacedWith?: string): Suggestion | null {
  const unit = s.settings.units;
  const history = variationHistory(s, e.id, replacedWith);
  const range = repRange(e.reps);
  const step = incrementFor(e, s.settings, replacedWith);
  const last = history[history.length - 1];

  if (!last) return null;

  const w = last.weight;
  const label = last.weightLabel;
  const reps = last.reps;
  const feels = last.feels;
  const painFlag = (last.pain ?? 0) >= 4 || feels.includes("pain");
  const formBroke = last.formClean === false || feels.includes("form");
  const veryHard = feels.filter((f) => f === "hard").length >= 2;
  const hitTop = !!range && reps.length > 0 && reps.every((r) => r >= range.max);
  const exceeded = !!range && reps.length > 0 && reps.every((r) => r > range.max);
  const belowMin = !!range && reps.length > 0 && reps.filter((r) => r < range.min).length >= 2;
  const twoSessionsTop =
    !!range &&
    history.length >= 2 &&
    history.slice(-2).every((h) => h.reps.length > 0 && h.reps.every((r) => r >= range.max));

  const histLine = `Last time (Day ${last.day}): ${label} for ${reps.join(", ")}.`;
  const options: SuggestOption[] = [];
  let workWeight = label;
  let workNum = w;
  let reason = histLine;

  if (painFlag) {
    const reduced = w !== null ? roundTo(w * 0.9, step) : null;
    reason = `${histLine} Pain was reported — progression is paused. Use the listed substitute and keep the load light.`;
    if (reduced !== null) {
      workWeight = formatWeight(reduced, unit);
      workNum = reduced;
      options.push({ label: "Reduce ~10%", weight: workWeight, reps: e.reps, kind: "reduce" });
    }
    options.push({ label: "Keep current weight", weight: label, reps: e.reps, kind: "keep" });
    return {
      workWeight,
      workWeightNum: workNum,
      repsTarget: e.reps,
      reason,
      options,
      warmups: [],
      blocked: true,
    };
  }

  if (formBroke || belowMin) {
    const reduced = w !== null ? roundTo(w * 0.92, step) : null;
    reason = `${histLine} ${formBroke ? "Form broke down" : "Reps fell below the target"} — drop back slightly and rebuild.`;
    if (reduced !== null) {
      workWeight = formatWeight(reduced, unit);
      workNum = reduced;
      options.push({ label: "Reduce ~5–10%", weight: workWeight, reps: e.reps, kind: "reduce" });
    }
    options.push({ label: "Keep current weight", weight: label, reps: e.reps, kind: "keep" });
  } else if ((hitTop || exceeded || twoSessionsTop) && !veryHard) {
    if (w === null) {
      reason = `${histLine} You hit the top of the range — add one controlled rep or the next band level.`;
      options.push({ label: "Keep and add a rep", weight: label, reps: e.reps, kind: "keep" });
    } else {
      const up = roundTo(w + step, step);
      const small = roundTo(w + Math.max(step / 2, step * 0.5), step / 2);
      workWeight = formatWeight(up, unit);
      workNum = up;
      reason = exceeded
        ? `${histLine} You exceeded the target range — increase the weight now or next set.`
        : twoSessionsTop
          ? `${histLine} Two sessions in a row at the top of the range — time for a small increase.`
          : `${histLine} All working sets reached the top of the range with clean form.`;
      options.push({
        label: `Use suggested ${formatWeight(up, unit)}`,
        weight: formatWeight(up, unit),
        reps: range ? `${range.min}–${Math.min(range.max, range.min + 2)}` : e.reps,
        kind: "suggested",
      });
      if (small < up) {
        options.push({
          label: `Smaller increase ${formatWeight(small, unit)}`,
          weight: formatWeight(small, unit),
          reps: e.reps,
          kind: "smaller",
        });
      }
      options.push({ label: "Keep current weight", weight: label, reps: e.reps, kind: "keep" });
    }
  } else {
    reason = `${histLine} Stay here and work toward ${range ? range.max : "the top"} reps on every set.`;
    options.push({ label: "Keep current weight", weight: label, reps: e.reps, kind: "keep" });
    if (w !== null) {
      options.push({
        label: `Small increase ${formatWeight(roundTo(w + step, step), unit)}`,
        weight: formatWeight(roundTo(w + step, step), unit),
        reps: e.reps,
        kind: "smaller",
      });
    }
  }

  const warmups =
    workNum !== null && needsWarmup(e, replacedWith)
      ? warmupPlan(workNum, e, s.settings, replacedWith)
      : [];

  return { workWeight, workWeightNum: workNum, repsTarget: e.reps, reason, options, warmups };
}

/* --------------------- in-workout set adaptation ----------------------- */

export interface SetAdvice {
  message: string;
  suggestedWeight?: string;
  kind: "up" | "hold" | "rest";
}

/** Short prompt after a working set, based on this set alone. */
export function adviceAfterSet(
  set: SetEntry,
  prevSet: SetEntry | undefined,
  e: Exercise,
  settings: Settings,
  replacedWith?: string,
): SetAdvice | null {
  const range = repRange(e.reps);
  const reps = Number(set.reps) || 0;
  const w = weightValue(set.weight);
  const step = incrementFor(e, settings, replacedWith);
  if (set.feel === "pain") {
    return {
      message: "Pain reported. Stop this exercise or switch to the listed substitute.",
      kind: "hold",
    };
  }
  if (range && reps > range.max + 2 && w !== null) {
    const up = roundTo(w + step, step);
    return {
      message: `You completed ${reps} reps with a target of ${e.reps}. Add a small amount of weight for the next set?`,
      suggestedWeight: formatWeight(up, settings.units),
      kind: "up",
    };
  }
  if (range && reps > 0 && reps <= range.min && (set.feel === "hard" || set.feel === "form")) {
    return {
      message:
        "This weight is challenging. Keep the same weight or reduce slightly for the next set.",
      suggestedWeight:
        w !== null ? formatWeight(roundTo(w * 0.92, step), settings.units) : undefined,
      kind: "hold",
    };
  }
  const prevReps = Number(prevSet?.reps) || 0;
  if (prevReps && reps && prevReps - reps >= 4) {
    return {
      message:
        "Reps dropped more than expected. Extend rest, reduce weight slightly, or keep the current setup.",
      suggestedWeight:
        w !== null ? formatWeight(roundTo(w * 0.92, step), settings.units) : undefined,
      kind: "rest",
    };
  }
  return null;
}