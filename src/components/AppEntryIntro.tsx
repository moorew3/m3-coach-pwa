/**
 * APP ENTRY GATE — the opening scene, before the app itself.
 * ------------------------------------------------------------------
 * While the gate is open the app UI is not rendered at all, so nothing
 * of the dashboard is visible before the coach asks his question.
 *
 * MOTION HONESTY: there is no verified walking footage of the approved
 * coach yet, so the coach never moves here. The scene is a stationary
 * cinematic reveal: the dark gym and its smoke drift, and the smoke
 * clears to reveal the same approved coach standing. The coach image is
 * never scaled, panned, slid or zoomed to imply a walk.
 *
 * FUTURE REAL WALK: set COACH_WALK_CLIP to an approved, identity-checked
 * portrait MP4 of this exact coach walking in. The flow below plays it in
 * place of the stationary reveal with no other change.
 *
 * YES enters the app on the workout selection / home screen and never
 * starts or resumes a workout. NO keeps the user outside any workout.
 *
 * Big-screen surfaces (display / glasses / presentation) are secondary
 * displays and are never gated.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { COACH_REFERENCE } from "@/data/coach-identity";
import { speak } from "@/lib/coach-voice";
import { introSeen, markIntroSeen } from "@/lib/session-intro";
import { useApp } from "@/lib/store";

/** Verified walking footage of the approved coach — none exists yet. */
const COACH_WALK_CLIP: string | undefined = undefined;

const QUESTION = "Are you ready to work your ass off?";
const REVEAL_MS = 2600;

type Phase = "arrive" | "reveal" | "ask" | "declined";

const isSecondary = (pathname: string) =>
  pathname.startsWith("/display") ||
  pathname.startsWith("/glasses") ||
  pathname.startsWith("/presentation");

/** Atmospheric footsteps only — synthesised, no asset, never implies motion on screen. */
function playFootsteps() {
  if (typeof window === "undefined") return;
  const Ctx =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  try {
    const ctx = new Ctx();
    for (let i = 0; i < 4; i += 1) {
      const t = ctx.currentTime + i * 0.52;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(38, t + 0.16);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
    window.setTimeout(() => void ctx.close().catch(() => {}), 3000);
  } catch {
    /* audio is optional atmosphere */
  }
}

export function AppEntryGate({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const secondary = isSecondary(pathname);
  // Closed only once we know this session already answered — so the app
  // never flashes behind the gate on a cold open.
  const [open, setOpen] = useState(!secondary);
  const [phase, setPhase] = useState<Phase>("arrive");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (secondary || introSeen()) setOpen(false);
  }, [secondary]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!open) return <>{children}</>;

  const voiceOn = settings.coachVoice !== false;

  /** The first real tap: unlocks audio, clears the smoke, then the coach speaks. */
  const begin = () => {
    if (phase !== "arrive") return;
    setPhase("reveal");
    playFootsteps();
    timer.current = window.setTimeout(() => {
      setPhase("ask");
      speak(QUESTION, voiceOn, { tone: "urgent" });
    }, REVEAL_MS);
  };

  const enterApp = () => {
    markIntroSeen();
    setOpen(false);
    if (pathname !== "/") void navigate({ to: "/" });
  };

  const accept = () => {
    speak("Let's go.", voiceOn, { tone: "urgent" });
    enterApp();
  };

  const decline = () => {
    setPhase("declined");
    speak("Alright. No workout today. I'll be here.", voiceOn, { tone: "reassuring" });
  };

  const revealed = phase !== "arrive";
  const big = "min-h-[4.5rem] flex-1 text-[clamp(20px,3.4vh,44px)] font-black uppercase";

  return (
    <div
      data-testid="app-entry-gate"
      role="dialog"
      aria-modal="true"
      aria-label="Coach entrance"
      className="fixed inset-0 z-[60] overflow-hidden bg-black text-white"
    >
      {/* Dark gym + the locked approved coach. Stationary: no transform. */}
      <div className="absolute inset-0">
        {COACH_WALK_CLIP ? (
          <video
            src={COACH_WALK_CLIP}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <img
            src={COACH_REFERENCE}
            alt="Your coach standing in the gym"
            draggable={false}
            className={`absolute inset-0 h-full w-full transform-none object-cover object-top transition-opacity duration-[2400ms] ${
              revealed ? "opacity-100" : "opacity-40"
            }`}
          />
        )}
      </div>

      {/* Smoke / steam: the only thing that moves before the reveal. */}
      <div
        data-testid="entry-smoke"
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 coach-smoke transition-opacity duration-[2400ms] ${
          revealed ? "opacity-30" : "opacity-100"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-all duration-[2400ms] ${
          revealed ? "bg-black/10 opacity-0 backdrop-blur-0" : "opacity-100"
        }`}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/75 to-transparent" />

      {phase === "arrive" && (
        <Button
          type="button"
          variant="ghost"
          data-testid="app-entry-tap"
          onClick={begin}
          className="absolute inset-0 h-auto w-full items-end justify-end rounded-none px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-left hover:bg-transparent"
        >
          <span className="w-full">
            <span className="block text-[clamp(11px,1.4vh,20px)] font-black uppercase tracking-[0.35em] text-primary">
              Coach
            </span>
            <span className="mt-3 block text-[clamp(22px,3.6vh,56px)] font-black leading-tight">
              Tap to enter the gym
            </span>
          </span>
        </Button>
      )}

      {(phase === "reveal" || phase === "ask") && (
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
          aria-live="polite"
        >
          {phase === "ask" && (
            <>
              <p
                data-testid="app-entry-question"
                className="text-[clamp(24px,4.6vh,72px)] font-black leading-[1.05] drop-shadow-lg"
              >
                {QUESTION}
              </p>
              <div className="mt-5 flex gap-3">
                <Button type="button" data-testid="app-entry-yes" onClick={accept} className={big}>
                  Yes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-testid="app-entry-no"
                  onClick={decline}
                  className={`${big} border-foreground/30 bg-foreground/10 text-foreground`}
                >
                  No
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === "declined" && (
        <div
          data-testid="app-entry-declined"
          className="absolute inset-x-0 bottom-0 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
          aria-live="polite"
        >
          <p className="text-[clamp(18px,3vh,44px)] font-black leading-tight drop-shadow-lg">
            Alright. No workout today. I'll be here.
          </p>
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="app-entry-retry"
              onClick={() => setPhase("ask")}
              className={`${big} w-full border-foreground/25 bg-foreground/10 text-foreground`}
            >
              Ask me again
            </Button>
            <Button
              type="button"
              variant="ghost"
              data-testid="app-entry-exit"
              onClick={enterApp}
              className="min-h-14 w-full text-sm font-bold uppercase text-foreground/55"
            >
              Just look around
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}