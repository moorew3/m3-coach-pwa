/**
 * WORKOUT PHASE MACHINE
 * ------------------------------------------------------------------
 * One canonical name for "where are we in the session" so the coach
 * stage, the HUD, the voice cues and the camera tracking all react to
 * the SAME thing instead of each re-deriving it from step.kind.
 *
 * Purely local + derived. No new state is stored: the coach script
 * remains the single source of truth for the running session.
 */
import type { CoachStep } from "@/lib/coach-script";

export type WorkoutPhase =
  | "INTRO"
  | "WARMUP"
  | "EXERCISE_PREP"
  | "ACTIVE_SET"
  | "REST"
  | "NEXT_EXERCISE"
  | "COOLDOWN"
  | "WORKOUT_COMPLETE";

export interface PhaseInfo {
  phase: WorkoutPhase;
  /** Short human label for the HUD. */
  label: string;
  /** Coach should be physically performing the movement right now. */
  coachPerforms: boolean;
  /** Camera tracking should be running/counting right now. */
  trackingActive: boolean;
  /** Coach faces front and talks (prep / rest / transition states). */
  frontFacing: boolean;
}

const INFO: Record<WorkoutPhase, Omit<PhaseInfo, "phase">> = {
  INTRO: { label: "Briefing", coachPerforms: false, trackingActive: false, frontFacing: true },
  WARMUP: { label: "Warm-up", coachPerforms: true, trackingActive: false, frontFacing: false },
  EXERCISE_PREP: { label: "Set up", coachPerforms: true, trackingActive: false, frontFacing: true },
  ACTIVE_SET: {
    label: "Working set",
    coachPerforms: true,
    trackingActive: true,
    frontFacing: false,
  },
  REST: { label: "Rest", coachPerforms: false, trackingActive: false, frontFacing: true },
  NEXT_EXERCISE: {
    label: "Next up",
    coachPerforms: false,
    trackingActive: false,
    frontFacing: true,
  },
  COOLDOWN: { label: "Cooldown", coachPerforms: true, trackingActive: false, frontFacing: false },
  WORKOUT_COMPLETE: {
    label: "Session done",
    coachPerforms: false,
    trackingActive: false,
    frontFacing: true,
  },
};

const isWarmupSection = (s?: CoachStep) => /warm/i.test(`${s?.section ?? ""} ${s?.chapter ?? ""}`);

export function phaseFor(step: CoachStep | undefined): PhaseInfo {
  let phase: WorkoutPhase = "INTRO";
  const kind: string = step?.kind ?? "intro";
  if (kind === "complete" || kind === "recap") phase = "WORKOUT_COMPLETE";
  else if (kind === "cooldown") phase = "COOLDOWN";
  else if (kind === "rest") phase = "REST";
  else if (kind === "work") phase = isWarmupSection(step) ? "WARMUP" : "ACTIVE_SET";
  else if (kind === "brief" || kind === "demo") phase = "EXERCISE_PREP";
  else if (kind === "transition" || kind === "prompt") phase = "NEXT_EXERCISE";
  return { phase, ...INFO[phase] };
}

export const phaseLabel = (p: WorkoutPhase) => INFO[p].label;