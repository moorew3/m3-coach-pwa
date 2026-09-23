/**
 * CAMERA ENGINE
 * ------------------------------------------------------------------
 * One shared camera + MediaPipe runtime for the whole app.
 *
 * Privacy: everything runs on the device. Frames go from the camera
 * straight into the local model and are thrown away. Nothing is
 * recorded, stored or uploaded, ever.
 *
 * Performance: pose runs on a throttled interval (default ~12 fps) and
 * gestures at half that, both inside requestAnimationFrame so the UI
 * and the coach audio thread are never blocked. If the device cannot
 * keep up, the loop simply skips frames.
 */
import { MoveAnalyzer, emptyMetrics, type LM, type MoveMetrics } from "./analysis";
import { GestureReader, type GestureId } from "./gestures";
import type { PatternId } from "./patterns";

const WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const POSE_MODEL = "/models/pose_landmarker_lite.task";
const GESTURE_MODEL = "/models/gesture_recognizer.task";

export type CamStatus =
  | "off"
  | "starting"
  | "loading"
  | "live"
  | "denied"
  | "unsupported"
  | "error";

export interface Calibration {
  bodyVisible: boolean;
  upperVisible: boolean;
  lowerVisible: boolean;
  farEnough: boolean;
  upright: boolean;
  bright: boolean;
  ready: boolean;
  prompt: string;
}

export interface CamState {
  status: CamStatus;
  error: string | null;
  /** Live landmark set for the overlay (normalised 0–1). */
  landmarks: LM[] | null;
  metrics: MoveMetrics | null;
  pattern: PatternId | null;
  calibration: Calibration;
  calibrating: boolean;
  gesturesOn: boolean;
  overlayOn: boolean;
  /** Last recognised hand shape, e.g. "thumbs up". */
  gestureSeen: string | null;
  lastGesture: GestureId | null;
  lastGestureAt: number;
  fps: number;
}

const blankCal: Calibration = {
  bodyVisible: false,
  upperVisible: false,
  lowerVisible: false,
  farEnough: false,
  upright: false,
  bright: false,
  ready: false,
  prompt: "Turn the camera on so I can see you.",
};

const initial: CamState = {
  status: "off",
  error: null,
  landmarks: null,
  metrics: null,
  pattern: null,
  calibration: blankCal,
  calibrating: false,
  gesturesOn: true,
  overlayOn: true,
  gestureSeen: null,
  lastGesture: null,
  lastGestureAt: 0,
  fps: 0,
};

let cam: CamState = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<CamState>) => {
  cam = { ...cam, ...patch };
  emit();
};

let video: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let pose: {
  detectForVideo: (v: HTMLVideoElement, t: number) => unknown;
  close?: () => void;
} | null = null;
let hands: {
  recognizeForVideo: (v: HTMLVideoElement, t: number) => unknown;
  close?: () => void;
} | null = null;
let raf = 0;
let analyzer: MoveAnalyzer | null = null;
const reader = new GestureReader();
let onGesture: ((g: GestureId) => void) | null = null;
let onCue: ((cue: string, m: MoveMetrics) => void) | null = null;

export function setGestureHandler(fn: ((g: GestureId) => void) | null) {
  onGesture = fn;
}
export function setCueHandler(fn: ((cue: string, m: MoveMetrics) => void) | null) {
  onCue = fn;
}

export function cameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof WebAssembly === "object"
  );
}

/** Attach the <video> the component renders (also used as the model input). */
export function attachVideo(el: HTMLVideoElement | null) {
  video = el;
  if (el && stream) el.srcObject = stream;
}

/* ------------------------------ calibration ----------------------------- */

const v = (l?: LM) => (l ? (l.visibility ?? 1) : 0);

function calibrate(lm: LM[] | null): Calibration {
  if (!lm || lm.length < 29)
    return { ...blankCal, prompt: "Step into frame — I can't see you yet." };
  const upper = (v(lm[11]) + v(lm[12]) + v(lm[13]) + v(lm[14])) / 4 > 0.6;
  const lower = (v(lm[25]) + v(lm[26]) + v(lm[27]) + v(lm[28])) / 4 > 0.5;
  const head = v(lm[0]) > 0.5;
  const top = Math.min(lm[11].y, lm[12].y);
  const bottom = Math.max(lm[27]?.y ?? 1, lm[28]?.y ?? 1);
  const height = bottom - top;
  const farEnough = height < 0.92 && height > 0.25;
  const shoulderTilt = Math.abs(lm[11].y - lm[12].y);
  const upright = shoulderTilt < 0.12;
  const bright = (v(lm[0]) + v(lm[11]) + v(lm[12])) / 3 > 0.5;

  const prompt = !head
    ? "Point the camera a little higher — I need your head in frame."
    : !lower
      ? "Step back so I can see your knees and ankles."
      : !farEnough
        ? height >= 0.92
          ? "Step back a bit — you're filling the whole frame."
          : "Come closer, you're too far away."
        : !upright
          ? "Stand the phone upright and square to you."
          : !bright
            ? "It's a bit dark — add some light in front of you."
            : "Perfect. I can see you.";

  const ready = head && upper && lower && farEnough && upright && bright;
  return {
    bodyVisible: head && upper,
    upperVisible: upper,
    lowerVisible: lower,
    farEnough,
    upright,
    bright,
    ready,
    prompt,
  };
}

/* -------------------------------- runtime ------------------------------- */

async function build() {
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
  /* GPU where the device allows it, CPU everywhere else — never fail hard */
  const make = async (delegate: "GPU" | "CPU") => {
    pose = (await vision.PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: POSE_MODEL, delegate },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })) as unknown as typeof pose;
    hands = (await vision.GestureRecognizer.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: GESTURE_MODEL, delegate },
      runningMode: "VIDEO",
      numHands: 1,
    })) as unknown as typeof hands;
  };
  try {
    await make("GPU");
  } catch {
    await make("CPU");
  }
}

interface PoseOut {
  landmarks?: LM[][];
}
interface HandOut {
  gestures?: { categoryName: string; score: number }[][];
  landmarks?: LM[][];
}

export async function startCamera(pattern: PatternId | null) {
  if (cam.status === "live" || cam.status === "starting" || cam.status === "loading") return;
  if (!cameraSupported()) {
    set({ status: "unsupported", error: "This browser can't use the camera for tracking." });
    return;
  }
  set({ status: "starting", error: null, calibrating: true });
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  } catch (e) {
    const denied = (e as DOMException)?.name === "NotAllowedError";
    set({
      status: denied ? "denied" : "error",
      error: denied
        ? "Camera permission was declined — voice and buttons still run the whole session."
        : "That camera couldn't be opened. Carry on with voice and buttons.",
    });
    return;
  }
  if (video) {
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      /* autoplay guard — the loop retries */
    }
  }
  set({ status: "loading" });
  try {
    await build();
  } catch {
    stopCamera();
    set({
      status: "error",
      error: "The movement model couldn't load on this device. Voice and buttons still work.",
    });
    return;
  }
  analyzer = pattern ? new MoveAnalyzer(pattern) : null;
  set({ status: "live", pattern, metrics: pattern ? emptyMetrics(pattern) : null });
  loop();
}

export function stopCamera() {
  cancelAnimationFrame(raf);
  raf = 0;
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  if (video) video.srcObject = null;
  pose?.close?.();
  hands?.close?.();
  pose = null;
  hands = null;
  analyzer = null;
  reader.reset();
  set({
    status: "off",
    landmarks: null,
    metrics: null,
    calibration: blankCal,
    calibrating: false,
    gestureSeen: null,
  });
}

export function setPattern(pattern: PatternId | null) {
  analyzer = pattern ? new MoveAnalyzer(pattern) : null;
  set({ pattern, metrics: pattern ? emptyMetrics(pattern) : null });
}

/** Start a fresh rep count (called at the start of each set). */
export function resetReps() {
  if (cam.pattern) setPattern(cam.pattern);
}

export function setGesturesOn(on: boolean) {
  set({ gesturesOn: on });
}
export function setOverlayOn(on: boolean) {
  set({ overlayOn: on });
}
export function setCalibrating(on: boolean) {
  set({ calibrating: on });
}

/** Snapshot of the current set's tracking, for the workout record. */
export function metricsSnapshot(): MoveMetrics | null {
  return cam.metrics && cam.metrics.confidence > 0 ? cam.metrics : null;
}

const POSE_EVERY = 80; // ms  → ~12 fps
const HAND_EVERY = 160; // ms → ~6 fps
let lastPose = 0;
let lastHand = 0;
let frames = 0;
let fpsAt = 0;

function loop() {
  raf = requestAnimationFrame(loop);
  const el = video;
  if (!el || el.readyState < 2) return;
  const now = performance.now();
  const wall = Date.now();

  if (pose && now - lastPose >= POSE_EVERY) {
    lastPose = now;
    let out: PoseOut | null = null;
    try {
      out = pose.detectForVideo(el, now) as PoseOut;
    } catch {
      return;
    }
    const lm = out?.landmarks?.[0] ?? null;
    frames += 1;
    if (now - fpsAt > 1000) {
      set({ fps: Math.round((frames * 1000) / (now - fpsAt)) });
      frames = 0;
      fpsAt = now;
    }
    const cal = calibrate(lm);
    const metrics = analyzer ? analyzer.push(lm, wall) : null;
    set({ landmarks: lm, calibration: cal, metrics });
    if (metrics?.cue && !cam.calibrating) onCue?.(metrics.cue, metrics);
  }

  if (hands && cam.gesturesOn && !cam.calibrating && now - lastHand >= HAND_EVERY) {
    lastHand = now;
    let out: HandOut | null = null;
    try {
      out = hands.recognizeForVideo(el, now) as HandOut;
    } catch {
      return;
    }
    const top = out?.gestures?.[0]?.[0];
    const name = top && top.score > 0.6 ? top.categoryName : null;
    const wrist = out?.landmarks?.[0]?.[0]?.x ?? null;
    const fired = reader.read(name, wrist, wall);
    if (reader.seen !== cam.gestureSeen) set({ gestureSeen: reader.seen });
    if (fired) {
      set({ lastGesture: fired, lastGestureAt: wall });
      onGesture?.(fired);
    }
  }
}

/* --------------------------------- react -------------------------------- */

import { useSyncExternalStore } from "react";

export function useCamera(): CamState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cam,
    () => initial,
  );
}