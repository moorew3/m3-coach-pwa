/**
 * COACH DOCK — the only permanent data on the Coach Mode screen.
 * ------------------------------------------------------------------
 * A single thin translucent strip at the very bottom: what you're doing,
 * which set, the rep/time target, and the clock when one is running.
 * Everything else (form, ROM, pace, camera, heart, XP, streak, next up)
 * lives behind the "Details" toggle and is closed by default, so the
 * middle of the screen belongs entirely to the coach.
 */
import { ChevronDown, ChevronUp } from "lucide-react";
import { GameHud, type HudProps } from "@/components/GameHud";

export function CoachDock({
  exercise,
  line,
  clock,
  clockTone = "primary",
  detailsOpen,
  onToggleDetails,
  hud,
}: {
  /** Current movement (or "Rest"). */
  exercise: string;
  /** Set x/y · target reps or time — one short line. */
  line?: string;
  /** Countdown, rest clock or GO — only when one is actually running. */
  clock?: string;
  clockTone?: "primary" | "accent";
  detailsOpen: boolean;
  onToggleDetails: () => void;
  /** Full read-out, revealed only when the client asks for it. */
  hud: HudProps;
}) {
  return (
    <div data-testid="coach-dock" className="pointer-events-auto">
      {detailsOpen && (
        <div
          data-testid="coach-details"
          className="mb-1.5 rounded-2xl border border-white/10 bg-black/70 p-2 backdrop-blur-md"
        >
          <GameHud {...hud} compact={false} />
        </div>
      )}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black leading-tight">{exercise}</p>
          {line && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-white/60">
              {line}
            </p>
          )}
        </div>
        {clock && (
          <span
            data-testid="stage-clock"
            className={`shrink-0 text-xl font-black tabular-nums leading-none ${
              clockTone === "accent" ? "text-accent" : "text-primary"
            }`}
          >
            {clock}
          </span>
        )}
        <button
          type="button"
          data-testid="dock-details"
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? "Hide session details" : "Show session details"}
          onClick={onToggleDetails}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 text-white/75"
        >
          {detailsOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
        </button>
      </div>
    </div>
  );
}