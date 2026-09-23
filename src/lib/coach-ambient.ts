/**
 * COACH AMBIENCE — the coach stays alive between working sets.
 * ------------------------------------------------------------------
 * The coach is the experience: he is never a decorative photograph while
 * the session is running. Every non-working state (greeting, prep,
 * countdown, set recap, rest, transition, cooldown prep, completion)
 * plays a REAL verified clip of the SAME approved coach — pacing,
 * shifting his weight, resetting his shoulders, mobilising — instead of
 * a frozen portrait.
 *
 * Hard rules kept intact:
 *  - Nothing here invents motion. Every clip comes from coachMotionFor(),
 *    so the canonical identity gate still decides what may render.
 *  - Ambience is never used for an ACTIVE movement: a working set always
 *    shows the exact clip for that exact exercise, chosen elsewhere.
 *  - If no approved ambient clip resolves, callers fall back to the
 *    approved still — never to another person.
 */
import { coachMotionFor } from "@/data/coach-identity";
import type { TrainerState } from "@/lib/trainer-media-state";

export type CoachClip = { url: string; poster?: string };

/**
 * Which approved movement reads as "coach being present" for each state.
 * Calm, low-intensity, full-body clips only — nothing that could be
 * mistaken for the exercise the user is meant to be doing.
 */
const AMBIENT_BY_STATE: Partial<Record<TrainerState, string[]>> = {
  INTRO: ["easyWalk", "controlledShoulderWork"],
  WARMUP_PREP: ["shoulderMobility", "controlledShoulderWork"],
  EXERCISE_PREP: ["controlledShoulderWork", "shoulderMobility"],
  COUNTDOWN: ["controlledShoulderWork", "boxingStance"],
  SET_COMPLETE: ["easyWalk", "shoulderMobility"],
  REST: ["easyWalk", "lowerBodyMobility"],
  NEXT_EXERCISE: ["lowerBodyMobility", "easyWalk"],
  COOLDOWN_PREP: ["hamstringMobility", "shoulderMobility"],
  COMPLETE: ["controlledShoulderWork", "easyWalk"],
};

/** The first approved clip for this state, or nothing. */
export function ambientClipFor(state: TrainerState): CoachClip | undefined {
  for (const id of AMBIENT_BY_STATE[state] ?? []) {
    const clip = coachMotionFor(id);
    if (clip) return clip;
  }
  return undefined;
}

/** Ambience plays a touch below real time so it reads as presence, not work. */
export const AMBIENT_RATE = 0.85;