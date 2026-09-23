/**
 * TRAINER MEDIA STATE
 * ------------------------------------------------------------------
 * One decision point for what may be visible on the Coach Mode stage.
 * Talking, setup, countdown, rest, transition and recap states always use
 * the completely static approved coach still. Only an active movement may
 * show the verified clip for that exact current movement.
 */
import { ambientClipFor } from "@/lib/coach-ambient";
import type { CoachStep } from "@/lib/coach-script";

export type TrainerState =
  | "INTRO"
  | "WARMUP_PREP"
  | "WARMUP_ACTIVE"
  | "EXERCISE_PREP"
  | "COUNTDOWN"
  | "ACTIVE_SET"
  | "SET_COMPLETE"
  | "REST"
  | "REST_PREVIEW"
  | "NEXT_EXERCISE"
  | "COOLDOWN_PREP"
  | "COOLDOWN_ACTIVE"
  | "COMPLETE";

export type TrainerMediaMode = "static" | "motion";

export interface TrainerMediaDecision {
  state: TrainerState;
  mode: TrainerMediaMode;
  /**
   * Presence clip for a non-working state (greeting, prep, countdown,
   * recap, rest, transition, completion). Always the SAME approved coach,
   * always a verified clip — never the current exercise, never a person
   * who is not him. Undefined means "fall back to the approved still".
   */
  ambient?: { url: string; poster?: string };
  /**
   * The clip on the stage. For every state except REST_PREVIEW this is the
   * exact CURRENT movement. In REST_PREVIEW it is the exact UPCOMING movement,
   * shown as a demonstration only.
   */
  motion?: { url: string; poster?: string };
  /** True only while an upcoming movement is being demonstrated during rest. */
  preview?: boolean;
}

const isWarmup = (step: CoachStep) => /warm/i.test(`${step.section} ${step.chapter ?? ""}`);

function decideTrainerMedia({
  step,
  lead,
  left,
  speaking,
  exactMotion,
  nextMotion,
}: {
  step: CoachStep;
  lead: number | null;
  left: number | null;
  speaking: boolean;
  exactMotion?: { url: string; poster?: string };
  /** Exact clip of the movement the session is resting INTO, if verified. */
  nextMotion?: { url: string; poster?: string };
}): TrainerMediaDecision {
  if (step.kind === "complete") return { state: "COMPLETE", mode: "static" };
  if (step.kind === "intro") return { state: "INTRO", mode: "static" };

  if (step.kind === "brief") {
    if (step.chapter === "cooldown") return { state: "COOLDOWN_PREP", mode: "static" };
    return { state: isWarmup(step) ? "WARMUP_PREP" : "EXERCISE_PREP", mode: "static" };
  }

  if (step.kind === "work") {
    if (lead !== null) return { state: "COUNTDOWN", mode: "static" };
    return exactMotion
      ? {
          state: isWarmup(step) ? "WARMUP_ACTIVE" : "ACTIVE_SET",
          mode: "motion",
          motion: exactMotion,
        }
      : {
          state: isWarmup(step) ? "WARMUP_ACTIVE" : "ACTIVE_SET",
          mode: "static",
        };
  }

  if (step.kind === "rest") {
    const planned = step.seconds ?? 0;
    const elapsed = left === null ? 0 : Math.max(0, planned - left);
    /* Rest is split inside its PLANNED duration — never extended:
       recap · upcoming-movement demonstration · get-ready. */
    const recapSec = Math.min(5, Math.max(2, Math.round(planned * 0.12)));
    const tailSec = Math.min(8, Math.max(5, Math.round(planned * 0.18)));
    const inRecap = elapsed < recapSec;
    if (inRecap || (speaking && elapsed < recapSec + 2))
      return { state: "SET_COMPLETE", mode: "static" };
    if (left !== null && left <= tailSec) return { state: "NEXT_EXERCISE", mode: "static" };
    if (nextMotion)
      return { state: "REST_PREVIEW", mode: "motion", motion: nextMotion, preview: true };
    return { state: "REST", mode: "static" };
  }

  if (step.kind === "prompt") return { state: "NEXT_EXERCISE", mode: "static" };

  if (step.kind === "cooldown") {
    return exactMotion
      ? { state: "COOLDOWN_ACTIVE", mode: "motion", motion: exactMotion }
      : { state: "COOLDOWN_ACTIVE", mode: "static" };
  }

  return { state: "INTRO", mode: "static" };
}

/**
 * The single decision point for the stage. On top of the state machine it
 * attaches a presence clip for every non-working state, so the coach keeps
 * moving between sets instead of freezing into a photograph. An active
 * movement is untouched: it still shows the exact clip for that exercise.
 */
export function resolveTrainerMedia(
  args: Parameters<typeof decideTrainerMedia>[0] & { ambient?: boolean },
): TrainerMediaDecision {
  const decision = decideTrainerMedia(args);
  if (decision.mode === "motion") return decision;
  if (args.ambient === false) return decision;
  return { ...decision, ambient: ambientClipFor(decision.state) };
}