/**
 * PORTAL INTRO — the magic-mirror wake-up.
 * ------------------------------------------------------------------
 * Coach Mode never opens on a dashboard. The screen behaves like a
 * mirror waking up: a light sweep crosses the glass, the approved coach
 * resolves out of the dark, looks at you, and the session name lands.
 * Purely local CSS/DOM over the approved still — no new media, no cost.
 *
 * It is deliberately short (about 3.4s) and can be tapped away after
 * roughly a second so daily use never feels slowed down.
 */
import { useEffect, useState } from "react";
import { CoachFace } from "@/components/CoachFace";

export function PortalIntro({
  title,
  subtitle,
  greeting,
  onDone,
  onEnter,
}: {
  title: string;
  subtitle?: string;
  /** One short line, the same thing the coach is about to say out loud. */
  greeting: string;
  onDone: () => void;
  /**
   * Fired SYNCHRONOUSLY from the tap that walks into the session. Mobile
   * browsers only unlock audio inside a real gesture, so this one tap is
   * what lets the coach talk for the rest of the workout — there is no
   * separate "press play for speech" button anywhere in Coach Mode.
   */
  onEnter?: () => void;
}) {
  const [skippable, setSkippable] = useState(false);
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase(1), 60);
    const t2 = window.setTimeout(() => setPhase(2), 1100);
    const t3 = window.setTimeout(() => setSkippable(true), 1000);
    const t4 = window.setTimeout(onDone, 3400);
    return () => [t1, t2, t3, t4].forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      data-testid="portal-intro"
      data-phase={phase}
      role="button"
      tabIndex={0}
      aria-label="Skip the coach's entrance"
      onClick={() => {
        onEnter?.();
        if (skippable) onDone();
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        onEnter?.();
        if (skippable) onDone();
      }}
      className="absolute inset-0 z-[47] overflow-hidden bg-black"
    >
      {/* the coach resolving out of the dark — already present and speaking as
           he arrives. The image itself stays static; only the wrapper opacity
           changes, so no body motion is ever applied to the coach photograph. */}
      <div
        className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
          phase === 0 ? "opacity-0" : "opacity-100"
        }`}
      >
        <CoachFace alt="Your coach stepping into the room" className="h-full w-full" />
      </div>
      {/* light sweep across the glass */}
      <div
        className={`pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[1400ms] ease-out ${
          phase === 0 ? "-translate-x-full" : "translate-x-[220%]"
        }`}
      />
      {/* studio vignette so the frame reads as depth, not a flat photo */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <div
        className={`absolute inset-x-0 bottom-0 px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] transition-all duration-700 ${
          phase === 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-white/60">
            {subtitle}
          </p>
        )}
        <p className="mt-2 text-2xl font-black leading-tight drop-shadow-lg">{greeting}</p>
        {skippable && (
          <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-white/45">
            Tap to begin
          </p>
        )}
      </div>
    </div>
  );
}