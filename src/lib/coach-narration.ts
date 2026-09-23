/**
 * SESSION NARRATION — the coach's through-line for one workout episode
 * ------------------------------------------------------------------
 * Per-movement coaching (`coach-cues.ts`) tells the user HOW to do the
 * exercise in front of them. This layer is everything a real trainer
 * says AROUND the exercises so the hour feels like one continuous,
 * produced session instead of cue files stitched together:
 *
 *   opening → equipment check → warm-up intro → into main work →
 *   block transitions → halfway check-in → last block → cooldown intro
 *   → recap with actual work performed.
 *
 * Every line here is context-aware (day, position in session, exact
 * next movement) and deterministic, so all four screens agree on it.
 * Wording is deliberately varied by position so the coach never opens
 * every exercise the same way.
 */
import type { DayPlan, Exercise } from "@/data/program";
import type { MovementCoaching } from "@/data/coach-cues";

export type Chapter =
  | "opening"
  | "equipment"
  | "warmup"
  | "main"
  | "checkin"
  | "finisher"
  | "cooldown"
  | "recap";

export interface DayBrief {
  goal: string;
  equipment: string;
  duration: string;
  safety: string;
  restCue: string;
}

const pick = <T>(list: T[], n: number) => list[((n % list.length) + list.length) % list.length];

const tidy = (s: string) => s.replace(/^About /, "").replace(/\.$/, "");
const lower1 = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/* ------------------------------- opening ------------------------------- */

export function opening(plan: DayPlan, c: DayBrief, mainNames: string[], athlete?: string): string {
  const focus = plan.focus.toLowerCase();
  const list =
    mainNames.length > 2
      ? `${mainNames.slice(0, 2).join(", ")}, then ${mainNames.length - 2} more`
      : mainNames.join(" and ");
  const h = new Date().getHours();
  const partOfDay = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  // Greet a person, at the right time of day, the way a trainer opens a
  // session — not a screen reading a heading.
  const hi = athlete
    ? `${partOfDay}, ${athlete}. Ready to work? Good to have you.`
    : `${partOfDay}. Ready to work?`;
  return (
    `${hi} Today is ${plan.weekday} — ${plan.title}, ${focus}. ` +
    `${c.goal} ` +
    `Plan for the session: warm-up first, then the main block — ${list || "the main work"} — and we close with a proper cooldown. ` +
    `Give it ${tidy(c.duration)}. I'll tell you exactly what to set up before every movement, so you don't have to think — just follow me.`
  );
}

export function equipmentCheck(c: DayBrief, first?: Exercise): string {
  const eq = lower1(c.equipment);
  return (
    `Quick equipment check before we move. You'll need ${eq} Get it within reach now. ` +
    `One rule today: ${c.safety} ` +
    (first
      ? `When you're set, we open up with ${first.name}. Follow me.`
      : "When you're set, we go.")
  );
}

/* ------------------------------ transitions ---------------------------- */

export interface BlockPosition {
  /** 0-based index among main-work movements. */
  index: number;
  total: number;
  isFirstMain: boolean;
  isLastMain: boolean;
  isHalfway: boolean;
  isWarmup: boolean;
  isFinisher: boolean;
  warmupIndex: number;
  warmupTotal: number;
  /** Day type — recovery days are introduced softly, not like a lift. */
  mode?: string;
}

/** How the coach introduces a movement, varied by where we are. */
export function introduce(e: Exercise, pos: BlockPosition, cu: MovementCoaching): string {
  if (pos.isWarmup) {
    if (pos.warmupIndex === 0) return `We open up with ${e.name}.`;
    if (pos.warmupIndex === pos.warmupTotal - 1) return `Last piece of the warm-up — ${e.name}.`;
    return pick([`Straight into ${e.name}.`, `Next in the warm-up: ${e.name}.`], pos.warmupIndex);
  }
  if (pos.isFinisher) return `Last piece of the day — the finisher. ${e.name}.`;
  if (pos.mode === "recovery") {
    if (pos.isFirstMain)
      return `Warm-up's done. Now the mobility work — nothing here is a test. First: ${e.name}.`;
    if (pos.isLastMain) return `Last one: ${e.name}. Stay just as easy as you were on the first.`;
    return pick(
      [`Ease into ${e.name}.`, `Next: ${e.name}.`, `Moving to ${e.name}.`, `Now ${e.name}.`],
      pos.index,
    );
  }
  if (pos.isFirstMain) return `Warm-up's done. Main work starts now — ${e.name}.`;
  if (pos.isLastMain)
    return `Last working movement of the session: ${e.name}. Let's finish the way we started — clean.`;
  const openers = [
    `Alright, ${lower1(e.name)} next.`,
    `Moving on — ${e.name}.`,
    `Next movement: ${e.name}.`,
    `Let's set up for ${e.name}.`,
    `Onto ${e.name}.`,
  ];
  const halfway = pos.isHalfway
    ? " That puts us at the halfway point of the session — still fresh, keep the standard."
    : "";
  void cu;
  return `${pick(openers, pos.index)}${halfway}`;
}

/** Spoken while the user sets up, before set 1 — the "what and why". */
export function briefBody(
  e: Exercise,
  cu: MovementCoaching,
  total: number,
  superset?: string,
  timed = false,
): string {
  const sets = `${total} ${total === 1 ? "set" : "sets"} of ${e.reps}.`;
  const pair = superset
    ? `This one's paired — ${superset}. You go straight from here into the partner movement, no rest between them. `
    : "";
  // Timed efforts get the "how it starts" line here; rep sets hear it as set 1 opens.
  return `${pair}${sets} That's ${cu.muscles}. ${cu.setup}${timed ? ` ${cu.start}` : ""} ${cu.path}`;
}

/* ------------------------------- check-in ------------------------------ */

export function halfwayCheckin(plan: DayPlan, next: Exercise, remaining: number): string {
  return (
    `Halfway through ${plan.title}. Take a real thirty seconds — water, roll the shoulders out. ` +
    `How are the joints? Sore and working is fine. Sharp pain, numbness, or dizziness is not — if that shows up we swap the movement, no ego in it. ` +
    `${remaining} ${remaining === 1 ? "movement" : "movements"} left in the main block, starting with ${next.name}.`
  );
}

/** Woven into the rest before the final main movement. */
export function lastBlockCue(next: Exercise): string {
  return `Entering the last block now — ${next.name} is the final working movement. This is the part that changes you. Bring your best set of the day.`;
}

/* -------------------------------- rest --------------------------------- */

export function restBetweenSets(
  cu: MovementCoaching,
  setDone: number,
  total: number,
  rest: number,
  restCue: string,
  timed: boolean,
  reps: string,
  weighted = true,
  unit = "set",
): string {
  const justDid = timed
    ? `Round ${setDone} of ${total} on ${cu.label} — done, ${reps} banked.`
    : `Set ${setDone} of ${total} on ${cu.label} — done.`;
  const weightLine =
    timed || !weighted ? "" : " Same weight next set unless that moved too easily.";
  const variants = [
    `${justDid} ${rest} seconds. ${restCue}${weightLine} Then ${unit} ${setDone + 1} of ${total}.`,
    `${justDid} Rest ${rest}. Breathe, shake it out.${weightLine} ${unit.charAt(0).toUpperCase() + unit.slice(1)} ${setDone + 1} of ${total} coming.`,
    `${justDid} ${rest} seconds off. ${restCue} Reset, then ${unit} ${setDone + 1}.${weightLine}`,
  ];
  return pick(variants, setDone);
}

export function restToNext(
  cu: MovementCoaching,
  nextEx: Exercise,
  nextCu: MovementCoaching,
  nextSets: number,
  rest: number,
  timed: boolean,
  reps: string,
  total: number,
  progress: string,
): string {
  const justDid = timed
    ? `That's ${cu.label} done — all ${total} ${total === 1 ? "round" : "rounds"}.`
    : `That's all ${total} ${total === 1 ? "set" : "sets"} of ${cu.label}.`;
  return `${justDid}${progress ? ` ${progress}` : ""} ${rest} seconds, then ${nextEx.name} — ${nextSets} ${nextSets === 1 ? "set" : "sets"} of ${nextEx.reps}. While you rest: ${nextCu.prep}`;
}

/* ------------------------------ cooldown ------------------------------- */

export function cooldownIntro(plan: DayPlan, first: string, mainCount: number): string {
  return (
    `That's the work done. ${mainCount} movements banked for ${plan.title}. Now we bring the heart rate down and take care of the tissue — ` +
    `don't skip this part, it's where tomorrow's soreness gets decided. First: ${first}.`
  );
}

/* --------------------------------- recap ------------------------------- */

export interface RecapFacts {
  doneSets?: number;
  minutes?: number;
  loggedNames?: string[];
}

export function recap(
  plan: DayPlan,
  mainNames: string[],
  plannedSets: number,
  facts: RecapFacts = {},
  performance: string[] = [],
): string {
  const names = facts.loggedNames?.length ? facts.loggedNames : mainNames;
  const list =
    names.length > 1
      ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
      : (names[0] ?? "the full session");
  const sets =
    facts.doneSets && facts.doneSets > 0
      ? `${facts.doneSets} sets logged`
      : `${plannedSets} sets planned`;
  const time = facts.minutes && facts.minutes > 0 ? ` in ${facts.minutes} minutes` : "";
  return (
    `That's the session. ${plan.weekday} — ${plan.title}. You went through ${list}: ${sets}${time}, warm-up to cooldown, and the form held. ` +
    (performance.length ? `Here's what you actually did. ${performance.join(" ")} ` : "") +
    `That's exactly how you build ${plan.focus.toLowerCase()}. Everything's saved. ` +
    `Recovery starts now — water first, protein within the next couple of hours, and an easy walk later if the legs feel heavy. ` +
    `I'll see you next session.`
  );
}