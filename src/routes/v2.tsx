import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useReducer, useState } from "react";
import {
  Eye,
  Glasses,
  Hand,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  UserRound,
} from "lucide-react";
import { V2_VIEWPOINTS, V2_WORKOUTS, viewpointFor } from "@/v2/catalog";\nimport { M3GymRenderer } from "@/v2/renderer";
import { sceneContractFor } from "@/v2/scene";
import { createV2Session, v2SessionReducer } from "@/v2/session";
import type { V2Mode } from "@/v2/types";

export const Route = createFileRoute("/v2")({
  head: () => ({
    meta: [
      { title: "M3 Coach V2 — Clean Rebuild" },
      {
        name: "description",
        content:
          "Isolated V2 workout runtime: one session, four viewpoints, renderer-ready gym scene contract.",
      },
    ],
  }),
  component: V2Preview,
});

const modeIcon: Record<V2Mode, typeof Eye> = {
  coach: UserRound,
  manual: Hand,
  shadow: Eye,
  glasses: Glasses,
};

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

function V2Preview() {
  const [workoutId, setWorkoutId] = useState(V2_WORKOUTS[0].id);
  const workout = useMemo(
    () => V2_WORKOUTS.find((w) => w.id === workoutId) ?? V2_WORKOUTS[0],
    [workoutId],
  );
  const [session, dispatch] = useReducer(v2SessionReducer, workout, createV2Session);

  useEffect(() => {
    dispatch({ type: "reset", workout });
  }, [workout]);

  useEffect(() => {
    if (!session.running) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 1000);
    return () => window.clearInterval(timer);
  }, [session.running]);

  const exercise = session.workout.exercises[session.exerciseIndex];
  const viewpoint = viewpointFor(session.mode);
  const scene = sceneContractFor(session);

  return (
    <main className="min-h-dvh bg-[#080a0d] text-white">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-3 py-3 sm:px-5">
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300">
              M3 Coach V2
            </p>
            <h1 className="mt-1 text-lg font-black">Clean rebuild preview</h1>
          </div>
          <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-200">
            Isolated branch
          </div>
        </header>

        <div className="mt-3 grid flex-1 gap-3 lg:grid-cols-[1fr_320px]">
          <section className="relative min-h-[64dvh] overflow-hidden rounded-3xl border border-white/10 bg-[#10151a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,0.12),transparent_36%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_35%)]" />

            <div className="relative z-10 flex items-center justify-between gap-2 p-3">
              <div className="rounded-xl bg-black/35 px-3 py-2 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                  {viewpoint.label} view
                </p>
                <p className="text-xs text-white/55">{viewpoint.camera}</p>
              </div>
              <div className="rounded-xl bg-black/35 px-3 py-2 text-right backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/45">
                  Scene
                </p>
                <p className="text-xs font-bold">M3 Gym V2</p>
              </div>
            </div>

            <div className="relative z-10 grid min-h-[50dvh] place-items-center px-4 pb-32 text-center">
              <div className="max-w-xl">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-white/45">
                  {session.phase}
                </p>
                <h2 className="mt-3 text-[clamp(2.1rem,7vw,5rem)] font-black uppercase leading-none">
                  {exercise?.name ?? "Workout complete"}
                </h2>
                {exercise && (
                  <>
                    <p className="mt-4 text-lg font-semibold text-cyan-200">
                      {exercise.seconds
                        ? `${exercise.seconds}s work`
                        : exercise.reps
                          ? `${exercise.reps} reps`
                          : "Follow coach"}
                    </p>
                    <p className="mt-2 text-sm text-white/55">
                      Set {Math.min(session.setIndex + 1, exercise.sets)} of {exercise.sets}
                    </p>
                  </>
                )}

                <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-black/25 p-4 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">
                    Renderer contract
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <dt className="text-white/40">Motion</dt>
                      <dd className="mt-1 font-bold">{scene.motionKey}</dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Camera FOV</dt>
                      <dd className="mt-1 font-bold">{scene.camera.fov}°</dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Coach visible</dt>
                      <dd className="mt-1 font-bold">{scene.showCoach ? "Yes" : "No"}</dd>
                    </div>
                    <div>
                      <dt className="text-white/40">Athlete camera</dt>
                      <dd className="mt-1 font-bold">{scene.showAthleteCamera ? "Yes" : "No"}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-[11px] leading-relaxed text-white/45">
                    This is intentionally not pretending to be 3D yet. A real rigged coach and
                    renderer will consume this exact scene contract.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 z-10 p-3">
              <div className="rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold">{session.workout.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">
                      {mmss(session.elapsedSeconds)} elapsed
                      {session.phaseSecondsLeft !== null
                        ? ` · ${session.phaseSecondsLeft}s left`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        dispatch({ type: session.running ? "pause" : "start" })
                      }
                      className="grid size-11 place-items-center rounded-xl bg-cyan-300 text-black"
                      aria-label={session.running ? "Pause" : "Start"}
                    >
                      {session.running ? (
                        <Pause className="size-5" />
                      ) : (
                        <Play className="size-5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "complete-set" })}
                      className="grid size-11 place-items-center rounded-xl bg-white/10"
                      aria-label="Complete set"
                    >
                      <SkipForward className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "reset", workout })}
                      className="grid size-11 place-items-center rounded-xl bg-white/10"
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
            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-3">
              <p className="px-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                Same workout · different viewpoint
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
                      className={`min-h-20 rounded-2xl border p-3 text-left transition ${
                        active
                          ? "border-cyan-300/70 bg-cyan-300/15"
                          : "border-white/10 bg-black/20"
                      }`}
                    >
                      <Icon className={`size-5 ${active ? "text-cyan-300" : "text-white/50"}`} />
                      <p className="mt-2 text-sm font-black">{mode.label}</p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/40">
                        {mode.camera}
                      </p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <label className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                Workout
                <select
                  value={workoutId}
                  onChange={(e) => setWorkoutId(e.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-[#12171c] px-3 text-sm font-bold text-white"
                >
                  {V2_WORKOUTS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-xs leading-relaxed text-white/45">{workout.focus}</p>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/45">
                What is different now
              </p>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-white/65">
                <li>• One reducer owns the entire session.</li>
                <li>• Modes only change camera/control behavior.</li>
                <li>• Scene positions are stable across mode changes.</li>
                <li>• Motion is addressed by reusable motion keys.</li>
                <li>• No old Coach/Manual/Glasses screens are reused here.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
