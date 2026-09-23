/**
 * COACHED SESSION — PHONE + DESKTOP
 * ------------------------------------------------------------------
 * A virtual personal trainer that runs the entire workout: intro,
 * warm-up, exercise briefs with the moving Mirror Me avatar, 3-2-1
 * countdowns, live cues, automatic rest with a preview of what's
 * next, auto-advance, a coached cooldown and a summary screen.
 *
 * Phone renders the single-column control surface; wide screens get a
 * real two-column layout with a much larger motion panel and a live
 * session log. Both drive the SAME shared session engine used by
 * Glasses and Presentation modes, so switching views never restarts.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  Camera,
  CameraOff,
  ChevronLeft,
  FlipHorizontal2,
  Hand,
  Minus,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Eye,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { planForDay } from "@/data/program";
import { mirrorFor } from "@/data/mirror-me";
import { TrainerStageMedia } from "@/components/TrainerStageMedia";
import { SheetPanel } from "@/components/Sheet";
import { coachMotionFor } from "@/data/coach-identity";
import { SubstitutionSelect } from "@/components/SubstitutionSelect";
import { coachStateFor } from "@/lib/coach-states";

import { WorkoutModeButton } from "@/components/WorkoutModeMenu";
import { buildCoachScript, coachingFor, currentCue } from "@/lib/coach-script";
import { stopSpeech } from "@/lib/coach-voice";
import { CoachAudioBadge, CoachAudioGate } from "@/components/CoachAudio";
import { CoachAudioPanel } from "@/components/CoachAudioPanel";
import { SessionAudio } from "@/components/SessionAudio";
import { nudgeCoach, nudgeMusic, pauseMusic, playMusic, toggleMusicMute } from "@/lib/audio-mix";
import { repsIn, secondsIn, setCommandHandler, weightIn } from "@/lib/voice-commands";
import { speak } from "@/lib/coach-voice";

import { recordWorkStep, resetCoachSession, useCoachEngine } from "@/lib/coach-session";
import { CameraCoach } from "@/components/CameraCoach";
import { HealthPanel } from "@/components/HealthPanel";
import { ActivityChooser } from "@/components/ActivityChooser";
import { effectiveExercise, effectiveExercises, effectivePlan } from "@/lib/activities";
import { patternFor } from "@/lib/vision/patterns";
import {
  metricsSnapshot,
  resetReps,
  setGesturesOn,
  setCueHandler,
  setGestureHandler,
  startCamera,
  useCamera,
} from "@/lib/vision/camera";
import { prefillFor, recapLines } from "@/lib/performance";
import type { HudProps } from "@/components/GameHud";
import { CoachDock } from "@/components/CoachDock";
import { CoachWake } from "@/components/CoachWake";
import { altSessionPlan } from "@/lib/alt-sessions";
import { scoreSession, streakThrough, targetTop } from "@/lib/game-score";
import { phaseFor } from "@/lib/workout-phase";
import { formScore, romPercent } from "@/lib/form-score";
import { useRepCadence } from "@/lib/rep-cadence";
import {
  PACE_LABEL,
  type PaceState,
  coachRate,
  paceCompare,
  repPace,
  secondsPerRep,
  syncScore,
  tempoFor,
} from "@/lib/motion-tempo";
import { trackingRulesFor } from "@/lib/exercise-player";
import { resolveTrainerMedia } from "@/lib/trainer-media-state";
import { CueEngine, type CueContext } from "@/lib/coach-cue-engine";
import type { MoveMetrics } from "@/lib/vision/analysis";
import {
  elapsedFor,
  getDay,
  saveAndExit,
  pauseWorkout,
  resumeWorkout,
  setState,
  startWorkoutOnce,
  ensureSession,
  completeWorkout,
  nextUnresolved,
  upsertSetValues,
  supersetsOn,
  updateDay,
  useApp,
  type SetEntry,
  type SetFeel,
} from "@/lib/store";

export const Route = createFileRoute("/coach/$day")({
  head: () => ({
    meta: [
      { title: "Coached Session — Arm Growth & Conditioning" },
      {
        name: "description",
        content:
          "A fully coach-led workout on phone or desktop: warm-up, guided exercises with a moving avatar, countdowns, automatic rest and a coached cooldown.",
      },
      { property: "og:title", content: "Coached Session — Arm Growth & Conditioning" },
      {
        property: "og:description",
        content: "Your virtual trainer runs the whole session from warm-up to cooldown.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CoachSession,
});

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

/**
 * CAPTION STRIP — what the coach just said, low on the screen and out of the
 * way of his body. It fades out ~2.5s after each new line while the audio
 * keeps playing, so nothing sits over the movement.
 */
function CaptionStrip({ text, speaking }: { text: string; speaking: boolean }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!text) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2600);
    return () => window.clearTimeout(t);
  }, [text]);
  if (!text) return null;
  return (
    <p
      aria-live="polite"
      data-testid="coach-caption"
      data-visible={visible ? "true" : "false"}
      className={`pointer-events-none line-clamp-2 rounded-lg border-l-2 bg-black/50 px-2.5 py-1 text-[clamp(12px,1.7vh,32px)] font-semibold backdrop-blur-sm transition-opacity duration-700 ${
        speaking ? "border-accent" : "border-primary"
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <span className="mr-1.5 text-[clamp(9px,1vh,19px)] font-bold uppercase tracking-widest text-white/55">
        {speaking ? "Coach" : "Cue"}
      </span>
      {text}
    </p>
  );
}

/**
 * REST PREVIEW CUE — a short setup line spoken once, the first time the
 * upcoming movement is demonstrated during a given rest. Purely voice: it
 * never touches reps, scoring, logging or session state.
 */
function RestPreviewCue({
  active,
  text,
  voiceOn,
}: {
  active: boolean;
  text: string;
  voiceOn: boolean;
}) {
  const said = useRef("");
  useEffect(() => {
    if (!active || !text || said.current === text) return;
    said.current = text;
    speak(text, voiceOn, { tone: "instructional", interrupt: false });
  }, [active, text, voiceOn]);
  useEffect(() => {
    if (!active) said.current = "";
  }, [active]);
  return null;
}

function CoachSession() {
  const { day: dayParam } = Route.useParams();
  const day = Number(dayParam) || 1;
  const state = useApp();
  const navigate = useNavigate();
  const plan = effectivePlan(state, day);
  const sessionExercises = effectiveExercises(state, day);
  const log = getDay(state, day);
  const coaching = coachingFor(plan);
  const voiceOn = state.settings.coachVoice !== false;

  /* real facts for the recap chapter — the coach names what was actually done */
  const doneSetsNow = Object.values(log.exercises).reduce(
    (n, el) => n + el.sets.filter((s) => s.done).length,
    0,
  );
  const loggedNames = Object.entries(log.exercises)
    .filter(([, el]) => el.sets.some((s) => s.done))
    .map(([id]) => effectiveExercise(state, day, id)?.name ?? id);
  /* cheap signature of today's log: the script re-reads it after every set */
  const logSig = Object.entries(log.exercises)
    .map(
      ([id, el]) =>
        `${id}:${el.sets.map((x) => `${x.done ? 1 : 0}${x.weight}/${x.reps}/${x.feel ?? ""}${x.rpe ?? ""}/${x.outcome ?? ""}`).join(",")}`,
    )
    .join(";");
  const script = useMemo(
    () =>
      buildCoachScript(
        day,
        supersetsOn(state, day),
        (e) => Math.max(1, e.sets, state.days[day]?.exercises[e.id]?.sets.length ?? 0),
        {
          recap: {
            doneSets: doneSetsNow,
            minutes: Math.round(elapsedFor(log, Date.now()) / 60000),
            loggedNames,
          },
          perf: { state, day },
          athlete: state.userAvatar.displayName?.trim() || undefined,
          plan: log.sessionPlan ? plan : undefined,
          exercises: log.sessionPlan ? sessionExercises : undefined,
        },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      day,
      state.settings.useSupersets,
      state.days[day]?.useSupersets,
      state.days[day]?.sessionPlan,
      doneSetsNow,
      logSig,
    ],
  );

  const [weight, setWeightRaw] = useState("");
  const [reps, setRepsRaw] = useState("");
  /* MANUAL WINS — once the user types, taps ± or speaks a correction for a
     set, nothing automatic (camera count, cadence finish, prefill) may
     overwrite that value for the rest of the set. */
  const manualWeight = useRef(false);
  const manualReps = useRef(false);
  const repsRef = useRef("");
  repsRef.current = reps;
  const setWeight = useCallback((v: string) => setWeightRaw(v), []);
  const setReps = useCallback((v: string) => setRepsRaw(v), []);
  /* the current work step, so an inline edit writes to the SAME set the
     manual log shows (no private coach-only copy saved later) */
  const liveSet = useRef<{ exerciseId: string; setIndex: number } | null>(null);
  const editWeight = useCallback(
    (v: string) => {
      manualWeight.current = true;
      setWeightRaw(v);
      const t = liveSet.current;
      if (t) upsertSetValues(day, t.exerciseId, t.setIndex, { weight: v });
    },
    [day],
  );
  const editReps = useCallback(
    (v: string) => {
      manualReps.current = true;
      setRepsRaw(v);
      const t = liveSet.current;
      if (t) upsertSetValues(day, t.exerciseId, t.setIndex, { reps: v });
    },
    [day],
  );
  const [feel, setFeel] = useState<SetFeel | undefined>(undefined);
  const [rpe, setRpe] = useState<number | undefined>(undefined);
  const [showRpe, setShowRpe] = useState(false);
  const [hint, setHint] = useState("");
  const [demoOpen, setDemoOpen] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [setupPrompted, setSetupPrompted] = useState(false);
  const [setKind, setSetKind] = useState<"warmup" | "work" | "drop" | "backoff">("work");
  const [camReps, setCamReps] = useState<number | null>(null);
  const [camActive, setCamActive] = useState(false);
  const [camConfidence, setCamConfidence] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  /* game stage: manual logging, camera panel and extras live in sheets */
  const [logOpen, setLogOpen] = useState(false);
  const [camOpen, setCamOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  /* COACH FIRST: the stats grid collapses to the essentials during a set so
     the middle of the screen stays clear for the coach's body and movement. */
  const [statsOpen, setStatsOpen] = useState(false);
  /* the magic-mirror opening: plays once, skippable after a second */
  const [portalSeen, setPortalSeen] = useState(false);

  const cam = useCamera();
  /* reps handed straight to the logger when the camera count is confirmed
     with one tap — bypasses the React state round-trip so nothing is lost */
  const confirmReps = useRef<string | null>(null);
  const announcedFor = useRef("");

  const [liveMetrics, setLiveMetrics] = useState<MoveMetrics | null>(null);
  /* dynamic trainer cues, driven by phase + real tracking events */
  const cueEngine = useRef(new CueEngine());
  const cueCtx = useRef<CueContext>({
    phase: "INTRO",
    metrics: null,
    rules: trackingRulesFor(undefined),
    repTarget: null,
  });
  const voiceRef = useRef(true);
  voiceRef.current = voiceOn;

  /* live rep count from the phone camera — a suggestion the user can accept or ignore */
  useEffect(() => {
    const id = setInterval(() => {
      const m = metricsSnapshot();
      setCamActive(Boolean(m));
      setCamConfidence(m?.confidence ?? 0);
      setCamReps(m && m.confidence >= 0.55 && m.reps > 0 ? m.reps : null);
      setLiveMetrics(m);
      const cue = cueEngine.current.tick({ ...cueCtx.current, metrics: m });
      if (cue) speak(cue.text, voiceRef.current, { tone: cue.tone, interrupt: false });
    }, 700);
    return () => clearInterval(id);
  }, []);

  const engine = useCoachEngine(day, script, (s, info) => {
    const m = metricsSnapshot();
    const repsUsed = confirmReps.current ?? reps;
    confirmReps.current = null;
    recordWorkStep(day, s, info, {
      weight: weight || undefined,
      reps: repsUsed || undefined,
      feel,
      rpe,
      kind: setKind,
      warmup: setKind === "warmup",
      vision:
        m && m.confidence >= 0.55 && m.reps > 0
          ? {
              pattern: m.pattern,
              reps: m.reps,
              romAvg: m.romAvg,
              tempoDown: m.tempoDown,
              tempoUp: m.tempoUp,
              symmetry: m.symmetry,
              confidence: m.confidence,
              cues: m.cues,
            }
          : undefined,
    } as Partial<SetEntry>);
    /* short, factual post-set read-out — set context first, then what the camera saw */
    if (s.kind === "work") {
      const setPart =
        s.setIndex != null && s.totalSets ? `Set ${s.setIndex + 1} of ${s.totalSets}. ` : "";
      const targetPart = s.reps ? `Target ${s.reps}${weight ? ` at ${weight}` : ""}. ` : "";
      // Only the camera read-out is worth a sentence here; the rest opener
      // that follows already names the logged set, so the coach never doubles up.
      const camPart =
        m && m.confidence >= 0.55 && m.reps > 0
          ? `I counted ${m.reps} clean reps. ${m.cues[0] ?? `Average range ${m.romAvg} degrees.`}`
          : "";
      if (camPart) {
        speak(`${setPart}${targetPart}${camPart}`, voiceOn, {
          tone: "instructional",
          interrupt: false,
        });
      }
    }
  });
  const { step, i, left, lead, running, mirrored, progress } = engine;
  const move = mirrorFor(step?.mirror);
  const pattern = patternFor(step?.exerciseId);

  /* ONE PAUSE STATE. Pausing on the coached stage pauses the workout itself,
     so the manual log shows the same frozen clock — and vice versa. */
  const setSessionRunning = useCallback(
    (v: boolean) => {
      engine.setRunning(v);
      if (getDay(state, day).completed) return;
      if (v) resumeWorkout(day);
      else pauseWorkout(day);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [day, engine.setRunning],
  );

  /* a pause made in the manual log shows up here immediately */
  useEffect(() => {
    if (log.completed) return;
    if (log.paused && running) engine.setRunning(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log.paused, log.completed, running]);

  /* OPENING A VIEW IS NOT STARTING A WORKOUT. Coach Mode only makes sure the
     day's record exists; the clock starts on the first real piece of work
     (below) and a finished day stays finished. */
  useEffect(() => {
    ensureSession(day);
  }, [day]);

  /* the clock starts once, with the first coached effort of the session */
  useEffect(() => {
    if (step?.kind === "work" && running) startWorkoutOnce(day);
  }, [day, step?.kind, running]);

  /* RESYNC TO THE LOG — Coach Mode is a view of the same workout, so it
     resumes at the first piece of work that still needs doing instead of
     repeating sets that were already logged in the manual view. */
  const resyncSig = useRef("");
  useEffect(() => {
    if (!script.length) return;
    if (log.completed) {
      const end = script.findIndex((s) => s.kind === "complete");
      if (end >= 0 && i !== end) engine.goto(end);
      return;
    }
    const target = nextUnresolved(
      state,
      day,
      sessionExercises.map((e) => ({ id: e.id, sets: e.sets })),
    );
    if (!target) return;
    const sig = `${target.exerciseId}:${target.setIndex}`;
    if (resyncSig.current === sig) return;
    resyncSig.current = sig;
    const at = script.findIndex(
      (s) =>
        s.kind === "work" && s.exerciseId === target.exerciseId && s.setIndex === target.setIndex,
    );
    if (at <= i) return; // never yank the user forward or backward mid-step
    const prev = script[at - 1];
    const brief =
      prev && prev.kind === "brief" && prev.exerciseId === target.exerciseId ? at - 1 : at;
    engine.goto(brief);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, log.completed, logSig, day]);

  /* CAMERA CONFIRM — when the camera has confidently counted the target,
     the coach offers the count once. It is never applied on its own: the
     user confirms by tap, voice ("done set") or gesture, or types a fix. */
  useEffect(() => {
    if (!step || step.kind !== "work" || step.seconds || lead !== null || !running) return;
    const top = targetTop(step.reps);
    if (top === null || camReps === null || camConfidence < 0.7 || camReps < top) return;
    if (announcedFor.current === step.id) return;
    announcedFor.current = step.id;
    speak(`That's ${camReps}. Say done set or tap confirm, and we rest.`, voiceOn, {
      tone: "instructional",
      interrupt: false,
    });
  }, [step, lead, running, camReps, camConfidence, voiceOn]);

  /* a fresh set collapses the manual log again — the HUD carries the facts */
  useEffect(() => {
    setLogOpen(false);
  }, [step?.id]);

  /* state-driven trainer cues: rest opening and the move to the next exercise.
     Short lines only, and the engine throttles anything repetitive. */
  useEffect(() => {
    if (!step) return;
    cueEngine.current.reset();
    const cue =
      step.kind === "rest"
        ? cueEngine.current.restStarted(step.seconds)
        : step.kind === "prompt"
          ? cueEngine.current.nextExercise(step.next)
          : null;
    if (cue) speak(cue.text, voiceRef.current, { tone: cue.tone, interrupt: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  /* ------------------- FOLLOW THE COACH: rep cadence -------------------
     A rep-based set has no clock in the script, so the coach used to loop
     as wallpaper while the user tapped "done set". Now one local beat at
     the shared target tempo counts HIS reps: the HUD, the "two more /
     last rep" calls and the automatic end of the set all read it. The
     camera count is still only ever a suggestion the user can override. */
  const repSet = Boolean(step && step.kind === "work" && !step.seconds);
  const cadenceTotal = repSet ? targetTop(step?.reps) : null;
  const cadenceTempo = tempoFor(step?.exerciseId, patternFor(step?.exerciseId));
  const cadenceLive = repSet && running && lead === null && Boolean(step?.exerciseId);
  const camRef = useRef({ reps: null as number | null, conf: 0 });
  camRef.current = { reps: camReps, conf: camConfidence };
  const coachRep = useRepCadence({
    key: `${step?.id ?? "none"}`,
    active: cadenceLive,
    total: cadenceTotal,
    secondsPerRep: secondsPerRep(cadenceTempo),
    onRep: (n: number, total: number) => {
      const left = total - n;
      if (left === 2) speak("Two more.", voiceRef.current, { tone: "urgent", interrupt: false });
      else if (left === 0)
        speak("Last rep — hold the finish.", voiceRef.current, {
          tone: "urgent",
          interrupt: false,
        });
    },
    onDone: (total: number) => {
      /* the coach has finished the set with the user. A number the user
         typed, tapped or spoke is final; otherwise a confident camera count
         is used, and failing that the prescribed target. */
      const cam = camRef.current;
      const used = manualReps.current
        ? repsRef.current || String(total)
        : cam.reps !== null && cam.conf >= 0.7
          ? String(cam.reps)
          : String(total);
      confirmReps.current = used;
      setReps(used);
      speak(`Good set. Logging ${used}.`, voiceRef.current, {
        tone: "reassuring",
        interrupt: false,
      });
      engine.finishWork();
    },
  });

  /* pre-fill the log fields from memory whenever the coach opens a set:
     last-used weight (or today's progression call) + planned reps, so a
     normal set is one tap. */
  useEffect(() => {
    setFeel(undefined);
    setRpe(undefined);
    setSetKind("work");
    setShowRpe(false);
    /* a new set starts fresh: the previous set's manual corrections must not
       block this set's prefill. */
    manualWeight.current = false;
    manualReps.current = false;
    const ex = step?.exerciseId ? effectiveExercise(state, day, step.exerciseId) : undefined;
    if (step?.kind === "work" && step.logging && ex && !step.seconds) {
      liveSet.current = { exerciseId: ex.id, setIndex: step.setIndex ?? 0 };
      const pre = prefillFor(state, ex, day, step.setIndex ?? 0);
      /* values already saved for this set (typed in the manual log, or on a
         previous visit) always beat the suggestion */
      const saved = getDay(state, day).exercises[ex.id]?.sets[step.setIndex ?? 0];
      setWeight(saved?.weight || pre.weight);
      setReps(saved?.reps || pre.reps);
      setHint(pre.hint);
    } else {
      liveSet.current = null;
      setWeight("");
      setReps("");
      setHint("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, step?.id]);

  /* AUTOPLAY FIRST — try to speak the moment Coach Mode opens. On devices
     that already trust this site (installed PWA, prior interaction) the
     coach greets with zero taps; where the browser refuses, the single
     "Enable Coach Voice" gate stays up and the flow resumes right after. */
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current || !voiceOn || engine.voiceStatus !== "locked") return;
    autoTried.current = true;
    void engine.enableAudio();
  }, [engine, voiceOn]);

  /* SETUP QUESTION — asked BY the coach, and never before he has greeted
     the athlete and previewed the session. Entering Coach Mode must land
     on the coach talking, not on a settings panel. */
  const introChapter =
    !step || step.chapter === "opening" || step.chapter === "equipment" || !portalSeen;
  useEffect(() => {
    if (log.coachSetupDone || setupPrompted || engine.voiceStatus !== "ready" || !voiceOn) return;
    if (introChapter) return;
    setSetupPrompted(true);
    engine.setRunning(false);
    speak(
      "Before we begin, want me to watch your form with the camera today? Want hands-free gestures on? And are we following today's programmed workout, or changing it?",
      true,
      { tone: "calm" },
    );
  }, [engine, log.coachSetupDone, setupPrompted, voiceOn, introChapter]);

  /* desktop keyboard shortcuts — never while typing in a field */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable))
        return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          setSessionRunning(!running);
          break;
        case "Enter":
          e.preventDefault();
          if (step?.kind === "work") engine.finishWork();
          else engine.advance();
          break;
        case "ArrowLeft":
          engine.back();
          break;
        case "ArrowRight":
          engine.advance();
          break;
        case "m":
        case "M":
          engine.toggleMirror();
          break;
        case "v":
        case "V":
          stopSpeech();
          setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: !voiceOn } }));
          break;
        default:
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [engine, running, step, voiceOn]);

  /* HANDS-FREE — every spoken command maps to the same action a button
     performs, so voice and taps can be mixed freely mid-set. */
  useEffect(() => {
    setCommandHandler((cmd, phrase) => {
      const muteCoach = (off: boolean) => {
        stopSpeech();
        setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: !off } }));
      };
      switch (cmd) {
        /* spoken corrections write the SAME inline fields a tap would, and
           count as manual, so nothing automatic overwrites them. */
        case "setWeight": {
          const w = weightIn(phrase);
          if (w !== null) {
            editWeight(String(w));
            speak(`Got it — ${w} ${state.settings.units}.`, voiceRef.current, {
              tone: "calm",
              interrupt: false,
            });
          }
          break;
        }
        case "setReps": {
          const r = repsIn(phrase);
          if (r !== null) {
            editReps(String(r));
            speak(`Logged ${r} reps.`, voiceRef.current, { tone: "calm", interrupt: false });
          }
          break;
        }
        case "start":
        case "resume":
          setSessionRunning(true);
          break;
        case "pause":
          setSessionRunning(false);
          break;
        case "next":
          engine.advance();
          break;
        case "previous":
          engine.back();
          break;
        case "repeat":
          engine.repeatStep();
          break;
        case "skip":
          engine.skipStep();
          break;
        case "addTime":
          engine.bumpRest(secondsIn(phrase));
          break;
        case "lessTime":
          engine.bumpRest(-secondsIn(phrase));
          break;
        case "swap":
          navigate({ to: "/workout/$day", params: { day: String(day) } });
          break;
        case "whatsNext":
          speak(
            step?.next ? `Next: ${step.next}` : "Keep going — I'll call the next one.",
            voiceOn,
            {
              tone: "instructional",
            },
          );
          break;
        case "showDemo":
          setDemoOpen(true);
          break;
        case "muteCoach":
          muteCoach(true);
          break;
        case "unmuteCoach":
          muteCoach(false);
          break;
        case "coachLouder":
          nudgeCoach(0.15);
          break;
        case "coachQuieter":
          nudgeCoach(-0.15);
          break;
        case "musicLouder":
          nudgeMusic(0.15);
          break;
        case "musicQuieter":
          nudgeMusic(-0.15);
          break;
        case "musicPause":
          pauseMusic();
          break;
        case "musicResume":
          toggleMusicMute(false);
          playMusic();
          break;
        case "cameraOn":
          void startCamera(pattern);
          break;
        case "cameraOff":
          import("@/lib/vision/camera").then(({ stopCamera }) => stopCamera());
          break;
        case "gesturesOn":
          setGesturesOn(true);
          break;
        case "gesturesOff":
          setGesturesOn(false);
          break;
        case "changeWorkout":
          setChooserOpen(true);
          break;
        case "useProgram":
          updateDay(day, (d) => ({ ...d, sessionPlan: undefined, coachSetupDone: true }));
          break;
        case "end":
          stopSpeech();
          saveAndExit(day, true);
          navigate({ to: "/" });
          break;
        default:
      }
    });
    return () => setCommandHandler(null);
  }, [engine, day, navigate, step?.next, voiceOn]);

  /* CAMERA — gestures drive the same actions as taps and speech, and the
     coach only speaks a form cue when the analyser is confident. */
  useEffect(() => {
    setGestureHandler((g) => {
      switch (g) {
        case "pauseResume":
          setSessionRunning(!running);
          break;
        case "completeSet":
          if (step?.kind === "work") engine.finishWork();
          else engine.advance();
          break;
        case "next":
          engine.advance();
          break;
        case "previous":
          engine.back();
          break;
        case "demo":
          setDemoOpen(true);
          break;
        case "attention":
          engine.repeatStep();
          break;
        default:
      }
    });
    setCueHandler((cue) => {
      if (step?.kind === "work") speak(cue, voiceOn, { tone: "instructional", interrupt: false });
    });
    return () => {
      setGestureHandler(null);
      setCueHandler(null);
    };
  }, [engine, running, step?.kind, voiceOn]);

  /* a new set means a fresh rep count */
  useEffect(() => {
    if (step?.kind === "work") resetReps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  if (!step) return null;

  const doneSets = Object.values(log.exercises).reduce(
    (n, el) => n + el.sets.filter((s) => s.done).length,
    0,
  );
  const nextDay = planForDay(day + 1);

  /* ------------------------------ complete ----------------------------- */
  if (step.kind === "complete") {
    const logged = Object.entries(log.exercises).filter(([, el]) => el.sets.some((s) => s.done));
    const completeMedia = resolveTrainerMedia({
      step,
      lead,
      left,
      speaking: engine.speaking,
      ambient: false,
    });
    return (
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        <div className="relative h-44 overflow-hidden rounded-2xl border border-border sm:h-56">
          <TrainerStageMedia
            decision={completeMedia}
            mirrored={false}
            playing={false}
            rate={1}
            label="Session recap"
          />
        </div>

        <h1 className="mt-4 text-3xl font-bold">Session complete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {plan.title} · {plan.focus}
        </p>

        <section className="surface-card mt-5 grid grid-cols-3 gap-2 rounded-2xl p-4 text-center">
          <div>
            <p className="text-2xl font-black text-primary">
              {mmss(Math.round(elapsedFor(log, Date.now()) / 1000))}
            </p>
            <p className="text-[11px] uppercase text-muted-foreground">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary">{logged.length}</p>
            <p className="text-[11px] uppercase text-muted-foreground">Exercises</p>
          </div>
          <div>
            <p className="text-2xl font-black text-primary">{doneSets}</p>
            <p className="text-[11px] uppercase text-muted-foreground">Sets</p>
          </div>
        </section>

        {(() => {
          /* GAME SCORE — every number below is derived from the logged sets
             above (see src/lib/game-score.ts); nothing is invented. */
          const sc = scoreSession(log, sessionExercises, { completed: true });
          const streakNow = streakThrough(state, day) + (log.completed ? 0 : 1);
          return (
            <section
              data-testid="session-score"
              className="mt-4 rounded-2xl border border-cyan-400/40 bg-gradient-to-b from-card to-background p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-accent">
                    Session score
                  </p>
                  <p className="text-3xl font-black text-primary">{sc.xp} XP</p>
                  <p className="text-xs text-muted-foreground">
                    {sc.doneSets} of {sc.plannedSets} planned sets · {sc.completion}% · {streakNow}{" "}
                    day streak
                  </p>
                </div>
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/15 text-4xl font-black text-primary">
                  {sc.grade}
                </div>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {sc.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      {l.label} × {l.count}
                    </span>
                    <span className="tabular-nums font-bold">+{l.xp}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Grade = planned sets actually done (S 100 · A 90 · B 75 · C 50). Finishing counts
                once you tap Save below.
              </p>
            </section>
          );
        })()}

        {(() => {
          const tracked = logged.flatMap(([id, el]) =>
            el.sets
              .filter((x) => x.vision)
              .map((x) => ({ name: effectiveExercise(state, day, id)?.name ?? id, v: x.vision! })),
          );
          if (!tracked.length) return null;
          return (
            <section className="surface-card mt-4 rounded-2xl p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-accent">
                Camera tracking
              </h2>
              <ul className="mt-2 space-y-1 text-sm">
                {tracked.map((t, n) => (
                  <li key={`${t.name}-${n}`}>
                    <span className="font-semibold">{t.name}</span>{" "}
                    <span className="text-muted-foreground">
                      {t.v.reps} reps · {t.v.romAvg}° average range · {t.v.tempoDown}s down ·{" "}
                      {Math.round(t.v.confidence * 100)}% confidence
                      {t.v.cues[0] ? ` · ${t.v.cues[0]}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}

        <section className="surface-card mt-4 rounded-2xl p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-accent">Logged work</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {logged.map(([id, el]) => (
              <li key={id} className="flex justify-between gap-3">
                <span className="truncate">{effectiveExercise(state, day, id)?.name ?? id}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {el.sets
                    .filter((s) => s.done)
                    .map((s) => [s.weight, s.reps].filter(Boolean).join("×") || "✓")
                    .join(" · ")}
                </span>
              </li>
            ))}
            {logged.length === 0 && <li className="text-muted-foreground">Nothing logged.</li>}
          </ul>
        </section>

        {(() => {
          /* progression notes come from the same performance logic the coach
             speaks — no invented numbers, only what was logged today. */
          const notes = recapLines(state, day, sessionExercises);
          if (!notes.length) return null;
          return (
            <section className="surface-card mt-4 rounded-2xl p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-accent">
                Coach&apos;s notes
              </h2>
              <ul className="mt-2 space-y-1 text-sm">
                {notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </section>
          );
        })()}

        <p className="mt-4 text-sm text-muted-foreground">
          Next scheduled workout:{" "}
          <span className="font-bold text-foreground">
            {nextDay.weekday} · {nextDay.title} — {nextDay.focus}
          </span>
        </p>

        <button
          type="button"
          onClick={() => {
            completeWorkout(day);
            resetCoachSession(day);
            navigate({ to: "/" });
          }}
          className="tap-target mt-6 w-full rounded-xl bg-primary text-base font-bold uppercase text-primary-foreground"
        >
          Save &amp; mark day complete
        </button>
        <button
          type="button"
          onClick={() => engine.goto(0)}
          className="tap-target mt-3 w-full rounded-xl bg-elevated text-sm font-bold uppercase"
        >
          Back to the session
        </button>
      </main>
    );
  }

  const bigNumber =
    lead !== null
      ? lead === 0
        ? "GO"
        : lead === 3 && engine.speaking
          ? "Ready"
          : String(lead)
      : step.speechPaced
        ? (step.reps ?? "")
        : left !== null
          ? mmss(left)
          : (step.reps ?? "");
  const liveLine = currentCue(step, left);

  const tone =
    step.kind === "rest" || step.kind === "cooldown" || step.kind === "prompt"
      ? "text-accent"
      : "text-primary";

  /* A real trainer says what just happened before he starts the rest clock.
     Every number here comes from what was actually logged/counted — nothing
     is invented, and form talk only appears when the camera was confident. */
  const speakSetSummary = (usedReps?: string) => {
    if (step.kind !== "work") return;
    const load = weight ? `${weight} ${state.settings.units}` : "bodyweight";
    const done = (usedReps ?? reps ?? "").toString().trim();
    const what = step.seconds
      ? `That's the time on ${hudExercise}.`
      : done
        ? `${done} at ${load} on ${hudExercise}.`
        : `Set logged on ${hudExercise}.`;
    const form =
      camActive && camConfidence !== null && camConfidence >= 0.7 && lastFormCue
        ? ` ${lastFormCue}`
        : camActive && camConfidence !== null && camConfidence < 0.5
          ? " I couldn't see you clearly enough to call the form on that one."
          : "";
    speak(`${what}${form} Breathe — rest starts now.`, voiceOn, { tone: "reassuring" });
  };

  const primaryAction = () => {
    if (step.kind === "work") {
      speakSetSummary();
      engine.finishWork();
      return;
    }
    engine.advance();
  };
  const primaryLabel =
    step.kind === "work"
      ? step.seconds
        ? "Finish early"
        : "Done set"
      : step.kind === "rest"
        ? "Skip rest"
        : step.speechPaced
          ? step.kind === "brief"
            ? "Skip to the set"
            : "Skip ahead"
          : "Continue";

  const toggleVoice = () => {
    stopSpeech();
    setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: !voiceOn } }));
  };
  const endWorkout = () => {
    stopSpeech();
    saveAndExit(day, true);
    navigate({ to: "/" });
  };

  const loggedRows = Object.entries(log.exercises).filter(([, el]) => el.sets.some((s) => s.done));

  /* ---------------- coach presence + set intelligence ---------------- */
  const coachClip = move ? coachMotionFor(move.id) : undefined;
  const stepExercise = step.exerciseId ? effectiveExercise(state, day, step.exerciseId) : undefined;
  /* Telling the trainer "give me something else" has to work during rest and
     transitions too — fall back to the movement we're resting into. */
  const swapExerciseId =
    step.exerciseId ??
    (() => {
      for (let k = i + 1; k < script.length; k++)
        if (script[k].exerciseId) return script[k].exerciseId;
      for (let k = i - 1; k >= 0; k--) if (script[k].exerciseId) return script[k].exerciseId;
      return undefined;
    })();
  const swapExercise = swapExerciseId ? effectiveExercise(state, day, swapExerciseId) : undefined;
  const substituted = step.exerciseId ? log.exercises[step.exerciseId]?.replacedWith : undefined;
  const sideMatch = /\b(left|right)\b/i.exec(`${step.title} ${step.detail ?? ""}`);
  const lastFormCue = Object.values(log.exercises)
    .flatMap((el) => el.sets)
    .filter((s) => s.vision?.cues?.length)
    .slice(-1)[0]?.vision?.cues[0];

  /* STAGE INVARIANT — the visible moving clip may ONLY ever be the verified
     clip of the CURRENT movement (coachMotionFor(move.id)). If the current
     movement has no verified clip we show the approved coach still plus an
     honest "motion pending" label. clipAfter() is used exclusively for hidden
     cache warming of an upcoming movement; it can never become visible. */
  const clipAfter = (from: number, notUrl?: string) => {
    for (let k = from; k < script.length; k++) {
      const m = mirrorFor(script[k].mirror);
      if (!m) continue;
      const c = coachMotionFor(m.id);
      if (c && c.url !== notUrl) return c;
    }
    return undefined;
  };
  /* UPCOMING MOVEMENT — used for spoken/visible preparation and hidden cache
     warming only. It never becomes the visible stage clip before its work step. */
  const upcoming = (() => {
    for (let k = i + 1; k < script.length; k++) {
      const s = script[k];
      if (s.kind !== "work" && s.kind !== "cooldown") continue;
      const m = mirrorFor(s.mirror);
      if (!m) continue;
      return {
        name: m.name,
        clip: coachMotionFor(m.id),
        sameExercise: Boolean(step.exerciseId) && s.exerciseId === step.exerciseId,
      };
    }
    return undefined;
  })();
  const trainerMedia = resolveTrainerMedia({
    step,
    lead,
    left,
    speaking: engine.speaking,
    exactMotion: coachClip,
    ambient: false,
  });
  const stageVideoVisible = trainerMedia.mode === "motion";
  const previewing = false;
  const motionMissing =
    (step.kind === "work" || step.kind === "cooldown") && Boolean(move) && !coachClip;
  const previewCue = !upcoming
    ? ""
    : upcoming.sameExercise
      ? `Next set: ${upcoming.name}. Same setup. Watch my path.`
      : `Next is ${upcoming.name}. Controlled path — watch me.`;
  /* Prep/countdown/rest preload the exact movement they are about to reveal.
     Once that movement is visible, only then warm the later distinct clip. */
  const preloadClip =
    trainerMedia.mode === "static" && coachClip
      ? coachClip
      : clipAfter(i + 1, trainerMedia.motion?.url);
  const showMovement = stageVideoVisible;
  const coachState = coachStateFor(step, {
    cameraOn: camActive,
    speaking: engine.speaking,
    demoVisible: showMovement,
    coachClip: showMovement && Boolean(coachClip),
  });
  const eyeContact = trainerMedia.mode === "static" && engine.speaking;

  const chip = (text: string, tone: "muted" | "primary" | "accent" = "muted") => (
    <span
      key={text}
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm ${
        tone === "primary"
          ? "bg-primary/25 text-primary"
          : tone === "accent"
            ? "bg-accent/20 text-accent"
            : "bg-black/55 text-white/80"
      }`}
    >
      {text}
    </span>
  );

  /* ------------------------------ game layer ------------------------------ */
  const score = scoreSession(log, sessionExercises);
  const streakNow = streakThrough(state, day);
  /* canonical phase — coach stage, HUD, voice and tracking all read this */
  const phaseInfo = phaseFor(step);
  const form = formScore(liveMetrics);
  /* shared tempo model: the coach's cadence, the pace read-out and the pace
     cues all come from the same target seconds-per-rep. */
  const stepPattern = patternFor(step.exerciseId) ?? liveMetrics?.pattern ?? null;
  const tempo = tempoFor(step.exerciseId, stepPattern);
  const measuredHalves =
    liveMetrics && liveMetrics.tempoDown > 0
      ? { down: liveMetrics.tempoDown, up: liveMetrics.tempoUp }
      : null;
  /* pace: primarily "are you keeping up with the coach's reps", falling
     back to tempo-versus-target when he isn't counting reps right now. */
  const paceVsCoach: PaceState = cadenceLive && camActive ? repPace(camReps, coachRep) : "unknown";
  const pace =
    paceVsCoach !== "unknown"
      ? { state: paceVsCoach, delta: 0 }
      : paceCompare(phaseInfo.trackingActive ? measuredHalves : null, tempo);
  const romPct = romPercent(liveMetrics);
  const sync = syncScore(measuredHalves, tempo, romPct, liveMetrics?.confidence ?? 0);
  /* keep the cue engine's context current without re-creating the timer */
  cueCtx.current = {
    phase: phaseInfo.phase,
    pace: pace.state,
    metrics: liveMetrics,
    rules: trackingRulesFor(step.exerciseId),
    repTarget: step.kind === "work" && !step.seconds ? targetTop(step.reps) : null,
    restSeconds: step.kind === "rest" ? step.seconds : undefined,
  };
  const hudStep =
    step.kind === "work" ||
    step.kind === "rest" ||
    step.kind === "brief" ||
    step.kind === "cooldown";
  const camTargetTop = step.kind === "work" && !step.seconds ? targetTop(step.reps) : null;
  const camConfirmReady =
    camTargetTop !== null && camReps !== null && camConfidence >= 0.7 && camReps >= camTargetTop;
  const hudExercise = substituted ?? stepExercise?.name ?? move?.name ?? step.title;
  const showBig =
    !(hudStep && lead === null && step.kind === "work" && !step.seconds) && bigNumber !== "";
  /* an exercise is actually running: keep the screen as clear as possible */
  const activeSet = step.kind === "work" && lead === null;

  /* THE DOCK LINE — one short sentence of truth at the bottom of the glass. */
  const setLabel =
    step.setIndex !== undefined && step.totalSets
      ? `Set ${step.setIndex + 1}/${step.totalSets}`
      : step.totalSets
        ? `${step.totalSets} sets`
        : undefined;
  const dockLine =
    step.kind === "rest"
      ? step.next
        ? `Next: ${step.next}`
        : "Recover"
      : [
          setLabel,
          step.reps ? `${step.reps}` : undefined,
          cadenceLive && cadenceTotal ? `rep ${coachRep}/${cadenceTotal}` : undefined,
        ]
          .filter(Boolean)
          .join(" · ") || step.section;

  /* Everything else stays behind "Details" — same numbers as before, just
     no longer painted across the coach. */
  const hudProps: HudProps = {
    exercise: step.kind === "rest" ? `Rest · next ${step.next ?? "set"}` : hudExercise,
    section: step.section,
    mission: `${score.clearedExercises}/${score.totalExercises} cleared`,
    setLabel:
      step.setIndex !== undefined && step.totalSets
        ? `${step.setIndex + 1}/${step.totalSets}`
        : step.totalSets
          ? `0/${step.totalSets}`
          : undefined,
    target: step.reps,
    phase: phaseInfo.label,
    formScore: form.score,
    streak: streakNow,
    pace: phaseInfo.trackingActive ? PACE_LABEL[pace.state] : "—",
    romPct: phaseInfo.trackingActive ? romPct : null,
    liveReps: step.kind === "work" && !step.seconds ? camReps : null,
    coachRep: cadenceLive ? coachRep : null,
    repTotal: cadenceTotal,
    load: step.kind === "work" ? weight : undefined,
    restLeft: step.kind === "rest" && left !== null ? left : null,
    camera: !pattern ? "unsupported" : camActive ? "watching" : "off",
    cameraConfidence: camConfidence ?? undefined,
    progress,
    xp: score.xp,
    next: step.kind !== "rest" ? step.next : undefined,
  };

  const railBtn = (
    label: string,
    Icon: typeof Pause,
    onClick: () => void,
    opts: { active?: boolean; pressed?: boolean; danger?: boolean; testId?: string } = {},
  ) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={opts.pressed}
      data-testid={opts.testId}
      className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm ${
        opts.danger
          ? "bg-black/55 text-red-300"
          : opts.active
            ? "bg-primary/30 text-primary"
            : "bg-black/55 text-white/85"
      }`}
    >
      <Icon className="size-4" />
      <span className="truncate">{label}</span>
    </button>
  );

  const camSupportedHere = Boolean(pattern);
  /* ± step follows the units the app already uses: a plate jump in pounds,
     a small plate pair in kilos. No separate weight system is invented. */
  const weightStep = state.settings.units === "kg" ? 2.5 : 5;
  // Setup only takes the screen once the coach has actually asked for it.
  const camOverlayVisible = camOpen || (!log.coachSetupDone && setupPrompted);

  /* the full manual log form lives in a sheet — one tap away, never on stage */
  const logForm = (
    <>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] uppercase text-muted-foreground">
            Weight ({state.settings.units})
          </span>
          <input
            inputMode="decimal"
            aria-label="Weight used"
            value={weight}
            onChange={(e) => editWeight(e.target.value)}
            placeholder="BW"
            className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-lg font-bold tabular-nums"
          />
        </label>
        <label className="block">
          <span className="text-[11px] uppercase text-muted-foreground">Reps done</span>
          <div className="mt-1 flex items-stretch gap-1">
            <button
              type="button"
              aria-label="One rep fewer"
              onClick={() => editReps(String(Math.max(0, (Number(reps) || 0) - 1)))}
              className="tap-target w-12 rounded-xl bg-elevated text-xl font-black"
            >
              −
            </button>
            <input
              inputMode="numeric"
              aria-label="Reps completed"
              value={reps}
              onChange={(e) => editReps(e.target.value)}
              placeholder={step.reps}
              className="tap-target w-full min-w-0 rounded-xl border border-input bg-elevated px-2 text-center text-lg font-bold tabular-nums"
            />
            <button
              type="button"
              aria-label="One rep more"
              onClick={() => editReps(String((Number(reps) || 0) + 1))}
              className="tap-target w-12 rounded-xl bg-elevated text-xl font-black"
            >
              +
            </button>
          </div>
        </label>
      </div>
      {camReps !== null && camReps !== Number(reps) && (
        <button
          type="button"
          onClick={() => editReps(String(camReps))}
          className="mt-2 w-full rounded-xl border border-accent bg-accent/10 px-3 py-2 text-sm font-bold text-accent"
        >
          Camera counted {camReps} reps — tap to use, or type your own
        </button>
      )}
      {!pattern && (
        <p className="mt-2 text-xs text-muted-foreground">
          Camera rep counting is not available for this movement — type your reps here and the coach
          will use your numbers.
        </p>
      )}
      <div className="mt-2 grid grid-cols-4 gap-1.5" role="group" aria-label="Set type">
        {(
          [
            ["warmup", "Warm-up"],
            ["work", "Work"],
            ["drop", "Drop"],
            ["backoff", "Back-off"],
          ] as ["warmup" | "work" | "drop" | "backoff", string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={setKind === k}
            onClick={() => setSetKind(k)}
            className={`tap-target rounded-xl text-xs font-bold uppercase ${setKind === k ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {(
          [
            ["easy", "Easy"],
            ["good", "Right"],
            ["hard", "Hard"],
          ] as [SetFeel, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={feel === k}
            onClick={() => setFeel(feel === k ? undefined : k)}
            className={`tap-target rounded-xl text-sm font-bold uppercase ${feel === k ? "bg-accent text-accent-foreground" : "bg-elevated text-muted-foreground"}`}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={showRpe}
          onClick={() => setShowRpe((v) => !v)}
          className={`tap-target rounded-xl text-sm font-bold uppercase ${rpe ? "bg-accent text-accent-foreground" : "bg-elevated text-muted-foreground"}`}
        >
          {rpe ? `RPE ${rpe}` : "RPE"}
        </button>
      </div>
      {showRpe && (
        <div className="mt-1.5 grid grid-cols-10 gap-1" role="radiogroup" aria-label="RPE 1 to 10">
          {Array.from({ length: 10 }, (_, n) => n + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rpe === n}
              onClick={() => {
                setRpe(rpe === n ? undefined : n);
                setShowRpe(false);
              }}
              className={`min-h-10 rounded-lg text-sm font-bold tabular-nums ${rpe === n ? "bg-accent text-accent-foreground" : "bg-elevated"}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setLogOpen(false);
          engine.finishWork();
        }}
        className="tap-target mt-3 w-full rounded-xl bg-primary text-base font-black uppercase text-primary-foreground"
      >
        Log &amp; rest
      </button>
    </>
  );

  return (
    <main
      data-testid="coach-stage"
      data-step-kind={step.kind}
      data-step-id={step.id}
      data-running={running ? "true" : "false"}
      data-lead={lead === null ? "null" : lead}
      data-countdown-events={engine.countdownEvents.join(",")}
      data-trainer-state={trainerMedia.state}
      data-media-mode={trainerMedia.mode}
      data-preview={previewing ? "true" : "false"}
      data-preview-clip={previewing ? (trainerMedia.motion?.url ?? "") : ""}
      className="fixed inset-0 z-[45] overflow-hidden bg-black text-white"
    >
      <RestPreviewCue active={previewing} text={previewCue} voiceOn={voiceOn} />
      <CoachAudioGate
        status={engine.voiceStatus}
        voiceOn={voiceOn}
        title={`${plan.weekday} · ${plan.title}`}
        onEnable={engine.enableAudio}
        /* during the entrance the mirror itself takes the tap */
        suppressed={!portalSeen}
        onSkip={() => setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: false } }))}
      />

      {/* ============================ THE STAGE ============================
          One resolver owns every handoff: speaking/setup/countdown/rest states
          use the pixel-stable approved still; only an active exact movement
          may show video. Upcoming clips remain hidden preload data. */}
      <div className="absolute inset-0" data-testid="stage-backdrop">
        <div
          data-testid="stage-frame"
          data-framing={stageVideoVisible ? "work" : "static"}
          className="absolute inset-0"
        >
          <TrainerStageMedia
            decision={trainerMedia}
            preloadMotion={preloadClip}
            mirrored={mirrored}
            playing={running && stageVideoVisible}
            rate={previewing ? 1 : coachRate(tempo)}
            label={
              previewing
                ? `${upcoming?.name ?? "Next movement"} — preview, coming up next`
                : `${move?.name ?? "Coach"} — moving demonstration`
            }
          />
          {motionMissing && (
            <div
              data-testid="coach-motion-production"
              className="pointer-events-none absolute inset-x-4 top-[18%] z-10 text-center"
            >
              <span className="inline-flex max-w-full rounded-md border border-primary/60 bg-background/85 px-3 py-2 text-xs font-black uppercase text-foreground backdrop-blur-sm">
                FULL MOTION DEMO IN PRODUCTION
              </span>
            </div>
          )}
        </div>
        {/* DEPTH — a soft studio vignette and restrained top/bottom falloff.
            The coach sits inside a lit room, not on a flat page. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,transparent_45%,rgba(0,0,0,0.72)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/92 via-black/55 to-transparent" />
      </div>

      {/* ALWAYS-READY START — the coach is already in the room and moving.
          "Good morning, Coach" (or a tap) wakes him; he approaches, makes
          eye contact and asks the question. YES walks straight into the
          session, NO keeps him present and offers a softer one. */}
      {!portalSeen && (
        <CoachWake
          title={`${plan.weekday} · ${plan.title}`}
          subtitle={plan.focus}
          voiceOn={voiceOn}
          /* this tap IS the gesture that turns his voice on — nothing else
             in the session asks the user to press play */
          onEnter={() => voiceOn && void engine.enableAudio()}
          onYes={() => {
            setPortalSeen(true);
            engine.setRunning(true);
          }}
          onAlt={(kind) => {
            const anyLogged = Object.values(log.exercises).some((el) =>
              el.sets.some((s) => s.done),
            );
            if (!anyLogged) {
              const alt = altSessionPlan(kind, state, day);
              updateDay(day, (d) => ({
                ...d,
                sessionPlan: alt,
                exercises: {},
                cursor: 0,
                completed: false,
                completedAt: undefined,
              }));
            }
            setPortalSeen(true);
            engine.setRunning(true);
          }}
          onNotToday={() => void navigate({ to: "/" })}
        />
      )}

      {/* ============================ TOP HUD ============================ */}
      <div className="absolute inset-x-0 top-0 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            {state.userAvatar.kind === "uploaded" && state.userAvatar.image && (
              <img
                src={state.userAvatar.image}
                alt={
                  state.userAvatar.displayName
                    ? `${state.userAvatar.displayName} avatar`
                    : "Your avatar"
                }
                className={`size-7 shrink-0 object-cover ${state.userAvatar.shape === "circle" ? "rounded-full" : "rounded-md"} ${state.userAvatar.frame === "gold" ? "ring-2 ring-primary" : state.userAvatar.frame === "cyan" ? "ring-2 ring-accent" : ""}`}
              />
            )}
            {/* No product labels during the workout — the coach and the work
                are the screen. Only his current state, quietly. */}
            <span className="truncate rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-sm">
              {coachState.label}
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Flip the coach left to right"
              aria-pressed={mirrored}
              onClick={engine.toggleMirror}
              className={`grid size-9 place-items-center rounded-lg backdrop-blur-sm ${mirrored ? "bg-primary/30 text-primary" : "bg-black/55"}`}
            >
              <FlipHorizontal2 className="size-4" />
            </button>
            <CoachAudioBadge
              status={engine.voiceStatus}
              voiceOn={voiceOn}
              onEnable={() => void engine.enableAudio()}
              onToggleMute={toggleVoice}
            />
            <WorkoutModeButton
              day={day}
              current="coach"
              dark
              isLeader={engine.isLeader}
              onClaimVoice={engine.claimVoice}
            />
            <button
              type="button"
              aria-label="End workout"
              onClick={endWorkout}
              className="grid size-9 place-items-center rounded-lg bg-black/55 backdrop-blur-sm"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* one hairline of progress — no stat grid over the coach */}
        <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ============================ BOTTOM ============================ */}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* only state the client genuinely needs, one short row, low down */}
        <div className="mb-1 flex flex-wrap gap-1 empty:hidden">
          {!running && chip("Paused", "accent")}
          {eyeContact && chip("Talking to you", "primary")}
          {cadenceLive && chip(`Rep ${coachRep} of ${cadenceTotal ?? "—"}`, "primary")}
          {step.kind === "work" && setKind !== "work" && chip(`${setKind} set`, "primary")}
          {sideMatch && chip(`${sideMatch[1]} side`)}
          {substituted && chip(`Swapped → ${substituted}`, "accent")}
          {motionMissing && chip("FULL MOTION DEMO IN PRODUCTION")}
          {previewing &&
            chip(
              upcoming?.sameExercise ? "Preview · next set" : `Preview · ${upcoming?.name}`,
              "accent",
            )}
          {step.kind === "rest" &&
            !previewing &&
            upcoming &&
            !upcoming.clip &&
            chip(`Next: ${upcoming.name} · motion pending`)}
          {stepPattern &&
            phaseInfo.phase === "EXERCISE_PREP" &&
            cam.status === "live" &&
            !cam.calibration.ready &&
            chip(cam.calibration.prompt, "accent")}
          {step.kind === "work" && !pattern && chip("Log by hand or voice")}
          {step.kind === "work" && pattern && !camActive && chip("Camera off")}
        </div>

        <CaptionStrip text={liveLine} speaking={engine.speaking} />

        {/* INLINE SET STRIP — weight and reps stay editable right here on the
            stage. No sheet for a normal set: tap a number and type, or use ±.
            The sheet keeps only the secondary details (RPE, feel, set type). */}
        {step.kind === "work" && step.logging && !step.seconds && (
          <div className="mt-1.5" data-testid="set-log">
            <div className="grid grid-cols-2 gap-1.5" data-testid="inline-set-strip">
              <div className="rounded-xl bg-black/55 px-1.5 py-1 backdrop-blur-sm">
                <span className="block px-1 text-[9px] font-bold uppercase tracking-widest text-white/60">
                  Weight ({state.settings.units})
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Less weight"
                    data-testid="weight-minus"
                    onClick={() =>
                      editWeight(String(Math.max(0, (Number(weight) || 0) - weightStep)))
                    }
                    className="size-8 shrink-0 rounded-lg bg-white/10 text-lg font-black leading-none"
                  >
                    −
                  </button>
                  <input
                    inputMode="decimal"
                    aria-label="Weight used"
                    data-testid="inline-weight"
                    value={weight}
                    onChange={(e) => editWeight(e.target.value)}
                    placeholder="BW"
                    className="min-w-0 flex-1 rounded-lg bg-transparent py-1 text-center text-lg font-black tabular-nums outline-none focus:bg-white/10"
                  />
                  <button
                    type="button"
                    aria-label="More weight"
                    data-testid="weight-plus"
                    onClick={() => editWeight(String((Number(weight) || 0) + weightStep))}
                    className="size-8 shrink-0 rounded-lg bg-white/10 text-lg font-black leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="rounded-xl bg-black/55 px-1.5 py-1 backdrop-blur-sm">
                <span className="block px-1 text-[9px] font-bold uppercase tracking-widest text-white/60">
                  Reps {setKind !== "work" ? `· ${setKind}` : ""}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="One rep fewer"
                    data-testid="reps-minus"
                    onClick={() => editReps(String(Math.max(0, (Number(reps) || 0) - 1)))}
                    className="size-8 shrink-0 rounded-lg bg-white/10 text-lg font-black leading-none"
                  >
                    −
                  </button>
                  <input
                    inputMode="numeric"
                    aria-label="Reps completed"
                    data-testid="inline-reps"
                    value={reps}
                    onChange={(e) => editReps(e.target.value)}
                    placeholder={step.reps}
                    className="min-w-0 flex-1 rounded-lg bg-transparent py-1 text-center text-lg font-black tabular-nums outline-none focus:bg-white/10"
                  />
                  <button
                    type="button"
                    aria-label="One rep more"
                    data-testid="reps-plus"
                    onClick={() => editReps(String((Number(reps) || 0) + 1))}
                    className="size-8 shrink-0 rounded-lg bg-white/10 text-lg font-black leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {camReps !== null && camReps !== Number(reps) && (
                <button
                  type="button"
                  data-testid="camera-suggestion"
                  onClick={() => editReps(String(camReps))}
                  className="min-h-8 flex-1 rounded-lg border border-accent/60 bg-accent/15 px-2 text-xs font-bold text-accent backdrop-blur-sm"
                >
                  Camera: {camReps} — tap to use
                </button>
              )}
              <button
                type="button"
                aria-expanded={logOpen}
                data-testid="set-details"
                onClick={() => setLogOpen(true)}
                className="min-h-8 shrink-0 rounded-lg bg-black/55 px-2 text-[11px] font-bold uppercase tracking-wide text-accent backdrop-blur-sm"
              >
                Details{hint ? ` · ${hint}` : ""}
              </button>
            </div>
          </div>
        )}

        {left !== null && step.kind === "rest" && (
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => engine.bumpRest(-15)}
              className="min-h-10 rounded-xl bg-black/55 text-sm font-bold uppercase backdrop-blur-sm"
            >
              <Minus className="mr-1 inline size-4" /> 15s
            </button>
            <button
              type="button"
              onClick={() => engine.bumpRest(15)}
              className="min-h-10 rounded-xl bg-black/55 text-sm font-bold uppercase backdrop-blur-sm"
            >
              <Plus className="mr-1 inline size-4" /> 15s
            </button>
          </div>
        )}

        {camConfirmReady && camReps !== null ? (
          <button
            type="button"
            data-testid="confirm-camera"
            onClick={() => {
              confirmReps.current = String(camReps);
              editReps(String(camReps));
              speakSetSummary(String(camReps));
              engine.finishWork();
            }}
            className="mt-1.5 min-h-11 w-full rounded-xl bg-accent text-base font-black uppercase tracking-wide text-accent-foreground"
          >
            Confirm camera count · {camReps} reps
          </button>
        ) : (
          <button
            type="button"
            data-testid="primary-action"
            onClick={primaryAction}
            className={`mt-1.5 w-full rounded-xl font-black uppercase tracking-wide backdrop-blur-sm ${
              activeSet || step.kind === "brief"
                ? "min-h-9 border border-primary/50 bg-primary/20 text-xs text-primary"
                : "min-h-11 bg-primary text-base text-primary-foreground"
            }`}
          >
            {primaryLabel}
          </button>
        )}

        {/* THE DOCK — the only permanent read-out on the screen */}
        <div className="mt-1.5">
          <CoachDock
            exercise={step.kind === "rest" ? "Rest" : hudExercise}
            line={dockLine}
            clock={showBig ? bigNumber : undefined}
            clockTone={tone === "text-accent" ? "accent" : "primary"}
            detailsOpen={statsOpen}
            onToggleDetails={() => setStatsOpen((v) => !v)}
            hud={hudProps}
          />
        </div>

        {/* controls disappear into the experience: pause, skip, more */}
        <div className="mt-1.5 grid grid-cols-3 gap-1" data-testid="control-rail">
          {railBtn(
            running ? "Pause" : "Resume",
            running ? Pause : Play,
            () => setSessionRunning(!running),
            { testId: "rail-pause" },
          )}
          {railBtn("Skip", SkipForward, engine.skipStep, { testId: "rail-skip" })}
          {railBtn("More", MoreHorizontal, () => setMoreOpen(true), { testId: "rail-more" })}
        </div>
      </div>

      {/* ====================== CAMERA (always mounted) ======================
          The camera panel stays mounted so tracking never stops when it is
          hidden; it slides over the stage on demand or during first setup. */}
      <div
        data-testid="camera-drawer"
        data-open={camOverlayVisible ? "true" : "false"}
        className={
          camOverlayVisible
            ? "absolute inset-x-0 bottom-0 z-[48] max-h-[72vh] overflow-y-auto rounded-t-2xl border-t border-border bg-background/97 p-3 text-foreground backdrop-blur"
            : "pointer-events-none fixed -left-[9999px] top-0 w-[360px] opacity-0"
        }
        aria-hidden={!camOverlayVisible}
      >
        {camOverlayVisible && (
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-primary">
              {!log.coachSetupDone ? "Coach setup" : "Camera & gestures"}
            </p>
            {log.coachSetupDone && (
              <button
                type="button"
                aria-label="Close camera panel"
                onClick={() => setCamOpen(false)}
                className="grid size-9 place-items-center rounded-lg bg-elevated"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <CameraCoach
          pattern={pattern}
          exerciseName={stepExercise?.name ?? undefined}
          voiceOn={voiceOn}
          onVoiceToggle={toggleVoice}
          onChangeWorkout={() => setChooserOpen(true)}
          setupPending={!log.coachSetupDone}
          onSetupComplete={() => {
            updateDay(day, (d) => ({ ...d, coachSetupDone: true }));
            setCamOpen(false);
            engine.setRunning(true);
          }}
        />
        {!camSupportedHere && camOverlayVisible && log.coachSetupDone && (
          <p className="mt-2 text-xs text-muted-foreground">
            The camera can&apos;t count this movement — the workout keeps going; log by tap or
            voice.
          </p>
        )}
      </div>

      {/* ============================ SHEETS ============================ */}
      {logOpen && step.kind === "work" && (
        <SheetPanel
          title="Adjust this set"
          subtitle={`${hudExercise} · set ${(step.setIndex ?? 0) + 1}${step.totalSets ? ` of ${step.totalSets}` : ""}${hint ? ` · ${hint}` : ""}`}
          onClose={() => setLogOpen(false)}
        >
          {logForm}
        </SheetPanel>
      )}

      {swapOpen && swapExercise && swapExerciseId && (
        <SheetPanel
          title="Swap this exercise"
          subtitle="The session keeps running — same sets, same effort."
          onClose={() => setSwapOpen(false)}
        >
          <SubstitutionSelect
            exercise={swapExercise}
            value={substituted}
            onChange={(v) => {
              const id = swapExerciseId;
              updateDay(day, (d) => ({
                ...d,
                exercises: {
                  ...d.exercises,
                  [id]: { ...(d.exercises[id] ?? { sets: [] }), replacedWith: v },
                },
              }));
              setSwapOpen(false);
              speak(
                v
                  ? `We're switching to ${v}. Same sets, same effort — I'll keep counting.`
                  : `Back to ${swapExercise.name}. Picking up where we left off.`,
                voiceOn,
                { tone: "instructional" },
              );
            }}
          />
        </SheetPanel>
      )}

      {moreOpen && (
        <SheetPanel
          title="Session controls"
          subtitle={`${plan.weekday} · ${plan.title}`}
          onClose={() => setMoreOpen(false)}
        >
          {/* moved off the stage: camera, voice, gestures, swap */}
          <div className="mb-2 grid grid-cols-4 gap-2">
            {[
              {
                label: camActive ? "Camera on" : "Camera off",
                Icon: camActive ? Camera : CameraOff,
                on: camActive,
                act: () => setCamOpen((v) => !v),
                testId: "rail-camera",
              },
              {
                label: voiceOn ? "Voice on" : "Muted",
                Icon: voiceOn ? Volume2 : VolumeX,
                on: voiceOn,
                act: toggleVoice,
              },
              {
                label: "Gestures",
                Icon: Hand,
                on: cam.gesturesOn,
                act: () => setGesturesOn(!cam.gesturesOn),
              },
              {
                label: "Swap move",
                Icon: ArrowLeftRight,
                on: Boolean(substituted),
                act: () => {
                  setSwapOpen(true);
                  setMoreOpen(false);
                },
                testId: "rail-swap",
              },
            ].map(({ label, Icon, on, act, testId }) => (
              <button
                key={label}
                type="button"
                data-testid={testId}
                onClick={act}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold uppercase tracking-wide ${
                  on ? "bg-primary/20 text-primary" : "bg-elevated text-muted-foreground"
                }`}
              >
                <Icon className="size-4" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                engine.back();
                setMoreOpen(false);
              }}
              className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-elevated text-xs font-bold uppercase"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                engine.repeatStep();
                setMoreOpen(false);
              }}
              className="flex min-h-12 items-center justify-center gap-1 rounded-xl bg-elevated text-xs font-bold uppercase"
            >
              <RotateCcw className="size-4" /> Repeat
            </button>
            <button
              type="button"
              onClick={() => {
                setDemoOpen(true);
                setMoreOpen(false);
              }}
              className="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-accent bg-accent/10 text-xs font-bold uppercase text-accent"
            >
              <Eye className="size-4" /> Demo
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setChooserOpen(true);
              setMoreOpen(false);
            }}
            className="tap-target w-full rounded-xl bg-elevated text-sm font-bold uppercase"
          >
            Change workout
          </button>
          {step.cues.filter(Boolean).filter((c) => c !== liveLine).length > 0 && (
            <ul className="space-y-1.5">
              {step.cues
                .filter(Boolean)
                .filter((c) => c !== liveLine)
                .map((c) => (
                  <li
                    key={c}
                    className="rounded-xl border-l-4 border-primary bg-elevated px-3 py-2 text-sm font-semibold"
                  >
                    {c}
                  </li>
                ))}
            </ul>
          )}
          {["walk", "treadmill", "weighted-vest-walk", "cardio"].includes(
            log.sessionPlan?.activityType ?? "",
          ) && <HealthPanel day={day} />}
          <SessionAudio />
          <CoachAudioPanel isLeader={engine.isLeader} muted={!voiceOn} />
          {/* View switching lives in the shared mode menu in the top bar — the
              same control, in the same place, in every workout view. */}

          {loggedRows.length > 0 && (
            <section className="rounded-2xl bg-elevated p-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-accent">Session log</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {loggedRows.map(([id, el]) => (
                  <li key={id} className="flex justify-between gap-3">
                    <span className="truncate">
                      {effectiveExercise(state, day, id)?.name ?? id}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {el.sets
                        .filter((s) => s.done)
                        .map((s) => [s.weight, s.reps].filter(Boolean).join("×") || "✓")
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="text-xs text-muted-foreground">
            {coachState.detail}
            {!running ? ` · Paused — ${coaching.restCue}` : ""}
          </p>
          <button
            type="button"
            onClick={endWorkout}
            className="tap-target w-full rounded-xl border border-destructive/50 bg-destructive/10 text-sm font-bold uppercase text-destructive"
          >
            End workout
          </button>
        </SheetPanel>
      )}

      {demoOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/95 p-4">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <div className="relative h-[55vh] overflow-hidden rounded-2xl border border-border">
                <TrainerStageMedia
                  decision={
                    coachClip
                      ? { state: "ACTIVE_SET", mode: "motion", motion: coachClip }
                      : { state: "EXERCISE_PREP", mode: "static" }
                  }
                  mirrored={mirrored}
                  playing={running && Boolean(coachClip)}
                  rate={coachRate(tempo)}
                  label={`${move?.name ?? "Coach"} — demonstration`}
                />
                {move && !coachClip && (
                  <div className="pointer-events-none absolute inset-x-4 top-4 text-center">
                    <span className="inline-flex max-w-full rounded-md border border-primary/60 bg-background/85 px-3 py-2 text-xs font-black uppercase text-foreground backdrop-blur-sm">
                      FULL MOTION DEMO IN PRODUCTION
                    </span>
                  </div>
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-lg font-bold">{move?.name ?? step.title}</p>
            <button
              type="button"
              onClick={() => setDemoOpen(false)}
              className="tap-target mt-3 w-full rounded-xl bg-primary text-sm font-black uppercase text-primary-foreground"
            >
              Close demonstration
            </button>
          </div>
        </div>
      )}
      <ActivityChooser
        day={day}
        open={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onSelect={() => {
          updateDay(day, (d) => ({ ...d, coachSetupDone: true }));
          resetCoachSession(day);
          engine.setRunning(true);
        }}
      />
    </main>
  );
}