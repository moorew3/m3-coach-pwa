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
  /** Compatibility/test hook. Direct playback always uses layer 0. */
  onLayerChange?: (layer: 0 | 1, reason: "loop" | "transition") => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const callbackRef = useRef(onLayerChange);
  callbackRef.current = onLayerChange;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);
    setIsPlaying(false);
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || failed) return;
    video.playbackRate = Math.max(0.5, Math.min(2, rate || 1));
    if (playing) {
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [playing, rate, url, failed, loaded]);

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
      data-failed={failed ? "true" : "false"}
      data-url={url}
      data-playing={isPlaying ? "true" : "false"}
      data-shown-url={loaded && !failed ? url : ""}
      aria-label={label ?? "Coach demonstration"}
      role="img"
    >
      <div className="absolute inset-0" style={mirrored ? { transform: "scaleX(-1)" } : undefined}>
        {failed ? (
          <img
            src={still}
            alt=""
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <video
            key={url}
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
              if (playing) void event.currentTarget.play().catch(() => undefined);
            }}
            onLoadedData={(event) => {
              setLoaded(true);
              callbackRef.current?.(0, "transition");
              if (playing) void event.currentTarget.play().catch(() => undefined);
            }}
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              setFailed(true);
              setLoaded(false);
              setIsPlaying(false);
            }}
            className="absolute inset-0 h-full w-full object-contain"
            aria-hidden="true"
          />
        )}
      </div>

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
