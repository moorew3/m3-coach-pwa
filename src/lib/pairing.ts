/**
 * SMART SUPERSET PAIRING
 * -------------------------------------------------------------
 * Builds the approved default pairings for a day, then adapts them to
 * today's readiness answers, pain flags and substitutions.
 * The user always stays in control — every pair can be changed,
 * removed, re-created or restored from the workout screen.
 */
import type { Exercise } from "@/data/program";
import type { CustomPair, DayLog, Readiness } from "@/lib/store";

export interface PairPlan {
  pairs: CustomPair[];
  /** One short sentence per automatic change. */
  notes: string[];
}

/** Heavy compound movements that must never be auto-paired together. */
const HEAVY =
  /bench press|chest press|incline dumbbell press|leg press|goblet squat|squat|romanian deadlift|lat pulldown|seated row|seated cable row|chest-supported row|one-arm supported row|hip thrust/i;

/** Movements that load the shoulder joint hard. */
const SHOULDER_STRESS = /overhead|pullover|press|lateral raise|fly/i;

const isHeavy = (e: Exercise) => HEAVY.test(e.name);
const stressesShoulder = (e: Exercise) => SHOULDER_STRESS.test(e.name);

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Math.random());

/** True when the user flagged pain on this exercise or swapped it out. */
function flagged(log: DayLog, id: string) {
  const el = log.exercises[id];
  return !!el && ((el.pain ?? 0) >= 4 || !!el.replacedWith);
}

/**
 * Approved default pairings for the day, adapted to readiness.
 * Built from the programmed superset groups in src/data/program.ts.
 */
export function recommendedPairs(list: Exercise[], log: DayLog, readiness?: Readiness): PairPlan {
  const notes: string[] = [];
  const groups = new Map<string, Exercise[]>();
  for (const e of list) {
    if (!e.superset) continue;
    groups.set(e.superset, [...(groups.get(e.superset) ?? []), e]);
  }

  const pairs: CustomPair[] = [];
  const sore = readiness ? readiness.energy <= 2 || !readiness.slept6 : false;

  for (const [, members] of groups) {
    const ordered = [...members].sort((a, b) =>
      (a.supersetSlot ?? "").localeCompare(b.supersetSlot ?? ""),
    );
    const [a, b] = ordered;
    if (!a || !b) continue;

    // Never two heavy compounds back to back.
    if (isHeavy(a) && isHeavy(b)) {
      notes.push(`${a.name} and ${b.name} are both heavy — they were kept separate.`);
      continue;
    }

    // Shoulder discomfort: don't stack two shoulder-loading movements.
    if (readiness?.shoulder && stressesShoulder(a) && stressesShoulder(b)) {
      const safer = list.find(
        (x) =>
          x.id !== a.id &&
          x.id !== b.id &&
          !stressesShoulder(x) &&
          !isHeavy(x) &&
          !flagged(log, x.id),
      );
      if (safer) {
        notes.push(
          `Shoulder discomfort reported. ${b.name} was replaced with ${safer.name} and overhead work was kept separate.`,
        );
        pairs.push({ id: uid(), a: a.id, b: safer.id });
      } else {
        notes.push(`Shoulder discomfort reported. ${a.name} and ${b.name} were kept separate.`);
      }
      continue;
    }

    // Elbow pain removes eccentric / overhead triceps pairs.
    if (readiness?.elbow && /eccentric|overhead|pullover|extension/i.test(`${a.name} ${b.name}`)) {
      notes.push(`Elbow discomfort reported. The ${a.name} pair was removed for today.`);
      continue;
    }

    // Knee / back pain removes leg pairings.
    if (
      (readiness?.knee || readiness?.back) &&
      /squat|leg press|curl|calf|bridge|thrust|deadlift/i.test(a.name) &&
      /squat|leg press|deadlift|thrust/i.test(b.name)
    ) {
      notes.push(
        `${readiness?.knee ? "Knee" : "Back"} discomfort reported. The leg pairing was removed.`,
      );
      continue;
    }

    // Painful or substituted exercises are never auto-paired.
    if (flagged(log, a.id) || flagged(log, b.id)) {
      notes.push(
        `${flagged(log, a.id) ? a.name : b.name} is flagged or substituted — it was left as a straight set.`,
      );
      continue;
    }

    // Very sore / under-slept: drop optional arm supersets.
    if (sore && a.supersetWarning) {
      notes.push("Arms are very sore. The optional arm superset was removed.");
      continue;
    }

    pairs.push({ id: uid(), a: a.id, b: b.id });
  }

  if (readiness?.sharpPain || readiness?.numbness) {
    return {
      pairs: [],
      notes: [
        "Sharp pain or numbness reported. All supersets were turned off — take full rest between sets.",
      ],
    };
  }

  return { pairs, notes };
}

/**
 * A pairing that genuinely must not be allowed. Everything else is a
 * judgement call the user is free to make, so only real conflicts block.
 */
export function pairBlocked(a?: Exercise, b?: Exercise): string | null {
  if (!a || !b) return null;
  if (a.id === b.id) return "Pick two different exercises.";
  return null;
}

/** Advisory verdict — shown, never enforced. */
export function pairWarning(a?: Exercise, b?: Exercise): string | null {
  if (!a || !b) return null;
  if (a.id === b.id) return null;
  if (isHeavy(a) && isHeavy(b))
    return "Both are heavy compounds — allowed, but rest well between rounds.";
  if (stressesShoulder(a) && stressesShoulder(b))
    return "Both stress the shoulder joint — pair with care.";
  return null;
}