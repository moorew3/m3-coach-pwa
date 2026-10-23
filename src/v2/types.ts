export type V2Mode = "coach" | "manual" | "shadow" | "glasses";

export type V2Phase =
  | "ready"
  | "warmup"
  | "work"
  | "rest"
  | "transition"
  | "complete";

export type V2Viewpoint = {
  id: V2Mode;
  label: string;
  camera: "trainer-facing" | "coach-eye" | "follow-along" | "first-person";
  showCoach: boolean;
  showAthleteCamera: boolean;
  compactHud: boolean;
};

export type V2Exercise = {
  id: string;
  name: string;
  category: "strength" | "boxing" | "kickboxing" | "cardio" | "core" | "mobility";
  sets: number;
  reps?: string;
  repRange?: [number, number];
  seconds?: number;
  restSeconds: number;
  /** Optional same-round partner group for true A1/B1 -> rest supersets. */
  supersetId?: string;
  /** Rest after LAST movement in a completed paired round. */
  supersetRestSeconds?: number;
  equipment?: string[];
  motionKey: string;
  cues: string[];
  warmupStyle?: "compound" | "small" | "none";
  loadClass?: "upper" | "lower" | "machine" | "bodyweight";
  optional?: boolean;
};

export type V2Workout = {
  id: string;
  title: string;
  focus: string;
  /** Supersets opt-in; existing workouts remain straight by default. */
  useSupersets?: boolean;
  exercises: V2Exercise[];
};

export type V2SetEntry = {
  reps: number | null;
  cleanForm: boolean | null;
};

export type V2Session = {
  workout: V2Workout;
  mode: V2Mode;
  phase: V2Phase;
  exerciseIndex: number;
  setIndex: number;
  elapsedSeconds: number;
  /** Genuine playing work/rest seconds for the current phase. Old saves may omit it. */
  phaseElapsedSeconds?: number;
  phaseSecondsLeft: number | null;
  running: boolean;
  completedSetIds: string[];
  targetWeights: Record<string, number>;
  setResults: Record<string, V2SetEntry[]>;
};

export type V2SceneState = {
  viewpoint: V2Viewpoint;
  currentExercise: V2Exercise;
  phase: V2Phase;
  running: boolean;
};
