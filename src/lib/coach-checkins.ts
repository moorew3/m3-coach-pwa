/**
 * ACTIVE COACH CHECK-INS
 * ------------------------------------------------------------------
 * Converts a just-finished working set into a question only when athlete
 * input can materially change the next action. Ordinary sets stay quiet.
 */
import type { Exercise } from "@/data/program";
import { liveSetDecision } from "@/lib/performance";
import type { AppState, SetEntry } from "@/lib/store";

export type CoachCheckInKind = "rest" | "load" | "technique";

export interface CoachCheckIn {
  id: string;
  kind: CoachCheckInKind;
  question: string;
  yesLabel: string;
  noLabel: string;
  yesSpoken: string;
  noSpoken: string;
  suggestedWeight?: string;
  currentWeight?: string;
  extraRestSeconds?: number;
}

/**
 * The default workout decision remains deterministic. A check-in is an
 * opportunity for the athlete to override or accept it, never a requirement.
 */
export function coachCheckInForSet(
  s: AppState,
  e: Exercise,
  set: SetEntry,
  setIndex: number,
  nextSameExercise: boolean,
): CoachCheckIn | null {
  if (!set.done || set.warmup || set.feel === "pain") return null;

  const decision = liveSetDecision(s, e, set);
  if (!decision) return null;

  const base = `${e.id}:${setIndex}:${set.at ?? ""}`;

  if (
    nextSameExercise &&
    (decision.kind === "increase" || decision.kind === "reduce") &&
    decision.weight &&
    decision.weight !== set.weight
  ) {
    const up = decision.kind === "increase";
    return {
      id: `${base}:load:${decision.weight}`,
      kind: "load",
      question: up
        ? `You earned the jump to ${decision.weight}. Want it next set, or repeat ${set.weight || "this load"}?`
        : `That set was too close to the limit. I recommend ${decision.weight} next set. Want the adjustment?`,
      yesLabel: up ? `Use ${decision.weight}` : `Drop to ${decision.weight}`,
      noLabel: set.weight ? `Repeat ${set.weight}` : "Keep current load",
      yesSpoken: up
        ? `Good. ${decision.weight} next set — same clean form.`
        : `Good call. ${decision.weight} next set. Let's get the reps back under control.`,
      noSpoken: set.weight
        ? `Okay. We'll repeat ${set.weight}. Earn it with clean reps.`
        : "Okay. We'll keep the current load.",
      suggestedWeight: decision.weight,
      currentWeight: set.weight || "",
    };
  }

  if (nextSameExercise && decision.kind === "technique") {
    return {
      id: `${base}:technique`,
      kind: "technique",
      question: "I saw a technique issue on that set. Want me to show the correction before the next one?",
      yesLabel: "Show correction",
      noLabel: "I’ve got it",
      yesSpoken: "Good. Watch the movement once, then you copy it.",
      noSpoken: "Got it. Same load — make the correction on the next set.",
    };
  }

  const hard =
    set.feel === "hard" ||
    (set.rpe ?? 0) >= 9 ||
    decision.reasons.some((r) => /very hard|near your limit|below the programmed/i.test(r));

  if (hard) {
    return {
      id: `${base}:rest30`,
      kind: "rest",
      question: "That took more out of you than normal. Want 30 extra seconds, or stay on the clock?",
      yesLabel: "+30 seconds",
      noLabel: "Keep the clock",
      yesSpoken: "You got it. Thirty more seconds — use it.",
      noSpoken: "All right. Stay on the clock. Get your breathing under control.",
      extraRestSeconds: 30,
    };
  }

  return null;
}
