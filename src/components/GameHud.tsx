/**
 * GAME HUD — the compact live read-out that frames the moving coach.
 * Only what matters mid-set: exercise, set X/Y, target, live reps, load,
 * rest clock, camera status, heart rate (when a monitor is connected),
 * session progress and XP. Everything else stays collapsible below.
 */
import { useEffect, useState } from "react";
import { lastHeartRate, onHeartRate } from "@/lib/health/hr-monitor";

export interface HudProps {
  exercise: string;
  section: string;
  setLabel?: string;
  target?: string;
  liveReps?: number | null;
  load?: string;
  restLeft?: number | null;
  camera: "watching" | "off" | "unsupported";
  cameraConfidence?: number;
  progress: number;
  xp: number;
  mission?: string;
  next?: string;
  /** Current workout phase label (Working set, Rest, Next up...). */
  phase?: string;
  /** 0–100 from real camera tracking; null when the camera can't judge. */
  formScore?: number | null;
  /** Consecutive completed training days. */
  streak?: number;
  /** Ahead / On pace / Behind versus the coach's cadence. */
  pace?: string;
  /** Last rep's range of motion as a % of the target for this movement. */
  romPct?: number | null;
  /** The rep the coach is on right now, when he is leading a rep set. */
  coachRep?: number | null;
  /** Target reps for the current set. */
  repTotal?: number | null;
  /** Collapse the stats grid to the essentials so the coach stays clear. */
  compact?: boolean;
  /** Tap handler for the expand/collapse control (omit to hide it). */
  onToggleCompact?: () => void;
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export function useHeartRate(): number | null {
  const [hr, setHr] = useState<number | null>(null);
  useEffect(() => {
    setHr(lastHeartRate());
    return onHeartRate((bpm) => setHr(bpm));
  }, []);
  return hr;
}

function Cell({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "muted" | "primary" | "accent";
}) {
  const color =
    tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-white";
  return (
    <div className="min-w-0 rounded-md bg-black/55 px-1.5 py-0.5 backdrop-blur-sm">
      <p className="text-[clamp(8px,0.95vh,18px)] font-bold uppercase tracking-widest text-white/60">
        {label}
      </p>
      <p
        className={`truncate text-[clamp(13px,1.6vh,30px)] font-black leading-tight tabular-nums ${color}`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Translucent overlay HUD — floats over the full-screen coach stage.
 * Deliberately thin: it frames the coach, it never boxes him in.
 */
export function GameHud(p: HudProps) {
  const hr = useHeartRate();
  const camText =
    p.camera === "watching"
      ? `On${p.cameraConfidence ? ` ${Math.round(p.cameraConfidence * 100)}%` : ""}`
      : p.camera === "off"
        ? "Off"
        : "N/A";
  const compact = p.compact === true;
  return (
    <section aria-label="Workout HUD" data-testid="game-hud" className="pointer-events-none">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[clamp(10px,1.15vh,22px)] font-bold uppercase tracking-widest text-accent drop-shadow">
          {p.phase ? `${p.phase} · ` : ""}
          {p.section}
          {p.mission ? ` · ${p.mission}` : ""}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[clamp(10px,1.15vh,22px)] font-black uppercase tracking-widest text-primary backdrop-blur-sm">
            {p.xp} XP
          </span>
          {p.onToggleCompact && (
            <button
              type="button"
              data-testid="hud-toggle"
              aria-expanded={!compact}
              aria-label={compact ? "Show all stats" : "Hide extra stats"}
              onClick={p.onToggleCompact}
              className="pointer-events-auto rounded-full bg-black/55 px-2 py-0.5 text-[clamp(10px,1.15vh,22px)] font-black uppercase tracking-widest text-white/75 backdrop-blur-sm"
            >
              {compact ? "Stats" : "Hide"}
            </button>
          )}
        </span>
      </div>
      <p className="truncate text-[clamp(18px,2.5vh,48px)] font-black leading-tight text-white drop-shadow-md">
        {p.exercise}
      </p>
      <div
        data-testid="hud-stats"
        data-compact={compact ? "true" : "false"}
        className={`mt-1 grid gap-1 ${compact ? "grid-cols-3" : "grid-cols-5 sm:grid-cols-10"}`}
      >
        <Cell label="Set" value={p.setLabel ?? "—"} tone="primary" />
        <Cell
          label={p.coachRep != null ? "Rep" : "Target"}
          value={
            p.coachRep != null && p.repTotal
              ? `${p.coachRep}/${p.repTotal}${p.liveReps != null ? ` · you ${p.liveReps}` : ""}`
              : compact
                ? (p.target ?? (p.liveReps != null ? String(p.liveReps) : "—"))
                : (p.target ?? "—")
          }
          tone={p.coachRep != null ? "accent" : "muted"}
        />
        <Cell
          label="Rest"
          value={p.restLeft != null ? mmss(p.restLeft) : "—"}
          tone={p.restLeft != null ? "accent" : "muted"}
        />
        {!compact && (
          <>
            <Cell
              label="Reps"
              value={p.liveReps != null ? String(p.liveReps) : "—"}
              tone={p.liveReps != null ? "accent" : "muted"}
            />
            <Cell label="Load" value={p.load || "BW"} />
            <Cell label="Cam" value={camText} tone={p.camera === "watching" ? "accent" : "muted"} />
            <Cell label="Heart" value={hr ? `${hr}` : "—"} tone={hr ? "primary" : "muted"} />
            <Cell
              label="Form"
              value={p.formScore != null ? String(p.formScore) : "—"}
              tone={p.formScore != null ? "accent" : "muted"}
            />
            <Cell
              label="ROM"
              value={p.romPct != null ? `${p.romPct}%` : "—"}
              tone={p.romPct != null ? "accent" : "muted"}
            />
            <Cell
              label="Pace"
              value={p.pace && p.pace !== "—" ? p.pace : "—"}
              tone={
                p.pace === "On pace" ? "accent" : p.pace && p.pace !== "—" ? "primary" : "muted"
              }
            />
            <Cell
              label="Streak"
              value={p.streak != null ? `${p.streak}d` : "—"}
              tone={p.streak ? "primary" : "muted"}
            />
            <Cell label="Done" value={`${p.progress}%`} />
          </>
        )}
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${p.progress}%` }}
        />
      </div>
      {p.next && !compact && (
        <p className="mt-0.5 hidden truncate text-[clamp(10px,1.15vh,22px)] font-semibold uppercase tracking-widest text-white/70 drop-shadow sm:block">
          Next: {p.next}
        </p>
      )}
    </section>
  );
}