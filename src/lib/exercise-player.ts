/**
 * EXERCISE PLAYER CONFIG
 * ------------------------------------------------------------------
 * One reusable description of everything the CoachPlayer needs to run
 * a movement: the verified coach motion clip, sets/reps/duration/rest,
 * the coaching cues, and the motion-tracking rules for that pattern.
 *
 * Every field comes from data already in the project (program data,
 * coach-identity clips, coach-cues, vision patterns) so any exercise in
 * the program can be played by the same component with no new assets.
 */
import type { Exercise } from "@/data/program";
import { coachMotionFor } from "@/data/coach-identity";
import { coachingForExercise, movementKeyFor, type MovementCoaching } from "@/data/coach-cues";
import { patternFor, type PatternId } from "@/lib/vision/patterns";
import { ROM_TARGET, PACE_TARGET } from "@/lib/form-score";
import { repRange } from "@/lib/game-score";

export interface TrackingRules {
  /** null = this movement is not analysed by the camera at all. */
  pattern: PatternId | null;
  /** Camera can count reps for this movement. */
  repDetection: boolean;
  /** Degrees of joint travel expected for a full rep. */
  romTargetDeg: number | null;
  /** Seconds per half-rep the coach is pacing. */
  paceTargetSec: number | null;
  /** Below this confidence the coach stops giving form-specific feedback. */
  minConfidence: number;
  /** Confidence needed before a camera rep count may be offered. */
  confirmConfidence: number;
}

export interface ExercisePlayerConfig {
  id: string;
  name: string;
  /** Key into the verified coach motion clips. */
  motionKey: string;
  motion?: { url: string; poster?: string };
  /** True when no verified clip exists — show the approved still + pending. */
  motionPending: boolean;
  sets: number;
  reps?: string;
  /** Timed movement duration, when the prescription is time-based. */
  seconds?: number;
  restSeconds: number;
  /** Target rep window, when there is one. */
  repTarget: [number, number] | null;
  cues: string[];
  coaching?: MovementCoaching;
  tracking: TrackingRules;
}

const secondsFromReps = (reps?: string): number | undefined => {
  if (!reps) return undefined;
  const m = /(\d+)\s*(s|sec|seconds?)\b/i.exec(reps);
  if (m) return Number(m[1]);
  const min = /(\d+)\s*(min|minutes?)\b/i.exec(reps);
  return min ? Number(min[1]) * 60 : undefined;
};

export function trackingRulesFor(exerciseId?: string): TrackingRules {
  const pattern = patternFor(exerciseId);
  return {
    pattern,
    repDetection: Boolean(pattern),
    romTargetDeg: pattern ? ROM_TARGET[pattern] : null,
    paceTargetSec: pattern ? PACE_TARGET[pattern] : null,
    minConfidence: 0.55,
    confirmConfidence: 0.7,
  };
}

/** Build the full player configuration for one exercise. */
export function exercisePlayerConfig(ex: Exercise): ExercisePlayerConfig {
  const motionKey = movementKeyFor(ex) || ex.mirror || ex.id;
  const motion = coachMotionFor(motionKey) ?? coachMotionFor(ex.id);
  const coaching = coachingForExercise(ex);
  return {
    id: ex.id,
    name: ex.name,
    motionKey,
    motion,
    motionPending: !motion,
    sets: Math.max(1, ex.sets),
    reps: ex.reps,
    seconds: secondsFromReps(ex.reps),
    restSeconds: ex.rest,
    repTarget: repRange(ex.reps),
    cues: coaching ? [coaching.start, coaching.path, ...coaching.form].filter(Boolean) : [],
    coaching,
    tracking: trackingRulesFor(ex.id),
  };
}

/** Convenience: is this movement camera-trackable in the current build? */
export const isTrackable = (exerciseId?: string) => Boolean(patternFor(exerciseId));