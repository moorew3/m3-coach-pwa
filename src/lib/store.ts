/**
 * App state.
 *
 * Supabase is the source of truth once sync is on (see `src/lib/cloud.ts`);
 * localStorage is the offline cache that keeps the app fully usable with no
 * network. Every mutation writes locally first, then queues a cloud push.
 */
import { useEffect, useSyncExternalStore } from "react";
import { TOTAL_DAYS, findExercise } from "@/data/program";
import { bootCloud, queueCloudPush, registerStateBridge } from "@/lib/cloud";
import { playTone } from "@/lib/coach-voice";

export type SetFeel = "easy" | "good" | "hard" | "form" | "pain";

/** What the camera measured during a set — omitted when it couldn't see. */
export interface VisionSet {
  pattern: string;
  reps: number;
  romAvg: number;
  tempoDown: number;
  tempoUp: number;
  symmetry: number | null;
  confidence: number;
  cues: string[];
}

export interface SetEntry {
  reps: string;
  weight: string;
  /** Warm-up sets do not count as working-set volume. */
  warmup?: boolean;
  /** What kind of set this is inside the exercise. */
  kind?: "warmup" | "work" | "drop" | "backoff";
  /** Optional 1–10 effort rating. */
  rpe?: number;
  /** Quick post-set rating. */
  feel?: SetFeel;
  /** Optional time for timed sets, e.g. "45s" or "3 min". */
  time?: string;
  /** Band colour / level for band exercises. */
  band?: string;
  /** Assistance amount or machine setting for assisted exercises. */
  assist?: string;
  /** Cardio detail. */
  speed?: string;
  incline?: string;
  distance?: string;
  calories?: string;
  /** Side for single-side movements. */
  side?: string;
  /** Timed work (cardio / boxing / carries / mobility): planned seconds. */
  plannedSec?: number;
  /** Timed work: seconds actually completed. */
  doneSec?: number;
  /** Timed work: how the interval ended. */
  outcome?: IntervalOutcome;
  /** Optional one-line note for this set. */
  note?: string;
  /** Camera tracking for this set, when the camera could actually see it. */
  vision?: VisionSet;
  /** When the set was logged (ISO). */
  at?: string;
  done: boolean;
}

export type IntervalOutcome = "completed" | "shortened" | "skipped";

export interface ExerciseLog {
  sets: SetEntry[];
  skipped?: boolean;
  /** Marked done via the "Exercise Complete" button. */
  complete?: boolean;
  replacedWith?: string;
  /** "Form felt clean?" — undefined until answered. */
  formClean?: boolean;
  /** Pain rating 0–10 recorded after the exercise. */
  pain?: number;
  /** Per-exercise rest override in seconds. */
  restOverride?: number;
  /** Per-exercise rep-target override. */
  repTarget?: string;
  /** Free-text notes for this exercise. */
  notes?: string;
}

export interface Readiness {
  shoulder: boolean;
  elbow: boolean;
  knee: boolean;
  back: boolean;
  sharpPain: boolean;
  numbness: boolean;
  energy: number; // 1–5
  slept6: boolean;
  at: string;
}
export interface Recovery {
  water: boolean;
  protein: boolean;
  creatine: boolean;
  cooldown: boolean;
  painNotes: string;
}
/** User-made superset pairing for a single workout day. */
export interface CustomPair {
  id: string;
  a: string;
  b: string;
}
export interface DayLog {
  completed: boolean;
  completedAt?: string;
  cursor: number;
  exercises: Record<string, ExerciseLog>;
  notes?: string;
  readiness?: Readiness;
  /** Per-workout superset preference (falls back to the global default). */
  useSupersets?: boolean;
  /** Optional user-created supersets for this workout. */
  customPairs?: CustomPair[];
  /** Smart pairing has been applied for this workout. */
  pairsInitialized?: boolean;
  /** One-line explanations of automatic pairing changes. */
  pairNotes?: string[];
  /** Start of the currently running time segment (undefined while paused). */
  startedAt?: string;
  /** Accumulated elapsed workout time in ms (segments already banked). */
  elapsedMs?: number;
  /** Workout clock is paused. */
  paused?: boolean;
  /** Saved and exited without finishing. */
  savedIncomplete?: boolean;
  recovery?: Recovery;
  /** Local-only progress photo (data URL). Day 1 / Day 22. */
  photo?: string;
  /** The session the user chose instead of the scheduled program. */
  sessionPlan?: SessionPlan;
  /** Manual or future provider-authorized health data for this session. */
  health?: HealthMetrics;
  /** The coach has asked this session's camera/gesture/workout questions. */
  coachSetupDone?: boolean;
}

export type ActivityType =
  | "programmed"
  | "walk"
  | "treadmill"
  | "weighted-vest-walk"
  | "cardio"
  | "boxing"
  | "custom-exercise"
  | "custom-workout";

export type ExerciseCategory =
  | "press"
  | "pull"
  | "curl"
  | "triceps"
  | "delts"
  | "squat"
  | "hinge"
  | "carry"
  | "boxing"
  | "kick"
  | "core"
  | "mobility"
  | "cardio";

export interface SessionExercise {
  id: string;
  name: string;
  target: string;
  sets: number;
  reps: string;
  rest: number;
  diagram: string;
  image?: string;
  mirror?: string;
  tracked?: boolean;
  notes?: string;
  load?: string;
  category?: ExerciseCategory;
}

export interface ActivityFields {
  durationMin?: string;
  distance?: string;
  steps?: string;
  vestLoad?: string;
  incline?: string;
  speed?: string;
  calories?: string;
  heartRate?: string;
  notes?: string;
}

export interface SessionPlan {
  id: string;
  source: "quick" | "saved";
  activityType: ActivityType;
  title: string;
  focus: string;
  fields: ActivityFields;
  exercises: SessionExercise[];
}

export interface SavedWorkout {
  id: string;
  name: string;
  exercises: SessionExercise[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthMetrics {
  /** manual = typed in; sensor = live phone/Bluetooth reading; imported = health-app export file. */
  source: "manual" | "wearable" | "sensor" | "imported";
  provider?: string;
  steps?: number;
  heartRate?: number;
  calories?: number;
  distance?: number;
  durationMin?: number;
  activeMinutes?: number;
  paceMinPerMile?: number;
  recordedAt: string;
}

export interface UserAvatarPreference {
  kind: "default" | "uploaded";
  /** Size-limited data URL. The approved coach visual remains separate. */
  image?: string;
  /** Display frame around the user's own picture. Coach identity is untouched. */
  frame?: "none" | "gold" | "cyan";
  /** Crop shape for the saved picture. */
  shape?: "square" | "circle";
  displayName?: string;
}

export interface Measurement {
  id: string;
  date: string;
  leftFlexed: string;
  rightFlexed: string;
  leftRelaxed: string;
  rightRelaxed: string;
  waist: string;
  bodyweight: string;
}

/* ------------------------------ nutrition ------------------------------ */

export interface FoodEntry {
  id: string;
  name: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}
export interface NutritionDay {
  entries: FoodEntry[];
  /** Glasses / cups of water (8 oz each). */
  water: number;
  bodyweight: string;
  trainingDay: boolean;
}
export interface NutritionTargets {
  trainingCal: number;
  restCal: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
}

export interface Settings {
  sound: boolean;
  vibration: boolean;
  accent: "gold" | "cyan";
  surface: "charcoal" | "black";
  contrast: "normal" | "high";
  /** Default for the per-workout "Use Supersets" toggle. */
  useSupersets: boolean;
  theme: "dark" | "light" | "system";
  units: "lb" | "kg";
  /** Start the rest timer automatically after a working set is completed. */
  autoRest: boolean;
  /** Move straight to the next warm-up / mobility movement (2s confirmation). */
  autoAdvanceWarmups: boolean;
  /** Move to the next set automatically when the rest timer reaches zero. */
  autoAdvanceAfterRest: boolean;

  /** Spoken coaching during the coached session (browser text-to-speech). */
  coachVoice: boolean;
  /** Adaptive weight suggestions on/off for the whole app. */
  adaptive: boolean;
  /** Smallest practical increases (in the selected unit). */
  incUpperIso: number;
  incUpperComp: number;
  incLower: number;
}
export interface AppState {
  startDate: string;
  days: Record<number, DayLog>;
  measurements: Measurement[];
  settings: Settings;
  nutrition: Record<string, NutritionDay>;
  favorites: FoodEntry[];
  targets: NutritionTargets;
  /** Saved default superset pairings per weekday key ("mon", "tue"...). */
  savedPairs: Record<string, CustomPair[]>;
  /** Saved warm-up percentages per exercise variation key. */
  warmupPrefs: Record<string, { pct: number; reps: string }[]>;
  /** Exercise variation keys with adaptive suggestions turned off. */
  adaptiveOff: string[];
  savedWorkouts: SavedWorkout[];
  userAvatar: UserAvatarPreference;
}

const KEY = "arm-growth-tracker:v1";

const today = () => new Date().toISOString().slice(0, 10);

export const defaultTargets: NutritionTargets = {
  trainingCal: 2600,
  restCal: 2300,
  protein: 170,
  carbs: 250,
  fat: 75,
  water: 10,
};

export const defaultState: AppState = {
  startDate: today(),
  days: {},
  measurements: [],
  settings: {
    sound: true,
    vibration: true,
    accent: "gold",
    surface: "charcoal",
    contrast: "normal",
    useSupersets: false,
    theme: "dark",
    units: "lb",
    autoRest: true,
    autoAdvanceWarmups: true,
    autoAdvanceAfterRest: true,
    coachVoice: true,

    adaptive: true,
    incUpperIso: 2.5,
    incUpperComp: 5,
    incLower: 10,
  },
  nutrition: {},
  favorites: [],
  targets: defaultTargets,
  savedPairs: {},
  warmupPrefs: {},
  adaptiveOff: [],
  savedWorkouts: [],
  userAvatar: { kind: "default" },
};

let state: AppState = defaultState;
let hydrated = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/* ----------------------------- save status ----------------------------- */

export type SaveStatus = "idle" | "saving" | "saved" | "error";

let saveStatus: SaveStatus = "idle";
const saveListeners = new Set<() => void>();
let savedTimer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

function setSaveStatus(next: SaveStatus) {
  saveStatus = next;
  saveListeners.forEach((l) => l());
}

/** Subscribe to the "Saving… / Saved / Save failed" indicator. */
export function useSaveStatus(): SaveStatus {
  return useSyncExternalStore(
    (l) => {
      saveListeners.add(l);
      return () => saveListeners.delete(l);
    },
    () => saveStatus,
    () => "idle" as SaveStatus,
  );
}

function persist(pushToCloud = true) {
  if (typeof window === "undefined") return;
  if (pushToCloud) queueCloudPush();
  setSaveStatus("saving");
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    setSaveStatus("saved");
    if (savedTimer) clearTimeout(savedTimer);
    savedTimer = setTimeout(() => {
      if (saveStatus === "saved") setSaveStatus("idle");
    }, 1600);
  } catch {
    /* storage unavailable — keep the data in memory and retry */
    setSaveStatus("error");
    if (!retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        persist();
      }, 4000);
    }
  }
}

/** Manual "Retry" from the save-failed chip. */
export function retrySave() {
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  persist();
}

function merge(parsed: Partial<AppState>): AppState {
  return {
    ...defaultState,
    ...parsed,
    settings: { ...defaultState.settings, ...(parsed.settings ?? {}) },
    targets: { ...defaultTargets, ...(parsed.targets ?? {}) },
    nutrition: parsed.nutrition ?? {},
    favorites: parsed.favorites ?? [],
    savedPairs: parsed.savedPairs ?? {},
    warmupPrefs: parsed.warmupPrefs ?? {},
    adaptiveOff: parsed.adaptiveOff ?? [],
    savedWorkouts: parsed.savedWorkouts ?? [],
    userAvatar: parsed.userAvatar ?? { kind: "default" },
  };
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      state = merge(JSON.parse(raw) as Partial<AppState>);
    }
  } catch {
    /* ignore corrupt data */
  }
  emit();

  // Cloud arrives after the cached state so the UI never waits on network.
  registerStateBridge(
    () => state,
    (next) => {
      state = merge(next);
      persist(false);
      emit();
    },
  );
  bootCloud();
}

export function setState(updater: (s: AppState) => AppState) {
  state = updater(state);
  persist();
  emit();
}

export function useApp(): AppState {
  useEffect(hydrate, []);
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => defaultState,
  );
}

/* ------------------------------ helpers ------------------------------- */

export function emptyDay(): DayLog {
  return { completed: false, cursor: 0, exercises: {} };
}

export function getDay(s: AppState, day: number): DayLog {
  return s.days[day] ?? emptyDay();
}

export function updateDay(day: number, fn: (d: DayLog) => DayLog) {
  setState((s) => ({ ...s, days: { ...s.days, [day]: fn(getDay(s, day)) } }));
}

export function currentDayNumber(s: AppState): number {
  const start = new Date(s.startDate + "T00:00:00");
  const now = new Date(today() + "T00:00:00");
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.min(TOTAL_DAYS, Math.max(1, diff + 1));
}

export function dayDateLabel(s: AppState, day: number): string {
  const d = new Date(s.startDate + "T00:00:00");
  d.setDate(d.getDate() + day - 1);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function completedCount(s: AppState): number {
  return Object.values(s.days).filter((d) => d.completed).length;
}

export function exerciseHistory(s: AppState, exerciseId: string) {
  return Object.entries(s.days)
    .map(([day, log]) => ({ day: Number(day), log: log.exercises[exerciseId] }))
    .filter((r) => r.log && r.log.sets.some((x) => x.done))
    .sort((a, b) => a.day - b.day);
}

/** Whether supersets are on for a given day. */
export function supersetsOn(s: AppState, day: number): boolean {
  return getDay(s, day).useSupersets ?? s.settings.useSupersets;
}

export interface Progression {
  lastDay: number;
  topWeight: string;
  topReps: string;
  clean: boolean;
  pain?: number;
  advice: string;
}

/** Simple progression suggestion from the most recent logged session. */
export function progressionFor(
  s: AppState,
  exerciseId: string,
  topRepTarget?: number,
): Progression | null {
  const history = exerciseHistory(s, exerciseId);
  const last = history[history.length - 1];
  if (!last?.log) return null;
  const done = last.log.sets.filter((x) => x.done);
  if (done.length === 0) return null;
  const topWeight = done.reduce((m, x) => (Number(x.weight) > Number(m.weight) ? x : m), done[0]);
  const reps = done.map((x) => Number(x.reps) || 0);
  const hitTop = topRepTarget ? reps.every((r) => r >= topRepTarget) : false;
  const clean = last.log.formClean === true;
  const pain = last.log.pain;
  let advice: string;
  if (pain !== undefined && pain >= 4) {
    advice = "Last time you rated pain 4+. Use a listed substitute today and keep the load light.";
  } else if (hitTop && clean) {
    advice = "You hit top reps with clean form — add the smallest weight increase available.";
  } else if (!clean && last.log.formClean === false) {
    advice = "Form was not clean last time — keep the same weight and own the technique.";
  } else {
    advice = "Keep the same weight until you hit the top of the rep range with clean form.";
  }
  return {
    lastDay: last.day,
    topWeight: topWeight.weight || "BW",
    topReps: topWeight.reps || "–",
    clean,
    pain,
    advice,
  };
}

/** Days with a saved completed workout, newest first. */
export function workoutHistory(s: AppState) {
  return Object.entries(s.days)
    .filter(([, d]) => d.completed)
    .map(([day, log]) => ({ day: Number(day), log }))
    .sort((a, b) => b.day - a.day);
}

/** Days that were saved but not finished. */
export function inProgressDays(s: AppState) {
  return Object.entries(s.days)
    .filter(
      ([, d]) =>
        !d.completed &&
        (d.startedAt || (d.elapsedMs ?? 0) > 0 || Object.keys(d.exercises).length > 0),
    )
    .map(([day, log]) => ({ day: Number(day), log }))
    .sort((a, b) => b.day - a.day);
}

/* ------------------------- workout session control ---------------------- */

/** Elapsed ms for a workout, counting the live segment when running. */
export function elapsedFor(log: DayLog, now: number): number {
  const banked = log.elapsedMs ?? 0;
  if (log.completed || log.paused || !log.startedAt) return banked;
  return banked + Math.max(0, now - Date.parse(log.startedAt));
}

export function pauseWorkout(day: number) {
  updateDay(day, (d) =>
    d.paused
      ? d
      : {
          ...d,
          paused: true,
          elapsedMs: elapsedFor(d, Date.now()),
          startedAt: undefined,
        },
  );
}

export function resumeWorkout(day: number) {
  updateDay(day, (d) => ({
    ...d,
    paused: false,
    savedIncomplete: false,
    startedAt: new Date().toISOString(),
  }));
}

/** Leave the workout but keep everything exactly where it is. */
export function saveAndExit(day: number, incomplete = false) {
  updateDay(day, (d) => ({
    ...d,
    paused: true,
    savedIncomplete: incomplete || d.savedIncomplete,
    elapsedMs: elapsedFor(d, Date.now()),
    startedAt: undefined,
  }));
}

/** Wipe all logged work for a day and start fresh. */
export function restartWorkout(day: number) {
  updateDay(day, () => ({ ...emptyDay(), startedAt: new Date().toISOString() }));
}

/** Create or reopen the session and start the clock immediately. */
export function startWorkout(day: number) {
  updateDay(day, (d) => ({
    ...d,
    completed: false,
    completedAt: undefined,
    paused: false,
    savedIncomplete: false,
    startedAt: new Date().toISOString(),
  }));
}

/* ------------------- canonical session lifecycle ---------------------- */

export type SessionPhase = "idle" | "running" | "paused" | "completed";

/** The one answer every view uses for "what is this workout doing?". */
export function sessionPhase(log: DayLog): SessionPhase {
  if (log.completed) return "completed";
  if (log.startedAt) return "running";
  if ((log.elapsedMs ?? 0) > 0 || log.paused) return "paused";
  return "idle";
}

/**
 * Open a day's record without touching the clock or completion state.
 * Every view (Coach, Manual, Glasses, Presentation) calls this on entry —
 * looking at a workout must never start or restart it.
 */
export function ensureSession(day: number) {
  updateDay(day, (d) => d);
}

/** Start the clock only when the session is genuinely idle. */
export function startWorkoutOnce(day: number) {
  updateDay(day, (d) =>
    d.completed || d.startedAt
      ? d
      : { ...d, paused: false, savedIncomplete: false, startedAt: new Date().toISOString() },
  );
}

/** Finish the workout from any view: the clock freezes permanently. */
export function completeWorkout(day: number) {
  updateDay(day, (d) => ({
    ...d,
    elapsedMs: elapsedFor(d, Date.now()),
    startedAt: undefined,
    paused: true,
    savedIncomplete: false,
    completed: true,
    completedAt: d.completedAt ?? new Date().toISOString(),
  }));
}

/**
 * First piece of work that still needs doing, in programmed order.
 * Both views resume from this, so they can never disagree about
 * "where am I in this session".
 */
export function nextUnresolved(
  s: AppState,
  day: number,
  exercises: { id: string; sets: number }[],
): { exerciseId: string; setIndex: number } | null {
  const log = getDay(s, day);
  for (const e of exercises) {
    const el = log.exercises[e.id];
    if (el?.skipped || el?.complete) continue;
    const planned = Math.max(1, e.sets, el?.sets.length ?? 0);
    for (let i = 0; i < planned; i++) {
      if (!el?.sets[i]?.done) return { exerciseId: e.id, setIndex: i };
    }
  }
  return null;
}

/**
 * Write weight/reps (or any field) into a set WITHOUT completing it, so an
 * edit made on the coached stage is visible in the manual log immediately.
 */
export function upsertSetValues(
  day: number,
  exerciseId: string,
  index: number,
  patch: Partial<SetEntry>,
) {
  updateDay(day, (d) => {
    const exercise = d.exercises[exerciseId];
    const sets = [...(exercise?.sets ?? [])];
    const planned =
      d.sessionPlan?.exercises.find((e) => e.id === exerciseId)?.sets ??
      findExercise(exerciseId)?.sets ??
      0;
    while (sets.length <= index || sets.length < planned)
      sets.push({ reps: "", weight: "", done: false });
    sets[index] = { ...sets[index], ...patch };
    return { ...d, exercises: { ...d.exercises, [exerciseId]: { ...(exercise ?? {}), sets } } };
  });
}

/** Reset only the workout clock — all logged work is untouched. */
export function restartClock(day: number) {
  updateDay(day, (d) => ({ ...d, elapsedMs: 0, startedAt: undefined, paused: true }));
}

/**
 * Reset the given exercises (uncheck sets, clear complete/skip status).
 * When keepValues is false the weights/reps/times are cleared too.
 */
export function resetExercises(day: number, ids: string[], keepValues: boolean) {
  updateDay(day, (d) => {
    const exercises = { ...d.exercises };
    for (const id of ids) {
      const el = exercises[id];
      if (!el) continue;
      exercises[id] = {
        sets: el.sets.map((s) =>
          keepValues
            ? { ...s, done: false, feel: undefined }
            : { reps: "", weight: "", time: undefined, warmup: s.warmup, done: false },
        ),
        replacedWith: el.replacedWith,
        restOverride: el.restOverride,
        repTarget: el.repTarget,
        notes: keepValues ? el.notes : undefined,
        complete: false,
        skipped: false,
      };
    }
    return { ...d, exercises };
  });
}

/**
 * Full reset of a session. The clock only resets when asked, so
 * "restart from selected exercise" can keep the session running.
 */
export function restartEntireWorkout(
  day: number,
  ids: string[],
  keepValues: boolean,
  opts: { resetClock?: boolean; cursor?: number } = {},
) {
  const { resetClock = true, cursor = 0 } = opts;
  resetExercises(day, ids, keepValues);
  updateDay(day, (d) => ({
    ...d,
    cursor,
    completed: false,
    completedAt: undefined,
    elapsedMs: resetClock ? 0 : d.elapsedMs,
    startedAt: resetClock ? undefined : d.startedAt,
    paused: resetClock ? true : d.paused,
    savedIncomplete: false,
  }));
}

/** True when a session for this day has any saved work or time on the clock. */
export function hasActiveSession(s: AppState, day: number): boolean {
  const d = s.days[day];
  if (!d || d.completed) return false;
  return (
    !!d.startedAt ||
    (d.elapsedMs ?? 0) > 0 ||
    Object.values(d.exercises).some(
      (el) =>
        el.complete || el.skipped || el.sets.some((x) => x.done || x.weight || x.reps || x.time),
    )
  );
}

/** Most recent weight logged for an exercise — used as the suggested weight. */
export function lastWeightFor(s: AppState, exerciseId: string): string | undefined {
  const history = exerciseHistory(s, exerciseId);
  const last = history[history.length - 1];
  const done = last?.log?.sets.filter((x) => x.done && x.weight) ?? [];
  return done.length ? done[done.length - 1].weight : undefined;
}

/** Reopen a finished workout so it can be corrected. */
export function reopenWorkout(day: number) {
  updateDay(day, (d) => ({
    ...d,
    completed: false,
    completedAt: undefined,
    paused: false,
    startedAt: new Date().toISOString(),
  }));
}

export function deleteWorkout(day: number) {
  setState((s) => {
    const days = { ...s.days };
    delete days[day];
    return { ...s, days };
  });
}

/**
 * Copy a saved workout's weights, reps, rest and supersets into another day
 * as a fresh, unchecked session.
 */
export function repeatWorkout(from: number, to: number) {
  setState((s) => {
    const src = s.days[from];
    if (!src) return s;
    const exercises: Record<string, ExerciseLog> = {};
    for (const [id, log] of Object.entries(src.exercises)) {
      exercises[id] = {
        sets: log.sets.map((x) => ({ reps: x.reps, weight: x.weight, done: false })),
        replacedWith: log.replacedWith,
      };
    }
    return {
      ...s,
      days: {
        ...s.days,
        [to]: {
          ...emptyDay(),
          exercises,
          useSupersets: src.useSupersets,
          customPairs: src.customPairs,
          startedAt: new Date().toISOString(),
        },
      },
    };
  });
}

/* --------------------------- superset pairing --------------------------- */

/** Apply a set of pairings to a workout (replaces whatever was there). */
export function applyPairs(day: number, pairs: CustomPair[], notes: string[] = []) {
  updateDay(day, (d) => ({ ...d, customPairs: pairs, pairNotes: notes, pairsInitialized: true }));
}

/** Save today's pairings as the default for this weekday. */
export function saveDefaultPairs(planKey: string, pairs: CustomPair[]) {
  setState((s) => ({ ...s, savedPairs: { ...s.savedPairs, [planKey]: pairs } }));
}

/** Forget the saved default for a weekday so recommendations return. */
export function clearDefaultPairs(planKey: string) {
  setState((s) => {
    const savedPairs = { ...s.savedPairs };
    delete savedPairs[planKey];
    return { ...s, savedPairs };
  });
}

/* ------------------------ adaptive progression ------------------------- */

export function saveWarmupPref(key: string, pattern: { pct: number; reps: string }[]) {
  setState((s) => ({ ...s, warmupPrefs: { ...s.warmupPrefs, [key]: pattern } }));
}

export function clearWarmupPref(key: string) {
  setState((s) => {
    const warmupPrefs = { ...s.warmupPrefs };
    delete warmupPrefs[key];
    return { ...s, warmupPrefs };
  });
}

/** Turn adaptive suggestions on/off for a single exercise variation. */
export function toggleAdaptiveFor(key: string) {
  setState((s) => ({
    ...s,
    adaptiveOff: s.adaptiveOff.includes(key)
      ? s.adaptiveOff.filter((k) => k !== key)
      : [...s.adaptiveOff, key],
  }));
}

export function resetAll() {
  setState(() => ({ ...defaultState, startDate: today() }));
}

/* --------------------------- feedback effects -------------------------- */

export function beep(settings: Settings, freq = 660) {
  if (settings.vibration && typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(40);
  }
  if (!settings.sound || typeof window === "undefined") return;
  // Routed through the SAME AudioContext the coach's tap unlocked, so
  // countdown beeps are audible on Android instead of dying in a
  // second, never-resumed context.
  playTone(freq, 340, 0.14);
}

/* ------------------------------ nutrition ------------------------------ */

export const todayKey = () => new Date().toISOString().slice(0, 10);

export function emptyNutrition(trainingDay = true): NutritionDay {
  return { entries: [], water: 0, bodyweight: "", trainingDay };
}

export function getNutrition(s: AppState, date: string): NutritionDay {
  return s.nutrition[date] ?? emptyNutrition();
}

export function updateNutrition(date: string, fn: (n: NutritionDay) => NutritionDay) {
  setState((s) => ({ ...s, nutrition: { ...s.nutrition, [date]: fn(getNutrition(s, date)) } }));
}

export function nutritionTotals(n: NutritionDay) {
  return n.entries.reduce(
    (t, e) => ({
      cal: t.cal + e.cal,
      protein: t.protein + e.protein,
      carbs: t.carbs + e.carbs,
      fat: t.fat + e.fat,
    }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function saveFavorite(food: FoodEntry) {
  setState((s) =>
    s.favorites.some((f) => f.name.toLowerCase() === food.name.toLowerCase())
      ? s
      : { ...s, favorites: [...s.favorites, { ...food, id: crypto.randomUUID() }] },
  );
}

export function removeFavorite(id: string) {
  setState((s) => ({ ...s, favorites: s.favorites.filter((f) => f.id !== id) }));
}

/* --------------------------- backup / restore -------------------------- */

export function exportData(): string {
  return JSON.stringify(state, null, 2);
}

export function importData(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as Partial<AppState>;
    if (!parsed || typeof parsed !== "object") return false;
    setState(() => merge(parsed));
    return true;
  } catch {
    return false;
  }
}

/**
 * Mark one set done from any coached view (phone, glasses, desktop,
 * presentation). Optional weight/reps are merged without disturbing
 * anything else already logged.
 */
export function markSetFromCoach(
  day: number,
  exerciseId: string,
  index: number,
  patch: Partial<SetEntry> = {},
) {
  updateDay(day, (d) => {
    const exercise = d.exercises[exerciseId];
    const sets = [...(exercise?.sets ?? [])];
    // Pad to the programmed count so the coached script never loses rounds
    // when it re-reads the log after set 1.
    const planned =
      d.sessionPlan?.exercises.find((e) => e.id === exerciseId)?.sets ??
      findExercise(exerciseId)?.sets ??
      0;
    while (sets.length <= index || sets.length < planned)
      sets.push({ reps: "", weight: "", done: false });
    sets[index] = { ...sets[index], ...patch, at: new Date().toISOString(), done: true };
    return { ...d, exercises: { ...d.exercises, [exerciseId]: { ...(exercise ?? {}), sets } } };
  });
}

/**
 * Record a timed interval (cardio round, boxing round, carry, mobility
 * hold) exactly as it ended: completed, cut short, or skipped. Skipped
 * intervals are kept as a record but never count as done work.
 */
export function logIntervalFromCoach(
  day: number,
  exerciseId: string,
  index: number,
  info: {
    plannedSec: number;
    doneSec: number;
    outcome: IntervalOutcome;
    feel?: SetFeel;
    rpe?: number;
  },
) {
  updateDay(day, (d) => {
    const exercise = d.exercises[exerciseId];
    const sets = [...(exercise?.sets ?? [])];
    const planned =
      d.sessionPlan?.exercises.find((e) => e.id === exerciseId)?.sets ??
      findExercise(exerciseId)?.sets ??
      0;
    while (sets.length <= index || sets.length < planned)
      sets.push({ reps: "", weight: "", done: false });
    const doneSec = Math.max(0, Math.min(info.plannedSec, Math.round(info.doneSec)));
    sets[index] = {
      ...sets[index],
      time: `${doneSec}s`,
      plannedSec: info.plannedSec,
      doneSec,
      outcome: info.outcome,
      ...(info.feel ? { feel: info.feel } : {}),
      ...(info.rpe ? { rpe: info.rpe } : {}),
      at: new Date().toISOString(),
      done: info.outcome !== "skipped",
    };
    return { ...d, exercises: { ...d.exercises, [exerciseId]: { ...(exercise ?? {}), sets } } };
  });
}

/** Adjust an already-logged set (e.g. fixing reps after the fact). */
export function patchLoggedSet(
  day: number,
  exerciseId: string,
  index: number,
  patch: Partial<SetEntry>,
) {
  updateDay(day, (d) => {
    const exercise = d.exercises[exerciseId];
    if (!exercise?.sets[index]) return d;
    const sets = [...exercise.sets];
    sets[index] = { ...sets[index], ...patch };
    return { ...d, exercises: { ...d.exercises, [exerciseId]: { ...exercise, sets } } };
  });
}