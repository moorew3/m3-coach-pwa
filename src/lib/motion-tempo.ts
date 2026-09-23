/**
 * MOTION TEMPO — one shared "how fast should this move" model.
 * ------------------------------------------------------------------
 * The coach's clip, the pace read-out and the voice cues all read the
 * SAME target tempo from here, so nothing is hardcoded in the route.
 *
 * Everything is local arithmetic: seconds per rep, a playback rate for
 * the coach clip, a pace verdict, and a simple follow-the-coach
 * synchronisation score for the current set.
 */
import type { PatternId } from "@/lib/vision/patterns";

export interface Tempo {
  /** Seconds lowering (eccentric). */
  down: number;
  /** Seconds lifting (concentric). */
  up: number;
}

/** Target tempo per movement pattern — deliberately conservative. */
export const TEMPO: Record<PatternId, Tempo> = {
  squat: { down: 2.5, up: 1.2 },
  lunge: { down: 2.2, up: 1.2 },
  curl: { down: 2.5, up: 1.0 },
  row: { down: 2.0, up: 1.0 },
  press: { down: 2.2, up: 1.2 },
  raise: { down: 2.5, up: 1.2 },
  punch: { down: 0.3, up: 0.3 },
};

/** Per-exercise overrides where the program asks for something specific. */
const BY_ID: Record<string, Tempo> = {
  assistedEccentricCurl: { down: 4, up: 1 },
  inclineWaiterCurl: { down: 3, up: 1 },
  lateralRaise: { down: 2.5, up: 1.5 },
  rearDeltFly: { down: 2.5, up: 1.5 },
};

export const secondsPerRep = (t: Tempo) => t.down + t.up;

export function tempoFor(exerciseId?: string, pattern?: PatternId | null): Tempo {
  if (exerciseId && BY_ID[exerciseId]) return BY_ID[exerciseId];
  return pattern ? TEMPO[pattern] : { down: 2, up: 1.5 };
}

/**
 * Playback rate for the coach clip so his cadence sits near the target
 * seconds-per-rep. Clamped hard: the coach must always look natural.
 */
export function coachRate(t: Tempo, clipSecondsPerRep = 3): number {
  const wanted = secondsPerRep(t);
  if (!wanted || !clipSecondsPerRep) return 1;
  return Math.max(0.75, Math.min(1.25, clipSecondsPerRep / wanted));
}

export type PaceState = "ahead" | "onPace" | "behind" | "unknown";

export const PACE_LABEL: Record<PaceState, string> = {
  ahead: "Ahead",
  onPace: "On pace",
  behind: "Behind",
  unknown: "—",
};

/**
 * Compare the user's measured half-rep timings with the target.
 * `delta` is the user's seconds-per-rep minus the target (negative = fast).
 */
export function paceCompare(
  measured: { down: number; up: number } | null,
  target: Tempo,
): { state: PaceState; delta: number } {
  if (!measured || measured.down <= 0 || measured.up <= 0) return { state: "unknown", delta: 0 };
  const user = measured.down + measured.up;
  const delta = +(user - secondsPerRep(target)).toFixed(1);
  const tol = Math.max(0.6, secondsPerRep(target) * 0.2);
  return { state: delta < -tol ? "ahead" : delta > tol ? "behind" : "onPace", delta };
}

/**
 * Follow-the-coach score, 0–100: how closely the user's rep cadence and
 * range matched the coach during this set. Null when the camera never
 * saw enough to judge.
 */
export function syncScore(
  measured: { down: number; up: number } | null,
  target: Tempo,
  romPct: number | null,
  confidence: number,
): number | null {
  if (!measured || confidence < 0.55 || measured.down <= 0) return null;
  const { delta } = paceCompare(measured, target);
  const timing = Math.max(0, 1 - Math.abs(delta) / Math.max(1.5, secondsPerRep(target) * 0.6));
  const range = romPct === null ? 0.8 : Math.max(0, Math.min(1, romPct / 100));
  return Math.round((timing * 0.6 + range * 0.4) * 100);
}

/**
 * Follow-the-coach in the simplest honest terms: is the user ahead of,
 * with, or behind the coach's rep count right now? Only meaningful when
 * the camera is actually counting.
 */
export function repPace(userReps: number | null, coachReps: number): PaceState {
  if (userReps === null || coachReps <= 0) return "unknown";
  const d = userReps - coachReps;
  return d >= 1.5 ? "ahead" : d <= -1.5 ? "behind" : "onPace";
}