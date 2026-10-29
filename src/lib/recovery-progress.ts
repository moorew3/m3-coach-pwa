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

/** Manual Recovery logbook records, not inferred from video demonstration. */
export const RECOVERY_ACTUAL_LOG_KEY = "m3-flex-real-reps-and-metrics-v1";
const APPROVED_SET_NAMES: Record<string, string> = {
  "C01-R3": "Seated shrugs",
  "C02": "Hammer curls",
  "C03": "Front raises",
  "C04-R2": "Alternating curls",
  "C08-PRESS-R3": "INNSTAR chest press",
};
export type ReportedRecoverySet = {
  id: string;
  at: string;
  exercise: string;
  name: string;
  reps: number;
  lb: number | null;
};

export function readReportedRecoverySets(
  storage: Pick<Storage,"getItem"> | null,
): ReportedRecoverySet[] {
  if (!storage) return [];
  try {
    const input: unknown = JSON.parse(storage.getItem(RECOVERY_ACTUAL_LOG_KEY) ?? "null");
    if (!input || typeof input !== "object") return [];
    const state = input as Record<string, unknown>;
    if (state.schema !== 1 || !Array.isArray(state.records) || state.records.length > 1500) return [];
    const records: ReportedRecoverySet[] = [];
    for (const item of state.records) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const record = item as Record<string, unknown>;
      if (record.type !== "set" || typeof record.id !== "string" ||
        !/^[-a-z0-9]{12,80}$/i.test(record.id) ||
        typeof record.exercise !== "string" ||
        !Object.prototype.hasOwnProperty.call(APPROVED_SET_NAMES, record.exercise) ||
        !Number.isInteger(record.reps) || (record.reps as number) < 0 || (record.reps as number) > 100 ||
        !(record.lb === null || typeof record.lb === "number" && Number.isFinite(record.lb) && record.lb >= 0 && record.lb <= 300) ||
        typeof record.at !== "string") continue;
      const timestamp = Date.parse(record.at);
      if (!Number.isFinite(timestamp) || timestamp < Date.UTC(2020,0,1) ||
        timestamp > Date.now() + 86400000) continue;
      records.push({
        id: record.id, at: record.at, exercise: record.exercise,
        name: APPROVED_SET_NAMES[record.exercise],
        reps: record.reps as number, lb: record.lb as number | null,
      });
    }
    return records.sort((a,b) => Date.parse(b.at)-Date.parse(a.at)).slice(0,12);
  } catch {
    return [];
  }
}
