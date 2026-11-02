import { useEffect, useRef, useState } from "react";
import type Player from "@vimeo/player";
import { COACH_REFERENCE } from "@/data/coach-identity";

/** Owner-enabled Vimeo embeds stay on the owner's host. Audio is always muted. */
export function EmbeddedMotion({
  id,
  playing = true,
  mirrored = false,
  label,
  poster,
  className = "",
  onPlayingChange,
  onFailure,
}: {
  id: string;
  playing?: boolean;
  mirrored?: boolean;
  label?: string;
  poster?: string;
  className?: string;
  onPlayingChange?: (playing: boolean) => void;
  onFailure?: () => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const player = useRef<Player | null>(null);
  const desired = useRef(playing);
  desired.current = playing;
  const callbacks = useRef({ onPlayingChange, onFailure });
  callbacks.current = { onPlayingChange, onFailure };
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let instance: Player | undefined;
    setFailed(false);
    setActive(false);
    setReady(false);
    const fail = () => {
      if (cancelled) return;
      setFailed(true);
      setActive(false);
      callbacks.current.onPlayingChange?.(false);
      callbacks.current.onFailure?.();
    };
    void import("@vimeo/player")
      .then(async ({ default: VimeoPlayer }) => {
        if (cancelled || !frame.current) return;
        instance = new VimeoPlayer(frame.current);
        player.current = instance;
        instance.on("play", () => {
          if (!cancelled) {
            setActive(true);
            callbacks.current.onPlayingChange?.(true);
          }
        });
        instance.on("pause", () => {
          if (!cancelled) {
            setActive(false);
            callbacks.current.onPlayingChange?.(false);
          }
        });
        instance.on("error", fail);
        await instance.ready();
        if (cancelled) return;
        await instance.setVolume(0);
        // Vimeo setVolume clears mute; apply hard mute after volume changes.
        await instance.setMuted(true);
        await instance.setLoop(true);
        if (cancelled) return;
        setReady(true);
        if (desired.current) await instance.play();
        else await instance.pause();
      })
      .catch(fail);
    return () => {
      cancelled = true;
      player.current = null;
      if (instance) void instance.destroy().catch(() => undefined);
    };
  }, [id, retryNonce]);

  useEffect(() => {
    const instance = player.current;
    if (!instance || !ready || failed) return;
    void (playing ? instance.play() : instance.pause()).catch(() => {
      setActive(false);
      callbacks.current.onPlayingChange?.(false);
    });
  }, [playing, ready, failed]);

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      data-testid="embedded-motion"
      data-provider="vimeo"
      data-video-id={id}
      data-playing={active ? "true" : "false"}
      data-failed={failed ? "true" : "false"}
    >
      {poster && !ready && (
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-contain" />
      )}
      {!failed && (
        <iframe
          ref={frame}
          key={`${id}::${retryNonce}`}
          src={`https://player.vimeo.com/video/${id}?autoplay=0&autopause=0&muted=1&loop=1&playsinline=1&controls=0&title=0&byline=0&portrait=0&dnt=1`}
          title={label ?? "Exercise demonstration"}
          allow="autoplay; fullscreen; picture-in-picture"
          className={`pointer-events-none absolute inset-0 h-full w-full border-0 ${ready ? "opacity-100" : "opacity-0"}`}
          style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        />
      )}
      {failed && (
        <div
          role="status"
          aria-live="polite"
          data-testid="embedded-video-fallback"
          className="absolute inset-0 grid place-items-center bg-black text-center text-sm text-white"
        >
          <img
            src={poster || COACH_REFERENCE}
            alt=""
            className="absolute inset-0 h-full w-full object-contain opacity-60"
            draggable={false}
          />
          <div className="relative mx-4 rounded-xl border border-amber-300/60 bg-black/85 p-4">
            <p className="font-semibold">Exercise video unavailable</p>
            <p className="mt-1 text-xs text-white/80">
              This embed could not load. No alternate exercise is shown; use Pause if you need the demonstration.
            </p>
            <button
              type="button"
              data-testid="retry-embedded-video"
              onClick={() => {
                setFailed(false);
                setActive(false);
                setReady(false);
                setRetryNonce((value) => value + 1);
              }}
              className="mt-3 rounded-lg border border-white/30 bg-white/15 px-4 py-2 text-xs font-bold"
            >
              Retry same approved embed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
