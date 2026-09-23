/**
 * CAMERA COACH
 * ------------------------------------------------------------------
 * The on-screen half of camera coaching: the live preview, the
 * skeleton overlay, the set-up checks and the honest read-out of what
 * the app can and cannot see right now.
 *
 * Nothing here records or uploads anything — the picture never leaves
 * the phone.
 */
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
  Hand,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  RefreshCw,
} from "lucide-react";
import {
  attachVideo,
  cameraSupported,
  setCalibrating,
  setGesturesOn,
  setOverlayOn,
  setPattern,
  startCamera,
  stopCamera,
  useCamera,
} from "@/lib/vision/camera";
import { GESTURE_LABEL, type GestureId } from "@/lib/vision/gestures";
import { PATTERN_LABEL, type PatternId } from "@/lib/vision/patterns";

const BONES: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const PHASE_LABEL: Record<string, string> = {
  idle: "Waiting",
  top: "Top",
  lowering: "Lowering",
  bottom: "Bottom",
  rising: "Rising",
};

export function CameraCoach({
  pattern,
  exerciseName,
  voiceOn,
  onVoiceToggle,
  onChangeWorkout,
  setupPending,
  onSetupComplete,
}: {
  pattern: PatternId | null;
  exerciseName?: string;
  voiceOn?: boolean;
  onVoiceToggle?: () => void;
  onChangeWorkout?: () => void;
  setupPending?: boolean;
  onSetupComplete?: () => void;
}) {
  const cam = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => setReady(true), []);
  useEffect(() => {
    attachVideo(videoRef.current);
    return () => attachVideo(null);
  }, []);
  useEffect(() => {
    if (cam.status === "live") setPattern(pattern);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern]);
  useEffect(() => () => stopCamera(), []);

  /* skeleton overlay — cheap 2D strokes, redrawn only when landmarks change */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    if (!cam.overlayOn || !cam.landmarks) return;
    const lm = cam.landmarks;
    ctx.strokeStyle = "rgba(56,220,255,0.9)";
    ctx.lineWidth = 3;
    BONES.forEach(([a, b]) => {
      const p = lm[a];
      const q = lm[b];
      if (!p || !q) return;
      ctx.beginPath();
      ctx.moveTo(p.x * c.width, p.y * c.height);
      ctx.lineTo(q.x * c.width, q.y * c.height);
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(255,209,102,0.95)";
    lm.forEach((p, i) => {
      if (i > 28) return;
      ctx.beginPath();
      ctx.arc(p.x * c.width, p.y * c.height, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [cam.landmarks, cam.overlayOn]);

  const on = cam.status === "live" || cam.status === "loading" || cam.status === "starting";
  const conf = cam.metrics?.confidence ?? 0;
  const canJudge = cam.status === "live" && conf >= 0.55 && cam.calibration.lowerVisible;

  const supported = !ready || cameraSupported();
  const statusLabel =
    cam.status === "live"
      ? "Live tracking"
      : cam.status === "loading"
        ? "Loading tracker"
        : cam.status === "starting"
          ? "Starting camera"
          : cam.status === "denied"
            ? "Permission needed"
            : cam.status === "error"
              ? "Camera error"
              : supported
                ? "Camera ready"
                : "Not supported";
  const gestureStatus = cam.lastGesture
    ? `Last gesture: ${GESTURE_LABEL[cam.lastGesture as GestureId].split(" — ")[0]}`
    : cam.gestureSeen
      ? `Seeing: ${cam.gestureSeen}`
      : cam.gesturesOn
        ? cam.status === "live"
          ? "Gestures ready — hold a sign briefly"
          : "Gestures ready when camera starts"
        : "Gesture control is off";

  const toggleCamera = () => {
    if (on) {
      stopCamera();
      return;
    }
    setExpanded(true);
    void startCamera(pattern);
  };

  const btn = setupPending ? "min-h-14 text-sm" : "min-h-12 text-[10px] leading-tight";

  return (
    <section
      className="surface-card mt-3 rounded-2xl p-3 sm:p-4"
      data-testid="camera-coach-controls"
    >
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-primary">
          {setupPending ? "Today’s setup" : "This session"}
        </p>
        {setupPending && (
          <p className="mt-1 text-sm font-bold">
            Want me to watch your form? Want hands-free gestures? Following today’s workout, or
            changing it?
          </p>
        )}
      </div>

      <div className={`grid gap-2 ${setupPending ? "grid-cols-2" : "grid-cols-4"}`}>
        <button
          type="button"
          onClick={toggleCamera}
          aria-pressed={on}
          disabled={!supported}
          className={`flex items-center justify-center gap-1 rounded-xl px-1 text-center font-black uppercase disabled:opacity-50 ${btn} ${
            on ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {on ? <CameraOff className="size-4 shrink-0" /> : <Camera className="size-4 shrink-0" />}
          {on ? "Camera off" : "Camera on"}
        </button>
        <button
          type="button"
          onClick={() => setGesturesOn(!cam.gesturesOn)}
          aria-pressed={cam.gesturesOn}
          className={`flex items-center justify-center gap-1 rounded-xl px-1 text-center font-black uppercase ${btn} ${
            cam.gesturesOn ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground"
          }`}
        >
          <Hand className="size-4 shrink-0" /> Gestures {cam.gesturesOn ? "on" : "off"}
        </button>
        {onVoiceToggle && onChangeWorkout && (
          <>
            <button
              type="button"
              onClick={onVoiceToggle}
              aria-pressed={voiceOn}
              className={`flex items-center justify-center gap-1 rounded-xl px-1 text-center font-black uppercase ${btn} ${voiceOn ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground"}`}
            >
              {voiceOn ? (
                <Volume2 className="size-4 shrink-0" />
              ) : (
                <VolumeX className="size-4 shrink-0" />
              )}
              Voice {voiceOn ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={onChangeWorkout}
              className={`flex items-center justify-center gap-1 rounded-xl bg-accent/15 px-1 text-center font-black uppercase text-accent ${btn}`}
            >
              <RefreshCw className="size-4 shrink-0" /> Change workout
            </button>
          </>
        )}
      </div>
      {setupPending && onSetupComplete && (
        <button
          type="button"
          onClick={onSetupComplete}
          className="mt-2 min-h-12 w-full rounded-xl bg-primary text-sm font-black uppercase text-primary-foreground"
        >
          Continue with these choices
        </button>
      )}

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl bg-elevated px-3 py-1.5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-bold uppercase text-foreground">
            <span
              className={`size-2.5 shrink-0 rounded-full ${cam.status === "live" ? "animate-pulse bg-destructive" : "bg-muted-foreground"}`}
            />
            {statusLabel}
          </p>
          <p
            className="truncate text-[11px] font-semibold text-muted-foreground"
            aria-live="polite"
          >
            {gestureStatus}
          </p>
        </div>
        <p className="shrink-0 text-right text-[11px] font-bold uppercase text-muted-foreground">
          Confidence
          <span className="block text-sm tabular-nums text-primary">
            {cam.status === "live" ? `${Math.round(conf * 100)}%` : "—"}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-bold"
      >
        {expanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        {expanded ? "Hide tracking details" : "Tracking details"}
      </button>

      <div className={expanded ? "" : "hidden"} data-testid="camera-coach-details">
        {!supported && (
          <p className="mt-3 text-xs font-semibold text-accent">
            This browser can't use the camera for movement tracking. Voice control and workout
            buttons still work normally.
          </p>
        )}
        {cam.error && <p className="mt-2 text-xs font-semibold text-accent">{cam.error}</p>}
        {cam.status === "loading" && (
          <p className="mt-2 text-xs text-muted-foreground">Loading the movement model…</p>
        )}

        <div className={`relative mt-3 overflow-hidden rounded-xl bg-black ${on ? "" : "hidden"}`}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-56 w-full -scale-x-100 object-cover sm:h-72"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="pointer-events-none absolute inset-0 h-full w-full -scale-x-100"
          />
          {cam.calibrating && (
            <div className="absolute inset-x-0 bottom-0 bg-background/85 p-3">
              <p className="text-sm font-bold">{cam.calibration.prompt}</p>
              <ul className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                {(
                  [
                    ["Head & torso", cam.calibration.bodyVisible],
                    ["Knees & ankles", cam.calibration.lowerVisible],
                    ["Distance", cam.calibration.farEnough],
                    ["Phone upright", cam.calibration.upright],
                    ["Lighting", cam.calibration.bright],
                  ] as [string, boolean][]
                ).map(([label, ok]) => (
                  <li key={label} className={ok ? "text-primary" : "text-muted-foreground"}>
                    {ok ? "✓" : "•"} {label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setCalibrating(false)}
                disabled={!cam.calibration.ready}
                className="tap-target mt-2 w-full rounded-xl bg-primary text-xs font-bold uppercase text-primary-foreground disabled:opacity-40"
              >
                {cam.calibration.ready ? "Start tracking" : "Line yourself up"}
              </button>
              <button
                type="button"
                onClick={() => setCalibrating(false)}
                className="mt-1 w-full text-[11px] uppercase text-muted-foreground"
              >
                Skip the check
              </button>
            </div>
          )}
        </div>

        {cam.status === "live" && !cam.calibrating && (
          <>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                ["Reps", canJudge ? String(cam.metrics?.reps ?? 0) : "–"],
                ["Phase", canJudge ? PHASE_LABEL[cam.metrics?.phase ?? "idle"] : "–"],
                ["ROM", canJudge && cam.metrics?.rom ? `${cam.metrics.rom}°` : "–"],
                ["Tempo", canJudge && cam.metrics?.tempoDown ? `${cam.metrics.tempoDown}s` : "–"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-elevated py-2">
                  <p className="text-lg font-black tabular-nums text-primary">{v}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
                </div>
              ))}
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground">
              {pattern ? PATTERN_LABEL[pattern] : `No analyser for ${exerciseName ?? "this move"}`}{" "}
              · confidence {Math.round(conf * 100)}%
              {cam.metrics?.symmetry !== null && cam.metrics?.symmetry !== undefined
                ? ` · symmetry ${Math.round(cam.metrics.symmetry * 100)}%`
                : ""}{" "}
              · {cam.fps} fps
            </p>
            {!canJudge && (
              <p className="mt-1 text-xs font-semibold text-accent">
                I can't see enough of you to judge this movement — no form feedback until I can.
              </p>
            )}
            {canJudge && cam.metrics?.cues[0] && (
              <p className="mt-1 text-sm font-bold text-primary">{cam.metrics.cues[0]}</p>
            )}
          </>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setOverlayOn(!cam.overlayOn)}
            aria-pressed={cam.overlayOn}
            className={`flex min-h-10 items-center justify-center gap-1 rounded-xl text-[11px] font-bold uppercase ${
              cam.overlayOn ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground"
            }`}
          >
            {cam.overlayOn ? <Eye className="size-4" /> : <EyeOff className="size-4" />} Skeleton
          </button>
          <button
            type="button"
            onClick={() => setCalibrating(true)}
            disabled={cam.status !== "live"}
            className="min-h-10 rounded-xl bg-elevated text-[11px] font-bold uppercase disabled:opacity-40"
          >
            Re-check setup
          </button>
        </div>

        <p className="mt-2 text-[11px] font-semibold text-foreground" aria-live="polite">
          {cam.lastGesture
            ? `Gesture recognised: ${GESTURE_LABEL[cam.lastGesture as GestureId].split(" — ")[0]}`
            : cam.gestureSeen
              ? `Seeing: ${cam.gestureSeen}`
              : cam.gesturesOn && cam.status === "live"
                ? "Hold a gesture for a moment to trigger it."
                : ""}
        </p>
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] uppercase text-muted-foreground">
            Gestures I understand
          </summary>
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            {Object.values(GESTURE_LABEL).map((g) => (
              <li key={g}>• {g}</li>
            ))}
          </ul>
        </details>
        <p className="mt-2 text-[10px] text-muted-foreground">
          The picture is processed on this phone and never saved or sent anywhere.
        </p>
      </div>
    </section>
  );
}