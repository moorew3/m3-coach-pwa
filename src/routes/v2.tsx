import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  Check, Eye, Glasses, Hand, Pause, Play,
  RotateCcw, SkipForward, UserRound, Volume2, VolumeX,
} from "lucide-react";
import { CoachMotion } from "@/components/CoachMotion";
import { coachMotionFor, COACH_REFERENCE } from "@/data/coach-identity";
import type { BoxingSnapshot, BoxingStance } from "@/v2/boxing-form";
import { askLiveCoach } from "@/lib/coach-talk";
import { metricsSnapshot, startCamera, stopCamera } from "@/lib/vision/camera";
import { patternFor } from "@/lib/vision/patterns";
import {
  repsIn, setCommandHandler, setConversationHandler, startListening,
  stopListening, useVoiceControl, voiceControlAvailable, weightIn,
} from "@/lib/voice-commands";
import { V2_VIEWPOINTS, V2_WORKOUTS, viewpointFor } from "@/v2/catalog";
import { ORIGINAL_WEEK_WORKOUTS, originalWorkoutForToday } from "@/v2/original-week-workouts";
import { approvedCoachMedia, nextApprovedCoachMedia } from "@/v2/approved-coach-media";
import { recoveredMotionFor } from "@/v2/recovered-motion-media";
import { playMarcusCue, preloadMarcusAudio, stopMarcusCue } from "@/v2/marcus-cue-audio";
import { unlockRecordedCoachAudio } from "@/v2/recorded-coach-player";
import { speakDetailedExercise, stopDetailedExerciseSpeech } from "@/v2/detailed-exercise-speech";
import { playFridayPremiumCue, stopFridayPremiumCue } from "@/v2/friday-premium-voice";
import { V2TrainingCamera } from "@/v2/training-camera";
import { M3GymRenderer } from "@/v2/renderer";
import { hasApprovedRealTimeCoach } from "@/v2/rig-release";
import { readAthletePortrait, saveAthletePortrait } from "@/v2/athlete-portrait";
import { WorkoutOpeningScene } from "@/v2/workout-opening-scene";
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
// Full original week first; keep every existing V2 workout including improved boxing.
const ALL_V2_WORKOUTS = [...ORIGINAL_WEEK_WORKOUTS, ...V2_WORKOUTS];

const modeIcon: Record<V2Mode, typeof Eye> = {
  coach: UserRound,
  manual: Hand,
  shadow: Eye,
  glasses: Glasses,
};
const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const mountainDayKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

function V2Coach() {
  // New sessions open the ORIGINAL plan for today, not the shortened V2 showcase.
  // Paused older sessions are still restored below and can be resumed safely.
  const [workoutId, setWorkoutId] = useState(() => originalWorkoutForToday().id);
  const workout = useMemo(
    () => ALL_V2_WORKOUTS.find((w) => w.id === workoutId) ?? originalWorkoutForToday(),
    [workoutId],
  );
  const [session, dispatch] = useReducer(v2SessionReducer, workout, createV2Session);
  const [hydrated, setHydrated] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [openingStarting, setOpeningStarting] = useState(false);
  const [athletePortrait, setAthletePortrait] = useState<string | null>(null);
  const [athleteError, setAthleteError] = useState<string | null>(null);
  const athletePicker = useRef<HTMLInputElement>(null);
  const dismissOpening = useCallback(() => {
    setShowOpening(false);
    try { window.sessionStorage.setItem("m3-v2-entrance-seen", "1"); }
    catch { /* session-only; do not block training */ }
  }, []);
  const [voiceOn, setVoiceOn] = useState(true);
  const voiceControl = useVoiceControl();
  const [liveCue, setLiveCue] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [boxingStance, setBoxingStance] = useState<BoxingStance>("orthodox");
  const [roundFeedback, setRoundFeedback] = useState<string | null>(null);
  const latestBoxing = useRef<BoxingSnapshot | null>(null);
  const lastDirectedCue = useRef("");
  const receiveBoxing = useCallback((snapshot: BoxingSnapshot) => { latestBoxing.current = snapshot; }, []);
  const reportRound = useCallback((report: string) => { setRoundFeedback(report); }, []);

  useEffect(() => {
    if (!hydrated) return;
    preloadMarcusAudio();
    setAthletePortrait(readAthletePortrait());
    try {
      if (session.phase === "ready" &&
          !window.sessionStorage.getItem("m3-v2-entrance-seen"))
        setShowOpening(true);
    } catch { /* still allow a skippable entrance without storage */ }
  }, [hydrated]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("m3-coach-v2-boxing-stance");
      if (saved === "orthodox" || saved === "southpaw") setBoxingStance(saved);
    } catch { /* device storage may be unavailable */ }
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem("m3-coach-v2-boxing-stance", boxingStance); }
    catch { /* do not block training */ }
  }, [boxingStance]);

  useEffect(() => {
    // A paused local snapshot protects the current workout during a refresh.
    // This never records or persists camera frames, microphone audio or secrets.
    try {
      const raw = window.localStorage.getItem(V2_LOCAL_SAVE);
      if (raw) {
        const saved = JSON.parse(raw) as {
          version?: number;
          savedOn?: string;
          workoutId?: string;
          session?: Partial<V2Session>;
        };
        const savedWorkout = ALL_V2_WORKOUTS.find((item) => item.id === saved.workoutId);
        const s = saved.session;
        // Never let yesterday's phone snapshot override today's prescribed
        // workout. Version 1 had no date stamp, so it is intentionally not
        // restored after this fix.
        if (saved.version === 2 && saved.savedOn === mountainDayKey() && savedWorkout && s) {
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
        version: 2,
        savedOn: mountainDayKey(),
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
    stopMarcusCue();
    stopListening();
    stopDetailedExerciseSpeech();
    stopFridayPremiumCue();
  }, []);

  const exercise = session.workout.exercises[session.exerciseIndex];
  const viewpoint = viewpointFor(session.mode);
  const media = approvedCoachMedia(exercise);
  const recoveredMedia = media ? undefined : recoveredMotionFor(exercise);
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
      // Dynamic form feedback remains visual until server-authenticated
      // Marcus speech is available. Never substitute a different speaker.
      setLiveCue(cue);
    },
    [],
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

  useEffect(() => {
    if (session.phase === "work" && session.running) {
      setRoundFeedback(null);
      // A new strength or kick-only drill must not inherit an earlier boxer
      // observation, which could silence its own rest instructions.
      const trackedBoxing = [
        "boxingStance", "jab", "cross", "jabCross",
        "boxingCombination", "defensiveReset", "guardReset",
      ].includes(exercise?.motionKey ?? "");
      if (!trackedBoxing) latestBoxing.current = null;
    }
  }, [session.phase, session.running, session.setIndex, session.exerciseIndex, exercise?.motionKey]);

  // This runs only when the session enters a new phase or set, never per camera
  // frame. Observed form feedback remains separate and confidence-gated.
  useEffect(() => {
    if ((!session.running && session.phase !== "complete") ||
        !exercise || session.phase === "ready") return;
    const eventKey = [
      session.workout.id, session.exerciseIndex, session.setIndex, session.phase,
    ].join(":");
    if (lastDirectedCue.current === eventKey) return;
    lastDirectedCue.current = eventKey;
    // A new movement must not inherit the previous movement's spoken cue.
    stopMarcusCue();
    stopFridayPremiumCue();
    stopDetailedExerciseSpeech();

    // A camera-observed boxing round has its own specific post-round coach
    // review. Don't start the generic "Rest..." announcement first and then
    // interrupt it with the review (the original double-talking problem).
    const observedBoxingReview =
      (session.phase === "rest" || session.phase === "transition" ||
       session.phase === "complete") &&
      (latestBoxing.current?.confidence ?? 0) >= 0.65;
    if (observedBoxingReview) return;

    let message = "";
    const setupCue = exercise.cues[0] ?? "Get into a stable starting position.";
    const movementCue = exercise.cues[1] ?? "Move with smooth, controlled technique.";
    const breathingCue = exercise.cues[2] ?? "Breathe steadily and keep your form controlled.";
    if (session.phase === "work") {
      const focusedCue = session.setIndex === 0
        ? `${movementCue} ${breathingCue}`
        : (session.setIndex % 2 === 1 ? movementCue : breathingCue);
      message = `${exercise.name}. Set ${session.setIndex + 1} of ${exercise.sets}. ${focusedCue}`;
    } else if (session.phase === "rest") {
      message = `Rest ${exercise.restSeconds} seconds. Reset your breathing and prepare for set ${session.setIndex + 1}.`;
    } else if (session.phase === "transition") {
      const setWord = exercise.sets === 1 ? "set" : "sets";
      message = `Next is ${exercise.name}. Your target is ${exercise.sets} ${setWord}: ${exercise.reps}. Set up: ${setupCue} Then: ${movementCue} ${breathingCue}`;
    } else if (session.phase === "complete") {
      message = "Workout complete. Good work finishing your session.";
    }

    if (message) {
      setLiveCue(message);
      if (voiceOn) {
        const premiumFriday = session.workout.id === "weekly-fri";
        if (session.phase === "rest") {
          stopFridayPremiumCue();
          void playMarcusCue("rest").then((started) => {
            if (!started) speakDetailedExercise(message);
          });
        } else if (session.phase === "transition") {
          if (!premiumFriday && !speakDetailedExercise(message))
            void playMarcusCue("next");
        } else if (session.phase === "complete") {
          stopFridayPremiumCue();
          void playMarcusCue("complete").then((started) => {
            if (!started) speakDetailedExercise(message);
          });
        } else if (session.phase === "work") {
          if (premiumFriday && session.setIndex === 0) {
            stopDetailedExerciseSpeech();
            void playFridayPremiumCue(exercise.motionKey).then((started) => {
              if (!started && !speakDetailedExercise(message))
                void playMarcusCue("start");
            });
          } else if (premiumFriday) {
            void playMarcusCue(session.setIndex === 1 ? "setTwo" : "start").then((started) => {
              if (!started) speakDetailedExercise(message);
            });
          } else if (!speakDetailedExercise(message)) {
            void playMarcusCue(session.setIndex === 0 ? "start" : "setTwo");
          }
        }
      }
    }
  }, [
    session.workout.id, session.exerciseIndex, session.setIndex,
    session.phase, session.running, voiceOn, exercise?.id,
  ]);

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
        case "completeSet": {
          if (session.phase !== "work") {
            setLiveCue("You are already between sets. The workout will continue automatically.");
            return;
          }
          const observed = metricsSnapshot();
          if (exercise?.category === "strength" &&
              observed && observed.confidence >= 0.65 && observed.reps > 0) {
            dispatch({
              type: "set-reps", exerciseId: exercise.id,
              setIndex: session.setIndex, reps: observed.reps,
            });
          }
          dispatch({ type: "complete-set" });
          setLiveCue("Set complete. Keep moving with the coach.");
          return;
        }
        case "next":
        case "skip":
          // Explicit next/skip remains available, but ordinary set completion
          // should use the hands-free "done" command.
          if (session.phase !== "work") {
            setLiveCue("You are already between sets. The workout will continue automatically.");
            return;
          }
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
          if (voiceOn) {
            if (session.workout.id === "weekly-fri" && next) {
              stopDetailedExerciseSpeech();
              void playFridayPremiumCue(next.motionKey).then((started) => {
                if (!started) speakDetailedExercise(
                  `${line} ${next.cues[0] ?? "Get into position."}`,
                );
              });
            } else {
              void playMarcusCue("next");
            }
          }
          return;
        }
        case "muteCoach":
          setVoiceOn(false);
          stopMarcusCue();
          stopDetailedExerciseSpeech();
          stopFridayPremiumCue();
          return;
        case "unmuteCoach":
          setVoiceOn(true);
          void playMarcusCue("intro");
          setLiveCue("Marcus — Warm & Friendly cue voice is on. Detailed coaching remains on screen.");
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
      const boxer = exercise?.category === "boxing" ? latestBoxing.current : null;
      const boxerReliable = Boolean(boxer && boxer.confidence >= 0.65);
      const context = {
        workout: session.workout.title,
        exercise: exercise?.name,
        phase: session.phase,
        setNumber: session.setIndex + 1,
        totalSets: exercise?.sets,
        target: exercise?.reps,
        weight: targetWeight ? String(targetWeight) : undefined,
        camera: {
          active: Boolean((metrics && metrics.confidence >= 0.55) || boxerReliable),
          confidence: boxerReliable ? boxer!.confidence : metrics?.confidence,
          reps: boxerReliable ? boxer!.leadPunches + boxer!.rearPunches : metrics?.reps,
          romAvg: metrics?.romAvg,
          symmetry: metrics?.symmetry,
          cue: boxerReliable ? boxer!.lastCorrection : metrics?.cue,
        },
      };
      setLiveCue("Coach is considering your question…");
      void askLiveCoach(phrase, context).then((reply) => {
        const observed = boxerReliable && boxer
          ? boxer.lastCorrection ||
            ("The camera recorded " + boxer.leadPunches + " completed lead-hand cycles and " +
            boxer.rearPunches + " rear-hand cycles. I cannot verify impact or hidden foot pivot.")
          : null;
        const line = reply || observed ||
          "I cannot reliably judge your form from this view. Reposition the camera or use the on-screen workout controls.";
        setLiveCue(line);
        if (voiceOn && !speakDetailedExercise(line)) void playMarcusCue("next");
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
      stopMarcusCue();
      stopDetailedExerciseSpeech();
      stopFridayPremiumCue();
      setVoiceOn(false);
      setVoiceError(null);
      return;
    }

    setVoiceError(null);
    const started = await playMarcusCue("intro");
    if (started) {
      lastDirectedCue.current = "";
      setVoiceOn(true);
      setLiveCue("Marcus — Warm & Friendly is connected for workout cues.");
      return;
    }

    const fallbackStarted = speakDetailedExercise("Coach voice is on.");
    setVoiceOn(fallbackStarted);
    setVoiceError(
      fallbackStarted
        ? null
        : "Coach audio could not start. Press the voice button once to unlock audio on this device.",
    );
  };

  const toggleWorkout = () => {
    if (session.running) {
      stopMarcusCue();
      stopFridayPremiumCue();
      stopDetailedExerciseSpeech();
      dispatch({ type: "pause" });
      return;
    }

    // A Start/Resume tap is a browser-approved user gesture. Use it to keep
    // coach audio unlocked across Coach, Shadow, Manual and Glasses scenes.
    unlockRecordedCoachAudio();
    lastDirectedCue.current = "";
    dispatch({ type: "start" });
  };

  const startFromOpening = async () => {
    if (openingStarting) return;
    setOpeningStarting(true);
    setVoiceError(null);
    // Start Workout is the only opening-scene exit and also unlocks audio.
    const started = await playMarcusCue("intro", true);
    if (started) setVoiceOn(true);
    else if (!speakDetailedExercise("Coach is ready. Starting your workout.")) {
      setVoiceOn(false);
      setVoiceError("Coach audio could not start. Tap the voice button once after the workout opens.");
    }
    lastDirectedCue.current = "";
    dismissOpening();
    setOpeningStarting(false);
    dispatch({ type: "start" });
  };

  const stageTitle = session.phase === "complete" ? "Workout complete"
    : session.phase === "rest" ? "Rest / get ready" : exercise?.name ?? "";
  const showCoach = session.mode === "coach" || session.mode === "shadow";
  const glasses = session.mode === "glasses";
  const isFighterMovement = exercise?.category === "boxing" || exercise?.category === "kickboxing";
  const guardClip = isFighterMovement ? coachMotionFor("guardReset") : undefined;
  const stageMedia = session.phase === "rest" && guardClip ? guardClip : (media ?? recoveredMedia);
  const stableCoachFraming = exercise?.motionKey === "hamstringCurl";
  const stageUsesRecovered = Boolean(!media && recoveredMedia && stageMedia === recoveredMedia);
  const stagePreloadUrl = isFighterMovement
    ? session.phase === "rest" ? media?.url : guardClip?.url
    : preload?.url;
  const videoPlaying = session.running && (session.phase === "work" ||
    (session.phase === "rest" && isFighterMovement && Boolean(guardClip)));
  // Full 6s technique demonstrations play seven complete guard-to-guard
  // cycles within the 40s bell. The full-length combo is nearly 1:1.
  const videoRate = session.phase === "work" && isFighterMovement && exercise?.seconds === 40
    ? exercise.motionKey === "boxingCombination" ? 1.017 : 1.05
    : 1;
  const realTimeRigReady = (showCoach || glasses) && hasApprovedRealTimeCoach(exercise?.motionKey);

  return (
    <main className="min-h-dvh bg-[#080b0f] text-white">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5">
        <input
          ref={athletePicker}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label="Select your approved athlete avatar image"
          onChange={(event) => {
            const chosen = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!chosen) return;
            setAthleteError(null);
            void saveAthletePortrait(chosen)
              .then((source) => setAthletePortrait(source))
              .catch((error: unknown) => setAthleteError(
                error instanceof Error ? error.message : "Could not save your avatar.",
              ));
          }}
        />
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#111820] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.32em] text-cyan-300">
              M3 Coach V2
            </p>
            <h1 className="mt-1 text-lg font-black">Interactive training</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (session.running) dispatch({ type: "pause" });
                setShowOpening(true);
                if (voiceOn) void playMarcusCue("intro");
              }}
              className="min-h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-xs font-black text-white/85"
            >
              Opening scene
            </button>
          <button
            type="button"
            onClick={() => {
              const boxing = V2_WORKOUTS.find((item) => item.id === "boxing-kickboxing");
              if (!boxing) return;
              setWorkoutId(boxing.id);
              dispatch({ type: "reset", workout: boxing });
              dispatch({ type: "set-mode", mode: "shadow" });
            }}
            className="min-h-11 max-w-[48%] rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-3 text-[11px] font-black uppercase leading-tight tracking-wide text-cyan-200"
          >
            Boxing + Kickboxing
          </button>
          </div>
        </header>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/[.07] px-4 py-3">
          <div>
            <p className="text-xs font-black text-cyan-200">Your original seven-day training plan is available here.</p>
            <p className="mt-1 text-xs text-white/65">Today's program: {originalWorkoutForToday().title}. Missing videos do not remove exercises.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const day = originalWorkoutForToday();
              setWorkoutId(day.id);
              dispatch({ type: "reset", workout: day });
              setLiveCue("Original " + day.title + " workout loaded. Press Start when ready.");
            }}
            className="min-h-11 rounded-xl bg-cyan-300 px-4 text-xs font-black text-black"
          >
            Load today's FULL workout
          </button>
        </div>
        {athleteError && (
          <p role="alert" className="mt-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs text-amber-100">
            {athleteError}
          </p>
        )}

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="relative min-h-[67dvh] overflow-hidden rounded-3xl border border-white/10 bg-[#070c12] sm:min-h-[720px]">
            {realTimeRigReady && <M3GymRenderer session={session} />}
            {showCoach && !realTimeRigReady && stageMedia && (
              <CoachMotion
                key={stageMedia.url}
                url={stageMedia.url}
                playing={showCoach && videoPlaying}
                rate={videoRate}
                stableFraming={stableCoachFraming}
                cycleKey={`${session.workout.id}:${session.exerciseIndex}:${session.setIndex}:${session.phase === "rest" ? "rest" : "work"}`}
                preloadUrl={stagePreloadUrl}
                className="absolute inset-0 h-full w-full"
                label={
                  stageUsesRecovered
                    ? `Motion demo of ${exercise?.name ?? "movement"}`
                    : `Approved coach demonstrating ${exercise?.name ?? "movement"}`
                }
              />
            )}
            {showCoach && !realTimeRigReady && stableCoachFraming && stageMedia && (
              <div className="pointer-events-none absolute left-3 top-3 z-[7] rounded-xl border border-cyan-300/40 bg-black/80 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-200">Stable leg curl</p>
                <p className="mt-1 text-[11px] text-white/80">Hips down · torso pinned · slow return</p>
              </div>
            )}
            {showCoach && !realTimeRigReady && stageUsesRecovered && recoveredMedia && (
              <div className="pointer-events-none absolute bottom-[104px] right-3 z-[6] max-w-[58%] rounded-xl border border-amber-300/40 bg-black/80 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200">
                  Motion demo
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/65">
                  Correct movement recovered from the original app. Follow the movement while your approved Virtual Coach provides the workout cues.
                </p>
              </div>
            )}
            {showCoach && !realTimeRigReady && !stageMedia && (
              <div
                className="absolute inset-0 bg-[#070c12]"
                data-testid="motion-pending-stage"
                aria-label={`Approved motion pending for ${exercise?.name ?? "movement"}`}
              />
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
              stance={boxingStance}
              onBoxingSnapshot={receiveBoxing}
              onRoundSummary={reportRound}
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
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-xs font-black uppercase text-black disabled:opacity-35"
                      aria-label={session.running ? "Pause workout" : "Start workout"}
                    >
                      {session.running ? <Pause className="size-5" /> : <Play className="size-5" />}
                      <span>{session.running ? "Pause" : "Start"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "complete-set" })}
                      disabled={session.phase !== "work"}
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
              <div className="mb-3 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/35 p-2">
                <div className="flex items-center gap-2">
                  <img src={COACH_REFERENCE} alt="Approved M3 coach" className="size-11 rounded-xl border border-cyan-300/25 object-cover object-top" />
                  {athletePortrait && (
                    <img src={athletePortrait} alt="Your approved athlete avatar" className="size-11 rounded-xl border border-white/20 object-cover object-top" />
                  )}
                  <p className="max-w-28 text-[10px] font-black leading-tight text-white/75">
                    {athletePortrait ? "Your coach + your athlete" : "Original M3 coach"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => athletePicker.current?.click()}
                  className="min-h-10 rounded-lg bg-white/10 px-3 text-[10px] font-black text-cyan-200"
                >
                  {athletePortrait ? "Change my avatar" : "Add my avatar"}
                </button>
              </div>
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

            {roundFeedback && (exercise?.category === "boxing" || exercise?.category === "kickboxing") && (
              <section className="rounded-3xl border border-cyan-300/30 bg-cyan-300/[.06] p-4">
                <p className="text-[10px] font-black uppercase tracking-[.24em] text-cyan-300">Observed round review</p>
                <p className="mt-2 text-sm leading-relaxed text-white/85">{roundFeedback}</p>
                <button
                  type="button"
                  disabled
                  className="mt-3 min-h-10 rounded-xl bg-white/10 px-3 text-xs font-black text-white disabled:opacity-45"
                >
                  Marcus review audio needs full runtime
                </button>
              </section>
            )}

            {(exercise?.category === "boxing" || exercise?.category === "kickboxing") && (
              <section className="rounded-3xl border border-white/10 bg-white/[.035] p-4">
                <p className="text-[10px] font-black uppercase tracking-[.24em] text-white/50">Your boxing stance</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["orthodox", "southpaw"] as const).map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setBoxingStance(choice)}
                      className={`min-h-11 rounded-xl border px-2 text-xs font-black ${boxingStance === choice
                        ? "border-cyan-300 bg-cyan-300/15 text-cyan-100"
                        : "border-white/10 bg-black/30 text-white/65"}`}
                    >
                      {choice === "orthodox" ? "Orthodox · left lead" : "Southpaw · right lead"}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-white/50">
                  Put your phone far enough back to show your head, hands and feet, at about chest height and a three-quarter angle. Camera cues assess visible movement, not punch power or hidden foot pivot.
                </p>
              </section>
            )}

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
                {voiceOn ? "Marcus cue voice on" : "Enable Marcus voice"}
              </button>
              <p className="mt-2 text-[11px] text-white/45">
                Marcus — Warm & Friendly remains the recorded branded cue voice. Because the connected Marcus account cannot generate new exercise-specific speech right now, V2 uses your phone's local voice only for the detailed exercise name, set number and form cue so you are never left hearing only “next.”
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
                    Music-friendly mode is on by default: Start does not open the microphone, so your phone music and Marcus can play together. Enable hands-free commands only when you want voice control; on some Android phones microphone listening can temporarily duck external music.
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
                    const nextWorkout = ALL_V2_WORKOUTS.find((w) => w.id === event.target.value) ??
                      originalWorkoutForToday();
                    setWorkoutId(nextWorkout.id);
                    dispatch({ type: "reset", workout: nextWorkout });
                    setLiveCue(null);
                  }}
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#111920] px-3 text-sm font-bold text-white"
                >
                  {ALL_V2_WORKOUTS.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </label>
              <p className="mt-2 text-xs text-white/50">{workout.focus}</p>
              <div className="mt-3 space-y-1">
                {session.workout.exercises.map((item, index) => {
                  const approved = Boolean(approvedCoachMedia(item));
                  const recovered = !approved ? recoveredMotionFor(item) : undefined;
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
                      ) : recovered ? (
                        <span className="shrink-0 rounded-full bg-amber-300/10 px-2 py-1 text-[9px] font-black text-amber-200">Motion demo</span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] font-black text-white/45">Motion pending</span>
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
      {showOpening && (
        <WorkoutOpeningScene
          starting={openingStarting}
          athletePortrait={athletePortrait}
          onChooseAthlete={() => athletePicker.current?.click()}
          onStart={() => void startFromOpening()}
        />
      )}
    </main>
  );
}
