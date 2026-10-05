/**
 * Premium V2 opening scene. The images themselves are stationary approved
 * identities; only LIGHT and SCENE opacity transition. This never fakes
 * character motion or alters any exercise, timer or coaching audio.
 */
import { useEffect, useState } from "react";
import { COACH_REFERENCE } from "@/data/coach-identity";

export function WorkoutOpeningScene({
  athletePortrait,
  onStart,
  onChooseAthlete,
  starting = false,
}: {
  athletePortrait: string | null;
  onStart: () => void;
  onChooseAthlete: () => void;
  starting?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const reveal = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(reveal);
  }, []);

  return (
    <div
      data-testid="v2-approved-avatar-entrance"
      aria-label="M3 Coach workout opening scene"
      role="dialog"
      className="fixed inset-0 z-[60] overflow-hidden bg-[#05090d] text-white"
    >
      {/* Atmosphere moves; approved portraits do NOT impersonate walking. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_15%,#1c4251_0%,#09121b_43%,#030507_92%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(180deg,transparent_0%,rgba(5,7,9,.96)_100%)]" />
      <div className="pointer-events-none absolute left-[-15%] top-[28%] h-[2px] w-[130%] -rotate-12 bg-cyan-300/20 shadow-[0_0_55px_8px_rgba(66,213,226,.15)]" />
      <div
        className={`pointer-events-none absolute inset-0 bg-black/70 transition-opacity duration-[1600ms] motion-reduce:duration-0 ${revealed ? "opacity-0" : "opacity-100"}`}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-between px-4 pb-[max(1.4rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-8">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.32em] text-cyan-300">
              M3 Fitness · Mind / Body / Purpose
            </p>
            <h1 className="mt-2 text-[clamp(23px,5vw,44px)] font-black uppercase leading-none">
              You + Your Coach
            </h1>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-white/60 sm:text-sm">
              Your approved athlete. Your original coach. One uninterrupted session.
            </p>
          </div>
        </div>

        <div
          className={`relative z-10 my-3 grid min-h-0 flex-1 grid-cols-2 items-end gap-3 transition-opacity duration-[950ms] motion-reduce:duration-0 ${revealed ? "opacity-100" : "opacity-0"}`}
        >
          <div className="relative flex h-full max-h-[67dvh] min-h-0 flex-col justify-end overflow-hidden rounded-3xl border border-white/10 bg-white/[.035]">
            {athletePortrait ? (
              <img
                src={athletePortrait}
                alt="Your selected approved athlete avatar"
                className="min-h-0 h-full w-full object-contain object-bottom"
                draggable={false}
              />
            ) : (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 px-3 text-center">
                <p className="text-[clamp(30px,9vw,66px)] font-black text-white/20">M3</p>
                <p className="text-xs font-bold text-white/80">
                  Your approved athlete image
                </p>
                <button
                  type="button"
                  onClick={onChooseAthlete}
                  className="min-h-11 rounded-xl border border-cyan-300/50 bg-cyan-300/15 px-3 text-xs font-black text-cyan-100"
                >
                  Use my approved avatar
                </button>
              </div>
            )}
            <p className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] font-black uppercase tracking-[.12em]">
              You · Athlete
            </p>
          </div>
          <div className="relative flex h-full max-h-[67dvh] min-h-0 flex-col justify-end overflow-hidden rounded-3xl border border-cyan-300/25 bg-[#10202a]">
            <img
              src={COACH_REFERENCE}
              alt="The original approved M3 virtual coach"
              className="min-h-0 h-full w-full object-cover object-top"
              draggable={false}
            />
            <p className="absolute bottom-2 left-2 rounded-lg bg-black/75 px-2 py-1 text-[10px] font-black uppercase tracking-[.12em]">
              M3 · Your Coach
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/65 p-3 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
              Discipline builds freedom
            </p>
            <p className="mt-1 text-[11px] text-white/55">
              This screen stays here until you press Start Workout.
            </p>
          </div>
          <button
            type="button"
            onClick={onStart}
            disabled={starting}
            className="min-h-12 shrink-0 rounded-xl bg-cyan-300 px-4 text-xs font-black uppercase text-[#071019]"
          >
            {starting ? "Coach introduction…" : "Start workout"}
          </button>
        </div>
      </div>
    </div>
  );
}
