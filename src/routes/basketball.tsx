/**
 * Live basketball form lab inside original M3 FLEX.
 * This is NOT a prerecorded workout, a make/miss detector, or an injury assessment.
 * Uses the same on-device MediaPipe camera engine used by V2 (no duplicate model).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, ChevronLeft, RotateCcw, ScanEye } from "lucide-react";
import {
  attachVideo, cameraSupported, setCameraFraming, startCamera, stopCamera, useCamera,
} from "@/lib/vision/camera";
import {
  BasketballReleaseTracker, type ShootingArm, type ShootingSnapshot,
} from "@/lib/vision/basketball-release";

export const Route = createFileRoute("/basketball")({
  head: () => ({
    meta: [
      { title: "M3 FLEX · Live Basketball Technique" },
      { name: "description", content: "Private camera-based seated shooting-arm mechanics feedback." },
    ],
  }),
  component: BasketballTechnique,
});

function BasketballTechnique() {
  const cam = useCamera();
  const video = useRef<HTMLVideoElement>(null);
  const [arm, setArm] = useState<ShootingArm>("right");
  const tracker = useRef(new BasketballReleaseTracker("right"));
  const [sample, setSample] = useState<ShootingSnapshot>(() => tracker.current.push(null));
  const [message, setMessage] = useState("");
  const live = cam.status === "live";

  useEffect(() => {
    attachVideo(video.current);
    return () => { attachVideo(null); stopCamera(); };
  }, []);
  useEffect(() => {
    tracker.current = new BasketballReleaseTracker(arm);
    setSample(tracker.current.push(null));
    setMessage("");
  }, [arm]);
  useEffect(() => {
    if (live) {
      const result = tracker.current.push(cam.landmarks);
      setSample(result);
      if (result.cue) setMessage(result.cue);
    }
  }, [cam.landmarks, live]);
  const start = async () => {
    setCameraFraming("upper");
    setMessage("Starting your private on-device camera analysis…");
    await startCamera(null);
  };
  const reset = () => {
    tracker.current.reset();
    setSample(tracker.current.push(null));
    setMessage("Drill reset. Start from your seated set position.");
  };

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 pb-24 pt-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
        <ChevronLeft className="size-4" /> M3 FLEX home
      </Link>
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-primary">Basketball · live camera training</p>
        <h1 className="mt-1 text-3xl font-black">Seated shooting-arm mechanics</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Marcus's existing camera system measures visible elbow extension while your
          injured left leg remains unloaded. It cannot track the ball, shot arc, hoop,
          made baskets, or real footwork. No recording or upload is performed.
        </p>
      </header>
      <section className="surface-card space-y-3 rounded-2xl p-4">
        <label className="block text-sm font-bold" htmlFor="basketball-arm">Shooting arm</label>
        <select id="basketball-arm" value={arm}
          onChange={(e) => setArm(e.target.value as ShootingArm)}
          className="tap-target w-full rounded-xl border border-input bg-elevated px-3">
          <option value="right">Right arm</option>
          <option value="left">Left arm</option>
        </select>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
          <video ref={video} autoPlay playsInline muted
            className="h-full w-full -scale-x-100 object-contain" />
          {!live && (
            <div className="absolute inset-0 grid place-items-center bg-black/85 p-4 text-center text-white">
              <div>
                <ScanEye className="mx-auto size-10 text-cyan-300" />
                <p className="mt-3 font-bold">{cam.status === "denied" ? "Allow camera access, then retry" :
                  cam.status === "loading" ? "Preparing movement model…" : "Camera is off"}</p>
                <p className="mt-2 max-w-sm text-sm text-white/60">
                  Sit facing the phone so your shooting shoulder, elbow, and wrist are visible.
                  Camera processing stays on this device.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!cameraSupported()}
            onClick={() => void start()}
            className="tap-target inline-flex items-center gap-2 rounded-lg bg-primary px-4 text-xs font-black text-primary-foreground disabled:opacity-40">
            <Camera className="size-4" /> {live ? "Camera running" : "Start tracking"}
          </button>
          <button type="button" onClick={stopCamera}
            className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold">
            <CameraOff className="size-4" /> Stop camera
          </button>
          <button type="button" onClick={reset}
            className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold">
            <RotateCcw className="size-4" /> Reset drill
          </button>
        </div>
        {cam.error && <p className="text-xs text-amber-500">{cam.error}</p>}
        {!cameraSupported() && <p className="text-xs text-amber-500">Camera/pose tracking is not available in this browser.</p>}
        <p className="text-xs text-muted-foreground">
          No live Marcus voice is substituted. Spoken 3D teaching requires the approved rig and audio integration.
        </p>
      </section>
      <section className="surface-card space-y-2 rounded-2xl p-4" aria-live="polite">
        <h2 className="text-lg font-black">What the camera sees</h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-elevated p-3">
            <p className="text-2xl font-black tabular-nums">{live ? sample.cycles : "—"}</p>
            <p className="text-[11px] text-muted-foreground">Arm extensions</p>
          </div>
          <div className="rounded-lg bg-elevated p-3">
            <p className="text-2xl font-black tabular-nums">{live && sample.elbowAngle !== null ? sample.elbowAngle + "°" : "—"}</p>
            <p className="text-[11px] text-muted-foreground">Elbow angle</p>
          </div>
          <div className="rounded-lg bg-elevated p-3">
            <p className="text-2xl font-black tabular-nums">{live ? Math.round(sample.confidence * 100) + "%" : "—"}</p>
            <p className="text-[11px] text-muted-foreground">Joint visibility</p>
          </div>
        </div>
        <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          {live ? (message || "Move from a comfortable set position to a controlled overhead arm extension.")
            : "Camera off. No movement is being evaluated."}
        </p>
        <p className="text-xs text-muted-foreground">
          Only visible arm-extension cycles are counted, not basketball shots. Reposition the camera
          if it cannot see the joints. Do not train through pain or load your injured leg.
        </p>
      </section>
    </main>
  );
}
