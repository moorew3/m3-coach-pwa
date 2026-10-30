import { viewpointFor } from "./catalog";
import type { V2SceneState, V2Session } from "./types";

export type CameraPose = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
};

export type SceneContract = {
  gymId: "m3-gym-v2";
  camera: CameraPose;
  coachAnchor: [number, number, number];
  athleteAnchor: [number, number, number];
  equipmentAnchor: [number, number, number];
  showCoach: boolean;
  showAthleteCamera: boolean;
  motionKey: string;
};

const CAMERAS: Record<string, CameraPose> = {
  "trainer-facing": { position: [0, 1.65, 4.8], target: [0, 1.45, 0], fov: 42 },
  "coach-eye": { position: [0, 1.7, -0.35], target: [0, 1.35, 3.2], fov: 48 },
  "follow-along": { position: [0, 1.6, 5.6], target: [0, 1.45, 0], fov: 46 },
  "first-person": { position: [0, 1.68, 2.65], target: [0, 1.48, -1.2], fov: 54 },
};

export function sceneStateFor(session: V2Session): V2SceneState {
  return {
    viewpoint: viewpointFor(session.mode),
    currentExercise: session.workout.exercises[session.exerciseIndex],
    phase: session.phase,
    running: session.running,
  };
}

export function sceneContractFor(session: V2Session): SceneContract {
  const scene = sceneStateFor(session);
  return {
    gymId: "m3-gym-v2",
    camera: CAMERAS[scene.viewpoint.camera],
    coachAnchor: [0, 0, 0],
    athleteAnchor: [0, 0, 3.1],
    equipmentAnchor: [0, 0, 0],
    showCoach: scene.viewpoint.showCoach,
    showAthleteCamera: scene.viewpoint.showAthleteCamera,
    motionKey: scene.currentExercise?.motionKey ?? "idle",
  };
}
