/**
 * SMART-GLASSES MODE — COACH-LED HUD
 * ------------------------------------------------------------------
 * Runs the exact same coached session as the phone/desktop view (same
 * shared engine, same step, same timers), stripped to what you can
 * read on a heads-up display: huge current movement, moving avatar,
 * giant countdown, one or two cues, set/round progress and the next
 * movement during rest. Auto-advances throughout.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Pause, Play, SkipForward, X } from "lucide-react";
import { mirrorFor } from "@/data/mirror-me";
import { MirrorMeDemo } from "@/components/MirrorMe";
import { CoachPresence } from "@/components/CoachPresence";
import { WorkoutModeButton } from "@/components/WorkoutModeMenu";
import { CoachAudioBadge, CoachAudioGate } from "@/components/CoachAudio";
import { stopSpeech } from "@/lib/coach-voice";
import { planForDay } from "@/data/program";
import { effectiveExercise, effectiveExercises, effectivePlan } from "@/lib/activities";
import { buildCoachScript, currentCue } from "@/lib/coach-script";
import { recordWorkStep, useCoachEngine } from "@/lib/coach-session";
import { glassesLine, prefillFor } from "@/lib/performance";
import {
  currentDayNumber,
  getDay,
  setState,
  ensureSession,
  supersetsOn,
  useApp,
} from "@/lib/store";

export const Route = createFileRoute("/glasses")({
  validateSearch: (s: Record<string, unknown>): { day?: number } => ({
    day: s.day === undefined ? undefined : Number(s.day) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Glasses Mode — Coach-Led Heads-Up Workout" },
      {
        name: "description",
        content:
          "Hands-free heads-up coaching: huge movement name, moving avatar, countdown, one cue and the next exercise during rest.",
      },
      { property: "og:title", content: "Glasses Mode — Coach-Led Heads-Up Workout" },
      {
        property: "og:description",
        content: "Auto-advancing coached workout display for smart glasses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GlassesMode,
});

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function GlassesMode() {
  const state = useApp();
  const search = Route.useSearch();
  const [mounted, setMounted] = useState(false);
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

  /* Display-first: the phone stays the controller and the audio leader
     unless this screen is the only one open, or the user taps
     "This screen speaks". */
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
  const move = mirrorFor(step?.mirror);
  const stepEx = step?.exerciseId ? effectiveExercise(state, day, step.exerciseId) : undefined;
  const lastLine = stepEx && step?.kind === "work" ? glassesLine(state, stepEx, day) : "";

  useEffect(() => {
    ensureSession(day);
  }, [day]);

  if (!step) return null;

  if (step.kind === "complete") {
    const sets = Object.values(log.exercises).reduce(
      (n, el) => n + el.sets.filter((s) => s.done).length,
      0,
    );
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white">
        <div>
          <p className="text-5xl font-black uppercase text-cyan-300">Done</p>
          <p className="mt-3 text-2xl font-bold">
            {plan.title} · {sets} sets logged
          </p>
          <p className="mt-2 text-white/70">
            Next: {planForDay(day + 1).weekday} — {planForDay(day + 1).title}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-bold uppercase text-black"
          >
            Back to today
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

  return (
    <main className="min-h-dvh bg-black px-4 pb-6 pt-3 text-white">
      {engine.isLeader && (
        <CoachAudioGate
          status={engine.voiceStatus}
          voiceOn={state.settings.coachVoice !== false}
          title={`${plan.weekday} · ${plan.title}`}
          onEnable={engine.enableAudio}
          onSkip={() => setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: false } }))}
          dark
        />
      )}
      <div className="mx-auto flex max-w-xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-300">
            {step.kind === "rest" ? "Rest" : step.section} · {plan.title}
          </p>
          <Link
            to="/"
            aria-label="Exit glasses mode"
            className="grid size-10 place-items-center rounded-lg bg-white/10"
          >
            <X className="size-5" />
          </Link>
        </div>

        <h1 className="font-display text-5xl font-black uppercase leading-none tracking-tight">
          {step.title}
        </h1>

        <p className="text-7xl font-black tabular-nums text-cyan-300">{big}</p>

        <div className="rounded-2xl border border-cyan-400/40 bg-white/5 p-1">
          {move ? (
            <MirrorMeDemo
              move={move}
              mirrored={mirrored}
              playing={running && lead === null}
              height="h-64"
            />
          ) : (
            <CoachPresence height="h-64" speaking={engine.speaking} dark />
          )}
        </div>

        <p
          aria-live="polite"
          className="rounded-xl border-l-4 border-cyan-300 bg-white/10 px-3 py-2 text-xl font-semibold"
        >
          {currentCue(step, left)}
        </p>

        <div className="flex items-center justify-between text-sm font-bold uppercase tracking-widest text-white/70">
          <span>
            {step.setIndex !== undefined && step.totalSets
              ? `Set ${step.setIndex + 1} / ${step.totalSets}`
              : step.section}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full bg-cyan-300" style={{ width: `${progress}%` }} />
        </div>

        {step.kind === "work" && step.logging && lastLine && (
          <p className="text-base font-semibold uppercase tracking-wide text-cyan-200/90">
            {lastLine}
          </p>
        )}

        {step.next && (
          <p className="text-lg uppercase tracking-widest text-white/70">Next: {step.next}</p>
        )}

        <button
          type="button"
          onClick={() => (step.kind === "work" ? engine.finishWork() : engine.advance())}
          className="min-h-16 w-full rounded-2xl bg-cyan-300 text-xl font-black uppercase tracking-wide text-black active:bg-cyan-200"
        >
          {step.kind === "work"
            ? step.seconds
              ? "Finish early"
              : "Done set"
            : step.kind === "rest"
              ? "Skip rest"
              : "Continue"}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            aria-label="Previous"
            onClick={engine.back}
            className="grid min-h-14 place-items-center rounded-2xl bg-white/10"
          >
            <ChevronLeft className="size-7" />
          </button>
          <button
            type="button"
            aria-label={running ? "Pause" : "Resume"}
            onClick={() => engine.setRunning(!running)}
            className="grid min-h-14 place-items-center rounded-2xl bg-white/10"
          >
            {running ? <Pause className="size-7" /> : <Play className="size-7" />}
          </button>
          <button
            type="button"
            aria-label="Skip"
            onClick={engine.skipStep}
            className="grid min-h-14 place-items-center rounded-2xl bg-white/10"
          >
            <SkipForward className="size-7" />
          </button>
        </div>

        <div className="mb-2 flex justify-center">
          <CoachAudioBadge
            status={engine.voiceStatus}
            voiceOn={state.settings.coachVoice !== false}
            onEnable={() => void engine.enableAudio()}
            onToggleMute={() => {
              stopSpeech();
              setState((p) => ({
                ...p,
                settings: { ...p.settings, coachVoice: !(p.settings.coachVoice !== false) },
              }));
            }}
            dark
          />
        </div>
        <div className="flex justify-center">
          <WorkoutModeButton
            day={day}
            current="glasses"
            dark
            isLeader={engine.isLeader}
            onClaimVoice={engine.claimVoice}
          />
        </div>
      </div>
    </main>
  );
}