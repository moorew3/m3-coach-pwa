/**
 * COACH MOTION — direct playback of verified coach clips.
 * ------------------------------------------------------------------
 * Keep this intentionally simple and reliable on phone browsers:
 * one visible muted/inline video for the approved clip, the canonical coach
 * still only as its poster/error fallback, plus one hidden preload for the
 * next approved clip.
 */
import { useEffect, useRef, useState } from "react";
import { EmbeddedMotion } from "@/components/EmbeddedMotion";
import { COACH_REFERENCE } from "@/data/coach-identity";

export function CoachMotion({
  url,
  vimeoId,
  poster,
  mirrored = false,
  playing = true,
  rate = 1,
  preloadUrl,
  className = "",
  label,
  onLayerChange,
  fallbackAtTop = false,
}: {
  url: string;
  vimeoId?: string;
  poster?: string;
  mirrored?: boolean;
  playing?: boolean;
  /** Playback speed so the coach's cadence matches the movement's target tempo. */
  rate?: number;
  /** Next movement's clip — fetched quietly so the transition is instant. */
  preloadUrl?: string;
  className?: string;
  label?: string;
  /** On an entrance screen, float a failed-video retry ABOVE the wake tap
   * overlay instead of hiding it under the bottom "Yes/No" controls. */
  fallbackAtTop?: boolean;
  /** Compatibility/test hook. Direct playback always uses layer 0. */
  onLayerChange?: (layer: 0 | 1, reason: "loop" | "transition") => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failure, setFailure] = useState<"source" | "stalled" | "blocked" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const stalledTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearStalledTimer = () => {
    if (stalledTimer.current !== null) clearTimeout(stalledTimer.current);
    stalledTimer.current = null;
  };
  const watchStall = () => {
    clearStalledTimer();
    if (!playing) return;
    stalledTimer.current = setTimeout(() => setFailure("stalled"), 12_000);
  };
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const callbackRef = useRef(onLayerChange);
  callbackRef.current = onLayerChange;

  useEffect(() => {
    setFailure(null);
    setLoaded(false);
    setIsPlaying(false);
    clearStalledTimer();
  }, [url, attempt]);

  useEffect(() => () => clearStalledTimer(), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failure) return;
    video.playbackRate = Math.max(0.5, Math.min(2, rate || 1));
    if (playing) {
      void video.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setFailure("blocked");
        }
      });
    } else {
      video.pause();
    }
    if (!playing) clearStalledTimer();
  }, [playing, rate, url, failure, loaded, attempt]);

  const still = poster || COACH_REFERENCE;
  if (vimeoId)
    return (
      <EmbeddedMotion
        id={vimeoId}
        playing={playing}
        mirrored={mirrored}
        label={label}
        poster={poster}
        className={className}
      />
    );

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      data-testid="coach-motion"
      data-failed={failure ? "true" : "false"}
      data-failure-reason={failure ?? ""}
      data-url={url}
      data-playing={isPlaying ? "true" : "false"}
      data-shown-url={loaded && !failure ? url : ""}
      aria-label={label ?? "Coach demonstration"}
      role="img"
    >
      <div className="absolute inset-0" style={mirrored ? { transform: "scaleX(-1)" } : undefined}>
        {failure ? (
          <img
            src={still}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            key={`${url}::${attempt}`}
            ref={videoRef}
            src={url}
            poster={still}
            muted
            playsInline
            autoPlay={playing}
            loop
            preload="auto"
            data-layer="0"
            data-active="true"
            onCanPlay={(event) => {
              setLoaded(true);
              if (playing) void event.currentTarget.play().catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "NotAllowedError") setFailure("blocked");
              });
            }}
            onLoadedData={(event) => {
              setLoaded(true);
              callbackRef.current?.(0, "transition");
              if (playing) void event.currentTarget.play().catch((error: unknown) => {
                if (error instanceof DOMException && error.name === "NotAllowedError") setFailure("blocked");
              });
            }}
            onPlaying={() => {
              clearStalledTimer();
              setIsPlaying(true);
            }}
            onWaiting={watchStall}
            onStalled={watchStall}
            onPause={() => {
              clearStalledTimer();
              setIsPlaying(false);
            }}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              clearStalledTimer();
              setFailure("source");
              setLoaded(false);
              setIsPlaying(false);
            }}
            className="absolute inset-0 h-full w-full object-contain"
            aria-hidden="true"
          />
        )}
      </div>

      {failure && (
        <div
          role="status"
          aria-live="polite"
          data-testid="coach-video-fallback"
          className={`absolute inset-x-3 ${fallbackAtTop ? "top-4 z-[70] pointer-events-auto" : "bottom-5"} rounded-xl border border-amber-300/60 bg-black/85 p-3 text-center text-sm text-white shadow-lg`}
        >
          <p className="font-semibold">Approved exercise video unavailable</p>
          <p className="mt-1 text-xs text-white/80">
            {failure === "blocked"
              ? "Your browser blocked playback. Tap retry to play the same approved video."
              : failure === "stalled"
                ? "Video paused while loading. Try the same approved video again."
                : "The video source could not load. No other exercise will be substituted."}
            {" "}The workout timer is unchanged; use Pause if you need this demonstration.
          </p>
          <button
            type="button"
            data-testid="retry-coach-video"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-2 rounded-lg border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold"
          >
            Retry approved video
          </button>
        </div>
      )}

      {preloadUrl && !preloadUrl.startsWith("https://player.vimeo.com/") && preloadUrl !== url && (
        <video
          src={preloadUrl}
          muted
          playsInline
          preload="auto"
          data-testid="coach-preload"
          className="pointer-events-none absolute size-px opacity-0"
          aria-hidden
        />
      )}
    </div>
  );
}
