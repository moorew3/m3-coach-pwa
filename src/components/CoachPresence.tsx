/**
 * COACH PRESENCE — the approved coach when there is no exercise demo.
 * ------------------------------------------------------------------
 * Opening, equipment check, prompts and the recap have no movement
 * to mirror, so the demo panel used to render nothing and the screen
 * became text-only ("Follow me" with nobody to follow). This shows
 * the canonical approved coach reference — no generated asset — so
 * the same person is on screen from the first second to the last.
 */
import { CoachFace } from "@/components/CoachFace";

export function CoachPresence({
  height = "h-56",
  caption = "Coach",
  speaking = false,
  dark = false,
  stateLabel,
}: {
  height?: string;
  caption?: string;
  speaking?: boolean;
  dark?: boolean;
  /** What the coach is doing right now — see lib/coach-states.ts */
  stateLabel?: string;
}) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border ${height} ${
        dark ? "border-cyan-400/40 bg-black" : "border-border bg-elevated"
      }`}
      aria-label="Your coach"
      role="img"
    >
      {/* clean approved still; the voice carries the speaking moment */}
      <CoachFace className="h-full w-full" />
      {stateLabel && (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary">
          {stateLabel}
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
            speaking
              ? "border-cyan-300 bg-cyan-300/20 text-cyan-100"
              : "border-white/30 bg-white/10 text-white/80"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${speaking ? "animate-pulse bg-cyan-300" : "bg-white/60"}`}
          />
          {speaking ? "Coach speaking" : caption}
        </span>
      </div>
    </div>
  );
}