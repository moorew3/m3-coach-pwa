/**
 * MIRROR ME — reusable exercise demonstration system.
 * ------------------------------------------------------------------
 * Every exercise in the app renders through this one structure:
 * name → avatar phase demo → numbered phases → work target → cues →
 * coach cue → timeline → loop / mirror / prev / next / complete.
 *
 * The demo area plays `move.videoUrl` when one exists, otherwise it
 * renders the approved realistic-avatar phase board (see
 * src/data/mirror-boards.ts). Mobile portrait shows ONE large phase
 * panel at a time and cycles while Loop is on; wide screens show the
 * whole board with every phase visible. Tapping the demo opens the
 * full-width detail view. No stick figures anywhere.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { CoachMotion } from "@/components/CoachMotion";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Eye,
  FlipHorizontal2,
  Gauge,
  Hand,
  Maximize2,
  Repeat,
  ShieldAlert,
  Move3d,
  Timer,
  User,
  Wind,
  X,
} from "lucide-react";
import { BOARD_PANELS, boardFor, boardMetaFor } from "@/data/mirror-boards";
import { coachMotionFor, isCoachVerified } from "@/data/coach-identity";
import { mirrorFor, type CueIcon, type MirrorMove } from "@/data/mirror-me";
import { coachStillFor } from "@/data/coach-identity";

/**
 * Real-motion player: plays the moving-avatar clip, loops it, mirrors it
 * horizontally on request and uses the static board only as a poster.
 */
function MotionPlayer({
  move,
  url,
  poster,
  mirrored,
  playing,
  height,
  coach,
  onOpen,
}: {
  move: MirrorMove;
  url: string;
  poster?: string;
  mirrored: boolean;
  playing: boolean;
  height: string;
  coach?: boolean;
  onOpen?: () => void;
}) {
  const body = (
    <>
      {/* seamless two-layer player: no remount per set, crossfaded loops */}
      <CoachMotion
        url={url}
        poster={poster}
        mirrored={mirrored}
        playing={playing}
        className={`w-full ${height}`}
        label={`${move.name} — moving demonstration`}
      />
      <span
        className={`absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
          coach ? "text-accent" : "text-muted-foreground"
        }`}
      >
        {coach ? "Train with Coach" : "Coach motion pending"}
      </span>
      {mirrored && (
        <span className="absolute right-2 top-2 rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
          Mirror
        </span>
      )}
      {onOpen && (
        <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-lg bg-background/70 text-accent">
          <Maximize2 className="size-4" aria-hidden />
        </span>
      )}
    </>
  );

  const shell = "relative w-full overflow-hidden rounded-xl border border-primary/30 bg-black";
  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={`${shell} block text-left`}
      aria-label={`Open ${move.name} demonstration`}
    >
      {body}
    </button>
  ) : (
    <div className={shell}>{body}</div>
  );
}

const CUE_ICONS: Record<CueIcon, typeof Activity> = {
  posture: User,
  control: Gauge,
  breathe: Wind,
  range: Move3d,
  tempo: Timer,
  grip: Hand,
  core: Activity,
  safety: ShieldAlert,
};

/** Phases actually shown on the board (reference boards carry 5-6 panels). */
const panelCount = (move: MirrorMove) => {
  const meta = boardMetaFor(move.id);
  if (meta) return Math.max(1, meta.panels);
  return Math.max(1, Math.min(BOARD_PANELS, move.phases.length));
};

/** Minimum container aspect (w/h) for the single-phase mobile viewer. */
const MIN_MOBILE_ASPECT = 0.62;

/** Outer viewer aspect: never narrower than the panel itself. */
const viewerAspect = (panelAspect: number) => Math.max(MIN_MOBILE_ASPECT, panelAspect);

/**
 * Inner box matches ONE panel exactly (so nothing is distorted or cropped),
 * centered inside the viewer, showing only the requested phase.
 */
const panelStyle = (
  board: string,
  panels: number,
  panelAspect: number,
  index: number,
): React.CSSProperties => ({
  width: `${Math.min(100, (panelAspect / viewerAspect(panelAspect)) * 100)}%`,
  backgroundImage: `url(${board})`,
  backgroundSize: `${panels * 100}% 100%`,
  backgroundPosition: `${panels > 1 ? (index / (panels - 1)) * 100 : 50}% 50%`,
});

const phaseLabel = (move: MirrorMove, i: number) =>
  boardMetaFor(move.id)?.labels[i] ?? move.phases[i]?.label ?? `Phase ${i + 1}`;

/* --------------------------- animated demo ---------------------------- */

export function MirrorMeDemo({
  move,
  mirrored = false,
  playing = true,
  height = "h-56",
  onPhase,
  onOpen,
}: {
  move: MirrorMove;
  mirrored?: boolean;
  playing?: boolean;
  height?: string;
  onPhase?: (index: number) => void;
  /** Tapping the demo opens the detailed full-width view. */
  onOpen?: () => void;
}) {
  const panels = panelCount(move);
  const board = boardFor(move.id);
  const still = coachStillFor(move.id);
  const [phase, setPhase] = useState(0);
  const [t, setT] = useState(0);
  const dwell = Math.max(700, Math.round((move.loopMs ?? 3200) / panels));

  useEffect(() => {
    setPhase(0);
    setT(0);
  }, [move.id]);

  useEffect(() => {
    if (!playing || panels < 2 || typeof window === "undefined") return;
    const step = 60;
    let elapsed = 0;
    const id = window.setInterval(() => {
      elapsed += step;
      if (elapsed >= dwell) {
        elapsed = 0;
        setPhase((p) => (p + 1) % panels);
      }
      setT(elapsed / dwell);
    }, step);
    return () => window.clearInterval(id);
  }, [playing, panels, dwell, move.id]);

  const phaseRef = useRef(-1);
  useEffect(() => {
    if (onPhase && phaseRef.current !== phase) {
      phaseRef.current = phase;
      onPhase(phase);
    }
  }, [phase, onPhase]);

  // APPROVED AVATAR ONLY. A movement plays a clip only when the verified
  // coach-identity asset exists; legacy/stand-in clips of a different person
  // are never substituted. Everything else falls back to the static board.
  const motion = coachMotionFor(move.id);
  if (motion) {
    return (
      <MotionPlayer
        move={move}
        url={motion.url}
        coach
        poster={motion.poster || board}
        mirrored={mirrored}
        playing={playing}
        height={height}
        onOpen={onOpen}
      />
    );
  }

  const label = phaseLabel(move, phase);
  const panelAspect = boardMetaFor(move.id)?.panelAspect ?? 1;

  const Inner = (
    <>
      {/* mobile / portrait: one large avatar phase panel at a time */}
      <div
        className="relative w-full overflow-hidden md:hidden"
        style={{ aspectRatio: `${viewerAspect(panelAspect)}` }}
      >
        {board ? (
          <div
            role="img"
            aria-label={`${move.name} — ${label}`}
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 transition-[background-position] duration-500 ease-out"
            style={{
              ...panelStyle(board, panels, panelAspect, phase),
              transform: mirrored ? "translateX(-50%) scaleX(-1)" : undefined,
            }}
          />
        ) : still ? (
          <img
            src={still}
            alt={`${move.name} — coach demonstration`}
            className="h-full w-full object-cover object-top"
            style={mirrored ? { transform: "scaleX(-1)" } : undefined}
          />
        ) : (
          <img
            src={still}
            alt={`${move.name} — your coach; full motion demo in production`}
            className="h-full w-full object-cover object-top"
            style={mirrored ? { transform: "scaleX(-1)" } : undefined}
          />
        )}
      </div>

      {/* wide: full board, every phase visible */}
      <div className="relative hidden w-full overflow-hidden md:block">
        <img
          src={board ?? still}
          alt={`${move.name} — ${board ? "all movement phases" : "coach demonstration"}`}
          loading="lazy"
          className="h-auto w-full object-contain"
          style={mirrored ? { transform: "scaleX(-1)" } : undefined}
        />
      </div>

      <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent md:hidden">
        {phase + 1}. {label}
      </span>
      {/* Honest labelling: no verified coach clip yet for this movement. */}
      <span className="absolute bottom-2 left-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Coach motion pending for this movement
      </span>

      {mirrored && (
        <span className="absolute right-2 top-2 rounded-full bg-primary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
          Mirror
        </span>
      )}
      {onOpen && (
        <span className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-lg bg-background/70 text-accent">
          <Maximize2 className="size-4" aria-hidden />
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-elevated md:hidden">
        <div className="h-full bg-accent" style={{ width: `${((phase + t) / panels) * 100}%` }} />
      </div>
    </>
  );

  const shell = "relative w-full overflow-hidden rounded-xl border border-primary/30 bg-black";

  return onOpen ? (
    <button
      type="button"
      onClick={onOpen}
      className={`${shell} block text-left`}
      aria-label={`Open ${move.name} phases`}
    >
      {Inner}
    </button>
  ) : (
    <div className={shell}>{Inner}</div>
  );
}

/* --------------------------- detail overlay ---------------------------- */

function PhaseBoardDetail({
  move,
  mirrored,
  onClose,
}: {
  move: MirrorMove;
  mirrored: boolean;
  onClose: () => void;
}) {
  const board = boardFor(move.id);
  const still = coachStillFor(move.id);
  const motion = coachMotionFor(move.id);
  const panels = panelCount(move);
  const panelAspect = boardMetaFor(move.id)?.panelAspect ?? 1;
  const list = useMemo(() => Array.from({ length: panels }, (_, i) => i), [panels]);

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto bg-background/98 backdrop-blur"
      role="dialog"
      aria-modal="true"
      aria-label={`${move.name} movement phases`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2">
        <p className="truncate text-sm font-bold uppercase tracking-widest text-primary">
          {move.name}
        </p>
        <button
          type="button"
          aria-label="Close phases"
          onClick={onClose}
          className="grid size-10 place-items-center rounded-lg bg-elevated"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="space-y-3 p-3 pb-16">
        {motion && (
          <video
            src={motion.url}
            poster={motion.poster ?? board}
            className="w-full rounded-xl border border-primary/30 bg-black"
            style={mirrored ? { transform: "scaleX(-1)" } : undefined}
            autoPlay
            loop
            muted
            playsInline
            aria-label={`${move.name} — moving demonstration`}
          />
        )}

        {board && (
          <img
            src={board}
            alt={`${move.name} — full phase board`}
            loading="lazy"
            className="hidden w-full rounded-xl border border-primary/30 md:block"
            style={mirrored ? { transform: "scaleX(-1)" } : undefined}
          />
        )}
        {list.map((i) => (
          <figure
            key={i}
            className="overflow-hidden rounded-xl border border-primary/30 bg-black md:hidden"
          >
            <div
              className="relative w-full overflow-hidden"
              style={{ aspectRatio: `${viewerAspect(panelAspect)}` }}
            >
              {board ? (
                <div
                  role="img"
                  aria-label={`${move.name} phase ${i + 1}`}
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2"
                  style={{
                    ...panelStyle(board, panels, panelAspect, i),
                    transform: mirrored ? "translateX(-50%) scaleX(-1)" : undefined,
                  }}
                />
              ) : (
                <img
                  src={still}
                  alt={`${move.name} — your coach; full motion demo in production`}
                  className="h-full w-full object-cover object-top"
                  style={mirrored ? { transform: "scaleX(-1)" } : undefined}
                />
              )}

              <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent">
                {i + 1}. {phaseLabel(move, i)}
              </span>
            </div>
            <figcaption className="px-3 py-2 text-sm text-muted-foreground">
              {move.phases[i]?.detail}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------ full card ------------------------------ */

export interface MirrorMeCardProps {
  move: MirrorMove;
  /** Overrides the library default (e.g. the workout's own set/rep target). */
  work?: string;
  /** Progress line, e.g. "Set 2 of 3". */
  progressLabel?: string;
  progress?: number; // 0..1
  onPrev?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  completeLabel?: string;
  restSeconds?: number;
}

export function MirrorMeCard({
  move,
  work,
  progressLabel,
  progress,
  onPrev,
  onNext,
  onComplete,
  completeLabel,
  restSeconds,
}: MirrorMeCardProps) {
  const [mirrored, setMirrored] = useState(false);
  const [loop, setLoop] = useState(true);
  const [detail, setDetail] = useState(false);

  return (
    <section className="surface-card rounded-2xl border border-primary/25 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
            Mirror Me · {isCoachVerified(move.id) ? "Your coach" : "Coach clip pending"}
          </p>
          <h3 className="truncate font-display text-xl font-bold leading-tight">{move.name}</h3>
          <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {move.equipment}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-primary/15 px-2 py-1 text-center text-xs font-bold text-primary">
          {work ?? move.work}
        </span>
      </div>

      <div className="mt-2">
        <MirrorMeDemo
          move={move}
          mirrored={mirrored}
          playing={loop}
          height="h-64 md:h-44"
          onOpen={() => setDetail(true)}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setLoop((v) => !v)}
          aria-pressed={loop}
          className={`tap-target flex items-center justify-center gap-2 rounded-xl border text-xs font-bold uppercase ${
            loop
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <Repeat className="size-4" /> Loop {loop ? "on" : "off"}
        </button>
        <button
          type="button"
          onClick={() => setMirrored((v) => !v)}
          aria-pressed={mirrored}
          className={`tap-target flex items-center justify-center gap-2 rounded-xl border text-xs font-bold uppercase ${
            mirrored
              ? "border-primary bg-primary/15 text-primary"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          <FlipHorizontal2 className="size-4" /> Mirror me
        </button>
      </div>

      <ol className="mt-3 space-y-1.5">
        {move.phases.map((p, i) => (
          <li key={p.label} className="flex gap-2 text-sm">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-accent/20 text-[10px] font-bold text-accent">
              {i + 1}
            </span>
            <span>
              <span className="font-semibold">{p.label}</span>{" "}
              <span className="text-muted-foreground">— {p.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-3 grid grid-cols-2 gap-1.5">
        {move.cues.map((c) => {
          const Icon = CUE_ICONS[c.icon];
          return (
            <p
              key={c.text}
              className="flex items-center gap-1.5 rounded-lg bg-elevated px-2 py-1.5 text-[11px] font-semibold"
            >
              <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">{c.text}</span>
            </p>
          );
        })}
      </div>

      <p className="mt-3 rounded-xl border-l-4 border-accent bg-accent/10 px-3 py-2 text-sm">
        <span className="font-bold uppercase tracking-wide text-accent">Coach: </span>
        {move.coachCue}
      </p>

      {(progressLabel || progress !== undefined) && (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.round((progress ?? 0) * 100)}%` }}
            />
          </div>
          {progressLabel && (
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {progressLabel}
              {restSeconds ? ` · Rest ${restSeconds}s` : ""}
            </p>
          )}
        </div>
      )}

      {(onPrev || onNext || onComplete) && (
        <div className="mt-3 flex gap-2">
          {onPrev && (
            <button
              type="button"
              onClick={onPrev}
              aria-label="Previous exercise"
              className="tap-target grid w-14 place-items-center rounded-xl bg-elevated"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {onComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
            >
              <CheckCircle2 className="size-5" />
              {completeLabel ?? (move.mode === "time" ? "Complete interval" : "Complete set")}
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              aria-label="Next exercise"
              className="tap-target grid w-14 place-items-center rounded-xl bg-elevated"
            >
              <ChevronRight className="size-5" />
            </button>
          )}
        </div>
      )}

      {detail && (
        <PhaseBoardDetail move={move} mirrored={mirrored} onClose={() => setDetail(false)} />
      )}
    </section>
  );
}

/* --------------------------- modal launcher ---------------------------- */

export function MirrorMeButton({
  mirrorKey,
  work,
  label = "Mirror Me",
  compact,
}: {
  mirrorKey?: string;
  work?: string;
  label?: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const move = mirrorFor(mirrorKey);
  if (!move) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "flex items-center gap-1 rounded-lg bg-accent/15 px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-accent"
            : "tap-target flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent/15 px-4 text-base font-bold uppercase tracking-wide text-accent active:bg-accent/30"
        }
      >
        <Eye className="size-4" aria-hidden />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-background/98 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-label={`${move.name} demonstration`}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-3 py-2">
            <p className="truncate text-sm font-bold uppercase tracking-widest text-primary">
              Mirror Me
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="grid size-10 place-items-center rounded-lg bg-elevated"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="p-3 pb-16">
            <MirrorMeCard move={move} work={work} />
          </div>
        </div>
      )}
    </>
  );
}