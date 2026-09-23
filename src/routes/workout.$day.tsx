import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Timer,
  Undo2,
  Zap,
} from "lucide-react";
import { orderedExercises, planForDay, RECOVERY_CHECKLIST, type Exercise } from "@/data/program";
import {
  beep,
  deleteWorkout,
  elapsedFor,
  getDay,
  lastWeightFor,
  pauseWorkout,
  restartClock,
  restartEntireWorkout,
  resetExercises,
  resumeWorkout,
  retrySave,
  saveAndExit,
  startWorkoutOnce,
  completeWorkout,
  progressionFor,
  supersetsOn,
  applyPairs,
  updateDay,
  useApp,
  useSaveStatus,
  type DayLog,
  type ExerciseLog,
  type SetEntry,
} from "@/lib/store";
import { WorkoutModeButton } from "@/components/WorkoutModeMenu";
import { MirrorMeButton } from "@/components/MirrorMe";
import { ShareWorkout } from "@/components/ShareWorkout";
import { SheetPanel, SheetButton } from "@/components/Sheet";
import { SetRowCompact, columnsFor } from "@/components/SetRowCompact";
import { ExerciseOptions } from "@/components/ExerciseOptions";
import { SmartPairing } from "@/components/SmartPairing";
import { AdaptiveSuggestion } from "@/components/AdaptiveSuggestion";
import {
  adviceAfterSet,
  describeSet,
  lastSessionSets,
  previousSetFor,
  weightValue,
  type SetAdvice,
} from "@/lib/progression";

import {
  KIND_LABELS,
  fieldsFor,
  kindOf,
  warmupTransitionRest,
  workingRestFor,
} from "@/lib/exercise-kind";
import { recommendedPairs } from "@/lib/pairing";
import { CastConnect } from "@/components/CastConnect";
import { DAY_GUIDES } from "@/data/guides";
import {
  publish,
  setCommandHandler,
  type DisplayCommand,
  type DisplaySnapshot,
} from "@/lib/display-link";
import { sendSnapshot, setCastCommandHandler } from "@/lib/cast-link";

export const Route = createFileRoute("/workout/$day")({
  head: () => ({
    meta: [
      { title: "Guided Workout — 22-Day Arm Growth Tracker" },
      {
        name: "description",
        content: "Log every set in one clean scrolling list with automatic rest.",
      },
      { property: "og:title", content: "Guided Workout — 22-Day Arm Growth Tracker" },
      {
        property: "og:description",
        content: "Guided arm growth workout with automatic rest timers.",
      },
    ],
  }),
  component: Workout,
});

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

const topRepTarget = (reps: string) => {
  const nums = reps.match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : undefined;
};

const setsFor = (log: DayLog, e: Exercise): SetEntry[] =>
  log.exercises[e.id]?.sets ??
  Array.from({ length: e.sets }, () => ({ reps: "", weight: "", done: false }));

const isResolved = (log: DayLog, e: Exercise) => {
  const el = log.exercises[e.id];
  return !!el && (el.skipped === true || el.complete === true);
};

function Workout() {
  const { day: dayParam } = Route.useParams();
  const day = Number(dayParam);
  const state = useApp();
  const navigate = useNavigate();
  const plan = planForDay(day);
  const useSS = supersetsOn(state, day);
  const log = getDay(state, day);
  const customPairs = log.customPairs ?? [];
  const base = orderedExercises(day, useSS);
  const list = useSS
    ? base.map((e) => {
        const pi = customPairs.findIndex((p) => p.a === e.id || p.b === e.id);
        if (pi < 0) {
          return log.pairsInitialized
            ? { ...e, superset: undefined, supersetSlot: undefined, supersetRest: undefined }
            : e;
        }
        const letter = String.fromCharCode(65 + pi);
        const cp = customPairs[pi];
        return {
          ...e,
          superset: letter,
          supersetSlot: cp.a === e.id ? `${letter}1` : `${letter}2`,
          supersetRest: e.rest,
        };
      })
    : base;
  const idx = Math.min(log.cursor, Math.max(0, list.length - 1));
  const exercise = list[idx];

  const saveStatus = useSaveStatus();
  const [rest, setRest] = useState(0);

  const [running, setRunning] = useState(false);
  const [restDone, setRestDone] = useState(false);
  const [restAnchor, setRestAnchor] = useState<number | null>(null);
  const [restOpen2, setRestExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [panel, setPanel] = useState<
    | null
    | "overview"
    | "stop"
    | "restart"
    | "pickFrom"
    | "resetClock"
    | "discard"
    | "more"
    | "pairs"
  >(null);
  const [menuFor, setMenuFor] = useState<number | null>(null);
  const [valueMode, setValueMode] = useState<"keep" | "suggest" | "clear">("keep");
  const keepValues = valueMode === "keep";

  const [customRest, setCustomRest] = useState("");
  const [advice, setAdvice] = useState<SetAdvice | null>(null);
  const [hideNext, setHideNext] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollWanted = useRef(false);

  /* smart pairing: recommended (or saved) pairs are pre-selected */
  useEffect(() => {
    if (!useSS || log.pairsInitialized || log.completed) return;
    const ids = new Set(base.map((e) => e.id));
    const saved = (state.savedPairs[plan.key] ?? []).filter((p) => ids.has(p.a) && ids.has(p.b));
    if (saved.length > 0) {
      applyPairs(day, saved, ["Your saved pairings for this day were applied."]);
      return;
    }
    const rec = recommendedPairs(base, log, log.readiness);
    applyPairs(day, rec.pairs, rec.notes);
  }, [useSS, log.pairsInitialized, log.completed, day, plan.key, base, log, state.savedPairs]);

  /* display / cast plumbing */
  const snapRef = useRef<DisplaySnapshot | null>(null);
  const cmdRef = useRef<(c: DisplayCommand) => void>(() => {});
  useEffect(() => {
    setCommandHandler((c) => cmdRef.current(c));
    setCastCommandHandler((c) => cmdRef.current(c));
    return () => {
      setCommandHandler(null);
      setCastCommandHandler(null);
    };
  }, []);
  useEffect(() => {
    const t = setInterval(() => {
      if (snapRef.current) {
        publish(snapRef.current);
        sendSnapshot(snapRef.current);
      }
    }, 500);
    return () => clearInterval(t);
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* auto-save when leaving / backgrounding */
  useEffect(() => {
    const bank = () => saveAndExit(day);
    const onHide = () => {
      if (document.visibilityState === "hidden") bank();
    };
    window.addEventListener("pagehide", bank);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", bank);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [day]);

  /* open the first incomplete exercise when the session is opened */
  const openedRef = useRef(false);
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    if (log.completed || list.length === 0) return;
    const first = list.findIndex((e) => !isResolved(log, e));
    if (first >= 0 && first !== log.cursor) updateDay(day, (d) => ({ ...d, cursor: first }));
  }, [day, list, log]);

  /* rest countdown */
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setRest((r) => {
        if (r <= 1) {
          setRunning(false);
          setRestDone(true);
          beep(state.settings, 880);
          if (state.settings.vibration && typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([120, 80, 120]);
          }
          scrollWanted.current = true;
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, state.settings]);

  const elapsedMs = elapsedFor(log, now);
  const clockRunning = !!log.startedAt && !log.paused;
  const clockStarted = clockRunning || (log.elapsedMs ?? 0) > 0;

  /* ------------------------------ summary ------------------------------ */
  const doneSets = list.reduce((n, e) => n + setsFor(log, e).filter((s) => s.done).length, 0);
  const totalSets = list.reduce((n, e) => n + setsFor(log, e).length, 0);
  const completedExercises = list.filter(
    (e) => !log.exercises[e.id]?.skipped && isResolved(log, e),
  );
  const skipped = list.filter((e) => log.exercises[e.id]?.skipped);
  const painFlags = list
    .map((e) => ({ name: e.name, pain: log.exercises[e.id]?.pain ?? 0 }))
    .filter((p) => p.pain >= 4);
  const allResolved = list.length > 0 && list.every((e) => isResolved(log, e));
  const volume = list.reduce(
    (n, e) =>
      n +
      setsFor(log, e)
        .filter((x) => x.done)
        .reduce((v, x) => v + (Number(x.weight) || 0) * (Number(x.reps) || 0), 0),
    0,
  );

  /* auto-scroll the active row into view after a completion / rest end.
     Must stay ABOVE the early returns below so hook order never changes. */
  const activeKeyRef = useRef("");
  useEffect(() => {
    if (!scrollWanted.current) return;
    scrollWanted.current = false;
    const el = rowRefs.current[activeKeyRef.current];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [log.cursor, doneSets, restDone]);

  if (log.completed) {
    return (
      <CompletedScreen
        day={day}
        planTitle={plan.title}
        log={log}
        completedNames={completedExercises.map((e) => log.exercises[e.id]?.replacedWith || e.name)}
        skippedNames={skipped.map((e) => e.name)}
        doneSets={doneSets}
        totalSets={totalSets}
      />
    );
  }

  if (!exercise) {
    return (
      <main className="px-4 pt-10 text-center">
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">No exercises scheduled for this day.</p>
        <Link
          to="/"
          className="tap-target mt-6 inline-flex items-center rounded-xl bg-primary px-6 font-bold text-primary-foreground"
        >
          Back to Today
        </Link>
      </main>
    );
  }

  /* ------------------------------ helpers ------------------------------ */
  const nameOf = (e: Exercise) => log.exercises[e.id]?.replacedWith || e.name;
  const kindOfEx = (e: Exercise) => kindOf(e, log.exercises[e.id]?.replacedWith);
  const doneCountOf = (e: Exercise) => setsFor(log, e).filter((s) => s.done).length;
  const hasSetsLeft = (e: Exercise) => setsFor(log, e).some((s) => !s.done);
  const restLengthOf = (e: Exercise) =>
    log.exercises[e.id]?.restOverride ??
    workingRestFor(e, kindOfEx(e), useSS && e.superset ? e.supersetRest : undefined);
  const repTargetOf = (e: Exercise) => log.exercises[e.id]?.repTarget ?? e.reps;

  const write = (id: string, next: SetEntry[], extra: Partial<ExerciseLog> = {}) =>
    updateDay(day, (d) => ({
      ...d,
      exercises: {
        ...d.exercises,
        [id]: { ...(d.exercises[id] ?? { sets: next }), ...extra, sets: next },
      },
    }));

  const meta = (id: string, patch: Partial<ExerciseLog>) =>
    updateDay(day, (d) => {
      const existing = d.exercises[id] ?? {
        sets: setsFor(d, list.find((e) => e.id === id)!),
      };
      return { ...d, exercises: { ...d.exercises, [id]: { ...existing, ...patch } } };
    });

  const stopTimers = () => {
    setRunning(false);
    setRest(0);
    setRestAnchor(null);
    setRestDone(false);
    setRestExpanded(false);
  };

  const startRest = (seconds: number, anchor: number) => {
    if (seconds <= 0) return;
    setRest(seconds);
    setRunning(true);
    setRestDone(false);
    setRestAnchor(anchor);
  };

  const nextUnresolvedIdx = (from = idx) => {
    const after = list.findIndex((e, i) => i > from && !isResolved(log, e));
    if (after >= 0) return after;
    return list.findIndex((e, i) => i !== from && !isResolved(log, e));
  };

  /* --------------------------- superset groups -------------------------- */
  const groupOf = (e: Exercise) =>
    useSS && e.superset ? `s:${e.superset}` : e.circuit ? `c:${e.circuit}` : null;
  const membersOf = (key: string) =>
    list.map((e, i) => ({ e, i })).filter(({ e }) => groupOf(e) === key);

  /** Blocks rendered in the list: a single exercise or a whole superset group. */
  const blocks: { key: string; group: string | null; items: { e: Exercise; i: number }[] }[] = [];
  const seen = new Set<string>();
  list.forEach((e, i) => {
    const gk = groupOf(e);
    if (!gk) {
      blocks.push({ key: e.id, group: null, items: [{ e, i }] });
      return;
    }
    if (seen.has(gk)) return;
    seen.add(gk);
    blocks.push({ key: gk, group: gk, items: membersOf(gk) });
  });

  /* --------------------------- set completion --------------------------- */
  const activeSetIdx = (() => {
    const s = setsFor(log, exercise);
    const n = s.findIndex((x) => !x.done);
    return n < 0 ? -1 : n;
  })();

  const completeSetAt = (exIndex: number, setIndex: number) => {
    const e = list[exIndex];
    const sets = setsFor(log, e);
    const cur = sets[setIndex];
    const next = sets.map((s, i) => (i === setIndex ? { ...s, done: !s.done } : s));
    const allDone = next.length > 0 && next.every((s) => s.done);
    write(e.id, next, { complete: allDone });

    if (!next[setIndex].done) {
      flash("Set reopened");
      return;
    }
    beep(state.settings);
    scrollWanted.current = true;

    const kind = kindOfEx(e);
    const kf = fieldsFor(kind);
    const entryE = log.exercises[e.id];
    if (state.settings.adaptive && !cur.warmup && !kf.continuous) {
      setAdvice(
        adviceAfterSet(next[setIndex], next[setIndex - 1], e, state.settings, entryE?.replacedWith),
      );
    }

    const workingWeight = weightValue(sets.find((s) => !s.warmup && s.weight)?.weight);
    const restSeconds = cur.warmup
      ? warmupTransitionRest(weightValue(cur.weight), workingWeight)
      : restLengthOf(e);

    const gk = groupOf(e);
    if (gk) {
      const members = membersOf(gk);
      const pos = members.findIndex((m) => m.i === exIndex);
      const roundAfter = next.filter((s) => s.done).length;
      const partner = members.find(
        (m, p) =>
          p > pos && !isResolved(log, m.e) && hasSetsLeft(m.e) && doneCountOf(m.e) < roundAfter,
      );
      if (partner) {
        updateDay(day, (d) => ({ ...d, cursor: partner.i }));
        setRunning(false);
        setRestAnchor(null);
        flash(`Next: ${nameOf(partner.e)} — no rest yet.`);
        return;
      }
      const back = members.find((m) =>
        m.i === exIndex ? next.some((s) => !s.done) : hasSetsLeft(m.e),
      );
      const target = back ? back.i : nextUnresolvedIdx(exIndex);
      if (target >= 0) updateDay(day, (d) => ({ ...d, cursor: target }));
      if (restSeconds > 0) {
        startRest(restSeconds, exIndex);
        flash(`Round complete. Rest ${restSeconds}s.`);
      } else flash("Round complete.");
      return;
    }

    if (kf.continuous) {
      if (!allDone) return;
      const n = nextUnresolvedIdx(exIndex);
      if (n >= 0 && state.settings.autoAdvanceWarmups) {
        updateDay(day, (d) => ({ ...d, cursor: n }));
        flash(`Next: ${nameOf(list[n])}`);
      }
      return;
    }

    if (allDone) {
      const n = nextUnresolvedIdx(exIndex);
      if (n >= 0) {
        updateDay(day, (d) => ({ ...d, cursor: n }));
        flash(`${nameOf(e)} complete. Next: ${nameOf(list[n])}.`);
      } else flash(`${nameOf(e)} complete.`);
    }
    if (restSeconds > 0 && state.settings.autoRest) startRest(restSeconds, exIndex);
  };

  /* key of the active row, consumed by the scroll effect above */
  const activeKey = `${idx}:${activeSetIdx}`;
  activeKeyRef.current = activeKey;

  const go = (delta: number) => {
    const target = Math.min(list.length - 1, Math.max(0, idx + delta));
    updateDay(day, (d) => ({ ...d, cursor: target }));
    scrollWanted.current = true;
    flash(nameOf(list[target]));
  };

  const goTo = (target: number) => {
    updateDay(day, (d) => ({ ...d, cursor: target }));
    scrollWanted.current = true;
    setPanel(null);
    flash(nameOf(list[target]));
  };

  /** Refill a reset session with the suggested (last used) working weights. */
  const fillSuggestions = (targetIds: string[]) => {
    for (const id of targetIds) {
      const e = list.find((x) => x.id === id);
      if (!e) continue;
      const w = lastWeightFor(state, e.id);
      write(
        e.id,
        setsFor(log, e).map((s) => ({
          ...s,
          weight: s.warmup ? "" : (w ?? ""),
          reps: "",
          done: false,
        })),
      );
    }
  };

  const finishSave = () => {
    // One finish path for every view: bank the time, freeze it for good.
    completeWorkout(day);
    setConfirming(false);
    stopTimers();
  };

  /** Tick every remaining set that already has values, then save. */
  const completeUnfinished = () => {
    for (const e of list) {
      const s = setsFor(log, e);
      if (s.every((x) => x.done)) continue;
      write(
        e.id,
        s.map((x) => ({ ...x, done: true })),
        { complete: true },
      );
    }
    finishSave();
  };

  /** Keep only the sets that were actually completed — exercises stay in the plan. */
  const saveCompletedOnly = () => {
    for (const e of list) {
      const s = setsFor(log, e);
      const done = s.filter((x) => x.done);
      if (done.length === s.length) continue;
      write(e.id, done, { complete: done.length > 0, skipped: done.length === 0 });
    }
    finishSave();
  };

  const exitTo = (incomplete: boolean) => {
    saveAndExit(day, incomplete);
    setPanel(null);
    navigate({ to: "/" });
  };

  const toggleClock = () => {
    if (clockRunning) {
      pauseWorkout(day);
      setRunning(false);
      flash("Workout paused");
      return;
    }
    if (clockStarted) {
      resumeWorkout(day);
      flash("Workout resumed");
    } else {
      startWorkoutOnce(day);
      flash("Workout started");
    }
  };

  const ids = list.map((e) => e.id);
  const entry = log.exercises[exercise.id];
  const sets = setsFor(log, exercise);
  const kind = kindOfEx(exercise);
  const kindFields = fieldsFor(kind);
  const restLength = restLengthOf(exercise);
  const prog = progressionFor(state, exercise.id, topRepTarget(exercise.reps));
  const guide = DAY_GUIDES[plan.key];
  const estMinutes = Math.round(
    list.reduce((m, e) => m + setsFor(log, e).length * (restLengthOf(e) + 45), 0) / 60,
  );

  /* --------------------------- up-next preview --------------------------- */
  const upNextIdx = (() => {
    const gk = groupOf(exercise);
    if (gk) {
      const members = membersOf(gk);
      const pos = members.findIndex((m) => m.i === idx);
      const roundAfter = doneCountOf(exercise) + 1;
      const partner = members.find(
        (m, p) =>
          p > pos && !isResolved(log, m.e) && hasSetsLeft(m.e) && doneCountOf(m.e) < roundAfter,
      );
      if (partner) return partner.i;
    }
    return sets.filter((s) => !s.done).length <= 1 ? nextUnresolvedIdx() : -1;
  })();
  const upNext = upNextIdx >= 0 ? list[upNextIdx] : undefined;

  /* ------------------------- display snapshot ---------------------------- */
  const displaySnapshot: DisplaySnapshot = {
    day,
    weekday: plan.weekday,
    planTitle: plan.title,
    guideSrc: guide?.src,
    guideAlt: guide?.alt,
    exerciseName: nameOf(exercise),
    targetSets: sets.length,
    targetReps: repTargetOf(exercise),
    restLength: restLength || 60,
    superset: useSS ? (exercise.superset ?? null) : null,
    supersetSlot: useSS ? (exercise.supersetSlot ?? null) : null,
    round:
      useSS && exercise.superset
        ? { n: Math.min(sets.length, doneCountOf(exercise) + 1), of: sets.length }
        : null,
    sets: sets.map((s) => ({ reps: s.reps, weight: s.weight, time: s.time, done: s.done })),
    setIndex: activeSetIdx < 0 ? Math.max(0, sets.length - 1) : activeSetIdx,
    lastResult: prog ? `${prog.topReps} reps @ ${prog.topWeight} (Day ${prog.lastDay})` : null,
    clockMs: elapsedMs,
    clockRunning,
    restOpen: restAnchor !== null,
    restSeconds: rest,
    restRunning: running,
    restDone,
    nextLabel: upNext ? nameOf(upNext) : "Finish workout",
    exerciseIndex: idx + 1,
    exerciseTotal: list.length,
    doneSets,
    totalSets,
    status:
      restAnchor !== null
        ? "resting"
        : clockRunning
          ? "running"
          : clockStarted
            ? "paused"
            : "not started",
    units: state.settings.units,
  };
  snapRef.current = displaySnapshot;
  publish(displaySnapshot);

  cmdRef.current = (c: DisplayCommand) => {
    switch (c.type) {
      case "toggleClock":
        toggleClock();
        break;
      case "pause":
        pauseWorkout(day);
        setRunning(false);
        break;
      case "resume":
        resumeWorkout(day);
        break;
      case "stop":
        setRunning(false);
        saveAndExit(day);
        setPanel("stop");
        break;
      case "restart":
        setPanel("restart");
        break;
      case "saveExit":
        exitTo(false);
        break;
      case "completeSet":
        if (activeSetIdx >= 0) completeSetAt(idx, activeSetIdx);
        break;
      case "prev":
        go(-1);
        break;
      case "next":
        go(1);
        break;
      case "goTo":
        if (typeof c.index === "number") goTo(c.index);
        break;
      case "list":
        setPanel("overview");
        break;
      case "startRest":
        startRest(restLength || 60, idx);
        break;
      case "pauseRest":
        setRunning((r) => !r);
        break;
      case "skipRest":
        stopTimers();
        break;
      case "resetRest":
        setRest(restLength || 60);
        setRunning(true);
        setRestDone(false);
        break;
      case "addRest":
        setRest((r) => r + 15);
        break;
      case "subRest":
        setRest((r) => Math.max(0, r - 15));
        break;
      case "finish":
        setConfirming(true);
        break;
      case "edit":
        if (typeof c.index === "number" && c.field) {
          write(
            exercise.id,
            sets.map((s, i) => (i === c.index ? { ...s, [c.field!]: c.value ?? "" } : s)),
          );
        }
        break;
    }
  };

  /* ------------------------------- pieces -------------------------------- */

  const RestBar = () => (
    <div className="mt-2 rounded-xl border border-accent/50 bg-accent/10 p-2">
      <button
        type="button"
        onClick={() => setRestExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-1 py-2"
      >
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent">
          <Timer className="size-4" aria-hidden />
          {restDone ? "Rest complete" : "Rest"}
        </span>
        <span className="font-display text-2xl font-bold tabular-nums text-primary">
          {mmss(rest)}
        </span>
      </button>
      {restOpen2 && (
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="tap-target rounded-lg bg-primary text-xs font-bold uppercase text-primary-foreground"
          >
            {running ? "Pause" : "Resume"}
          </button>
          <button
            type="button"
            onClick={() => setRest((r) => r + 15)}
            className="tap-target rounded-lg bg-elevated text-xs font-bold"
          >
            +15s
          </button>
          <button
            type="button"
            onClick={() => setRest((r) => Math.max(0, r - 15))}
            className="tap-target rounded-lg bg-elevated text-xs font-bold"
          >
            −15s
          </button>
          <button
            type="button"
            onClick={() => {
              setRest(restLength || 60);
              setRunning(true);
              setRestDone(false);
            }}
            className="tap-target rounded-lg bg-elevated text-xs font-bold uppercase"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={stopTimers}
            className="tap-target rounded-lg bg-elevated text-xs font-bold uppercase"
          >
            Stop
          </button>
          <button
            type="button"
            onClick={() => {
              stopTimers();
              flash("Rest skipped");
            }}
            className="tap-target rounded-lg bg-elevated text-xs font-bold uppercase"
          >
            Skip
          </button>
          <div className="col-span-2 flex gap-1.5">
            <input
              inputMode="numeric"
              placeholder="Custom sec"
              aria-label="Custom rest seconds"
              value={customRest}
              onChange={(e) => setCustomRest(e.target.value)}
              className="h-11 w-full rounded-lg border border-input bg-elevated px-2 text-base"
            />
            <button
              type="button"
              onClick={() => {
                const sec = Number(customRest);
                if (sec > 0) {
                  setRest(sec);
                  setRunning(true);
                  setRestDone(false);
                }
              }}
              className="tap-target w-16 shrink-0 rounded-lg bg-elevated text-xs font-bold uppercase"
            >
              Set
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              stopTimers();
              flash("Continuing");
            }}
            className="tap-target rounded-lg bg-success/25 text-xs font-bold uppercase text-success"
          >
            Continue now
          </button>
        </div>
      )}
    </div>
  );

  const ExerciseTable = ({ e, i, hideRest }: { e: Exercise; i: number; hideRest?: boolean }) => {
    const el = log.exercises[e.id];
    const s = setsFor(log, e);
    const k = kindOfEx(e);
    const kf = fieldsFor(k);
    const cols = columnsFor(kf, state.settings.units);
    const prev = lastSessionSets(state, e.id, el?.replacedWith, day);

    const active = i === idx;
    const activeSet = active ? s.findIndex((x) => !x.done) : -1;
    const suggested = lastWeightFor(state, e.id);

    return (
      <div className={el?.skipped ? "opacity-50" : ""}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => goTo(i)}
              className="block w-full truncate text-left text-base font-bold leading-tight text-primary"
            >
              {nameOf(e)}
            </button>
            <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
              {KIND_LABELS[k]} · {s.length} × {repTargetOf(e)}
              {el?.skipped ? " · skipped" : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <MirrorMeButton
              mirrorKey={e.mirror}
              work={`${s.length} × ${repTargetOf(e)}`}
              label="Demo"
              compact
            />
            <button
              type="button"
              aria-label={`Options for ${nameOf(e)}`}
              onClick={() => setMenuFor(i)}
              className="grid size-10 shrink-0 place-items-center rounded-lg bg-elevated"
            >
              <MoreVertical className="size-5" />
            </button>
          </div>
        </div>

        {kf.weight && suggested && (
          <p className="mt-1 text-[11px] text-accent">Suggested: {suggested}</p>
        )}

        <div className="mt-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          <span className="w-7 shrink-0 text-center">Set</span>
          <span className="w-20 shrink-0 text-center">Previous</span>
          <span className="flex min-w-0 flex-1 gap-1">
            {cols.map((c) => (
              <span key={c.key} className="min-w-0 flex-1 text-center">
                {c.ph}
              </span>
            ))}
          </span>
          <span className="w-11 shrink-0 text-center">✓</span>
        </div>

        {prev && (
          <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            Previous session: Day {prev.day}
          </p>
        )}

        <div className="mt-1 space-y-1">
          {s.map((st, j) => {
            const sameKind = s.slice(0, j).filter((x) => !!x.warmup === !!st.warmup).length;
            const prevSet = previousSetFor(prev, sameKind, !!st.warmup);
            const isActive = active && j === activeSet;
            return (
              <div
                key={j}
                ref={(node) => {
                  rowRefs.current[`${i}:${j}`] = node;
                }}
              >
                <SetRowCompact
                  label={
                    st.warmup ? "W" : String(s.slice(0, j + 1).filter((x) => !x.warmup).length)
                  }
                  warmup={st.warmup}
                  previous={describeSet(prevSet, state.settings.units)}
                  columns={cols}
                  set={st}
                  index={j}
                  active={isActive}
                  showSide={kf.side}
                  onChange={(patch) =>
                    write(
                      e.id,
                      s.map((x, q) => (q === j ? { ...x, ...patch } : x)),
                    )
                  }
                  onToggle={() => completeSetAt(i, j)}
                />
                {isActive && (
                  <p className="px-1 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Current{st.warmup ? " · warm-up" : ""}
                  </p>
                )}
                {!hideRest && restLengthOf(e) > 0 && (
                  <div className="flex items-center gap-2 px-1 py-1" aria-hidden>
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-semibold tabular-nums text-accent">
                      {mmss(restLengthOf(e))}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            {hideRest || restLengthOf(e) > 0 ? "" : "No rest — flow straight on"}
          </p>
          <button
            type="button"
            onClick={() => write(e.id, [...s, { reps: "", weight: "", done: false }])}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold uppercase text-primary"
          >
            <Plus className="size-4" /> Add set
            {!hideRest && restLengthOf(e) > 0 ? ` (${mmss(restLengthOf(e))})` : ""}
          </button>
        </div>
      </div>
    );
  };

  /* -------------------------------- render ------------------------------- */
  return (
    <main className="px-3 pb-40 pt-2">
      {/* compact sticky top bar */}
      <div className="sticky top-0 z-30 -mx-3 border-b border-border bg-background/95 px-3 pb-2 pt-2 backdrop-blur">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <Link
            to="/"
            aria-label="Back"
            className="grid size-10 place-items-center rounded-lg bg-elevated"
          >
            <ChevronLeft className="size-5" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-widest text-primary">
              {plan.title} — {plan.weekday}
            </p>
            <p className="flex items-baseline gap-2 font-display text-xl font-bold tabular-nums leading-none">
              {mmss(elapsedMs / 1000)}
              {!clockRunning && clockStarted && (
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Paused
                </span>
              )}
              {saveStatus === "saving" && (
                <span className="text-[10px] font-bold uppercase text-muted-foreground">
                  Saving…
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-[10px] font-bold uppercase text-success">Saved</span>
              )}
              {saveStatus === "error" && (
                <button
                  type="button"
                  onClick={retrySave}
                  className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive"
                >
                  Save failed — retry
                </button>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={clockRunning ? "Pause workout" : "Start workout"}
              onClick={toggleClock}
              className={`grid size-10 place-items-center rounded-lg ${
                clockRunning ? "bg-accent/25 text-accent" : "bg-primary text-primary-foreground"
              }`}
            >
              {clockRunning ? <Pause className="size-5" /> : <Play className="size-5" />}
            </button>
            <WorkoutModeButton day={day} current="manual" />
            <button
              type="button"
              aria-label="More controls"
              onClick={() => setPanel("more")}
              className="grid size-10 place-items-center rounded-lg bg-elevated"
            >
              <MoreHorizontal className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="tap-target rounded-lg bg-success/25 px-3 text-[11px] font-bold uppercase text-success"
            >
              Finish
            </button>
          </div>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary"
            style={{ width: `${(doneSets / Math.max(1, totalSets)) * 100}%` }}
          />
        </div>
      </div>

      {/* the headline way in: a 1-on-1 session with the coach */}
      <Link
        to="/coach/$day"
        params={{ day: String(day) }}
        data-testid="train-with-coach"
        className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-primary/50 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent px-4"
      >
        <span className="min-w-0">
          <span className="block text-sm font-black uppercase tracking-widest text-primary">
            Train with coach
          </span>
          <span className="block truncate text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            1-on-1 immersive session
          </span>
        </span>
        <ChevronRight className="size-5 shrink-0 text-primary" />
      </Link>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-20 z-[55] mx-auto w-fit max-w-[92%] rounded-full bg-primary px-5 py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-lg"
        >
          {toast}
        </div>
      )}

      {/* -------------------------- the workout list -------------------------- */}
      <div className="mt-3 space-y-3">
        {blocks.map((b) => {
          const inBlock = b.items.some(({ i }) => i === idx);
          const showRest = restAnchor !== null && b.items.some(({ i }) => i === restAnchor);
          if (!b.group) {
            const { e, i } = b.items[0];
            return (
              <section
                key={b.key}
                className={`surface-card rounded-2xl p-3 ${inBlock ? "ring-1 ring-primary/60" : ""}`}
              >
                {ExerciseTable({ e, i })}
                {showRest && RestBar()}
              </section>
            );
          }
          const isCircuit = b.group.startsWith("c:");
          const first = b.items[0].e;
          const label = isCircuit
            ? (first.circuit ?? "Circuit").toUpperCase()
            : `SUPERSET ${first.superset}`;
          const rounds = Math.max(...b.items.map(({ e }) => setsFor(log, e).length));
          const round = Math.min(rounds, Math.min(...b.items.map(({ e }) => doneCountOf(e))) + 1);
          return (
            <section
              key={b.key}
              className={`rounded-2xl border-2 border-accent/70 bg-accent/5 p-3 ${
                inBlock ? "ring-1 ring-primary/60" : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-accent">
                  <Zap className="size-4" aria-hidden /> {label} — Round {round} of {rounds}
                </p>
                <button
                  type="button"
                  onClick={() => setPanel("pairs")}
                  className="rounded-full bg-elevated px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground"
                >
                  Pairing
                </button>
              </div>
              <p className="mt-1 text-sm font-bold leading-tight">
                {b.items.map(({ e }) => nameOf(e)).join("  +  ")}
              </p>
              <div className="mt-2 space-y-3">
                {b.items.map(({ e, i }, p) => (
                  <div
                    key={e.id}
                    className={`rounded-xl bg-card p-3 ${p > 0 ? "border-l-4 border-accent/60" : ""}`}
                  >
                    {ExerciseTable({ e, i, hideRest: true })}
                  </div>
                ))}
              </div>
              <p className="mt-2 rounded-lg bg-elevated px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground">
                Rest after {isCircuit ? "the last exercise" : "both"}:{" "}
                {restLengthOf(b.items[b.items.length - 1].e)} sec
              </p>
              {showRest && RestBar()}
            </section>
          );
        })}
      </div>

      {/* ---------------------------- up next preview -------------------------- */}
      {upNext && !hideNext && (
        <section className="surface-card mt-3 rounded-2xl border-l-4 border-accent p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent">Up next</p>
          <p className="text-base font-bold">{nameOf(upNext)}</p>
          <p className="text-xs text-muted-foreground">
            {setsFor(log, upNext).length} sets × {repTargetOf(upNext)}
            {lastWeightFor(state, upNext.id)
              ? ` · Suggested: ${lastWeightFor(state, upNext.id)}`
              : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Rest:{" "}
            {restLengthOf(upNext) > 0 ? `${restLengthOf(upNext)} seconds` : "flow straight on"}
          </p>
          {(upNext.notes || upNext.target) && (
            <p className="mt-1 text-xs text-muted-foreground">
              Setup: {upNext.notes || upNext.target}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <MirrorMeButton mirrorKey={upNext.mirror} label="Mirror Me" compact />
            <button
              type="button"
              onClick={() => goTo(upNextIdx)}
              className="tap-target flex-1 rounded-xl bg-elevated text-xs font-bold uppercase"
            >
              Go to exercise
            </button>
            <button
              type="button"
              onClick={() => setHideNext(true)}
              className="tap-target w-20 rounded-xl bg-elevated text-xs font-bold uppercase"
            >
              Hide
            </button>
          </div>
        </section>
      )}

      {advice && (
        <section className="surface-card mt-3 rounded-2xl border border-accent/40 p-4">
          <p className="text-sm font-semibold text-accent">{advice.message}</p>
          <div className="mt-3 grid gap-2">
            {advice.suggestedWeight && (
              <button
                type="button"
                onClick={() => {
                  write(
                    exercise.id,
                    sets.map((x) =>
                      x.done || x.warmup ? x : { ...x, weight: advice.suggestedWeight as string },
                    ),
                  );
                  setAdvice(null);
                  flash(`Remaining sets set to ${advice.suggestedWeight}`);
                }}
                className="tap-target rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
              >
                {advice.kind === "up" ? "Increase now" : "Reduce slightly"} (
                {advice.suggestedWeight})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdvice(null)}
              className="tap-target rounded-xl bg-elevated text-sm font-bold uppercase"
            >
              Keep current weight
            </button>
          </div>
        </section>
      )}

      <AdaptiveSuggestion
        state={state}
        exercise={exercise}
        replacedWith={entry?.replacedWith}
        sets={sets}
        onWrite={(next) => write(exercise.id, next)}
        onFlash={flash}
      />

      {/* form / pain for the current exercise */}
      <section className="surface-card mt-3 rounded-2xl p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {nameOf(exercise)} — how did it feel?
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] uppercase text-muted-foreground">Form clean?</p>
            <div className="mt-1 flex gap-2">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  type="button"
                  aria-pressed={entry?.formClean === v}
                  onClick={() => meta(exercise.id, { formClean: v })}
                  className={`tap-target flex-1 rounded-xl text-sm font-bold uppercase ${
                    entry?.formClean === v
                      ? v
                        ? "bg-success/25 text-success"
                        : "bg-destructive/25 text-destructive"
                      : "bg-elevated text-muted-foreground"
                  }`}
                >
                  {v ? "Yes" : "No"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase text-muted-foreground" htmlFor="pain">
              Pain 0–10
            </label>
            <input
              id="pain"
              type="range"
              min={0}
              max={10}
              step={1}
              value={entry?.pain ?? 0}
              onChange={(e) => meta(exercise.id, { pain: Number(e.target.value) })}
              className="mt-3 w-full accent-[var(--color-primary)]"
            />
            <p className="text-sm font-bold tabular-nums">{entry?.pain ?? 0}/10</p>
          </div>
        </div>
        {(entry?.pain ?? 0) >= 4 && (
          <p className="mt-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            Pain {entry?.pain}/10 — flagged. Next session use:{" "}
            {(exercise.substitutions ?? ["a lighter, pain-free variation"])[0]}.
          </p>
        )}
      </section>

      {useSS && (
        <SmartPairing
          day={day}
          planKey={plan.key}
          base={base}
          log={log}
          readiness={log.readiness}
          savedDefault={state.savedPairs[plan.key]}
          onFlash={flash}
          onTurnOff={() => {
            updateDay(day, (d) => ({ ...d, useSupersets: false }));
            flash("Supersets off");
          }}
        />
      )}

      <section className="surface-card mt-3 rounded-2xl p-4">
        <label className="block">
          <span className="text-sm font-bold uppercase text-muted-foreground">Workout notes</span>
          <textarea
            rows={3}
            value={log.notes ?? ""}
            placeholder="How it felt, load changes, anything to remember."
            onChange={(e) => updateDay(day, (d) => ({ ...d, notes: e.target.value }))}
            className="mt-2 w-full rounded-xl border border-input bg-elevated p-3 text-base"
          />
        </label>
      </section>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="tap-target mt-4 w-full rounded-2xl bg-success/25 py-4 text-base font-bold uppercase tracking-wide text-success"
      >
        Finish Workout
      </button>
      {!allResolved && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          You can finish at any time — anything unlogged is recorded as skipped.
        </p>
      )}

      {/* ------------------------------- panels -------------------------------- */}
      {menuFor !== null && list[menuFor] && (
        <ExerciseOptions
          state={state}
          exercise={list[menuFor]}
          entry={log.exercises[list[menuFor].id]}
          sets={setsFor(log, list[menuFor])}
          dayKey={plan.key}
          weekday={plan.weekday}
          restLength={restLengthOf(list[menuFor])}
          paired={!!groupOf(list[menuFor])}
          onClose={() => setMenuFor(null)}
          onWrite={(next) => write(list[menuFor].id, next)}
          onMeta={(patch) => meta(list[menuFor].id, patch)}
          onRestart={() => {
            resetExercises(day, [list[menuFor].id], keepValues);
            stopTimers();
            setMenuFor(null);
            flash("Exercise restarted");
          }}
          onUnpair={() => {
            const id = list[menuFor].id;
            applyPairs(
              day,
              customPairs.filter((p) => p.a !== id && p.b !== id),
              ["Pairing removed — these exercises run as straight sets."],
            );
            setMenuFor(null);
            flash("Pairing removed");
          }}
          onRestorePairs={() => {
            const rec = recommendedPairs(base, log, log.readiness);
            applyPairs(day, rec.pairs, rec.notes);
            setMenuFor(null);
            flash("Recommended pairing restored");
          }}
        />
      )}

      {panel === "more" && (
        <SheetPanel
          title="Workout controls"
          subtitle="Everything lives here so the list stays clean."
          onClose={() => setPanel(null)}
        >
          <SheetButton primary onClick={() => setPanel("overview")}>
            Workout overview
          </SheetButton>
          <MirrorMeButton mirrorKey={list[idx]?.mirror} label="Mirror Me demo" />
          <SheetButton
            onClick={() => {
              setRunning(false);
              saveAndExit(day);
              setPanel("stop");
              flash("Workout stopped");
            }}
          >
            Stop workout
          </SheetButton>
          <SheetButton onClick={() => exitTo(false)}>Save and exit</SheetButton>
          <SheetButton onClick={() => setPanel("restart")}>Restart…</SheetButton>
          <SheetButton onClick={() => setPanel("resetClock")}>Reset workout clock</SheetButton>
          <SheetButton
            onClick={() => {
              resetExercises(day, [exercise.id], keepValues);
              stopTimers();
              setPanel(null);
              flash("Exercise restarted");
            }}
          >
            Restart current exercise
          </SheetButton>
          <SheetButton onClick={() => setPanel("pickFrom")}>
            Restart from selected exercise
          </SheetButton>
          <SheetButton
            onClick={() => {
              updateDay(day, (d) => ({ ...d, useSupersets: !useSS }));
              flash(useSS ? "Supersets off" : "Supersets on");
            }}
          >
            Supersets: {useSS ? "on" : "off"}
          </SheetButton>
          <SheetButton
            onClick={() => {
              setPanel(null);
              setConfirming(true);
            }}
          >
            Finish workout
          </SheetButton>
          <CastConnect compact />
        </SheetPanel>
      )}

      {panel === "overview" && (
        <SheetPanel
          title={`${plan.weekday} — ${plan.title}`}
          subtitle={`${list.length} exercises · about ${estMinutes} min · tap any exercise to jump to it`}
          onClose={() => setPanel(null)}
        >
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li
                key={b.key}
                className={b.group ? "rounded-xl border border-accent/50 bg-accent/5 p-2" : ""}
              >
                {b.group && (
                  <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                    {b.group.startsWith("c:")
                      ? (b.items[0].e.circuit ?? "Circuit")
                      : `Superset ${b.items[0].e.superset}`}
                  </p>
                )}
                {b.items.map(({ e, i }) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`tap-target mb-1 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left ${
                      i === idx ? "bg-primary/15 ring-1 ring-primary" : "bg-elevated"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">
                        {setsFor(log, e).length} × {nameOf(e)}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {KIND_LABELS[kindOfEx(e)]} · {repTargetOf(e)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-bold uppercase text-muted-foreground">
                      {log.exercises[e.id]?.skipped
                        ? "Skipped"
                        : isResolved(log, e)
                          ? "Done"
                          : `${doneCountOf(e)}/${setsFor(log, e).length}`}
                    </span>
                  </button>
                ))}
              </li>
            ))}
          </ul>
        </SheetPanel>
      )}

      {panel === "pickFrom" && (
        <SheetPanel
          title="Restart from…"
          subtitle="Everything before your pick is kept. The workout clock keeps running."
          onClose={() => setPanel(null)}
        >
          {list.map((e, i) => (
            <SheetButton
              key={e.id}
              onClick={() => {
                restartEntireWorkout(day, ids.slice(i), keepValues, {
                  resetClock: false,
                  cursor: i,
                });
                stopTimers();
                setPanel(null);
                flash(`Reset from ${nameOf(e)}`);
              }}
            >
              {i + 1}. {nameOf(e)}
            </SheetButton>
          ))}
        </SheetPanel>
      )}

      {panel === "resetClock" && (
        <SheetPanel
          title="Reset workout clock?"
          subtitle="Sets, weights, reps, notes and supersets are all kept."
          onClose={() => setPanel(null)}
        >
          <SheetButton
            primary
            onClick={() => {
              pauseWorkout(day);
              restartClock(day);
              setPanel(null);
              flash("Clock reset — press Start");
            }}
          >
            Reset clock to 00:00
          </SheetButton>
          <SheetButton onClick={() => setPanel(null)}>Cancel</SheetButton>
        </SheetPanel>
      )}

      {panel === "discard" && (
        <SheetPanel
          title="Discard this workout?"
          subtitle="Only today's active session is deleted. Earlier history is kept."
          onClose={() => setPanel(null)}
        >
          <SheetButton
            danger
            onClick={() => {
              deleteWorkout(day);
              stopTimers();
              setPanel(null);
              flash("Session discarded");
              navigate({ to: "/" });
            }}
          >
            Yes, discard this session
          </SheetButton>
          <SheetButton onClick={() => setPanel("stop")}>Cancel and keep it</SheetButton>
        </SheetPanel>
      )}

      {panel === "stop" && (
        <SheetPanel
          title="Workout stopped"
          subtitle="Everything is saved. What next?"
          onClose={() => setPanel(null)}
        >
          <SheetButton primary onClick={() => exitTo(false)}>
            Save and exit
          </SheetButton>
          <SheetButton onClick={() => exitTo(true)}>Save as incomplete</SheetButton>
          <SheetButton onClick={() => setPanel("restart")}>Restart workout</SheetButton>
          <SheetButton danger onClick={() => setPanel("discard")}>
            Discard current session
          </SheetButton>
          <SheetButton
            onClick={() => {
              resumeWorkout(day);
              setPanel(null);
              flash("Workout resumed");
            }}
          >
            Continue workout
          </SheetButton>
        </SheetPanel>
      )}

      {panel === "restart" && (
        <SheetPanel
          title="Restart"
          subtitle="Pick exactly what should reset."
          onClose={() => setPanel(null)}
        >
          <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Entered weights and reps
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {(["keep", "suggest", "clear"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={valueMode === m}
                onClick={() => setValueMode(m)}
                className={`tap-target rounded-xl text-[11px] font-bold uppercase ${
                  valueMode === m
                    ? "bg-primary text-primary-foreground"
                    : "bg-elevated text-muted-foreground"
                }`}
              >
                {m === "keep" ? "Keep" : m === "suggest" ? "Suggested" : "Clear"}
              </button>
            ))}
          </div>
          <SheetButton
            primary
            onClick={() => {
              restartEntireWorkout(day, ids, keepValues);
              if (valueMode === "suggest") fillSuggestions(ids);
              if (valueMode === "clear") updateDay(day, (d) => ({ ...d, notes: "" }));
              stopTimers();
              setPanel(null);
              flash("Workout restarted — press Start");
            }}
          >
            Restart entire workout
          </SheetButton>

          <SheetButton
            onClick={() => {
              restartClock(day);
              setPanel(null);
              flash("Clock reset to 00:00");
            }}
          >
            Restart workout clock only
          </SheetButton>
          <SheetButton
            onClick={() => {
              resetExercises(day, [exercise.id], keepValues);
              stopTimers();
              setPanel(null);
              flash("Exercise restarted");
            }}
          >
            Restart current exercise
          </SheetButton>
          <SheetButton onClick={() => setPanel("pickFrom")}>
            Restart from selected exercise
          </SheetButton>
          <SheetButton onClick={() => setPanel(null)}>Cancel</SheetButton>
        </SheetPanel>
      )}

      {panel === "pairs" && (
        <SheetPanel
          title="Superset pairing"
          subtitle="Change, remove or restore the recommended pairs."
          onClose={() => setPanel(null)}
        >
          <SheetButton
            onClick={() => {
              const rec = recommendedPairs(base, log, log.readiness);
              applyPairs(day, rec.pairs, rec.notes);
              setPanel(null);
              flash("Recommended pairing restored");
            }}
          >
            Restore recommended pairing
          </SheetButton>
          <SheetButton
            onClick={() => {
              updateDay(day, (d) => ({ ...d, useSupersets: false }));
              setPanel(null);
              flash("Supersets off");
            }}
          >
            Turn supersets off
          </SheetButton>
          {(log.pairNotes ?? []).map((n) => (
            <p key={n} className="rounded-xl bg-elevated p-3 text-xs text-muted-foreground">
              {n}
            </p>
          ))}
        </SheetPanel>
      )}

      {confirming && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm finish workout"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-4 backdrop-blur"
        >
          <div className="surface-card max-h-[88vh] w-full max-w-lg overflow-auto rounded-2xl p-5">
            <h2 className="text-xl font-bold">
              {doneSets === 0
                ? "Nothing logged yet"
                : doneSets < totalSets
                  ? "Some sets are unfinished"
                  : "Finish this workout?"}
            </h2>
            {doneSets === 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                Complete at least one set to save this as a finished workout.
              </p>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              <li>
                Total time: <strong>{mmss(elapsedMs / 1000)}</strong>
              </li>
              <li>
                Exercises completed: <strong>{completedExercises.length}</strong> of {list.length}
              </li>
              <li>
                Sets completed: <strong>{doneSets}</strong> of {totalSets}
              </li>
              <li>
                Total volume:{" "}
                <strong>
                  {volume > 0 ? `${Math.round(volume)} ${state.settings.units}` : "not tracked"}
                </strong>
              </li>
              <li>
                Skipped:{" "}
                <strong>{skipped.length ? skipped.map((e) => e.name).join(", ") : "none"}</strong>
              </li>
              <li className={painFlags.length ? "text-destructive" : ""}>
                Pain flags:{" "}
                <strong>
                  {painFlags.length
                    ? painFlags.map((p) => `${p.name} ${p.pain}/10`).join(", ")
                    : "none"}
                </strong>
              </li>
              <li className="text-muted-foreground">Notes: {log.notes?.trim() || "none"}</li>
            </ul>
            <p className="mt-3 rounded-xl bg-elevated p-3 text-[11px] text-muted-foreground">
              Unfinished exercises stay in your programme — nothing is removed from the plan.
            </p>
            <div className="mt-5 space-y-2">
              {doneSets === 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="tap-target w-full rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
                  >
                    Continue workout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      exitTo(true);
                    }}
                    className="tap-target w-full rounded-xl border border-border bg-card text-sm font-bold uppercase"
                  >
                    Save as incomplete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      setPanel("discard");
                    }}
                    className="tap-target w-full rounded-xl bg-destructive/20 text-sm font-bold uppercase text-destructive"
                  >
                    Discard this session
                  </button>
                </>
              ) : doneSets < totalSets ? (
                <>
                  <button
                    type="button"
                    onClick={completeUnfinished}
                    className="tap-target w-full rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
                  >
                    Complete unfinished sets
                  </button>
                  <button
                    type="button"
                    onClick={saveCompletedOnly}
                    className="tap-target w-full rounded-xl bg-success/25 text-sm font-bold uppercase text-success"
                  >
                    Save completed sets only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      exitTo(true);
                    }}
                    className="tap-target w-full rounded-xl border border-border bg-card text-sm font-bold uppercase"
                  >
                    Save as incomplete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="tap-target w-full rounded-xl bg-elevated text-sm font-bold uppercase"
                  >
                    Return to workout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      setPanel("overview");
                    }}
                    className="tap-target w-full rounded-xl bg-elevated text-sm font-bold uppercase"
                  >
                    Review workout
                  </button>
                  <ShareWorkout day={day} />
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className="tap-target w-full rounded-xl border border-border bg-card text-sm font-bold uppercase"
                  >
                    Return to workout
                  </button>
                  <button
                    type="button"
                    onClick={finishSave}
                    className="tap-target w-full rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
                  >
                    Confirm and save
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* --------------------------- success screen --------------------------- */

function CompletedScreen({
  day,
  planTitle,
  log,
  completedNames,
  skippedNames,
  doneSets,
  totalSets,
}: {
  day: number;
  planTitle: string;
  log: DayLog;
  completedNames: string[];
  skippedNames: string[];
  doneSets: number;
  totalSets: number;
}) {
  const rec = log.recovery ?? {
    water: false,
    protein: false,
    creatine: false,
    cooldown: false,
    painNotes: "",
  };
  const setRec = (patch: Partial<typeof rec>) =>
    updateDay(day, (d) => ({ ...d, recovery: { ...rec, ...patch } }));

  return (
    <main className="px-4 pt-8">
      <div className="surface-card rounded-2xl p-6 text-center">
        <CheckCircle2 className="mx-auto size-16 text-success" aria-hidden />
        <h1 className="mt-3 text-3xl font-bold">Workout Complete</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Day {day} · {planTitle}
        </p>
        <ul className="mt-4 space-y-1 text-left text-sm">
          <li>
            Exercises completed: <strong>{completedNames.length}</strong>
          </li>
          <li>
            Sets completed: <strong>{doneSets}</strong> of {totalSets}
          </li>
          <li>
            Skipped: <strong>{skippedNames.length ? skippedNames.join(", ") : "none"}</strong>
          </li>
          <li>
            Total time: <strong>{mmss((log.elapsedMs ?? 0) / 1000)}</strong>
          </li>
          {log.notes?.trim() && <li className="text-muted-foreground">Notes: {log.notes}</li>}
        </ul>
      </div>

      <section className="surface-card mt-4 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Recovery checklist</h2>
        <div className="mt-3 space-y-2">
          {RECOVERY_CHECKLIST.map((c) => {
            const on = rec[c.key];
            return (
              <button
                key={c.key}
                type="button"
                aria-pressed={on}
                onClick={() => setRec({ [c.key]: !on } as Partial<typeof rec>)}
                className="tap-target flex w-full items-center justify-between gap-3 rounded-xl bg-elevated px-4 text-left text-sm font-semibold"
              >
                {c.label}
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${
                    on ? "bg-success/25 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
        <label className="mt-3 block">
          <span className="text-sm text-muted-foreground">Pain notes</span>
          <textarea
            rows={2}
            value={rec.painNotes}
            onChange={(e) => setRec({ painNotes: e.target.value })}
            className="mt-1 w-full rounded-xl border border-input bg-elevated p-3 text-base"
          />
        </label>
      </section>

      <ShareWorkout day={day} className="mt-5" label="Share this workout" />

      <Link
        to="/"
        className="tap-target mt-3 flex w-full items-center justify-center rounded-2xl bg-primary py-5 text-lg font-bold uppercase text-primary-foreground"
      >
        Return Home
      </Link>
      <button
        type="button"
        onClick={() => updateDay(day, (d) => ({ ...d, completed: false, completedAt: undefined }))}
        className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-sm font-bold uppercase"
      >
        <Undo2 className="size-5" /> Undo completion
      </button>
    </main>
  );
}