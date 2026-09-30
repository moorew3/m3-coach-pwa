import { Camera, CameraOff, RefreshCw, ScanEye } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  attachVideo, cameraSupported, setCalibrating, setPattern, startCamera,
  stopCamera, useCamera,
} from "@/lib/vision/camera";
import { patternFor } from "@/lib/vision/patterns";
import { KickTracker, type KickKind, type KickSnapshot } from "./kick-tracker";
import { BoxingFormTracker, type BoxingDrill, type BoxingSnapshot, type BoxingStance } from "./boxing-form";
import type { V2Mode, V2Session } from "./types";

const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [24, 26], [23, 25],
  [25, 27], [26, 28],
];
type Props = {
  session: V2Session;
  onCue: (cue: string) => void;
  onRepCapture: (reps: number) => void;
  stance: BoxingStance;
};

export function V2TrainingCamera({ session, onCue, onRepCapture, stance }: Props) {
  const cam = useCamera();
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const kickTracker = useRef<KickTracker | null>(null);
  const boxTracker = useRef<BoxingFormTracker | null>(null);
  const [kick, setKick] = useState<KickSnapshot | null>(null);
  const [box, setBox] = useState<BoxingSnapshot | null>(null);

  const exercise = session.workout.exercises[session.exerciseIndex];
  const motionKey = exercise?.motionKey ?? "";
  const kickKind: KickKind | null =
    motionKey === "frontKick" || motionKey === "roundKick" ? motionKey : null;
  const boxingKeys: BoxingDrill[] = [
    "boxingStance", "jab", "cross", "jabCross",
    "boxingCombination", "defensiveReset", "guardReset",
  ];
  const boxingDrill = boxingKeys.find((key) => key === motionKey) ?? null;
  // Stationary knee-chamber work needs its own dedicated tracking; do not
  // manufacture punch reps during it.
  const nonRepTechnique = new Set([
    "kneeChamber",
  ]);
  const pattern =
    kickKind || boxingDrill || nonRepTechnique.has(motionKey)
      ? null
      : patternFor(motionKey) ?? patternFor(exercise?.id);
  const supported = typeof window !== "undefined" && cameraSupported();
  const isOn = cam.status === "live" || cam.status === "loading" || cam.status === "starting";
  const live = cam.status === "live";
  const judge = live && cam.calibration.ready && !cam.calibrating;
  const manual = session.mode === "manual";
  const visible = manual || session.mode === "coach" || session.mode === "shadow";

  useEffect(() => {
    attachVideo(video.current);
    return () => {
      attachVideo(null);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    kickTracker.current = kickKind ? new KickTracker(kickKind) : null;
    boxTracker.current = boxingDrill ? new BoxingFormTracker(boxingDrill, stance) : null;
    setKick(null);
    setBox(null);
    if (cam.status === "live") setPattern(pattern);
  }, [kickKind, boxingDrill, stance, motionKey, pattern, cam.status, session.setIndex]);

  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    if (video.current?.videoWidth && video.current.videoHeight &&
        (c.width !== video.current.videoWidth || c.height !== video.current.videoHeight)) {
      c.width = video.current.videoWidth;
      c.height = video.current.videoHeight;
    }
    ctx.clearRect(0, 0, c.width, c.height);
    if (!cam.landmarks || !live) return;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(94,231,243,.9)";
    for (const [a, b] of BONES) {
      const p = cam.landmarks[a];
      const q = cam.landmarks[b];
      if (!p || !q || Math.min(p.visibility ?? 1, q.visibility ?? 1) < 0.5) continue;
      ctx.beginPath();
      ctx.moveTo(p.x * c.width, p.y * c.height);
      ctx.lineTo(q.x * c.width, q.y * c.height);
      ctx.stroke();
    }
  }, [cam.landmarks, live]);

  useEffect(() => {
    if (!kickTracker.current || !judge || !session.running || session.phase !== "work") return;
    const result = kickTracker.current.update(cam.landmarks);
    setKick(result);
    if (result.cue) onCue(result.cue);
  }, [cam.landmarks, judge, session.running, session.phase, onCue]);

  useEffect(() => {
    if (!boxTracker.current || !judge || !session.running || session.phase !== "work") return;
    const result = boxTracker.current.update(cam.landmarks);
    setBox(result);
    if (result.cue) onCue(result.cue);
  }, [cam.landmarks, judge, session.running, session.phase, onCue]);

  useEffect(() => {
    if (!judge || !session.running || session.phase !== "work" || kickKind || boxingDrill) return;
    if (cam.metrics?.cue) onCue(cam.metrics.cue);
  }, [cam.metrics?.cue, judge, session.running, session.phase, kickKind, boxingDrill, onCue]);

  const reps = boxingDrill ? (box?.leadPunches ?? 0) + (box?.rearPunches ?? 0) :
    kickKind ? kick?.reps ?? 0 : cam.metrics?.reps ?? 0;
  const confidence = boxingDrill ? box?.confidence ?? 0 :
    kickKind ? kick?.confidence ?? 0 : cam.metrics?.confidence ?? 0;
  const canReport = judge && (boxingDrill ? box !== null :
    kickKind ? kick !== null : pattern !== null) &&
    confidence >= (boxingDrill ? 0.65 : 0.55);

  return (
    <div
      className={
        manual
          ? "absolute inset-0 z-[2] overflow-hidden bg-[#060b10]"
          : visible && isOn
            ? "absolute bottom-[94px] right-3 z-[6] h-[198px] w-[47%] max-w-[270px] overflow-hidden rounded-2xl border-2 border-cyan-300/60 bg-black shadow-2xl sm:h-[220px]"
            : "absolute bottom-[94px] right-3 z-[6]"
      }
      data-testid="v2-camera-tracker"
      data-camera-status={cam.status}
    >
      {/* The video stays mounted even while hidden: one shared MediaPipe stream. */}
      <video
        ref={video}
        muted
        playsInline
        autoPlay
        className={
          visible && isOn
            ? "absolute inset-0 h-full w-full -scale-x-100 object-contain"
            : "pointer-events-none absolute size-px opacity-0"
        }
      />
      <canvas
        ref={canvas}
        width={640}
        height={480}
        className={
          visible && isOn
            ? "pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-contain"
            : "pointer-events-none absolute size-px opacity-0"
        }
      />

      {visible && !isOn && (
        <div className={manual ? "absolute inset-0 grid place-items-center p-5" : ""}>
          <div className={manual ? "max-w-sm text-center" : ""}>
            {manual && (
              <>
                <ScanEye className="mx-auto mb-3 size-9 text-cyan-300" />
                <p className="text-xl font-black">Coach-eye tracking</p>
                <p className="mt-2 text-sm text-white/60">
                  Stand where the camera can see your whole body. Your video stays on this device.
                </p>
              </>
            )}
            <button
              type="button"
              disabled={!supported}
              onClick={() => void startCamera(pattern)}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black uppercase text-black disabled:opacity-50"
            >
              <Camera className="size-4" />
              {cam.status === "denied" ? "Allow camera, then retry" : "Enable movement tracking"}
            </button>
            {cam.error && <p className="mt-2 text-xs text-amber-300">{cam.error}</p>}
          </div>
        </div>
      )}

      {visible && isOn && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-2 pb-2 pt-6">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-black uppercase text-cyan-200">
                {cam.calibrating ? "Camera setup" : canReport ? "Live tracking" : "Reposition camera"}
              </p>
              <p className="text-[10px] leading-snug text-white/75">
                {cam.calibrating || !cam.calibration.ready
                  ? cam.calibration.prompt
                  : canReport
                    ? boxingDrill && box
                      ? `${box.leadPunches} lead · ${box.rearPunches} rear · ${box.combinations} 1–2 combos · ${box.stance}`
                      : `${reps} reps · ${Math.round(confidence * 100)}% visibility`
                    : boxingDrill
                      ? "Show both hands and face to track your stance and complete punch returns"
                      : kickKind
                      ? "Kicks: full body required"
                      : pattern
                        ? "Move into frame"
                        : "Camera active; no reliable analyzer for this exercise"}
              </p>
            </div>
            <button
              type="button"
              onClick={stopCamera}
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-black/60"
              aria-label="Stop movement tracking"
            >
              <CameraOff className="size-4" />
            </button>
          </div>
          {cam.calibrating && cam.calibration.ready && (
            <button
              type="button"
              onClick={() => setCalibrating(false)}
              className="mt-2 min-h-9 w-full rounded-lg bg-cyan-300 text-xs font-black text-black"
            >
              Start tracking
            </button>
          )}
          {manual && canReport && exercise?.category === "strength" && (
            <button
              type="button"
              onClick={() => onRepCapture(reps)}
              className="mt-2 min-h-9 w-full rounded-lg border border-cyan-300/50 bg-black/70 text-xs font-black text-cyan-200"
            >
              Use {reps} camera reps for this set
            </button>
          )}
          {kickKind && kick?.note && manual && (
            <p className="mt-2 text-[10px] text-amber-200">{kick.note}</p>
          )}
          {boxingDrill && box?.lastCorrection && (
            <p className="mt-1 text-[10px] leading-snug text-amber-200">{box.lastCorrection}</p>
          )}
          {boxingDrill && manual && box?.note && (
            <p className="mt-1 text-[10px] leading-snug text-white/60">{box.note}</p>
          )}
        </div>
      )}
      {visible && cam.status === "loading" && (
        <div className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-[10px]">
          <RefreshCw className="mr-1 inline size-3 animate-spin" />
          Loading on-device tracker
        </div>
      )}
    </div>
  );
}
