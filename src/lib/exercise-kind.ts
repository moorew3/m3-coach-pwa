/**
 * EXERCISE TYPES
 * -------------------------------------------------------------
 * Every movement in the program resolves to exactly one type.
 * The type decides which fields the active screen asks for, what
 * the completion button says and whether a formal rest timer runs.
 */
import type { Exercise } from "@/data/program";

export type ExerciseKind =
  | "dynamic-warmup"
  | "mobility"
  | "static-stretch"
  | "weighted"
  | "bodyweight"
  | "band"
  | "assisted"
  | "timed-core"
  | "rep-core"
  | "cardio"
  | "cooldown";

export const KIND_LABELS: Record<ExerciseKind, string> = {
  "dynamic-warmup": "Dynamic warm-up",
  mobility: "Mobility",
  "static-stretch": "Static stretch",
  weighted: "Weighted strength",
  bodyweight: "Bodyweight strength",
  band: "Band exercise",
  assisted: "Assisted exercise",
  "timed-core": "Timed core exercise",
  "rep-core": "Rep-based core exercise",
  cardio: "Cardio",
  cooldown: "Cooldown",
};

/** Explicit types for the movements where a guess would be wrong. */
const KIND_BY_ID: Record<string, ExerciseKind> = {
  "wu-treadmill-3": "dynamic-warmup",
  "wu-treadmill-4": "dynamic-warmup",
  "wu-arm-circles": "dynamic-warmup",
  "wu-band-pull-apart": "band",
  "wu-cat-cow": "mobility",
  "wu-glute-bridge-wu": "dynamic-warmup",
  "tue-incline-treadmill": "cardio",
  "tue-dead-bug": "rep-core",
  "tue-pallof": "rep-core",
  "tue-reverse-crunch": "rep-core",
  "tue-close-grip-pushup": "bodyweight",
  "fri-treadmill-10": "cardio",
  "fri-assisted-eccentric-curl": "assisted",
  "sat-walk": "cooldown",
  "sat-catcow": "mobility",
  "sat-shoulder-rolls": "mobility",
  "sun-mobility": "mobility",
};

/** Movements that flow straight into the next one — no formal rest. */
const CONTINUOUS: ExerciseKind[] = ["dynamic-warmup", "mobility", "static-stretch", "cooldown"];

/** Resolve the exercise type, honouring a substitution's wording. */
export function kindOf(e: Exercise, replacedWith?: string): ExerciseKind {
  const explicit = KIND_BY_ID[e.id];
  const name = (replacedWith || e.name).toLowerCase();
  if (replacedWith) {
    if (/\bband\b/.test(name)) return "band";
    if (/assisted/.test(name)) return "assisted";
  }
  // New weekly program: ids carry their type.
  if (
    e.id.startsWith("mob-") ||
    e.id.startsWith("wu-lower-mobility") ||
    e.id.startsWith("wu-shoulder-mobility")
  )
    return "static-stretch";
  if (
    e.id.startsWith("cardio-") ||
    e.id.startsWith("box-") ||
    e.id.endsWith("-cooldown") ||
    e.id.endsWith("-walk")
  )
    return "cardio";
  if (explicit) {
    // A band warm-up swapped for dumbbells is no longer a band exercise.
    if (explicit === "band" && replacedWith && !/band/.test(name)) return "weighted";
    return explicit;
  }
  if (/stretch|hold/.test(name)) return "static-stretch";
  if (/walk|treadmill|bike|cardio|row erg/.test(name)) return "cardio";
  if (/assisted/.test(name)) return "assisted";
  if (/^band |band /.test(name) && e.tracked === false) return "band";
  if (/plank|dead bug|pallof|crunch|hollow/.test(name)) return "rep-core";
  if (e.tracked === false) return "bodyweight";
  return "weighted";
}

export interface KindFields {
  weight: boolean;
  band: boolean;
  assist: boolean;
  bodyweight: boolean;
  reps: boolean;
  time: boolean;
  cardio: boolean;
  rounds: boolean;
  side: boolean;
  /** Flows into the next movement instead of a workout rest period. */
  continuous: boolean;
}

const base: KindFields = {
  weight: false,
  band: false,
  assist: false,
  bodyweight: false,
  reps: false,
  time: false,
  cardio: false,
  rounds: false,
  side: false,
  continuous: false,
};

export function fieldsFor(kind: ExerciseKind): KindFields {
  const continuous = CONTINUOUS.includes(kind);
  switch (kind) {
    case "weighted":
      return { ...base, weight: true, reps: true };
    case "bodyweight":
      return { ...base, bodyweight: true, reps: true, time: true };
    case "band":
      return { ...base, band: true, reps: true };
    case "assisted":
      return { ...base, assist: true, reps: true };
    case "timed-core":
      return { ...base, time: true, rounds: true, side: true };
    case "rep-core":
      return { ...base, reps: true, side: true };
    case "cardio":
      return { ...base, cardio: true, time: true };
    case "dynamic-warmup":
      return { ...base, reps: true, time: true, continuous };
    case "mobility":
      return { ...base, reps: true, time: true, side: true, continuous };
    case "static-stretch":
      return { ...base, time: true, side: true, continuous };
    case "cooldown":
      return { ...base, time: true, continuous };
    default:
      return base;
  }
}

/** Button label that matches the movement. */
export function completeLabel(kind: ExerciseKind, loadedWarmupSet = false): string {
  if (loadedWarmupSet) return "Complete Warm-Up Set";
  switch (kind) {
    case "timed-core":
      return "Complete Interval";
    case "cardio":
      return "Complete Cardio";
    case "dynamic-warmup":
    case "mobility":
      return "Complete Movement";
    case "static-stretch":
    case "cooldown":
      return "Complete Stretch";
    default:
      return "Complete Set";
  }
}

/** Programmed rest after a working set — 0 means "flow straight on". */
export function workingRestFor(e: Exercise, kind: ExerciseKind, supersetRest?: number): number {
  if (fieldsFor(kind).continuous) return 0;
  return supersetRest ?? e.rest ?? 0;
}

/**
 * Short transition after a LOADED warm-up set — never the full working rest.
 * Light 30s · moderate 45s · final heavier warm-up 60–90s.
 */
export function warmupTransitionRest(setWeight: number | null, workWeight: number | null): number {
  if (!setWeight || !workWeight || workWeight <= 0) return 45;
  const pct = setWeight / workWeight;
  if (pct < 0.55) return 30;
  if (pct < 0.72) return 45;
  return 75;
}

export const BAND_LEVELS = ["Light", "Medium", "Heavy", "Extra heavy"];
export const BAND_COLORS = ["Yellow", "Red", "Green", "Blue", "Black", "Orange", "Purple"];
export const ASSIST_PRESETS = [
  "Bodyweight (no assist)",
  "Band assist — light",
  "Band assist — medium",
  "Band assist — heavy",
  "Machine setting 1",
  "Machine setting 2",
  "Machine setting 3",
];