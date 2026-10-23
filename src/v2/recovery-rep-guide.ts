import type { V2Exercise } from "./types";

/**
 * A visual cadence metronome, NOT an exercise repetition detector.
 * No inferred or estimated repetition is ever written to the workout log.
 * The clock is fed only genuine video-playing workout seconds.
 */
export type RecoveryRepGuide = {
  cueNumber: number;
  minimum: number;
  maximum: number;
  paceSeconds: number;
  progressPercent: number;
  phase: "controlled lift" | "controlled return" | "finish when ready";
  elapsedSeconds: number;
  finishedGuide: boolean;
};

export function recoveryRepGuide(
  exercise: V2Exercise | undefined,
  elapsedSeconds: number,
  paceSeconds = 4,
): RecoveryRepGuide | null {
  if (!exercise?.id.startsWith("recovery-") ||
      exercise.category !== "strength" ||
      !exercise.repRange ||
      exercise.repRange.length !== 2) return null;

  const [minimum, maximum] = exercise.repRange;
  if (!Number.isInteger(minimum) || !Number.isInteger(maximum) ||
      minimum <= 0 || maximum < minimum) return null;

  const elapsed = Number.isFinite(elapsedSeconds) && elapsedSeconds >= 0
    ? elapsedSeconds : 0;
  const pace = Math.max(3, Math.min(6, Number.isFinite(paceSeconds) ? paceSeconds : 4));
  const cueNumber = Math.min(maximum, Math.floor(elapsed / pace) + 1);
  const finishedGuide = elapsed >= maximum * pace;
  const progressPercent = Math.min(100, Math.round(100 * elapsed / (maximum * pace)));
  const phase = finishedGuide ? "finish when ready"
    : elapsed % pace < pace / 2 ? "controlled lift" : "controlled return";
  return {
    cueNumber, minimum, maximum, paceSeconds: pace, progressPercent,
    phase, elapsedSeconds: elapsed, finishedGuide,
  };
}
