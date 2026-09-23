/**
 * BIG SCREEN — the premium TV / computer output of the SAME session.
 * ------------------------------------------------------------------
 * Driven by a computer into a 55–65" TV (HDMI, casting or screen share).
 * The coach fills the frame life-size; only four overlays are allowed:
 * the movement name, the set/rep or clock, one coaching cue, and a
 * compact bottom status strip. Everything else lives on the phone.
 *
 * Opened on a phone-sized window the same route becomes the REMOTE:
 * the same canonical session, driven with large buttons. No workout
 * state lives here — the shared DayLog + coach engine own all of it.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Maximize2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { TrainerStageMedia } from "@/components/TrainerStageMedia";
import { WorkoutModeButton, toggleFullScreen } from "@/components/WorkoutModeMenu";
import { CoachAudioGate } from "@/components/CoachAudio";
import { stopSpeech } from "@/lib/coach-voice";
import { coachMotionFor } from "@/data/coach-identity";
import { mirrorFor } from "@/data/mirror-me";
import { effectiveExercise, effectiveExercises, effectivePlan } from "@/lib/activities";
import { buildCoachScript, currentCue } from "@/lib/coach-script";
import { recordWorkStep, useCoachEngine } from "@/lib/coach-session";
import { resolveTrainerMedia } from "@/lib/trainer-media-state";
import { prefillFor } from "@/lib/performance";
import { currentDayNumber, getDay, setState, supersetsOn, useApp } from "@/lib/store";

export const Route = createFileRoute("/presentation")({
  validateSearch: (s: Record<string, unknown>): { day?: number } => ({
    day: s.day === undefined ? undefined : Number(s.day) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Big Screen — Life-Size Coach-Led Workout on Your TV" },
      {
        name: "description",
        content:
          "Send the coached session to a TV or monitor: life-size coach, movement name, set and clock, one cue and a compact status strip. Your phone stays the remote.",
      },
      { property: "og:title", content: "Big Screen — Life-Size Coach-Led Workout on Your TV" },
      {
        property: "og:description",
        content:
          "The same coached session, life-size on the big screen, controlled from your phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BigScreenMode,
});

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function useIsRemote() {
  const [remote, setRemote] = useState(false);
  useEffect(() => {
    const check = () => setRemote(window.innerWidth < 820);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return remote;
}

function BigScreenMode() {
  const state = useApp();
  const search = Route.useSearch();
  const [mounted, setMounted] = useState(false);
  const [chrome, setChrome] = useState(true);
  const isRemote = useIsRemote();
  useEffect(() => setMounted(true), []);
  const day = search.day ?? (mounted ? currentDayNumber(state) : 1);
  const plan = effectivePlan(state, day);
  const sessionExercises = effectiveExercises(state, day);
  const log = getDay(state, day);

  const doneSetsNow = Object.values(log.exercises).reduce(
    (n, el) => n + el.sets.filter((s) => s.done).length,
    0,
  );
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
          recap: { doneSets: doneSetsNow },
          perf: { state, day },
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

  /* Passive by default: the phone keeps the clock and the voice unless this
     screen claims them. Either way both read the SAME canonical session. */
  const engine = useCoachEngine(
    day,
    script,
    (s, info) => {
      const e = effectiveExercise(state, day, s.exerciseId ?? "");
      const pre = e && !s.seconds ? prefillFor(state, e, day, s.setIndex ?? 0) : null;
      recordWorkStep(
        day,
        s,
        info,
        pre ? { weight: pre.weight || undefined, reps: pre.reps || undefined } : {},
      );
    },
    { passive: true },
  );
  const { step, left, lead, running, mirrored, progress } = engine;
  const voiceOn = state.settings.coachVoice !== false;

  useEffect(() => {
    const t = setTimeout(() => setChrome(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const toggleMute = () => {
    stopSpeech();
    setState((p) => ({
      ...p,
      settings: { ...p.settings, coachVoice: !(p.settings.coachVoice !== false) },
    }));
  };

  if (!step) return null;

  const move = mirrorFor(step.mirror);
  const coachClip = move ? coachMotionFor(move.id) : undefined;
  const upcomingClip = (() => {
    if (step.kind !== "rest") return undefined;
    for (let k = engine.i + 1; k < script.length; k++) {
      const s = script[k];
      if (s.kind !== "work" && s.kind !== "cooldown") continue;
      const m = mirrorFor(s.mirror);
      if (!m) continue;
      return coachMotionFor(m.id);
    }
    return undefined;
  })();
  const media = resolveTrainerMedia({
    step,
    lead,
    left,
    speaking: engine.speaking,
    exactMotion: coachClip,
    ambient: false,
  });
  const motionMissing =
    (step.kind === "work" || step.kind === "cooldown") && Boolean(move) && !coachClip;

  if (step.kind === "complete") {
    const sets = Object.values(log.exercises).reduce(
      (n, el) => n + el.sets.filter((s) => s.done).length,
      0,
    );
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-10 text-center text-white">
        <div>
          <p className="text-[10vw] font-black uppercase leading-none text-cyan-300">Done</p>
          <p className="mt-6 text-[3vw] font-bold">
            {plan.title} · {sets} sets logged
          </p>
          <Link
            to="/coach/$day"
            params={{ day: String(day) }}
            className="mt-10 inline-block rounded-2xl border border-white/25 bg-white/10 px-8 py-4 text-xl font-bold uppercase tracking-widest"
          >
            Back to coach
          </Link>
        </div>
      </main>
    );
  }

  const big =
    lead !== null
      ? lead === 0
        ? "GO"
        : lead === 3 && engine.speaking
          ? "Ready"
          : String(lead)
      : step.speechPaced
        ? (step.reps ?? "Follow me")
        : left !== null
          ? mmss(left)
          : (step.reps ?? "Ready");

  /* ---------------- PHONE REMOTE ---------------- */
  if (isRemote) {
    const btn =
      "flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-elevated px-2 text-[11px] font-bold uppercase tracking-widest text-foreground";
    return (
      <main
        data-testid="big-screen-remote"
        className="min-h-dvh bg-background p-3 pb-[max(1rem,env(safe-area-inset-bottom))] text-foreground"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
              Big screen remote
            </p>
            <h1 className="truncate text-xl font-black uppercase">{step.title}</h1>
          </div>
          <WorkoutModeButton
            day={day}
            current="presentation"
            isLeader={engine.isLeader}
            onClaimVoice={engine.claimVoice}
          />
        </div>

        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-elevated px-4 py-3">
          <p className="min-w-0 truncate text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {step.setIndex !== undefined && step.totalSets
              ? `Set ${step.setIndex + 1} / ${step.totalSets}`
              : step.kind === "rest"
                ? "Rest"
                : step.section}
          </p>
          <p className="shrink-0 text-3xl font-black tabular-nums text-primary">{big}</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" className={btn} onClick={engine.back}>
            <ChevronLeft className="size-6" /> Previous
          </button>
          <button
            type="button"
            className={btn}
            data-testid="remote-play"
            onClick={() => engine.setRunning(!running)}
          >
            {running ? <Pause className="size-6" /> : <Play className="size-6" />}
            {running ? "Pause" : "Resume"}
          </button>
          <button type="button" className={btn} onClick={engine.advance}>
            <ChevronRight className="size-6" /> Next
          </button>
          <button
            type="button"
            className={btn}
            data-testid="remote-complete"
            onClick={() => (step.kind === "work" ? engine.finishWork() : engine.advance())}
          >
            <Check className="size-6" /> Done set
          </button>
          <button type="button" className={btn} onClick={toggleMute}>
            {voiceOn ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
            {voiceOn ? "Mute" : "Unmute"}
          </button>
          <button type="button" className={btn} onClick={engine.skipStep}>
            <ChevronRight className="size-6" /> Skip
          </button>
        </div>

        <p className="mt-3 rounded-2xl border-l-4 border-primary bg-elevated px-4 py-3 text-sm font-semibold">
          {currentCue(step, left)}
        </p>

        <Link
          to="/coach/$day"
          params={{ day: String(day) }}
          className="mt-3 flex min-h-14 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black uppercase tracking-widest text-primary-foreground"
        >
          Back to coach on this phone
        </Link>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Weights, reps, substitutions and the clock stay on the coach screen — same session.
        </p>
      </main>
    );
  }

  /* ---------------- TV / BIG SCREEN ---------------- */
  return (
    <main
      onMouseMove={() => setChrome(true)}
      data-testid="big-screen-stage"
      data-step-kind={step.kind}
      data-step-id={step.id}
      data-running={running ? "true" : "false"}
      data-media-mode={media.mode}
      data-motion-available={coachClip ? "true" : "false"}
      className="relative h-dvh w-full overflow-hidden bg-black text-white"
    >
      {engine.isLeader && (
        <CoachAudioGate
          status={engine.voiceStatus}
          voiceOn={voiceOn}
          title={`${plan.weekday} · ${plan.title}`}
          onEnable={engine.enableAudio}
          onSkip={() => setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: false } }))}
          dark
        />
      )}

      {/* the coach owns the frame */}
      <TrainerStageMedia
        decision={media}
        preloadMotion={upcomingClip}
        mirrored={mirrored}
        playing={running && lead === null}
        rate={1}
        label={step.title}
      />

      {motionMissing && (
        <div
          data-testid="presentation-motion-production"
          className="pointer-events-none absolute inset-x-[3vw] top-[20vh] z-10 text-center"
        >
          <span className="inline-flex max-w-full rounded-md border border-cyan-300/60 bg-black/85 px-5 py-3 text-[clamp(14px,1.2vw,26px)] font-black uppercase text-white backdrop-blur-sm">
            FULL MOTION DEMO IN PRODUCTION
          </span>
        </div>
      )}

      {/* top: movement + set/clock, nothing else */}
      <div className="pointer-events-none absolute inset-x-0 top-0 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-8 bg-gradient-to-b from-black/75 to-transparent px-[3vw] pb-[6vh] pt-[3vh]">
        <div className="min-w-0">
          <p className="truncate text-[clamp(14px,1.1vw,26px)] font-bold uppercase tracking-[0.35em] text-cyan-300">
            {!running
              ? "Paused"
              : step.kind === "rest"
              ? "Rest"
              : step.section === plan.title
                ? plan.weekday
                : step.section}
          </p>
          <h1 className="truncate font-display text-[clamp(28px,3.4vw,84px)] font-black uppercase leading-none tracking-tight">
            {step.title}
          </h1>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[clamp(12px,0.9vw,22px)] font-bold uppercase tracking-[0.3em] text-white/60">
            {step.setIndex !== undefined && step.totalSets
              ? `Set ${step.setIndex + 1} / ${step.totalSets}`
              : `${progress}%`}
          </p>
          <p className="text-[clamp(40px,5vw,120px)] font-black leading-none tabular-nums text-cyan-300">
            {big}
          </p>
        </div>
      </div>

      {/* bottom: one cue + compact status strip */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-[3vw] pb-[2.5vh] pt-[8vh]">
        <p className="mx-auto max-w-[70vw] truncate text-center text-[clamp(16px,1.5vw,36px)] font-semibold text-white/90">
          {currentCue(step, left)}
        </p>
        <div className="mt-[1.5vh] h-[0.6vh] overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-cyan-300 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-[1.2vh] grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 text-[clamp(11px,0.9vw,20px)] font-bold uppercase tracking-[0.3em] text-white/60">
          <p className="truncate">
            {plan.weekday} · {doneSetsNow} sets logged
            {step.next ? ` · Next: ${step.next}` : ""}
            {motionMissing ? " · FULL MOTION DEMO IN PRODUCTION" : ""}
          </p>
          {chrome && (
            <div className="pointer-events-auto flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                aria-label={voiceOn ? "Mute coach" : "Unmute coach"}
                className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/10"
              >
                {voiceOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
              </button>
              <button
                type="button"
                onClick={toggleFullScreen}
                aria-label="Full screen"
                className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/10"
              >
                <Maximize2 className="size-5" />
              </button>
              <WorkoutModeButton
                day={day}
                current="presentation"
                dark
                isLeader={engine.isLeader}
                onClaimVoice={engine.claimVoice}
              />
              <Link
                to="/coach/$day"
                params={{ day: String(day) }}
                aria-label="Back to the coached session"
                className="grid size-11 place-items-center rounded-xl border border-white/25 bg-white/10"
              >
                <X className="size-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}