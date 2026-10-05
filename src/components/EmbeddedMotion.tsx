import { useEffect, useRef, useState } from "react";
import type Player from "@vimeo/player";

/** Owner-enabled Vimeo embeds stay on the owner's host. Audio is always muted. */
export function EmbeddedMotion({
  id,
  segment,
  playing = true,
  mirrored = false,
  label,
  poster,
  className = "",
  onPlayingChange,
  onFailure,
}: {
  id: string;
  segment?: { start: number; end: number };
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
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let instance: Player | undefined;
    let rewinding = false;
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
        if (segment)
          instance.on("timeupdate", ({ seconds }: { seconds: number }) => {
            if (cancelled || rewinding || seconds < segment.end - 0.1) return;
            rewinding = true;
            void instance!
              .setCurrentTime(segment.start)
              .then(async () => {
                if (!cancelled && desired.current) await instance!.play();
              })
              .catch(fail)
              .finally(() => {
                rewinding = false;
              });
          });
        await instance.ready();
        if (cancelled) return;
        await instance.setMuted(true);
        await instance.setVolume(0);
        await instance.setLoop(true);
        if (segment) await instance.setCurrentTime(segment.start);
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
  }, [id, segment?.start, segment?.end]);

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
          key={id}
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
          className="absolute inset-0 grid place-items-center p-5 text-center text-sm text-white/80"
        >
          Exercise video unavailable. Follow the form cues below.
        </div>
      )}
    </div>
  );
}
