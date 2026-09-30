import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  Check, Dumbbell, Eye, Glasses, Hand, Pause, Play,
  RotateCcw, SkipForward, UserRound, Volume2, VolumeX,
} from "lucide-react";
import { CoachMotion } from "@/components/CoachMotion";
import { getVoiceStatus, speak, stopSpeech, unlockVoice, useVoiceStatus } from "@/lib/coach-voice";
import { askLiveCoach } from "@/lib/coach-talk";
import { metricsSnapshot, startCamera, stopCamera } from "@/lib/vision/camera";
import { patternFor } from "@/lib/vision/patterns";
import {
  repsIn, setCommandHandler, setConversationHandler, startListening,
  stopListening, useVoiceControl, voiceControlAvailable, weightIn,
} from "@/lib/voice-commands";
import { V2_VIEWPOINTS, V2_WORKOUTS, viewpointFor } from "@/v2/catalog";
import { approvedCoachMedia, nextApprovedCoachMedia } from "@/v2/approved-coach-media";
import { V2TrainingCamera } from "@/v2/training-camera";
import { M3GymRenderer } from "@/v2/renderer";
import { hasApprovedRealTimeCoach } from "@/v2/rig-release";
import { recommendProgression, warmupPlanFor } from "@/v2/progression";
import { createV2Session, v2SessionReducer } from "@/v2/session";
import type { V2Mode, V2Session } from "@/v2/types";

export const Route = createFileRoute("/v2")({
  head: () => ({
    meta: [
      { title: "M3 Coach V2 — Interactive Training" },
      {
        name: "description",
        content: "Approved real-coach motion, a shared workout, and opt-in on-device movement tracking.",
      },
    ],
  }),
  component: V2Coach,
});

const V2_LOCAL_SAVE = "m3-coach-v2-local-session-v1";

const modeIcon: Record<V2Mode, typeof Eye> = {
  coach: UserRound,
  manual: Hand,
  shadow: Eye,
  glasses: Glasses,
};
const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function V2Coach() {
  // Open with the already-approved real boxing combination, not a placeholder.
  const [workoutId, setWorkoutId] = useState("cardio-core");
  const workout = useMemo(
    () => V2_WORKOUTS.find((w) => w.id === workoutId) ?? V2_WORKOUTS[0],
    [workoutId],
  );
  const [session, dispatch] = useReducer(v2SessionReducer, workout, createV2Session);
  const [hydrated, setHydrated] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const voiceStatus = useVoiceStatus();
  const voiceControl = useVoiceControl();
  const [liveCue, setLiveCue] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    // A paused local snapshot protects the current workout during a refresh.
    // This never records or persists camera frames, microphone audio or secrets.
    try {
      const raw = window.localStorage.getItem(V2_LOCAL_SAVE);
      if (raw) {
        const saved = JSON.parse(raw) as {
          version?: number;
          workoutId?: string;
          session?: Partial<V2Session>;
        };
        const savedWorkout = V2_WORKOUTS.find((item) => item.id === saved.workoutId);
        const s = saved.session;
        if (saved.version === 1 && savedWorkout && s) {
          const exIdx = Math.max(0, Math.min(
            savedWorkout.exercises.length - 1,
            Number.isInteger(s.exerciseIndex) ? s.exerciseIndex! : 0,
          ));
          const setIdx = Math.max(0, Math.min(
            savedWorkout.exercises[exIdx].sets - 1,
            Number.isInteger(s.setIndex) ? s.setIndex! : 0,
          ));
          const restored: V2Session = {
            ...createV2Session(savedWorkout),
            workout: savedWorkout,
            mode: V2_VIEWPOINTS.some((v) => v.id === s.mode) ? s.mode! : "coach",
            phase: s.phase === "complete" ? "complete" : "ready",
            exerciseIndex: exIdx,
            setIndex: setIdx,
            elapsedSeconds:
              typeof s.elapsedSeconds === "number" && Number.isFinite(s.elapsedSeconds)
                ? Math.max(0, Math.floor(s.elapsedSeconds))
                : 0,
            running: false,
            phaseSecondsLeft: null,
            completedSetIds: Array.isArray(s.completedSetIds)
              ? s.completedSetIds.filter((id): id is string => typeof id === "string")
              : [],
            targetWeights:
              s.targetWeights && typeof s.targetWeights === "object" && !Array.isArray(s.targetWeights)
                ? s.targetWeights
                : {},
            setResults:
              s.setResults && typeof s.setResults === "object" && !Array.isArray(s.setResults)
                ? s.setResults
                : {},
          };
          setWorkoutId(savedWorkout.id);
          dispatch({ type: "restore", session: restored });
        }
      }
    } catch {
      // Storage may be unavailable; use the in-memory session in that case.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(V2_LOCAL_SAVE, JSON.stringify({
        version: 1,
        workoutId: session.workout.id,
        session: { ...session, running: false },
      }));
    } catch {
      // Private-browsing/storage restrictions must never prevent training.
    }
  }, [session, hydrated]);

  useEffect(() => {
    if (!session.running) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(timer);
  }, [session.running]);

  useEffect(() => {
    setLiveCue(null);
  }, [session.exerciseIndex, session.workout.id]);

  useEffect(() => () => {
    stopSpeech();
    stopListening();
  }, []);

  const exercise = session.workout.exercises[session.exerciseIndex];
  const viewpoint = viewpointFor(session.mode);
  const media = approvedCoachMedia(exercise);
  const preload = nextApprovedCoachMedia(session.workout.exercises, session.exerciseIndex);
  const targetWeight = exercise ? session.targetWeights[exercise.id] ?? 0 : 0;
  const warmups = exercise ? warmupPlanFor(exercise, targetWeight, 5) : [];
  const setEntries = exercise ? session.setResults[exercise.id] ?? [] : [];
  const completedResults =
    exercise?.category === "strength"
      ? setEntries.slice(0, exercise.sets).filter(
          (entry): entry is { reps: number; cleanForm: boolean } =>
            typeof entry?.reps === "number" && typeof entry?.cleanForm === "boolean",
        )
      : [];
  const progression =
    exercise?.category === "strength" &&
    completedResults.length === exercise.sets &&
    targetWeight > 0
      ? recommendProgression({
          exercise,
          currentWeight: targetWeight,
          results: completedResults,
          previousTopRangeStreak: 0,
        })
      : null;

  const giveFeedback = useCallback(
    (cue: string) => {
      setLiveCue(cue);
      if (voiceOn && getVoiceStatus() === "ready")
        speak(cue, true, { tone: "instructional", interrupt: false });
    },
    [voiceOn],
  );

  const captureReps = useCallback(
    (reps: number) => {
      const current = session.workout.exercises[session.exerciseIndex];
      if (current?.category !== "strength") return;
      dispatch({
        type: "set-reps", exerciseId: current.id,
        setIndex: session.setIndex, reps,
      });
      setLiveCue(`Captured ${reps} camera reps. Confirm your form and complete the set.`);
    },
    [session.exerciseIndex, session.setIndex, session.workout],
  );

  // The existing speech recognizer manages Android microphone restarts and
  // ignores the coach's own spoken responses. Workout state remains authoritative.
  useEffect(() => {
    setCommandHandler((command, phrase) => {
      switch (command) {
        case "start":
        case "resume":
          dispatch({ type: "start" });
          setLiveCue("Workout resumed.");
          return;
        case "pause":
          dispatch({ type: "pause" });
          setLiveCue("Workout paused.");
          return;
        case "next":
        case "skip":
          dispatch({ type: "complete-set" });
          return;
        case "previous":
          dispatch({
            type: "select-exercise",
            exerciseIndex: Math.max(0, session.exerciseIndex - 1),
          });
          return;
        case "repeat":
          dispatch({ type: "select-exercise", exerciseIndex: session.exerciseIndex });
          return;
        case "showDemo":
          dispatch({ type: "set-mode", mode: "coach" });
          return;
        case "cameraOn":
          void startCamera(patternFor(exercise?.motionKey) ?? patternFor(exercise?.id));
          return;
        case "cameraOff":
          stopCamera();
          return;
        case "setReps": {
          const reps = repsIn(phrase);
          if (reps !== null && exercise?.category === "strength") {
            dispatch({
              type: "set-reps", exerciseId: exercise.id,
              setIndex: session.setIndex, reps,
            });
            setLiveCue(`Logged ${reps} reps. Confirm your form before completing this set.`);
          }
          return;
        }
        case "setWeight": {
          const weight = weightIn(phrase);
          if (weight !== null && exercise?.category === "strength") {
            dispatch({
              type: "set-target-weight", exerciseId: exercise.id, weight,
            });
            setLiveCue(`Set target weight to ${weight} pounds.`);
          }
          return;
        }
        case "whatsNext": {
          const next = session.workout.exercises[session.exerciseIndex + 1];
          const line = next ? `Next is ${next.name}.` : "That is the final movement.";
          setLiveCue(line);
          if (voiceOn) speak(line, true, { tone: "calm" });
          return;
        }
        case "muteCoach":
          setVoiceOn(false);
          stopSpeech();
          return;
        case "unmuteCoach":
          if (getVoiceStatus() === "ready") setVoiceOn(true);
          else setLiveCue("Tap Enable coach voice once to unlock audio.");
          return;
        case "end":
          dispatch({ type: "pause" });
          stopListening();
          setLiveCue("Workout paused. Your session stays here.");
          return;
        default:
          setLiveCue("Command heard. Use the workout controls for that action.");
      }
    });
    setConversationHandler((phrase) => {
      const metrics = metricsSnapshot();
      const context = {
        workout: session.workout.title,
        exercise: exercise?.name,
        phase: session.phase,
        setNumber: session.setIndex + 1,
        totalSets: exercise?.sets,
        target: exercise?.reps,
        weight: targetWeight ? String(targetWeight) : undefined,
        camera: {
          active: Boolean(metrics && metrics.confidence >= 0.55),
          confidence: metrics?.confidence,
          reps: metrics?.reps,
          romAvg: metrics?.romAvg,
          symmetry: metrics?.symmetry,
          cue: metrics?.cue,
        },
      };
      setLiveCue("Coach is considering your question…");
      void askLiveCoach(phrase, context).then((reply) => {
        const line = reply ||
          "Live questions are not configured in this preview yet. Workout commands and visual movement feedback remain available.";
        setLiveCue(line);
        if (reply && voiceOn && getVoiceStatus() === "ready")
          speak(reply, true, { tone: "attentive" });
      });
    });
    return () => {
      setCommandHandler(null);
      setConversationHandler(null);
    };
  }, [
    session.exerciseIndex, session.workout, session.phase,
    session.setIndex, exercise?.id, exercise?.motionKey,
    exercise?.name, exercise?.sets, exercise?.reps, targetWeight, voiceOn,
  ]);

  const toggleVoice = async () => {
    if (voiceOn) {
      stopSpeech();
      setVoiceOn(false);
      setVoiceError(null);
      return;
    }
    // Audio unlock begins in the actual tap, as required on Android.
    const status = await unlockVoice("M3 Coach audio enabled.", "calm");
    const ready = status === "ready";
    setVoiceOn(ready);
    setVoiceError(ready ? null : "Voice was blocked. Check phone volume, audio output and browser permissions.");
  };

  const toggleWorkout = () => {
    const next = session.running ? "pause" : "start";
    dispatch({ type: next });
    if (voiceOn && next === "start") {
      speak(`Let's work. ${exercise?.name ?? session.workout.title}.`, true, {
        tone: "assertive",
      });
    }
  };

  const stageTitle = session.phase === "complete" ? "Workout complete" : exercise?.name ?? "";
  const showCoach = session.mode === "coach" || session.mode === "shadow";
  const glasses = session.mode === "glasses";
  const videoPlaying = session.running && session.phase === "work";
  const realTimeRigReady = (showCoach || glasses) && hasApprovedRealTimeCoach(exercise?.motionKey);

  return (
    <main className="min-h-dvh bg-[#080b0f] text-white">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111820] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.32em] text-cyan-300">
              M3 Coach V2
            </p>
            <h1 className="mt-1 text-lg font-black">Interactive training</h1>
          </div>
          <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-200">
            Private rebuild
          </span>
        </header>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="relative min-h-[67dvh] overflow-hidden rounded-3xl border border-white/10 bg-[#070c12] sm:min-h-[720px]">
            {realTimeRigReady && <M3GymRenderer session={session} />}
            {showCoach && !realTimeRigReady && media && (
              <CoachMotion
                key={media.url}
                url={media.url}
                poster={media.poster}
                playing={videoPlaying}
                preloadUrl={preload?.url}
                className="absolute inset-0 h-full w-full"
                label={`Approved coach demonstrating ${exercise?.name ?? "movement"}`}
              />
            )}
            {showCoach && !realTimeRigReady && !media && (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#152a36,#080b0f_65%)] px-8 text-center">
                <div className="max-w-md">
                  <Dumbbell className="mx-auto size-12 text-white/25" />
                  <p className="mt-4 text-lg font-black">Approved demonstration pending</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/50">
                    We will not show a stick figure, a different trainer, or the wrong exercise.
                    Your set, live camera and manual workout log remain available.
                  </p>
                </div>
              </div>
            )}
            {glasses && !realTimeRigReady && (
              <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_center,#142630,#05090d_65%)]">
                <div className="w-[85%] max-w-lg rounded-2xl border border-cyan-300/35 bg-cyan-300/5 p-6">
                  <p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">
                    Glasses / first-person HUD
                  </p>
                  <p className="mt-4 text-3xl font-black">{stageTitle}</p>
                  <p className="mt-2 text-lg text-cyan-200">
                    {session.phaseSecondsLeft !== null
                      ? `${session.phaseSecondsLeft}s remaining`
                      : exercise?.reps ?? "Follow your session"}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-white/50">
                    This is a compact phone HUD. Wearable display integration is not yet verified.
                  </p>
                </div>
              </div>
            )}

            {glasses && realTimeRigReady && (
              <div className="pointer-events-none absolute bottom-[104px] left-3 z-[4] rounded-xl border border-cyan-300/35 bg-black/70 px-3 py-2 text-xs font-black text-cyan-200">
                FIRST-PERSON · {session.phaseSecondsLeft !== null
                  ? `${session.phaseSecondsLeft}s remaining`
                  : exercise?.reps}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 z-[3] bg-gradient-to-b from-black/70 via-transparent to-black/75" />

            <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] p-3">
              <div className="max-w-[min(80%,450px)] rounded-xl bg-black/60 p-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-300">
                  {viewpoint.label} · {session.phase}
                </p>
                <h2 className="mt-1 text-xl font-black uppercase leading-tight sm:text-2xl">
                  {stageTitle}
                </h2>
                <p className="mt-1 text-xs font-semibold text-white/70">
                  {exercise?.seconds ? `${exercise.seconds}s work` : exercise?.reps ?? ""} · Set
                  {" "}{Math.min(session.setIndex + 1, exercise?.sets ?? 1)}/{exercise?.sets ?? 1}
                </p>
              </div>
            </div>

            {liveCue && (
              <div
                className="pointer-events-none absolute bottom-[105px] left-3 z-[8] max-w-[55%] rounded-xl border border-cyan-300/40 bg-black/85 px-3 py-2 text-xs font-bold text-cyan-100"
                aria-live="polite"
              >
                {liveCue}
              </div>
            )}

            <V2TrainingCamera
              session={session}
              onCue={giveFeedback}
              onRepCapture={captureReps}
            />

            <div className="absolute inset-x-0 bottom-0 z-[9] p-3">
              <div className="rounded-2xl border border-white/10 bg-black/80 p-3 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black">{session.workout.title}</p>
                    <p className="mt-1 text-[11px] text-white/50">
                      {mmss(session.elapsedSeconds)} elapsed
                      {session.phaseSecondsLeft !== null
                        ? ` · ${session.phaseSecondsLeft}s left`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={toggleWorkout}
                      disabled={session.phase === "complete"}
                      className="grid size-11 place-items-center rounded-xl bg-cyan-300 text-black disabled:opacity-35"
                      aria-label={session.running ? "Pause workout" : "Start workout"}
                    >
                      {session.running ? <Pause className="size-5" /> : <Play className="size-5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "complete-set" })}
                      disabled={session.phase === "complete"}
                      className="grid size-11 place-items-center rounded-xl bg-white/15 disabled:opacity-35"
                      aria-label="Complete set and advance"
                    >
                      <SkipForward className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "reset", workout })}
                      className="grid size-11 place-items-center rounded-xl bg-white/15"
                      aria-label="Reset workout"
                    >
                      <RotateCcw className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-3">
            <section className="rounded-3xl border border-white/10 bg-white/[.035] p-3">
              <p className="px-1 text-[10px] font-black uppercase tracking-[.24em] text-white/50">
                One workout · four viewpoints
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {V2_VIEWPOINTS.map((mode) => {
                  const Icon = modeIcon[mode.id];
                  const active = session.mode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => dispatch({ type: "set-mode", mode: mode.id })}
                      className={`min-h-[76px] rounded-2xl border p-3 text-left ${
                        active
                          ? "border-cyan-300 bg-cyan-300/15"
                          : "border-white/10 bg-black/25"
                      }`}
                    >
                      <Icon className={`size-5 ${active ? "text-cyan-300" : "text-white/55"}`} />
                      <p className="mt-2 text-sm font-black">{mode.label}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
              <button
                type="button"
                onClick={() => void toggleVoice()}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-xs font-black uppercase ${
                  voiceOn
                    ? "bg-cyan-300/15 text-cyan-200"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {voiceOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                {voiceOn ? "Coach voice on" : "Enable coach voice"}
              </button>
              <p className="mt-2 text-[11px] text-white/45">
                Voice status: {voiceStatus}. Coach speaks when a real tracking cue is available.
              </p>
              {voiceError && <p className="mt-2 text-xs text-amber-200">{voiceError}</p>}
              {voiceControlAvailable() ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (voiceControl.listening) stopListening();
                      else startListening();
                    }}
                    className={`mt-2 min-h-11 w-full rounded-xl border px-3 text-xs font-black uppercase ${
                      voiceControl.listening
                        ? "border-cyan-300/50 bg-cyan-300/15 text-cyan-200"
                        : "border-white/10 bg-white/10 text-white/80"
                    }`}
                  >
                    {voiceControl.listening ? "Stop hands-free listening" : "Enable hands-free commands"}
                  </button>
                  <p className="mt-2 text-[11px] leading-relaxed text-white/45">
                    Say start, pause, next, 12 reps, 50 pounds, or ask Coach a question.
                  </p>
                  {voiceControl.heard && (
                    <p className="mt-1 text-[11px] text-cyan-200">
                      Heard: {voiceControl.heard}
                    </p>
                  )}
                  {voiceControl.error && (
                    <p className="mt-1 text-xs text-amber-200">{voiceControl.error}</p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-[11px] text-white/45">
                  Hands-free speech commands are not available in this browser;
                  the on-screen buttons work normally.
                </p>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
              <label className="text-[10px] font-black uppercase tracking-[.24em] text-white/50">
                Workout
                <select
                  value={workoutId}
                  onChange={(event) => {
                    const nextWorkout = V2_WORKOUTS.find((w) => w.id === event.target.value) ??
                      V2_WORKOUTS[0];
                    setWorkoutId(nextWorkout.id);
                    dispatch({ type: "reset", workout: nextWorkout });
                    setLiveCue(null);
                  }}
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#111920] px-3 text-sm font-bold text-white"
                >
                  {V2_WORKOUTS.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs text-white/50">{workout.focus}</p>
              <div className="mt-3 space-y-1">
                {session.workout.exercises.map((item, index) => {
                  const approved = Boolean(approvedCoachMedia(item));
                  const selected = index === session.exerciseIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => dispatch({ type: "select-exercise", exerciseIndex: index })}
                      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-xs ${
                        selected ? "bg-cyan-300/15 text-cyan-100" : "bg-black/25 text-white/65"
                      }`}
                    >
                      <span>{index + 1}. {item.name}</span>
                      {approved ? (
                        <Check className="size-4 shrink-0 text-emerald-300" />
                      ) : (
                        <span className="shrink-0 text-[9px] text-white/35">Clip pending</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {exercise?.category === "strength" && (
              <section className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[.24em] text-white/50">
                  Load · warm-up · working sets
                </p>
                <label className="mt-3 block text-xs font-bold text-white/70">
                  Target working weight
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      value={targetWeight || ""}
                      onChange={(e) => dispatch({
                        type: "set-target-weight",
                        exerciseId: exercise.id,
                        weight: Math.max(0, Number(e.target.value) || 0),
                      })}
                      className="min-h-11 w-full rounded-xl border border-white/10 bg-[#111920] px-3 text-base font-black"
                      placeholder="Enter target weight"
                    />
                    <span className="text-sm font-black text-white/50">lb</span>
                  </div>
                </label>
                {warmups.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {warmups.map((step) => (
                      <div key={step.label} className="flex items-center justify-between gap-3 rounded-lg bg-black/20 px-3 py-2">
                        <div>
                          <p className="text-xs font-bold">{step.label}</p>
                          <p className="text-[10px] text-white/45">
                            {step.percent === null ? "Easy set" : `${step.percent}%`} · {step.reps} reps
                          </p>
                        </div>
                        <span className="text-sm font-black text-cyan-300">
                          {step.weight === null ? "Light" : `${step.weight} lb`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {session.mode === "manual" && (
                  <div className="mt-4 border-t border-white/10 pt-3">
                    <p className="text-[10px] font-black uppercase tracking-[.24em] text-white/50">Actual sets</p>
                    <div className="mt-2 space-y-2">
                      {Array.from({ length: exercise.sets }, (_, index) => {
                        const entry = setEntries[index];
                        return (
                          <div key={index} className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
                            <span className="text-xs font-black">{index + 1}</span>
                            <input
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={entry?.reps ?? ""}
                              onChange={(e) => dispatch({
                                type: "set-reps", exerciseId: exercise.id, setIndex: index,
                                reps: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                              })}
                              className="min-h-10 min-w-0 rounded-xl border border-white/10 bg-[#111920] px-3 text-sm"
                              placeholder="Actual reps"
                            />
                            <button
                              type="button"
                              onClick={() => dispatch({
                                type: "set-form", exerciseId: exercise.id, setIndex: index,
                                cleanForm: entry?.cleanForm === true ? false : true,
                              })}
                              className={`min-h-10 rounded-xl px-3 text-[10px] font-black ${
                                entry?.cleanForm === true
                                  ? "bg-emerald-400 text-black"
                                  : entry?.cleanForm === false
                                    ? "bg-amber-300 text-black"
                                    : "bg-white/10 text-white/60"
                              }`}
                            >
                              {entry?.cleanForm === true ? "Clean" : entry?.cleanForm === false ? "Form broke" : "Form?"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {progression && (
                      <div className="mt-3 rounded-xl bg-cyan-300/10 p-3">
                        <p className="text-xs font-black uppercase text-cyan-300">
                          Next workout: {progression.action}
                        </p>
                        <p className="mt-1 text-sm">{progression.reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            <p className="px-2 pb-4 text-[11px] leading-relaxed text-white/40">
              On-device visual feedback is limited to reliably visible body positions.
              Camera tracking does not verify weight, impact, foot pivot, or injury risk.
              The approved 3D character and remaining exercise animations are still being produced.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
