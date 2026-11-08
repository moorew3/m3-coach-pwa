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
  muted = true,
  onPlaybackFailure,
  onVideoReady,
  onRetry,
  rate = 1,
  preloadUrl,
  className = "",
  label,
  onLayerChange,
  fallbackAtTop = false,
  stableFraming = true,
  cycleKey,
}: {
  url: string;
  vimeoId?: string;
  poster?: string;
  mirrored?: boolean;
  playing?: boolean;
  muted?: boolean;
  onPlaybackFailure?: () => void;
  /** Only fires after this exact clip has rendered a decoded video frame. */
  onVideoReady?: () => void;
  /** Retry the same clip and resume the parent session after a media error. */
  onRetry?: () => void;
  /** Playback speed so the coach's cadence matches the movement's target tempo. */
  rate?: number;
  /** Next movement's clip — fetched quietly so the transition is instant. */
  preloadUrl?: string;
  className?: string;
  label?: string;
  /** On an entrance screen, float a failed-video retry ABOVE the wake tap
   * overlay instead of hiding it under the bottom "Yes/No" controls. */
  fallbackAtTop?: boolean;
  /** V2 requires stable full-body framing; the player already uses object-contain. */
  stableFraming?: boolean;
  /** Force a fresh video on a new exercise set while retaining the same approved URL. */
  cycleKey?: string;
  /** Compatibility/test hook. Direct playback always uses layer 0. */
  onLayerChange?: (layer: 0 | 1, reason: "loop" | "transition") => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failure, setFailure] = useState<"source" | "stalled" | "blocked" | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [frameVisible, setFrameVisible] = useState(false);
  const [silentFallback, setSilentFallback] = useState(false);
  const frameReported = useRef(false);
  const videoReadyCallback = useRef(onVideoReady);
  videoReadyCallback.current = onVideoReady;

  const firstDecodedFrame = (video: HTMLVideoElement) => {
    if (frameReported.current || video.videoWidth === 0 || video.readyState < 2) return;
    frameReported.current = true;
    clearStalledTimer();
    setFrameVisible(true);
    videoReadyCallback.current?.();
  };

  const attemptPlayback = (video: HTMLVideoElement) => {
    void video.play().catch(async (error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (error instanceof DOMException && error.name === "NotAllowedError" && !video.muted) {
        // Approved embedded narration can be blocked on automatic scene changes.
        // Keep the SAME approved actor moving rather than substituting any media.
        video.muted = true;
        setSilentFallback(true);
        try { await video.play(); return; } catch { /* handled below */ }
      }
      setFailure(error instanceof DOMException && error.name === "NotAllowedError" ? "blocked" : "source");
    });
  };
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
    setFrameVisible(false);
    setSilentFallback(false);
    frameReported.current = false;
    clearStalledTimer();
  }, [url, attempt, cycleKey]);

  useEffect(() => () => clearStalledTimer(), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failure) return;
    video.playbackRate = Math.max(0.5, Math.min(2, rate || 1));
    if (playing) {
      if (!frameReported.current) watchStall();
      attemptPlayback(video);
    } else {
      video.pause();
      clearStalledTimer();
    }
  }, [playing, rate, url, failure, loaded, attempt]);

  useEffect(() => { if (failure) onPlaybackFailure?.(); }, [failure, onPlaybackFailure]);

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
      data-stable-framing={stableFraming ? "true" : "false"}
      data-failed={failure ? "true" : "false"}
      data-failure-reason={failure ?? ""}
      data-url={url}
      data-playing={isPlaying ? "true" : "false"}
      data-shown-url={loaded && !failure ? url : ""}
      data-frame-ready={frameVisible && !failure ? "true" : "false"}
      data-audio-muted-fallback={silentFallback ? "true" : "false"}
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
            key={`${url}::${cycleKey ?? "same-exercise"}::${attempt}`}
            ref={videoRef}
            src={url}
            poster={still}
            muted={muted}
            playsInline
            autoPlay={playing}
            loop
            preload="auto"
            data-layer="0"
            data-active="true"
            onCanPlay={(event) => {
              setLoaded(true);
              if (playing) attemptPlayback(event.currentTarget);
            }}
            onLoadedData={(event) => {
              setLoaded(true);
              callbackRef.current?.(0, "transition");
              if (playing) attemptPlayback(event.currentTarget);
            }}
            onPlaying={(event) => {
              setIsPlaying(true);
              const video = event.currentTarget;
              if (typeof video.requestVideoFrameCallback === "function") {
                video.requestVideoFrameCallback(() => firstDecodedFrame(video));
              } else {
                // Older Android WebViews lack requestVideoFrameCallback.
                firstDecodedFrame(video);
              }
            }}
            onTimeUpdate={(event) => {
              if (event.currentTarget.currentTime > 0) firstDecodedFrame(event.currentTarget);
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

      {/* A native video element can be black while its first frame decodes.
          Never present an empty exercise stage as if Marcus were demonstrating. */}
      {!failure && !frameVisible && (
        <div className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-end pb-4">
          <img src={still} alt="" draggable={false}
            className="absolute inset-0 h-full w-full object-contain" />
          <span data-testid="coach-motion-loading"
            className="relative rounded-lg bg-black/80 px-3 py-2 text-center text-xs font-semibold text-white">
            Loading this approved moving demonstration…
          </span>
        </div>
      )}
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
            onClick={() => {
              setAttempt((value) => value + 1);
              onRetry?.();
            }}
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
