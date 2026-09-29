import type { V2Mode, V2Session, V2Workout } from "./types";

export type V2Action =
  | { type: "set-mode"; mode: V2Mode }
  | { type: "start" }
  | { type: "pause" }
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
    phaseSecondsLeft: null,
    running: false,
    completedSetIds: [],
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
    phaseSecondsLeft: exercise?.seconds ?? null,
  };
}

function advance(session: V2Session): V2Session {
  const exercise = session.workout.exercises[session.exerciseIndex];
  if (!exercise) return { ...session, phase: "complete", running: false };

  if (session.setIndex + 1 < exercise.sets) {
    return {
      ...session,
      phase: exercise.restSeconds ? "rest" : "work",
      setIndex: session.setIndex + 1,
      phaseSecondsLeft: exercise.restSeconds || exercise.seconds || null,
      running: true,
    };
  }

  if (session.exerciseIndex + 1 < session.workout.exercises.length) {
    return {
      ...session,
      phase: "transition",
      exerciseIndex: session.exerciseIndex + 1,
      setIndex: 0,
      phaseSecondsLeft: 8,
      running: true,
    };
  }

  return { ...session, phase: "complete", running: false, phaseSecondsLeft: null };
}

export function v2SessionReducer(session: V2Session, action: V2Action): V2Session {
  switch (action.type) {
    case "set-mode":
      return { ...session, mode: action.mode };
    case "start":
      return session.phase === "ready" ? beginWork(session) : { ...session, running: true };
    case "pause":
      return { ...session, running: false };
    case "tick": {
      if (!session.running) return session;
      const next = { ...session, elapsedSeconds: session.elapsedSeconds + 1 };
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
