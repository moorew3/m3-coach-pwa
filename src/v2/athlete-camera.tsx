import { Camera, CameraOff, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraStatus = "idle" | "starting" | "live" | "blocked" | "error";

export function V2AthleteCamera({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  };

  const start = async (nextFacing = facingMode) => {
    stop();
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("live");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setStatus(name === "NotAllowedError" ? "blocked" : "error");
    }
  };

  const flip = async () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    if (status === "live") await start(next);
  };

  useEffect(() => {
    if (!active) stop();
    return () => {
      if (!active) stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  if (!active) return null;

  return (
    <div className="absolute inset-0 z-[2] overflow-hidden bg-black" data-testid="v2-athlete-camera">
      <video
        ref={videoRef}
        playsInline
        muted
        className={`h-full w-full object-cover ${facingMode === "user" ? "-scale-x-100" : ""}`}
      />

      {status !== "live" && (
        <div className="absolute inset-0 grid place-items-center bg-[#080b0f] px-6 text-center">
          <div className="max-w-sm">
            <Camera className="mx-auto size-10 text-cyan-300" />
            <h2 className="mt-4 text-xl font-black uppercase">Coach-eye camera</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Put the phone where your trainer would stand. Manual Mode keeps the same exercise,
              set, timer and workout position while the screen shows you.
            </p>
            {status === "blocked" && (
              <p className="mt-3 text-xs font-bold text-amber-300">
                Camera permission was blocked. Allow camera access for this site and try again.
              </p>
            )}
            {status === "error" && (
              <p className="mt-3 text-xs font-bold text-amber-300">
                A usable camera could not be started on this device.
              </p>
            )}
            <button
              type="button"
              onClick={() => void start()}
              disabled={status === "starting"}
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-cyan-300 px-5 font-black uppercase text-black disabled:opacity-60"
            >
              {status === "starting" ? (
                <RefreshCw className="size-5 animate-spin" />
              ) : (
                <Camera className="size-5" />
              )}
              {status === "starting" ? "Starting" : "Start camera"}
            </button>
          </div>
        </div>
      )}

      {status === "live" && (
        <div className="absolute right-3 top-16 flex gap-2">
          <button
            type="button"
            onClick={() => void flip()}
            className="grid size-11 place-items-center rounded-xl border border-white/15 bg-black/60 backdrop-blur"
            aria-label="Switch camera"
          >
            <RefreshCw className="size-5" />
          </button>
          <button
            type="button"
            onClick={stop}
            className="grid size-11 place-items-center rounded-xl border border-white/15 bg-black/60 backdrop-blur"
            aria-label="Stop camera"
          >
            <CameraOff className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
