/**
 * FORM SCORE — an honest 0–100 read of the camera-tracked set.
 * ------------------------------------------------------------------
 * Derived only from what the local pose analyser actually measured:
 * range of motion, tempo control and left/right symmetry. When the
 * camera cannot see the user well enough (confidence below 0.55) there
 * is NO score — the HUD shows a dash rather than a made-up number.
 */
import type { MoveMetrics } from "@/lib/vision/analysis";
import type { PatternId } from "@/lib/vision/patterns";

/** Range of motion (degrees) that counts as a full rep, per pattern. */
export const ROM_TARGET: Record<PatternId, number> = {
  squat: 70,
  lunge: 65,
  curl: 90,
  row: 55,
  press: 80,
  punch: 60,
  raise: 50,
};

/** Comfortable seconds per half-rep — slower than this is fine, faster is rushed. */
export const PACE_TARGET: Record<PatternId, number> = {
  squat: 1.2,
  lunge: 1.2,
  curl: 1.0,
  row: 1.0,
  press: 1.1,
  punch: 0.3,
  raise: 1.2,
};

/** Range of motion of the last rep as a percentage of the pattern target. */
export function romPercent(
  m: { pattern: PatternId; rom: number; confidence: number } | null | undefined,
): number | null {
  if (!m || m.confidence < 0.55 || m.rom <= 0) return null;
  return Math.round(Math.min(100, (m.rom / ROM_TARGET[m.pattern]) * 100));
}

export interface FormScore {
  /** 0–100, or null when the camera was not confident enough to judge. */
  score: number | null;
  rom: number;
  pace: number;
  symmetry: number;
  /** Plain-language reason the score is what it is. */
  note: string;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export function formScore(m: MoveMetrics | null | undefined): FormScore {
  if (!m || m.confidence < 0.55 || m.reps < 1) {
    return {
      score: null,
      rom: 0,
      pace: 0,
      symmetry: 0,
      note: "Not enough camera detail to score form.",
    };
  }
  const romTarget = ROM_TARGET[m.pattern];
  const paceTarget = PACE_TARGET[m.pattern];
  const rom = clamp01(m.romAvg / romTarget);
  const half = Math.max(m.tempoDown, m.tempoUp);
  const pace = half <= 0 ? 0.6 : clamp01(half / paceTarget);
  const symmetry = m.symmetry === null ? 0.85 : clamp01(m.symmetry);

  const score = Math.round((rom * 0.45 + pace * 0.3 + symmetry * 0.25) * 100);
  const note =
    rom < 0.75
      ? "Range is short — go deeper on the next set."
      : pace < 0.7
        ? "You're rushing — slow the lowering down."
        : symmetry < 0.8
          ? "One side is working harder than the other."
          : "Clean, controlled reps.";
  return { score: Math.max(0, Math.min(100, score)), rom, pace, symmetry, note };
}