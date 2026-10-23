import type { V2Mode, V2Session, V2Workout } from "./types";
import { buildV2SetSequence } from "./set-sequence";

export type V2Action =
  | { type: "restore"; session: V2Session }
  | { type: "set-mode"; mode: V2Mode }
  | { type: "select-exercise"; exerciseIndex: number }
  | { type: "set-target-weight"; exerciseId: string; weight: number }
  | { type: "set-reps"; exerciseId: string; setIndex: number; reps: number | null }
  | { type: "set-form"; exerciseId: string; setIndex: number; cleanForm: boolean | null }
  | { type: "start" }
  | { type: "pause" }
  | { type: "adjust-rest"; seconds: number }
  | { type: "tick" }
  | { type: "complete-set" }
  | { type: "next" }
  | { type: "reset"; workout: V2Workout };

export function createV2Session(workout: V2Workout): V2Session {
  return {
    workout,
    mode: workout.id === "shadow-boxing" ? "shadow" : "coach",
    phase: "ready",
    exerciseIndex: 0,
    setIndex: 0,
    elapsedSeconds: 0,
    phaseElapsedSeconds: 0,
    phaseSecondsLeft: null,
    running: false,
    completedSetIds: [],
    targetWeights: {},
    setResults: {},
  };
}

const setKey = (session: V2Session) =>
  `${session.workout.exercises[session.exerciseIndex]?.id ?? "done"}:${session.setIndex}`;

function beginWork(session: V2Session): V2Session {
  const exercise = session.workout.exercises[session.exerciseIndex];
  return {
    ...session,
    phase: "work",
    running: true,
    phaseElapsedSeconds: 0,
    phaseSecondsLeft: exercise?.seconds ?? null,
  };
}

function advance(session: V2Session): V2Session {
  const planned = buildV2SetSequence(session.workout);
  const current = planned.findIndex(
    step => step.exerciseIndex === session.exerciseIndex && step.setIndex === session.setIndex,
  );
  const next = current >= 0 ? planned[current + 1] : undefined;
  if (!next) {
    return { ...session, phase: "complete", running: false, phaseElapsedSeconds: 0, phaseSecondsLeft: null };
  }
  const duration = planned[current].restAfterSeconds;
  const queued = { ...session, exerciseIndex: next.exerciseIndex, setIndex: next.setIndex };
  // During rest, show which exercise/set comes NEXT; log only after its own
  // work step is actually completed. A->B superset has duration=0.
  if (duration > 0) {
    return { ...queued, phase: "rest", phaseElapsedSeconds: 0, phaseSecondsLeft: duration, running: true };
  }
  return beginWork(queued);
}

function updateSetEntry(
  session: V2Session,
  exerciseId: string,
  setIndex: number,
  patch: { reps?: number | null; cleanForm?: boolean | null },
): V2Session {
  const exercise = session.workout.exercises.find((item) => item.id === exerciseId);
  const size = Math.max(exercise?.sets ?? 0, setIndex + 1);
  const current = session.setResults[exerciseId] ?? [];
  const next = Array.from({ length: size }, (_, index) => ({
    reps: current[index]?.reps ?? null,
    cleanForm: current[index]?.cleanForm ?? null,
  }));
  next[setIndex] = { ...next[setIndex], ...patch };
  return {
    ...session,
    setResults: { ...session.setResults, [exerciseId]: next },
  };
}

export function v2SessionReducer(session: V2Session, action: V2Action): V2Session {
  switch (action.type) {
    case "restore":
      return { ...action.session, running: false };
    case "set-mode":
      return { ...session, mode: action.mode };
    case "select-exercise": {
      if (action.exerciseIndex < 0 || action.exerciseIndex >= session.workout.exercises.length) {
        return session;
      }
      const selected = session.workout.exercises[action.exerciseIndex];
      // Browsing exercises during an active workout must not silently pause the
      // session. Keep the workout live and start the selected movement at set 1.
      // When already paused/not started, selection remains a READY preview.
      return session.running
        ? {
            ...session,
            exerciseIndex: action.exerciseIndex,
            setIndex: 0,
            phase: "work",
            phaseElapsedSeconds: 0,
            phaseSecondsLeft: selected?.seconds ?? null,
            running: true,
          }
        : {
            ...session,
            exerciseIndex: action.exerciseIndex,
            setIndex: 0,
            phase: "ready",
            phaseElapsedSeconds: 0,
            phaseSecondsLeft: null,
            running: false,
          };
    }
    case "set-target-weight":
      return {
        ...session,
        targetWeights: {
          ...session.targetWeights,
          [action.exerciseId]: Math.max(0, action.weight),
        },
      };
    case "set-reps":
      return updateSetEntry(session, action.exerciseId, action.setIndex, { reps: action.reps });
    case "set-form":
      return updateSetEntry(session, action.exerciseId, action.setIndex, {
        cleanForm: action.cleanForm,
      });
    case "start":
      return session.phase === "ready" ? beginWork(session) : { ...session, running: true };
    case "pause":
      return { ...session, running: false };
    case "adjust-rest": {
      if (session.phase !== "rest" || session.phaseSecondsLeft === null) return session;
      const offset = Number.isFinite(action.seconds) ? Math.trunc(action.seconds) : 0;
      const remaining = Math.min(600, Math.max(5, session.phaseSecondsLeft + offset));
      return { ...session, phaseSecondsLeft: remaining };
    }
    case "tick": {
      if (!session.running) return session;
      const next = { ...session, elapsedSeconds: session.elapsedSeconds + 1,
        phaseElapsedSeconds: (session.phaseElapsedSeconds ?? 0) + 1 };
      if (session.phaseSecondsLeft === null) return next;
      const left = Math.max(0, session.phaseSecondsLeft - 1);
      if (left > 0) return { ...next, phaseSecondsLeft: left };
      if (session.phase === "rest" || session.phase === "transition") return beginWork(next);
      if (session.phase === "work") {
        const completedSetIds = session.completedSetIds.includes(setKey(session))
          ? session.completedSetIds
          : [...session.completedSetIds, setKey(session)];
        return advance({ ...next, completedSetIds });
      }
      return next;
    }
    case "complete-set": {
      // A rest/transition tap or voice command must never credit the NEXT set.
      if (session.phase !== "work") return session;
      const completedSetIds = session.completedSetIds.includes(setKey(session))
        ? session.completedSetIds
        : [...session.completedSetIds, setKey(session)];
      return advance({ ...session, completedSetIds });
    }
    case "next":
      return advance(session);
    case "reset":
      return createV2Session(action.workout);
  }
}
