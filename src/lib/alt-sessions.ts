/**
 * ALTERNATE SESSIONS — what the coach offers when the answer is "no".
 * ------------------------------------------------------------------
 * Every option is built from movements that ALREADY exist in the program
 * catalogue. Nothing is invented, and each one becomes an ordinary
 * SessionPlan, so logging, timers, substitutions and history behave
 * exactly as they do for the scheduled workout.
 */
import { THURSDAY } from "@/data/program";
import { effectiveExercises, toSessionExercise } from "@/lib/activities";
import type { AppState, SessionPlan } from "@/lib/store";

export type AltSession = "lighter" | "recovery" | "stretch";

export const ALT_LABELS: Record<AltSession, string> = {
  lighter: "Lighter workout",
  recovery: "Recovery session",
  stretch: "Stretching",
};

const plan = (title: string, focus: string, exercises: SessionPlan["exercises"]): SessionPlan => ({
  id: crypto.randomUUID(),
  source: "quick",
  activityType: "custom-workout",
  title,
  focus,
  fields: {},
  exercises,
});

const recoveryExercises = () => [...THURSDAY.warmup, ...THURSDAY.main].map(toSessionExercise);

/** Today's own session, trimmed to two working sets and longer rests. */
export function lighterPlan(state: AppState, day: number): SessionPlan {
  const exercises = effectiveExercises(state, day).map((e) => ({
    ...toSessionExercise(e),
    sets: Math.max(1, Math.min(2, e.sets)),
    rest: Math.round((e.rest || 60) * 1.25),
  }));
  return plan("Lighter session", "Same movements, less volume", exercises);
}

/** Easy movement and mobility only — nothing loaded. */
export function recoveryPlan(): SessionPlan {
  const exercises = recoveryExercises().map((e) => ({
    ...e,
    sets: 1,
    rest: 30,
  }));
  return plan("Recovery session", "Easy movement and mobility", exercises);
}

/** Pure stretching / mobility flow. */
export function stretchPlan(): SessionPlan {
  const exercises = THURSDAY.main
    .map(toSessionExercise)
    .map((e) => ({ ...e, sets: 1, rest: 20 }));
  return plan("Stretching", "Mobility flow, no load", exercises);
}

export function altSessionPlan(kind: AltSession, state: AppState, day: number): SessionPlan {
  if (kind === "lighter") return lighterPlan(state, day);
  if (kind === "recovery") return recoveryPlan();
  return stretchPlan();
}