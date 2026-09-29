/**
 * SHADOW MODE — follow the same workout from an athlete-facing point of view.
 * --------------------------------------------------------------------------
 * This is not a separate workout engine. It consumes the same DayLog,
 * CoachStep script, timers and verified coach motion as Coach / Manual /
 * Glasses / Presentation. Switching views never restarts the session.
 *
 * Boxing and kickboxing steps become true follow-along rounds: the approved
 * coach fills the stage, the user mirrors the movement, and the round/set
 * HUD stays on top. Strength/mobility movements also work here as a simple
 * "move with coach" view.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import {
  ChevronLeft,
  FlipHorizontal2,
  Pause,
  Play,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import { CoachAudioGate } from "@/components/CoachAudio";
import { CoachMotion } from "@/components/CoachMotion";
import { CoachPresence } from "@/components/CoachPresence";
import { WorkoutModeButton } from "@/components/WorkoutModeMenu";
import { coachMotionFor } from "@/data/coach-identity";
import { effectiveExercise, effectiveExercises, effectivePlan } from "@/lib/activities";
import { buildCoachScript, currentCue } from "@/lib/coach-script";
import { recordWorkStep, useCoachEngine } from "@/lib/coach-session";
import { prefillFor } from "@/lib/performance";
import {
  currentDayNumber,
  ensureSession,
  getDay,
  setState,
  startWorkoutOnce,
  supersetsOn,
  useApp,
} from "@/lib/store";

export const Route = createFileRoute("/shadow")({
  validateSearch: (s: Record<string, unknown>): { day?: number } => ({
    day: s.day === undefined ? undefined : Number(s.day) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shadow Mode — Train With Your Coach" },
      {
        name: "description",
        content:
          "Follow the same live workout in athlete-facing Shadow Mode for boxing, kickboxing, conditioning and strength work.",
      },
    ],
  }),
  component: ShadowMode,
});

const mmss = (s: number) =>
  `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function ShadowMode() {
  const state = useApp();
  const search = Route.useSearch();
  const day = search.day ?? currentDayNumber(state);
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
        `${id}:${el.sets
          .map(
            (x) =>
              `${x.done ? 1 : 0}${x.weight}/${x.reps}/${x.feel ?? ""}${x.rpe ?? ""}/${x.outcome ?? ""}`,
          )
          .join(",")}`,
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

  const engine = useCoachEngine(day, script, (step, info) => {
    const exercise = effectiveExercise(state, day, step.exerciseId ?? "");
    const pre =
      exercise && !step.seconds ? prefillFor(state, exercise, day, step.setIndex ?? 0) : null;
    recordWorkStep(
      day,
      step,
      info,
      pre ? { weight: pre.weight || undefined, reps: pre.reps || undefined } : {},
    );
  });

  const { step, left, lead, running, mirrored, progress } = engine;
  const stepExercise = step?.exerciseId
    ? effectiveExercise(state, day, step.exerciseId)
    : undefined;
  const motionKey = step?.mirror || stepExercise?.mirror || step?.exerciseId || "";
  const motion = motionKey ? coachMotionFor(motionKey) : undefined;
  const combat =
    plan.type === "boxing" ||
    stepExercise?.category === "boxing" ||
    /box|punch|jab|cross|kick|guard|slip/i.test(step?.title ?? "");

  useEffect(() => {
    ensureSession(day);
  }, [day]);

  if (!step) return null;

  if (step.kind === "complete") {
    return (
      <main className="grid min-h-dvh place-items-center bg-black px-6 text-center text-white">
        <div className="max-w-md">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">
            Shadow session complete
          </p>
          <h1 className="mt-3 text-5xl font-black uppercase">{plan.title}</h1>
          <p className="mt-4 text-white/65">
            Same workout log is saved. Switch views any time without starting over.
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-cyan-300 px-6 font-black uppercase text-black"
          >
            Back to today
          </Link>
        </div>
      </main>
    );
  }

  const clock =
    lead !== null
      ? lead === 0
        ? "GO"
        : String(lead)
      : left !== null
        ? mmss(left)
        : (step.reps ?? "FOLLOW");

  const finishLabel =
    step.kind === "work"
      ? step.seconds
        ? combat
          ? "Finish round"
          : "Finish early"
        : "Done set"
      : step.kind === "rest"
        ? "Skip rest"
        : "Continue";

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-black text-white"
      data-testid="shadow-stage"
      data-viewpoint="athlete-facing"
      data-combat={combat ? "true" : "false"}
    >
      {engine.isLeader && (
        <CoachAudioGate
          status={engine.voiceStatus}
          voiceOn={state.settings.coachVoice !== false}
          title={combat ? "Shadow Boxing / Kickboxing" : "Shadow Follow-Along"}
          onEnable={async () => {
            startWorkoutOnce(day);
            return engine.enableAudio();
          }}
          onSkip={() =>
            setState((p) => ({ ...p, settings: { ...p.settings, coachVoice: false } }))
          }
          dark
        />
      )}

      <div className="absolute inset-0">
        {motion ? (
          <CoachMotion
            url={motion.url}
            poster={motion.poster}
            mirrored={mirrored}
            playing={running && lead === null}
            rate={1}
            className="h-full w-full"
            label={`${step.title} — follow your coach`}
          />
        ) : (
          <div className="grid h-full place-items-center p-4">
            <CoachPresence
              height="h-[72dvh]"
              caption="Coach ready"
              speaking={engine.speaking}
              dark
            />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/90" />
      </div>

      <header className="relative z-10 flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          aria-label="Exit shadow mode"
          className="grid size-10 place-items-center rounded-xl bg-black/55 backdrop-blur"
        >
          <X className="size-5" />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">
            {combat ? "Shadow Boxing / Kickboxing" : "Move With Coach"}
          </p>
          <p className="truncate text-xs font-bold text-white/70">{plan.title}</p>
        </div>
        <WorkoutModeButton
          day={day}
          current="shadow"
          dark
          isLeader={engine.isLeader}
          onClaimVoice={engine.claimVoice}
        />
      </header>

      <section className="pointer-events-none absolute inset-x-0 top-[18dvh] z-10 px-4 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/60">
          {step.kind === "rest"
            ? "Recover"
            : combat
              ? "Mirror the coach"
              : "Match the coach"}
        </p>
        <h1 className="mt-1 text-[clamp(2rem,7vw,5rem)] font-black uppercase leading-none drop-shadow-lg">
          {step.title}
        </h1>
        <p className="mt-2 text-[clamp(2.5rem,13vw,7rem)] font-black tabular-nums text-cyan-300 drop-shadow-lg">
          {clock}
        </p>
        {step.setIndex !== undefined && step.totalSets && (
          <p className="mt-1 text-sm font-black uppercase tracking-widest text-white/75">
            {combat ? "Round" : "Set"} {step.setIndex + 1} / {step.totalSets}
          </p>
        )}
      </section>

      <section className="absolute inset-x-0 bottom-0 z-10 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl rounded-3xl border border-white/15 bg-black/62 p-3 backdrop-blur-md">
          <p
            aria-live="polite"
            className="min-h-12 text-center text-base font-semibold leading-snug text-white"
          >
            {currentCue(step, left) || step.detail || "Stay with the coach."}
          </p>

          <div className="mt-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
            <span>{step.section}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full bg-cyan-300" style={{ width: `${progress}%` }} />
          </div>

          <button
            type="button"
            onClick={() => {
              startWorkoutOnce(day);
              if (step.kind === "work") engine.finishWork();
              else engine.advance();
            }}
            className="mt-3 min-h-14 w-full rounded-2xl bg-cyan-300 text-lg font-black uppercase tracking-wide text-black active:bg-cyan-200"
          >
            {finishLabel}
          </button>

          <div className="mt-2 grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={engine.back}
              className="grid min-h-11 place-items-center rounded-xl bg-white/10"
              aria-label="Previous step"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => engine.setRunning(!running)}
              className="grid min-h-11 place-items-center rounded-xl bg-white/10"
              aria-label={running ? "Pause" : "Resume"}
            >
              {running ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <button
              type="button"
              onClick={engine.toggleMirror}
              className="grid min-h-11 place-items-center rounded-xl bg-white/10"
              aria-label="Mirror coach"
            >
              <FlipHorizontal2 className="size-5" />
            </button>
            <button
              type="button"
              onClick={engine.advance}
              className="grid min-h-11 place-items-center rounded-xl bg-white/10"
              aria-label="Next step"
            >
              <SkipForward className="size-5" />
            </button>
          </div>

          {!engine.isLeader && (
            <button
              type="button"
              onClick={engine.claimVoice}
              className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 text-xs font-black uppercase tracking-widest text-white/70"
            >
              <Volume2 className="size-4" /> Coach from this screen
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
