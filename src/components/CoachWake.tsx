/**
 * COACH WAKE — the always-ready start state.
 * ------------------------------------------------------------------
 * The session never opens on a menu. The coach walks from the back of the
 * gym toward the viewer in a dedicated, identity-checked portrait clip.
 * A verified presence loop takes over at the foreground without showing a
 * different person or falling back to a generic trainer.
 *
 * He then holds eye contact and asks: "Are you ready to work your ass off?"
 * with large YES and NO controls on screen at the same time.
 *
 * Voice is a convenience only. If the browser has no speech recognition,
 * or the microphone is blocked, the touch controls carry the whole flow.
 */
import { useEffect, useRef, useState } from "react";
import { CoachFace } from "@/components/CoachFace";
import { CoachMotion } from "@/components/CoachMotion";
import { Button } from "@/components/ui/button";
import { ambientClipFor, AMBIENT_RATE } from "@/lib/coach-ambient";
import { ALT_LABELS, type AltSession } from "@/lib/alt-sessions";
import { speak } from "@/lib/coach-voice";

type Phase = "approach" | "ask" | "affirm" | "options";

const QUESTION = "Are you ready to work your ass off?";
const QUESTION_AT_MS = 6200;

interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult:
    | ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function recognizer(): Recognition | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  const C = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!C) return null;
  try {
    return new C();
  } catch {
    return null;
  }
}

export function CoachWake({
  title,
  subtitle,
  onYes,
  onAlt,
  onNotToday,
  onEnter,
  voiceOn,
}: {
  title: string;
  subtitle?: string;
  /** Straight into the workout — never back to a menu. */
  onYes: () => void;
  /** One of the softer sessions the coach offers after a "no". */
  onAlt: (kind: AltSession) => void;
  onNotToday: () => void;
  /** Fired inside the real tap, so the coach's voice is unlocked. */
  onEnter?: () => void;
  voiceOn?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("approach");
  const [heard, setHeard] = useState<string | null>(null);
  const [voiceReady, setVoiceReady] = useState(false);

  const [entranceEnded, setEntranceEnded] = useState(false);
  const phaseRef = useRef<Phase>("approach");
  const askedRef = useRef(false);
  const leavingRef = useRef(false);
  phaseRef.current = phase;

  /** Both layers come from the canonical approved coach library. */
  const approachClip = ambientClipFor("INTRO");
  const readyClip = ambientClipFor("EXERCISE_PREP") ?? approachClip;

  const ask = () => {
    if (askedRef.current || phaseRef.current !== "approach") return;
    askedRef.current = true;
    setEntranceEnded(true);
    setPhase("ask");
    speak(QUESTION, Boolean(voiceOn), { tone: "urgent" });
  };

  const wake = () => {
    onEnter?.();
  };

  const accept = () => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    onEnter?.();
    setPhase("affirm");
    speak("Let's go.", Boolean(voiceOn), { tone: "urgent" });
    window.setTimeout(onYes, 500);
  };

  const decline = () => {
    onEnter?.();
    setPhase("options");
    speak("Alright. Then let's find something you will do.", Boolean(voiceOn), {
      tone: "reassuring",
    });
  };

  useEffect(() => {
    const timer = window.setTimeout(ask, QUESTION_AT_MS);
    return () => window.clearTimeout(timer);
    // The entrance runs once. `ask` deliberately reads the initial voice preference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- optional voice: wake phrase, then yes / no ---- */
  useEffect(() => {
    const rec = recognizer();
    if (!rec) return;
    let stopped = false;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const list = e.results as unknown as ArrayLike<{ 0: { transcript: string } }>;
      const last = list[list.length - 1];
      const said = String(last?.[0]?.transcript ?? "").toLowerCase();
      if (!said) return;
      setHeard(said);
      const p = phaseRef.current;
      if (
        p === "approach" &&
        /good\s+(morning|afternoon|evening)|hey\s+coach|wake\s+up/.test(said)
      ) {
        wake();
      } else if (p === "ask" && /\b(yes|yeah|yep|ready|let'?s go)\b/.test(said)) {
        accept();
      } else if (p === "ask" && /\b(no|nope|not really)\b/.test(said)) {
        decline();
      }
    };
    rec.onerror = () => setVoiceReady(false);
    rec.onend = () => {
      if (stopped) return;
      try {
        rec.start();
      } catch {
        setVoiceReady(false);
      }
    };
    try {
      rec.start();
      setVoiceReady(true);
    } catch {
      setVoiceReady(false);
    }
    return () => {
      stopped = true;
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const big = "min-h-[4.5rem] flex-1 text-[clamp(20px,3.4vh,44px)] font-black uppercase";

  return (
    <div
      data-testid="coach-wake"
      data-phase={phase}
      className="absolute inset-0 z-[48] overflow-hidden bg-black text-white"
    >
      {/* IDENTITY LOCK: the opening uses the same canonical approved coach
          clips as the rest of the app (coachMotionFor via ambientClipFor).
          No separately generated look-alike is allowed on this screen. */}
      <div className="absolute inset-0" data-testid="coach-entrance-media">
        {approachClip ? (
          <>
            <CoachMotion
              url={approachClip.url}
              poster={approachClip.poster}
              playing
              rate={AMBIENT_RATE}
              className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
                entranceEnded ? "opacity-0" : "opacity-100"
              }`}
              label="Your coach walking toward you"
            />
            {readyClip && (
              <CoachMotion
                url={readyClip.url}
                poster={readyClip.poster}
                playing
                rate={AMBIENT_RATE}
                className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${
                  entranceEnded ? "opacity-100" : "opacity-0"
                }`}
                label="Your coach ready in front of you"
              />
            )}
          </>
        ) : (
          <CoachFace className="h-full w-full" alt="Your coach" />
        )}
      </div>
      <div
        data-testid="coach-entrance-haze"
        className={`pointer-events-none absolute inset-0 bg-foreground/10 backdrop-blur-[3px] transition-all duration-[2400ms] ${
          phase === "approach" && !entranceEnded ? "opacity-100" : "backdrop-blur-0 opacity-0"
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_40%,rgba(0,0,0,0.82)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/75 to-transparent" />

      {phase === "approach" && (
        <Button
          type="button"
          variant="ghost"
          data-testid="coach-wake-tap"
          onClick={wake}
          className="absolute inset-0 h-auto w-full items-end justify-end rounded-none px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] text-left hover:bg-transparent"
        >
          <span className="w-full">
            <span className="block text-[clamp(11px,1.4vh,20px)] font-black uppercase tracking-[0.35em] text-primary">
              {title}
            </span>
            {subtitle && (
              <span className="mt-1 block text-[clamp(11px,1.3vh,18px)] font-semibold uppercase tracking-widest text-white/60">
                {subtitle}
              </span>
            )}
            <span className="mt-3 block text-[clamp(22px,3.6vh,56px)] font-black leading-tight">
              Say “Good morning, Coach”
            </span>
            <span className="mt-2 block text-[clamp(12px,1.6vh,22px)] font-bold uppercase tracking-widest text-white/55">
              {voiceReady ? "…or tap to meet him" : "Tap to meet him"}
            </span>
          </span>
        </Button>
      )}

      {(phase === "ask" || phase === "affirm") && (
        <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <p
            data-testid="coach-wake-question"
            className="text-[clamp(24px,4.6vh,72px)] font-black leading-[1.05] drop-shadow-lg"
          >
            {phase === "affirm" ? "Let's go." : QUESTION}
          </p>
          {phase === "ask" && (
            <div className="mt-5 flex gap-3">
              <Button type="button" data-testid="coach-wake-yes" onClick={accept} className={big}>
                Yes
              </Button>
              <Button
                type="button"
                variant="outline"
                data-testid="coach-wake-no"
                onClick={decline}
                className={`${big} border-foreground/30 bg-foreground/10 text-foreground`}
              >
                No
              </Button>
            </div>
          )}
          {heard && (
            <p className="mt-3 text-[11px] uppercase tracking-widest text-white/40">
              Heard: {heard}
            </p>
          )}
        </div>
      )}

      {phase === "options" && (
        <div
          data-testid="coach-wake-options"
          className="absolute inset-x-0 bottom-0 px-5 pb-[max(2rem,env(safe-area-inset-bottom))]"
        >
          <p className="text-[clamp(18px,3vh,44px)] font-black leading-tight drop-shadow-lg">
            Alright. Then let's find something you will do.
          </p>
          <div className="mt-4 grid gap-2">
            <Button type="button" onClick={accept} className={`${big} w-full`}>
              Start anyway
            </Button>
            {(["lighter", "recovery", "stretch"] as AltSession[]).map((k) => (
              <Button
                key={k}
                type="button"
                variant="outline"
                data-testid={`coach-wake-${k}`}
                onClick={() => onAlt(k)}
                className={`${big} w-full border-foreground/25 bg-foreground/10 text-foreground`}
              >
                {ALT_LABELS[k]}
              </Button>
            ))}
            <Button
              type="button"
              variant="ghost"
              data-testid="coach-wake-not-today"
              onClick={onNotToday}
              className="min-h-14 w-full text-sm font-bold uppercase text-foreground/55"
            >
              Not today
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}