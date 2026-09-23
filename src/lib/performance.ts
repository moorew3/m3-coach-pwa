/**
 * PERFORMANCE MEMORY — what the user ACTUALLY did, and what the coach
 * should say about it.
 * ------------------------------------------------------------------
 * Everything here is derived from the existing day logs (`AppState.days`),
 * so it is local-first, survives refresh, and rides along with the normal
 * cloud snapshot sync. Nothing is stored twice.
 *
 * Three consumers:
 *   • the coach script  — history-aware setup lines, current-session set
 *                          openers, rest reactions, progression decisions
 *                          and the recap
 *   • the coached UI    — pre-filled weight/reps and "last time" hints
 *   • the progress view — per-exercise recent / best / trend / next time
 *
 * Wording rule: reference history only where a real trainer would —
 * exercise setup, a progression decision, the final set, the recap.
 */
import { findExercise, type Exercise } from "@/data/program";
import { kindOf } from "@/lib/exercise-kind";
import {
  formatWeight,
  incrementFor,
  repRange,
  roundTo,
  variationKey,
  weightValue,
} from "@/lib/progression";
import type { AppState, IntervalOutcome, SetEntry, SetFeel } from "@/lib/store";

/* ------------------------------- helpers -------------------------------- */

const working = (sets: SetEntry[]) => sets.filter((s) => s.done && !s.warmup);
const num = (v?: string) => (v && /^\s*[\d.]+\s*$/.test(v) ? Number(v) : null);
const isTimedReps = (reps: string) => /\b(sec|min)\b|\ds\b/i.test(reps);

/** Is this movement one the coach loads and progresses by weight? */
export function isStrength(e: Exercise): boolean {
  const k = kindOf(e);
  return (
    (k === "weighted" ||
      k === "assisted" ||
      k === "band" ||
      k === "bodyweight" ||
      k === "rep-core") &&
    !isTimedReps(e.reps)
  );
}

/** Timed cardio / boxing / carries / mobility / conditioning. */
export function isTimed(e: Exercise): boolean {
  return isTimedReps(e.reps);
}

/** "45" → "45", "BW" → "bodyweight", "Band" → "the band". */
export function spokenWeight(w?: string): string {
  if (!w) return "bodyweight";
  const t = w.trim();
  if (/^bw$/i.test(t) || /bodyweight/i.test(t)) return "bodyweight";
  if (/^band$/i.test(t)) return "the band";
  return t;
}

const joinList = (xs: (string | number)[]) =>
  xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : String(xs[0] ?? "");

const feelWord: Record<SetFeel, string> = {
  easy: "easy",
  good: "about right",
  hard: "hard",
  form: "form broke down",
  pain: "painful",
};

/** RPE 1–10 or easy / right / hard collapsed to one difficulty read. */
export function difficultyOf(s: SetEntry): "easy" | "right" | "hard" | "very-hard" | null {
  if (s.rpe)
    return s.rpe >= 9.5 ? "very-hard" : s.rpe >= 8.5 ? "hard" : s.rpe <= 6 ? "easy" : "right";
  if (s.feel === "easy") return "easy";
  if (s.feel === "good") return "right";
  if (s.feel === "hard" || s.feel === "form") return "hard";
  if (s.feel === "pain") return "very-hard";
  return null;
}

/* --------------------------- last performance --------------------------- */

export interface LastPerformance {
  day: number;
  sets: SetEntry[];
  /** working-set reps, in order */
  reps: number[];
  /** heaviest working weight used */
  weight: string;
  weightNum: number | null;
  /** highest RPE / hardest feel across the session */
  hardest: ReturnType<typeof difficultyOf>;
  rpeMax: number | null;
  /** timed work */
  rounds: { planned: number; completed: number; shortened: number; skipped: number };
  formClean?: boolean;
  pain?: number;
}

/**
 * The most relevant previous performance for THIS exact movement: same
 * exercise id, same substitution, same units — most recent day before
 * the one being trained that has at least one done set.
 */
export function lastPerformance(
  s: AppState,
  e: Exercise,
  excludeDay: number,
): LastPerformance | null {
  const today = s.days[excludeDay]?.exercises[e.id];
  const key = variationKey(e.id, today?.replacedWith, s.settings.units);
  const rows = Object.entries(s.days)
    .map(([d, log]) => ({ day: Number(d), el: log.exercises[e.id] }))
    .filter(
      (r) =>
        r.day !== excludeDay &&
        !!r.el &&
        variationKey(e.id, r.el.replacedWith, s.settings.units) === key &&
        r.el.sets.some((x) => x.done),
    )
    .sort((a, b) => b.day - a.day);
  const last = rows[0];
  if (!last?.el) return null;
  return summarise(last.day, last.el.sets, last.el.formClean, last.el.pain);
}

/** Today's log for a movement, as the coach sees it mid-session. */
export function sessionPerformance(s: AppState, e: Exercise, day: number): LastPerformance | null {
  const el = s.days[day]?.exercises[e.id];
  if (!el || !el.sets.some((x) => x.done || x.outcome)) return null;
  return summarise(day, el.sets, el.formClean, el.pain);
}

function summarise(
  day: number,
  sets: SetEntry[],
  formClean?: boolean,
  pain?: number,
): LastPerformance {
  const ws = working(sets);
  const heaviest = ws.reduce<SetEntry | undefined>(
    (m, x) => (!m || (weightValue(x.weight) ?? -1) > (weightValue(m.weight) ?? -1) ? x : m),
    undefined,
  );
  const rpes = ws.map((x) => x.rpe ?? 0).filter(Boolean);
  const order: NonNullable<ReturnType<typeof difficultyOf>>[] = [
    "easy",
    "right",
    "hard",
    "very-hard",
  ];
  const hardest =
    ws
      .map(difficultyOf)
      .filter((d): d is NonNullable<typeof d> => !!d)
      .sort((a, b) => order.indexOf(b) - order.indexOf(a))[0] ?? null;
  const timed = sets.filter((x) => x.outcome || x.plannedSec);
  return {
    day,
    sets,
    reps: ws.map((x) => num(x.reps) ?? 0).filter((n) => n > 0),
    weight: heaviest?.weight || "BW",
    weightNum: heaviest ? weightValue(heaviest.weight) : null,
    hardest,
    rpeMax: rpes.length ? Math.max(...rpes) : null,
    rounds: {
      planned: timed.length,
      completed: timed.filter((x) => x.outcome === "completed").length,
      shortened: timed.filter((x) => x.outcome === "shortened").length,
      skipped: timed.filter((x) => x.outcome === "skipped").length,
    },
    formClean,
    pain,
  };
}

/* ----------------------------- progression ------------------------------ */

export type ProgressionKind = "up" | "add-reps" | "hold" | "reduce" | "repeat-timed" | "none";

export interface ProgressionCall {
  kind: ProgressionKind;
  /** the weight to use today / next time (label in the user's units) */
  weight: string;
  /** one spoken sentence a trainer would say */
  line: string;
  /** short chip for the UI */
  short: string;
}

/**
 * Double-progression rules, decided from one performance record:
 *   • every working set at the top of the range and not very hard → smallest increase
 *   • reps under the bottom of the range, or very hard / form / pain → hold or reduce
 *   • otherwise → same weight, chase reps
 * Weighted cardio and band work are never pushed up by load.
 */
export function progressionCall(
  s: AppState,
  e: Exercise,
  perf: LastPerformance | null,
): ProgressionCall | null {
  if (!perf) return null;
  const unit = s.settings.units;
  const range = repRange(e.reps);
  const w = perf.weightNum;
  const label = perf.weight;
  const replaced = s.days[perf.day]?.exercises[e.id]?.replacedWith;
  const step = incrementFor(e, s.settings, replaced);
  const kind = kindOf(e);

  if (isTimed(e)) {
    const r = perf.rounds;
    if (r.planned === 0) return null;
    if (r.completed === r.planned) {
      return {
        kind: "repeat-timed",
        weight: label,
        line: `You completed all ${r.planned} ${r.planned === 1 ? "round" : "rounds"} last time. Same length today — we sharpen the quality, not the clock.`,
        short: "Same rounds — sharpen quality",
      };
    }
    const missed = r.planned - r.completed;
    return {
      kind: "hold",
      weight: label,
      line: `Last time ${missed} of ${r.planned} ${missed === 1 ? "round came" : "rounds came"} up short. Same setup today — the goal is finishing every round clean.`,
      short: "Finish every round",
    };
  }

  const reps = perf.reps;
  if (!reps.length) return null;
  const painFlag = (perf.pain ?? 0) >= 4 || perf.sets.some((x) => x.feel === "pain");
  const veryHard = perf.hardest === "very-hard" || (perf.rpeMax ?? 0) >= 9.5;
  const hardAll =
    perf.sets
      .filter((x) => x.done)
      .every((x) => difficultyOf(x) === "hard" || difficultyOf(x) === "very-hard") &&
    reps.length > 1;
  const formBroke = perf.formClean === false || perf.sets.some((x) => x.feel === "form");
  const hitTop = !!range && reps.every((r) => r >= range.max);
  const belowMin = !!range && reps.some((r) => r < range.min);
  const noLoad = w === null || kind === "band" || kind === "bodyweight" || kind === "rep-core";

  if (painFlag) {
    const reduced = w !== null ? formatWeight(roundTo(w * 0.9, step), unit) : label;
    return {
      kind: "reduce",
      weight: reduced,
      line: `Last time this one hurt. We go lighter today — ${spokenWeight(reduced)} — and if anything pinches we swap it out. Pain is not a rep.`,
      short: `Reduce to ${reduced} — pain last time`,
    };
  }
  if (belowMin || veryHard || formBroke) {
    const reduce = belowMin && (veryHard || formBroke) && w !== null;
    const reduced = reduce ? formatWeight(roundTo(w! * 0.92, step), unit) : label;
    return {
      kind: reduce ? "reduce" : "hold",
      weight: reduced,
      line: reduce
        ? `Last session ${spokenWeight(label)} came in under the range and felt like a max. Drop to ${spokenWeight(reduced)} today and rebuild it clean.`
        : belowMin
          ? `Last time you got ${joinList(reps)} at ${spokenWeight(label)} — under the range. Same weight today, no ego on the bar; we want every set inside ${range!.min} to ${range!.max}.`
          : formBroke
            ? `Form slipped last time at ${spokenWeight(label)}. Same weight today — own the tempo before we add anything.`
            : `Last set came in at an RPE ${perf.rpeMax ?? 9}. Keep this at ${spokenWeight(label)} and clean up the tempo.`,
      short: reduce ? `Reduce to ${reduced}` : `Hold ${label} — clean it up`,
    };
  }
  if (hitTop && !hardAll) {
    if (noLoad) {
      return {
        kind: "add-reps",
        weight: label,
        line: `You hit ${range!.max} on every set last time. Today add a rep, or step up a band level if the last set felt easy.`,
        short: "Top of range — add a rep / next band",
      };
    }
    const up = formatWeight(roundTo(w! + step, step), unit);
    return {
      kind: "up",
      weight: up,
      line: `You hit all ${reps.length} sets at ${range!.max} last session at ${spokenWeight(label)}. If the warm-ups feel good, move up to ${spokenWeight(up)} today — ${range!.min} clean is the floor.`,
      short: `Move up to ${up}`,
    };
  }
  const top = range?.max;
  const best = Math.max(...reps);
  const target = top ? Math.min(top, best + 1) : best + 1;
  return {
    kind: "add-reps",
    weight: label,
    line: `Last time you used ${spokenWeight(label)} for ${joinList(reps)}. Same weight today — let's get ${target}${top && target < top ? ` or ${Math.min(top, target + 1)}` : ""} clean.`,
    short: `Same weight — go for ${target}`,
  };
}

/* ----------------------------- coach lines ------------------------------ */

/** History-aware line for the exercise setup (main work only). */
export function setupLine(s: AppState, e: Exercise, day: number): string {
  const last = lastPerformance(s, e, day);
  const call = progressionCall(s, e, last);
  return call ? call.line : "";
}

/**
 * Mid-exercise awareness: what the user logged on the sets just done.
 * "You got 10 on set one and 9 on set two. Stay with the same weight for
 * set three — give me eight clean minimum."
 */
export function setOpenerLine(
  s: AppState,
  e: Exercise,
  day: number,
  r: number,
  total: number,
): string {
  if (r === 0 || !isStrength(e)) return "";
  const el = s.days[day]?.exercises[e.id];
  const done = (el?.sets ?? []).slice(0, r).filter((x) => x.done);
  if (!done.length) return "";
  const range = repRange(e.reps);
  const ords = ["one", "two", "three", "four", "five", "six"];
  const withReps = done.map((x, i) => ({ reps: num(x.reps), w: x.weight, d: difficultyOf(x), i }));
  const known = withReps.filter((x) => x.reps);
  if (!known.length) return "";
  const said = joinList(known.map((x) => `${x.reps} on set ${ords[x.i] ?? x.i + 1}`));
  const lastSet = withReps[withReps.length - 1];
  const lastReps = lastSet.reps ?? 0;
  const minFloor = range
    ? Math.max(range.min, Math.min(lastReps - 1, range.max))
    : Math.max(1, lastReps - 2);
  const isLast = r === total - 1;
  const w = lastSet.w ? spokenWeight(lastSet.w) : "";
  const weightPhrase = w ? `Stay at ${w}` : "Same weight";

  if (lastSet.d === "very-hard" || lastSet.d === "hard") {
    return `You got ${said}, and that last one was ${lastSet.d === "very-hard" ? "a grinder" : "hard"}. ${weightPhrase} for set ${ords[r] ?? r + 1} — ${minFloor} clean minimum, stop one short of failure.`;
  }
  if (
    range &&
    lastReps > range.max &&
    lastSet.d === "easy" &&
    lastSet.w &&
    weightValue(lastSet.w) !== null &&
    !isLast
  ) {
    const step = incrementFor(e, s.settings, el?.replacedWith);
    const up = formatWeight(roundTo(weightValue(lastSet.w)! + step, step), s.settings.units);
    return `You got ${said} and called it easy. Go up to ${spokenWeight(up)} for set ${ords[r] ?? r + 1} — same tempo, ${range.min} to ${range.max}.`;
  }
  if (isLast) {
    return `You got ${said}. ${weightPhrase} for the last set — give me ${minFloor} clean minimum, and every rep past that is a bonus.`;
  }
  return `You got ${said}. ${weightPhrase} for set ${ords[r] ?? r + 1} — ${minFloor} clean minimum.`;
}

/** Short reaction to the set just logged, for the start of the rest. */
export function afterSetLine(s: AppState, e: Exercise, day: number, r: number): string {
  const x = s.days[day]?.exercises[e.id]?.sets[r];
  if (!x?.done) return "";
  const reps = num(x.reps);
  if (isTimed(e)) {
    if (x.outcome === "shortened" && x.doneSec !== undefined)
      return `${x.doneSec} seconds of that banked — we'll take the full round next time.`;
    return "";
  }
  if (!reps) return "";
  const range = repRange(e.reps);
  const w = x.weight ? ` at ${spokenWeight(x.weight)}` : "";
  const d = difficultyOf(x);
  if (d === "very-hard" || x.feel === "form")
    return `${reps}${w}, and it was a grind. Take the full rest — next set stays at the same weight, cleaner tempo.`;
  if (d === "hard")
    return `${reps}${w} — that one was hard. Take the full rest; same weight next set, stop one short of failure.`;
  if (range && reps >= range.max && d === "easy")
    return `${reps}${w}, and easy. That's the top of the range — next set can go up one increment.`;
  if (range && reps >= range.max)
    return `${reps}${w} — top of the range. Hold that weight, keep the reps there.`;
  if (range && reps < range.min)
    return `${reps}${w}. Under the range — that's fine, same weight, full rest, and we tidy the tempo.`;
  return `${reps}${w} logged. Good work.`;
}

/** What the coach recommends for NEXT time, judged from today's log. */
export function nextTimeCall(s: AppState, e: Exercise, day: number): ProgressionCall | null {
  const perf = sessionPerformance(s, e, day);
  return progressionCall(s, e, perf);
}

/** Recap sentences built from what was actually logged today. */
export function recapLines(s: AppState, day: number, mains: Exercise[]): string[] {
  const lines: string[] = [];
  const ups: string[] = [];
  const holds: string[] = [];
  let notable = 0;
  for (const e of mains) {
    const perf = sessionPerformance(s, e, day);
    if (!perf) continue;
    if (isTimed(e)) {
      const r = perf.rounds;
      if (r.planned)
        lines.push(
          r.completed === r.planned
            ? `${e.name}: all ${r.planned} ${r.planned === 1 ? "round" : "rounds"} finished.`
            : `${e.name}: ${r.completed} of ${r.planned} rounds finished${r.shortened ? `, ${r.shortened} cut short` : ""}.`,
        );
    } else if (perf.reps.length && notable < 3) {
      notable++;
      lines.push(
        `${e.name}: ${spokenWeight(perf.weight)} for ${joinList(perf.reps)}${perf.rpeMax ? `, top RPE ${perf.rpeMax}` : ""}.`,
      );
    }
    const call = progressionCall(s, e, perf);
    if (call?.kind === "up") ups.push(`${e.name} to ${spokenWeight(call.weight)}`);
    if (call?.kind === "reduce" || (call?.kind === "hold" && !isTimed(e))) holds.push(e.name);
  }
  if (ups.length) lines.push(`Next time: move ${joinList(ups)} — you earned it.`);
  if (holds.length)
    lines.push(`Hold the weight on ${joinList(holds)} and clean up the reps first.`);
  return lines;
}

/* ------------------------------ UI helpers ------------------------------ */

/** Pre-fill for the coached set: last weight for this set (or heaviest), planned reps. */
export function prefillFor(
  s: AppState,
  e: Exercise,
  day: number,
  r: number,
): { weight: string; reps: string; hint: string } {
  const todayEl = s.days[day]?.exercises[e.id];
  const prevToday = todayEl?.sets
    .slice(0, r)
    .reverse()
    .find((x) => x.done && x.weight);
  const last = lastPerformance(s, e, day);
  const call = progressionCall(s, e, last);
  const range = repRange(e.reps);
  const lastSet = last?.sets.filter((x) => x.done)[r];
  const weight =
    prevToday?.weight ||
    (call && (call.kind === "up" || call.kind === "reduce")
      ? call.weight
      : lastSet?.weight || last?.weight || "");
  const reps = lastSet?.reps && num(lastSet.reps) ? lastSet.reps : range ? String(range.min) : "";
  const hint = last
    ? `Last: ${last.weight} × ${last.reps.join(", ") || "–"}${last.rpeMax ? ` · RPE ${last.rpeMax}` : ""}`
    : "";
  return { weight: weight === "BW" ? "" : weight, reps, hint };
}

/** Compact "last / target" for glasses and presentation. */
export function glassesLine(s: AppState, e: Exercise, day: number): string {
  const last = lastPerformance(s, e, day);
  if (!last) return "";
  const call = progressionCall(s, e, last);
  if (isTimed(e)) return `Last: ${last.rounds.completed}/${last.rounds.planned} rounds`;
  return `Last ${last.weight} × ${last.reps.join("/")}${call ? ` · ${call.short}` : ""}`;
}

/* ---------------------------- progress view ----------------------------- */

export interface ExerciseSummary {
  exercise: Exercise;
  timed: boolean;
  sessions: {
    day: number;
    sets: SetEntry[];
    weight: string;
    reps: number[];
    rpeMax: number | null;
    rounds: LastPerformance["rounds"];
    volume: number;
    e1rm: number;
  }[];
  latest: ExerciseSummary["sessions"][number];
  best: { weight: string; reps: number; e1rm: number; day: number } | null;
  trend: "up" | "flat" | "down" | "new";
  next: ProgressionCall | null;
}

const e1rmOf = (w: number, reps: number) => (reps > 0 ? Math.round(w * (1 + reps / 30)) : 0);

/** Every exercise the user has logged, newest activity first. */
export function exerciseSummaries(s: AppState): ExerciseSummary[] {
  const ids = new Set<string>();
  for (const log of Object.values(s.days))
    for (const [id, el] of Object.entries(log.exercises))
      if (el.sets.some((x) => x.done || x.outcome)) ids.add(id);
  const out: ExerciseSummary[] = [];
  for (const id of ids) {
    const exercise = findExercise(id);
    if (!exercise) continue;
    const sessions = Object.entries(s.days)
      .map(([d, log]) => ({ day: Number(d), el: log.exercises[id] }))
      .filter((r) => r.el && r.el.sets.some((x) => x.done || x.outcome))
      .sort((a, b) => b.day - a.day)
      .map(({ day, el }) => {
        const p = summarise(day, el!.sets, el!.formClean, el!.pain);
        const w = p.weightNum ?? 0;
        return {
          day,
          sets: el!.sets,
          weight: p.weight,
          reps: p.reps,
          rpeMax: p.rpeMax,
          rounds: p.rounds,
          volume: p.reps.reduce((n, r) => n + r * (w || 1), 0),
          e1rm: Math.max(
            0,
            ...working(el!.sets).map((x) => e1rmOf(weightValue(x.weight) ?? 0, num(x.reps) ?? 0)),
          ),
        };
      });
    if (!sessions.length) continue;
    const timed = isTimed(exercise);
    let best: ExerciseSummary["best"] = null;
    if (!timed) {
      for (const ses of sessions)
        for (const x of working(ses.sets)) {
          const w = weightValue(x.weight) ?? 0;
          const reps = num(x.reps) ?? 0;
          const e1 = e1rmOf(w, reps);
          if (reps && (!best || e1 > best.e1rm || (e1 === best.e1rm && reps > best.reps)))
            best = { weight: x.weight || "BW", reps, e1rm: e1, day: ses.day };
        }
    }
    let trend: ExerciseSummary["trend"] = "new";
    if (sessions.length >= 2) {
      const [a, b] = sessions; // a newest
      const ka = timed ? a.rounds.completed : a.e1rm || a.volume;
      const kb = timed ? b.rounds.completed : b.e1rm || b.volume;
      trend = ka > kb * 1.01 ? "up" : ka < kb * 0.99 ? "down" : "flat";
    }
    const latestDay = sessions[0].day;
    const next = progressionCall(s, exercise, summarise(latestDay, sessions[0].sets));
    out.push({ exercise, timed, sessions, latest: sessions[0], best, trend, next });
  }
  return out.sort((a, b) => b.latest.day - a.latest.day);
}

/** Outcome helper for the coached engine: how a timed step ended. */
export function outcomeFor(
  left: number | null,
  planned: number,
): { outcome: IntervalOutcome; doneSec: number } {
  const remaining = Math.max(0, left ?? planned);
  const doneSec = Math.max(0, planned - remaining);
  return { outcome: remaining <= 0 ? "completed" : doneSec > 0 ? "shortened" : "skipped", doneSec };
}