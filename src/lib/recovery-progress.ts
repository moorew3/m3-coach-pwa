/**
 * M3 FLEX shared Recovery Coach dashboard bridge.
 * The approved timed-demonstration player remains at its existing same-origin
 * /recovery-coach/ address. We read only its minimal local progress snapshot.
 * This does NOT assert actual athlete repetitions or medical clearance.
 */
export const RECOVERY_PROGRESS_KEY = "m3-flex-recovery-progress-v1";
export const RECOVERY_LAST_SESSION_KEY = "m3-flex-recovery-last-session-v1";

export type RecoveryProgram = "recovery" | "A" | "B";
export type RecoveryProgress = {
  program: RecoveryProgram;
  savedAt: number;
  phase: number;
  idx: number;
  workRound: number;
  targetRounds: number;
  mode: string;
  completedSteps: number;
};

export type RecoverySessionReceipt = {
  program: RecoveryProgram;
  finishedAt: number;
  demonstratedSteps: number;
  disclaimer: string;
};

const isProgram = (value: unknown): value is RecoveryProgram =>
  value === "recovery" || value === "A" || value === "B";

export function readRecoveryProgress(storage: Pick<Storage, "getItem"> | null): RecoveryProgress | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(RECOVERY_PROGRESS_KEY);
    if (!raw) return null;
    const item: unknown = JSON.parse(raw);
    if (!item || typeof item !== "object") return null;
    const v = item as Record<string, unknown>;
    if (v.v !== 1 || !isProgram(v.program ?? "recovery")) return null;
    if (typeof v.savedAt !== "number" || !Number.isFinite(v.savedAt) ||
        Date.now() - v.savedAt > 24 * 60 * 60 * 1000 ||
        v.savedAt > Date.now() + 60_000) return null;
    if (!Number.isInteger(v.phase) || (v.phase as number) < 0 || (v.phase as number) > 2 ||
        !Number.isInteger(v.idx) || (v.idx as number) < 0 || (v.idx as number) > 20 ||
        !Number.isInteger(v.workRound) || (v.workRound as number) < 1 ||
        !Number.isInteger(v.targetRounds) || (v.targetRounds as number) < 1 ||
        (v.targetRounds as number) > 2 || !Array.isArray(v.completed) ||
        v.completed.length > 60 || !["ready","running","rest","paused","waiting","preview"].includes(String(v.mode))) return null;
    return {
      program: (v.program ?? "recovery") as RecoveryProgram,
      savedAt: v.savedAt,
      phase: v.phase as number,
      idx: v.idx as number,
      workRound: v.workRound as number,
      targetRounds: v.targetRounds as number,
      mode: v.mode as string,
      completedSteps: v.completed.length,
    };
  } catch {
    return null;
  }
}

export function readLastRecoverySession(storage: Pick<Storage, "getItem"> | null): RecoverySessionReceipt | null {
  if (!storage) return null;
  try {
    const item: unknown = JSON.parse(storage.getItem(RECOVERY_LAST_SESSION_KEY) ?? "null");
    if (!item || typeof item !== "object") return null;
    const v = item as Record<string, unknown>;
    if (!isProgram(v.program) || typeof v.finishedAt !== "number" ||
        !Number.isFinite(v.finishedAt) || v.finishedAt > Date.now() + 60_000 ||
        Date.now() - v.finishedAt > 90 * 86400000 ||
        !Number.isInteger(v.demonstratedSteps) ||
        (v.demonstratedSteps as number) < 1 || (v.demonstratedSteps as number) > 30 ||
        v.disclaimer !== "Timed demonstrations only; actual reps not verified.") return null;
    return {
      program: v.program,
      finishedAt: v.finishedAt,
      demonstratedSteps: v.demonstratedSteps as number,
      disclaimer: v.disclaimer,
    };
  } catch {
    return null;
  }
}

export function safeLocalRecoveryStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

export const recoveryTitle = (program: RecoveryProgram) =>
  program === "A" ? "Workout A · Approved equipment scenes" :
    program === "B" ? "Workout B · Approved INNSTAR scenes" :
      "Seated Recovery Coach";
