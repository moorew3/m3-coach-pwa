/**
 * COACH MOTION — seamless playback of the verified coach clips.
 * ------------------------------------------------------------------
 * Two <video> layers share the stage. The visible layer plays; the
 * standby layer is already loaded with the SAME clip so the loop
 * boundary is hidden by a short crossfade instead of a hard native
 * jump. When the movement changes, the standby layer loads the NEW clip
 * first and only becomes visible once it can play — so the coach never
 * blinks to black or remounts mid-session. A third hidden element warms
 * the cache for whichever clip comes next.
 *
 * Nothing here is generated: only the approved coach files already in
 * the project. If a clip fails to load the approved coach still stays
 * on screen — never another person.
 */
import { useEffect, useRef, useState } from "react";
import { COACH_REFERENCE } from "@/data/coach-identity";

/** Seconds before the end of the clip at which the standby layer takes over. */
const LOOP_LEAD = 0.28;
/** Crossfade length in ms (matches the Tailwind duration below). */
const FADE_MS = 260;
/** Give up waiting for `canplay` and swap anyway after this long. */
const READY_TIMEOUT = 3500;

export function CoachMotion({
  url,
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
  poster?: string;
  mirrored?: boolean;
  playing?: boolean;
  /** Playback speed so the coach's cadence matches the movement's target tempo. */
  rate?: number;
  /** Next movement's clip — fetched quietly so the transition is instant. */
  preloadUrl?: string;
  className?: string;
  label?: string;
  /** Test hook: fires on every loop/transition swap with the new active layer. */
  onLayerChange?: (layer: 0 | 1, reason: "loop" | "transition") => void;
}) {
  const vids = [useRef<HTMLVideoElement>(null), useRef<HTMLVideoElement>(null)] as const;
  const activeRef = useRef<0 | 1>(0);
  const [active, setActive] = useState<0 | 1>(0);
  const [failed, setFailed] = useState(false);
  const [firstFrame, setFirstFrame] = useState(false);
  const [playingLayers, setPlayingLayers] = useState<[boolean, boolean]>([false, false]);
  /* STRICT INVARIANT: video layers are only visible when the clip they hold is
     the clip of the CURRENT movement. While a new movement's clip loads we show
     the approved coach still/poster — never the previous exercise's motion. */
  const [shownUrl, setShownUrl] = useState<string | null>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const swapLock = useRef(false);
  const urlRef = useRef(url);
  const cbRef = useRef(onLayerChange);
  cbRef.current = onLayerChange;

  const safePlay = (v: HTMLVideoElement | null) => {
    if (!v || !playingRef.current) return;
    void v.play().catch(() => undefined);
  };

  /** Resolve once the element can render frames of its current src. */
  const whenReady = (v: HTMLVideoElement) =>
    new Promise<void>((resolve) => {
      if (v.readyState >= 3) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        v.removeEventListener("canplay", finish);
        v.removeEventListener("error", finish);
        resolve();
      };
      v.addEventListener("canplay", finish);
      v.addEventListener("error", finish);
      window.setTimeout(finish, READY_TIMEOUT);
    });

  /** Make `to` the visible layer; park the old one at frame 0, ready for the next loop. */
  const swapTo = (to: 0 | 1, reason: "loop" | "transition") => {
    const from = activeRef.current;
    if (from === to) return;
    activeRef.current = to;
    setActive(to);
    cbRef.current?.(to, reason);
    window.setTimeout(() => {
      const old = vids[from].current;
      if (!old) return;
      old.pause();
      if (old.src !== vids[to].current?.src && old.getAttribute("src") !== urlRef.current) {
        old.src = urlRef.current;
        old.load();
      } else {
        try {
          old.currentTime = 0;
        } catch {
          /* not seekable yet */
        }
      }
      swapLock.current = false;
    }, FADE_MS + 40);
  };

  /* first mount + movement change: load into standby, wait, then crossfade */
  useEffect(() => {
    urlRef.current = url;
    setFailed(false);
    setShownUrl((prev) => (prev === url ? prev : null));
    let cancelled = false;
    const cur = vids[activeRef.current].current;
    const standbyIdx = (activeRef.current === 0 ? 1 : 0) as 0 | 1;
    const standby = vids[standbyIdx].current;
    if (!cur || !standby) return;

    const alreadyShowing = cur.getAttribute("src") === url;
    if (alreadyShowing) {
      // same movement (e.g. next set) — keep the running video, prime standby
      if (standby.getAttribute("src") !== url) {
        standby.src = url;
        standby.load();
      }
      safePlay(cur);
      setShownUrl(url);
      return;
    }

    if (!cur.getAttribute("src")) {
      // very first clip: nothing to fade from — poster stays under it
      cur.src = url;
      cur.load();
      void whenReady(cur).then(() => {
        if (cancelled) return;
        setFirstFrame(true);
        setShownUrl(url);
        safePlay(cur);
        standby.src = url;
        standby.load();
      });
      return;
    }

    swapLock.current = true;
    standby.src = url;
    standby.load();
    void whenReady(standby).then(() => {
      if (cancelled) return;
      try {
        standby.currentTime = 0;
      } catch {
        /* ignore */
      }
      safePlay(standby);
      swapTo(standbyIdx, "transition");
      setShownUrl(url);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  /* pause = freeze both layers; resume = continue the visible one */
  useEffect(() => {
    const cur = vids[activeRef.current].current;
    const other = vids[activeRef.current === 0 ? 1 : 0].current;
    if (playing) {
      safePlay(cur);
    } else {
      cur?.pause();
      other?.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  /* cadence: both layers share the rate so the loop handover keeps the tempo */
  useEffect(() => {
    const r = Math.max(0.5, Math.min(2, rate || 1));
    for (const v of vids) if (v.current) v.current.playbackRate = r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rate, url, active]);

  /* ONE watcher: hand over to the pre-loaded standby just before the clip ends */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = window.requestAnimationFrame(tick);
      if (!playingRef.current || swapLock.current) return;
      const cur = vids[activeRef.current].current;
      const sIdx = (activeRef.current === 0 ? 1 : 0) as 0 | 1;
      const standby = vids[sIdx].current;
      if (!cur || !standby || !cur.duration || cur.paused) return;
      if (cur.duration - cur.currentTime > LOOP_LEAD) return;
      if (standby.getAttribute("src") !== urlRef.current || standby.readyState < 3) return;
      swapLock.current = true;
      try {
        standby.currentTime = 0;
      } catch {
        /* ignore */
      }
      safePlay(standby);
      swapTo(sIdx, "loop");
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const still = poster || COACH_REFERENCE;
  const markPlaying = (idx: 0 | 1, value: boolean) =>
    setPlayingLayers((current) => {
      if (current[idx] === value) return current;
      const next: [boolean, boolean] = [...current];
      next[idx] = value;
      return next;
    });
  const layer = (idx: 0 | 1) => (
    <video
      ref={vids[idx]}
      muted
      playsInline
      autoPlay={false}
      loop
      preload="auto"
      data-layer={idx}
      data-active={active === idx ? "true" : "false"}
      data-playing={playingLayers[idx] ? "true" : "false"}
      onPlaying={() => markPlaying(idx, true)}
      onPause={() => markPlaying(idx, false)}
      onEnded={() => markPlaying(idx, false)}
      onError={() => {
        if (activeRef.current === idx) setFailed(true);
      }}
      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[260ms] ease-linear ${active === idx && !failed && firstFrame && shownUrl === url ? "opacity-100" : "opacity-0"}`}
      aria-hidden={active !== idx}
    />
  );

  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      data-testid="coach-motion"
      data-failed={failed ? "true" : "false"}
      data-url={url ?? ""}
      data-playing={playingLayers[active] && shownUrl === url ? "true" : "false"}
      data-shown-url={shownUrl ?? ""}
      aria-label={label ?? "Coach demonstration"}
      role="img"
    >
      <div className="absolute inset-0" style={mirrored ? { transform: "scaleX(-1)" } : undefined}>
        {/* approved coach still sits under the video: no black frame, ever */}
        <img
          src={still}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-top"
          draggable={false}
        />
        {layer(0)}
        {layer(1)}
      </div>
      {preloadUrl && preloadUrl !== url && (
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