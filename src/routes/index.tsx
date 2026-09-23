import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Glasses,
  Play,
  RotateCcw,
  Undo2,
  X,
  Zap,
} from "lucide-react";
import { NUTRITION_CARD, orderedExercises, planForDay, weekOfDay } from "@/data/program";
import {
  completedCount,
  currentDayNumber,
  dayDateLabel,
  getDay,
  hasActiveSession,
  restartWorkout,
  saveAndExit,
  startWorkoutOnce,
  supersetsOn,
  updateDay,
  useApp,
} from "@/lib/store";

import { COACH_REFERENCE } from "@/data/coach-identity";
import { ExerciseLibraryButton } from "@/components/ExerciseLibrary";
import { ReadinessCheck } from "@/components/ReadinessCheck";
import { SubstitutionSelect } from "@/components/SubstitutionSelect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Arm Growth & Conditioning Tracker" },
      {
        name: "description",
        content:
          "Today's session: readiness check, Mirror Me demos, set tracking, rest timers and a heads-up glasses mode.",
      },
      { property: "og:title", content: "Today — Arm Growth & Conditioning Tracker" },
      {
        property: "og:description",
        content: "Strength, weighted cardio and boxing conditioning with Mirror Me exercise demos.",
      },
    ],
  }),
  component: Today,
});

function Today() {
  const state = useApp();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const day = mounted ? currentDayNumber(state) : 1;
  const plan = planForDay(day);
  const log = getDay(state, day);
  const useSS = supersetsOn(state, day);
  const list = orderedExercises(day, useSS);
  const [checking, setChecking] = useState(false);
  const [startChoice, setStartChoice] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [navError, setNavError] = useState("");

  const doneSets = list.reduce(
    (n, e) => n + (log.exercises[e.id]?.sets.filter((s) => s.done).length ?? 0),
    0,
  );
  const totalSets = list.reduce((n, e) => n + e.sets, 0);
  const started = doneSets > 0 && !log.completed;
  const allResolved =
    list.length === 0 ||
    list.every((e) => {
      const el = log.exercises[e.id];
      return !!el && (el.skipped === true || el.complete === true);
    });
  const ready = !!log.readiness;

  const go = (path: string, to: "/workout/$day" | "/coach/$day") => {
    setNavError("");
    try {
      const r = navigate({ to, params: { day: String(day) } }) as unknown as Promise<void>;
      if (r && typeof (r as Promise<void>).catch === "function") {
        r.catch(() => {
          if (typeof window !== "undefined") window.location.assign(path);
        });
      }
    } catch {
      if (typeof window !== "undefined") window.location.assign(path);
      else setNavError("Could not open Coach Mode. Please try again.");
    }
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        if (window.location.pathname !== path) window.location.assign(path);
      }, 1200);
    }
  };

  const openWorkout = () => go(`/workout/${day}`, "/workout/$day");
  const openCoach = () => go(`/coach/${day}`, "/coach/$day");

  return (
    <main className="px-4 pt-6">
      <header className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">
          Willie Moore III
        </p>
        <h1 className="text-3xl font-bold">Arm Growth &amp; Conditioning</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Day {day} · Week {weekOfDay(day)} · {plan.weekday} · {plan.title}
          {mounted ? ` · ${dayDateLabel(state, day)}` : ""}
        </p>
      </header>

      <section className="surface-card relative mb-5 overflow-hidden rounded-2xl">
        <button
          type="button"
          onClick={() => setAvatarOpen(true)}
          className="block w-full"
          aria-label="View full motivation image"
        >
          <img
            src={COACH_REFERENCE}
            alt="The approved coach training in the gym"
            className="mx-auto max-h-64 w-full object-contain"
            loading="eager"
          />
        </button>
        <p className="absolute inset-x-0 bottom-0 bg-background/55 p-2 text-center text-sm font-bold uppercase leading-tight tracking-wide backdrop-blur-sm">
          If you want it, <span className="text-primary">get off your ass and get it!</span>
        </p>
      </section>

      {avatarOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur"
          role="dialog"
          aria-modal="true"
          aria-label="Motivation image"
        >
          <div className="flex justify-end p-3">
            <button
              type="button"
              aria-label="Close image"
              onClick={() => setAvatarOpen(false)}
              className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <img
              src={COACH_REFERENCE}
              alt="The approved coach training in the gym"
              className="mx-auto h-auto w-full object-contain"
            />
          </div>
        </div>
      )}

      <section className="surface-card rounded-2xl p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold">{plan.title}</h2>
            <p className="text-sm text-accent">{plan.focus}</p>
          </div>
          {log.completed && <CheckCircle2 className="size-7 shrink-0 text-success" />}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>

        <div className="mt-4 grid gap-2">
          <ExerciseLibraryButton label="Exercise demo library" />
          <Link
            to="/glasses"
            search={{ day }}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/10 px-4 text-base font-bold uppercase tracking-wide text-primary"
          >
            <Glasses className="size-5" aria-hidden /> Glasses mode
          </Link>
        </div>

        {plan.type !== "measure" && list.length > 0 && (
          <>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {doneSets} / {totalSets} sets logged
            </p>

            {ready && (
              <p className="mt-2 flex items-center gap-1 text-xs text-success">
                <ClipboardCheck className="size-4" aria-hidden /> Readiness check done · energy{" "}
                {log.readiness?.energy}/5
              </p>
            )}

            {started && (
              <div className="mt-4 rounded-xl border border-accent/40 bg-accent/10 p-3">
                <p className="text-sm font-bold uppercase tracking-wide text-accent">
                  Workout in progress
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {doneSets} of {totalSets} sets logged
                  {log.savedIncomplete ? " · saved as incomplete" : ""}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={openCoach}
                    className="tap-target rounded-xl bg-primary text-xs font-bold uppercase text-primary-foreground"
                  >
                    Resume coached session
                  </button>
                  <button
                    type="button"
                    onClick={openWorkout}
                    className="tap-target rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    Review workout
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartChoice(true)}
                    className="tap-target rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    Start over
                  </button>
                  <button
                    type="button"
                    onClick={() => saveAndExit(day, true)}
                    className="tap-target rounded-xl border border-border bg-card text-xs font-bold uppercase"
                  >
                    End &amp; save incomplete
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Resuming opens the exact set you left on. The clock stays paused until you press
                  play.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (log.completed) return openCoach();
                if (hasActiveSession(state, day)) return setStartChoice(true);
                if (!ready) return setChecking(true);
                startWorkoutOnce(day);
                openCoach();
              }}
              className="tap-target mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-center text-base font-bold uppercase leading-tight tracking-wide text-primary-foreground"
            >
              {started ? (
                <RotateCcw className="size-5 shrink-0" />
              ) : (
                <Play className="size-5 shrink-0" />
              )}
              {log.completed
                ? "Coach Mode — review session"
                : started
                  ? "Resume Coach Mode"
                  : "Coach Mode — Train with Coach"}
            </button>
            {navError && (
              <p className="mt-2 rounded-xl bg-destructive/15 p-2 text-center text-xs font-semibold text-destructive">
                {navError}
              </p>
            )}
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Coach performs every movement with you, talks you through sets, rest, camera and form.
            </p>

            <button
              type="button"
              onClick={openWorkout}
              className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-sm font-semibold"
            >
              <ClipboardCheck className="size-4" aria-hidden /> Manual workout log
            </button>

            <button
              type="button"
              onClick={() => updateDay(day, (d) => ({ ...d, useSupersets: !useSS }))}
              aria-pressed={useSS}
              className="tap-target mt-3 flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Zap className="size-4 text-accent" aria-hidden /> Use supersets today
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  useSS ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {useSS ? "On" : "Off"}
              </span>
            </button>
          </>
        )}

        {plan.type === "measure" && (
          <Link
            to="/progress"
            className="tap-target mt-4 flex w-full items-center justify-center rounded-xl bg-primary text-base font-bold uppercase tracking-wide text-primary-foreground"
          >
            Log final measurements
          </Link>
        )}

        <button
          type="button"
          disabled={!log.completed && !allResolved}
          onClick={() =>
            updateDay(day, (d) => ({
              ...d,
              completed: !d.completed,
              completedAt: d.completed ? undefined : new Date().toISOString(),
            }))
          }
          className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-sm font-semibold disabled:opacity-40"
        >
          {log.completed ? <Undo2 className="size-5" /> : <CheckCircle2 className="size-5" />}
          {log.completed ? "Undo complete" : "Mark day complete"}
        </button>
        {!log.completed && !allResolved && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Complete or skip every exercise to unlock "Mark day complete".
          </p>
        )}
      </section>

      {checking && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Readiness check"
          className="fixed inset-0 z-[60] overflow-y-auto bg-background/95 p-4 backdrop-blur"
        >
          <div className="mx-auto w-full max-w-lg pb-24">
            <ReadinessCheck
              onCancel={() => setChecking(false)}
              onSave={(r) => {
                updateDay(day, (d) => ({ ...d, readiness: r }));
                setChecking(false);
                startWorkoutOnce(day);
                openCoach();
              }}
            />
          </div>
        </div>
      )}

      {startChoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Unfinished workout"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-4 backdrop-blur"
        >
          <div className="surface-card w-full max-w-lg rounded-2xl p-5">
            <h2 className="text-xl font-bold">You have an unfinished workout</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Day {day} · {doneSets} of {totalSets} sets logged. Pick up where you left off or start
              a brand-new session.
            </p>
            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setStartChoice(false);
                  openCoach();
                }}
                className="tap-target w-full rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
              >
                Resume existing workout
              </button>
              <button
                type="button"
                onClick={() => {
                  restartWorkout(day);
                  setStartChoice(false);
                  openCoach();
                }}
                className="tap-target w-full rounded-xl bg-elevated text-sm font-bold uppercase"
              >
                Start a new session
              </button>
              <button
                type="button"
                onClick={() => setStartChoice(false)}
                className="tap-target w-full rounded-xl border border-border bg-card text-sm font-bold uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {list.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-lg font-bold uppercase tracking-wide">Today's exercises</h2>
          <ul className="space-y-3">
            {list.map((e) => {
              const el = log.exercises[e.id];
              const blank = Array.from({ length: e.sets }, () => ({
                reps: "",
                weight: "",
                done: false,
              }));
              const ready =
                el?.skipped === true ||
                (!!el && el.sets.length > 0 && el.sets.every((s) => s.done));
              const done = !!el && (el.skipped === true || el.complete === true);
              const patch = (extra: Record<string, unknown>) =>
                updateDay(day, (d) => ({
                  ...d,
                  exercises: {
                    ...d.exercises,
                    [e.id]: { ...(d.exercises[e.id] ?? { sets: blank }), ...extra },
                  },
                }));
              return (
                <li
                  key={e.id}
                  className={`surface-card rounded-2xl p-4 ${done ? "opacity-80 ring-1 ring-success/40" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className={`text-base font-bold ${done ? "text-success" : ""}`}>
                      {e.name}
                    </h3>
                    {el?.skipped ? (
                      <span className="text-xs text-muted-foreground">Skipped</span>
                    ) : (
                      el?.complete && (
                        <span className="text-xs font-bold text-success">Complete</span>
                      )
                    )}
                  </div>
                  {useSS && e.superset && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                      <Zap className="size-3" aria-hidden /> Pair {e.superset} · {e.supersetSlot}
                    </span>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {e.sets} × {e.reps} · {e.target}
                  </p>
                  {useSS && e.superset && e.supersetWarning && (
                    <p className="mt-2 rounded-xl bg-destructive/10 p-2 text-[11px] font-semibold text-destructive">
                      {e.supersetWarning}
                    </p>
                  )}
                  <SubstitutionSelect
                    exercise={e}
                    value={el?.replacedWith}
                    onChange={(v) => patch({ replacedWith: v })}
                  />
                  <button
                    type="button"
                    onClick={() => patch({ complete: !el?.complete, skipped: false })}
                    disabled={!ready && !el?.complete}
                    className={`tap-target mt-3 w-full rounded-xl text-sm font-bold uppercase ${
                      el?.complete
                        ? "bg-elevated text-muted-foreground"
                        : "bg-success/25 text-success disabled:bg-muted disabled:text-muted-foreground"
                    }`}
                  >
                    {el?.complete ? "Reopen exercise" : "Exercise Complete"}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="surface-card mt-6 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase tracking-wide text-accent">
          {NUTRITION_CARD.title}
        </h2>
        <ul className="mt-2 space-y-2 text-sm">
          {NUTRITION_CARD.points.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-accent">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {completedCount(state)} sessions complete
      </p>
    </main>
  );
}