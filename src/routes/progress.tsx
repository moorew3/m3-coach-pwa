import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import { ShareWorkout } from "@/components/ShareWorkout";
import {
  MEASUREMENT_FIELDS,
  PHOTO_INSTRUCTIONS,
  TOTAL_DAYS,
  exercisesForDay,
  planForDay,
} from "@/data/program";
import { exerciseSummaries } from "@/lib/performance";
import {
  completedCount,
  dayDateLabel,
  deleteWorkout,
  exerciseHistory,
  getDay,
  reopenWorkout,
  repeatWorkout,
  setState,
  updateDay,
  useApp,
  workoutHistory,
} from "@/lib/store";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: "Progress — 22-Day Arm Growth Tracker" },
      {
        name: "description",
        content:
          "Arm measurements, Day 1 and Day 22 photos, completed workouts and exercise history.",
      },
      { property: "og:title", content: "Progress — 22-Day Arm Growth Tracker" },
      {
        property: "og:description",
        content: "Track arm measurements, photos and lifting history.",
      },
    ],
  }),
  component: Progress,
});

const blank = {
  leftFlexed: "",
  rightFlexed: "",
  leftRelaxed: "",
  rightRelaxed: "",
  waist: "",
  bodyweight: "",
};

/** Downscale a picked image to a small data URL so it fits in localStorage. */
function readResized(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode failed"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function PhotoSlot({ day, label, photo }: { day: number; label: string; photo?: string }) {
  const [error, setError] = useState("");
  return (
    <div className="rounded-xl bg-elevated p-3">
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 grid aspect-[3/4] place-items-center overflow-hidden rounded-lg border border-dashed border-border bg-card">
        {photo ? (
          <img src={photo} alt={`${label} progress photo`} className="size-full object-cover" />
        ) : (
          <span className="px-3 text-center text-xs text-muted-foreground">
            No photo yet — stored only on this device
          </span>
        )}
      </div>
      <label className="tap-target mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground">
        {photo ? "Replace photo" : "Add photo"}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label={`${label} photo`}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const data = await readResized(file);
              updateDay(day, (d) => ({ ...d, photo: data }));
              setError("");
            } catch {
              setError("Could not save that image. Try a smaller photo.");
            }
          }}
        />
      </label>
      {photo && (
        <button
          type="button"
          onClick={() => updateDay(day, (d) => ({ ...d, photo: undefined }))}
          className="tap-target mt-2 w-full rounded-xl border border-border text-xs font-bold uppercase text-muted-foreground"
        >
          Remove
        </button>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Progress() {
  const state = useApp();
  const [form, setForm] = useState<Record<string, string>>(blank);

  const summaries = useMemo(() => exerciseSummaries(state), [state]);
  const [openId, setOpenId] = useState<string | null>(null);

  const history = workoutHistory(state);
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");

  /** Next later day sharing the same weekday that isn't already finished. */
  const nextSlot = (from: number): number | null => {
    const key = planForDay(from).key;
    for (let d = from + 1; d <= TOTAL_DAYS; d++) {
      if (planForDay(d).key === key && !state.days[d]?.completed) return d;
    }
    return null;
  };

  const save = () => {
    setState((s) => ({
      ...s,
      measurements: [
        ...s.measurements,
        {
          id: crypto.randomUUID(),
          date: new Date().toISOString().slice(0, 10),
          ...(form as Omit<(typeof s.measurements)[number], "id" | "date">),
        },
      ],
    }));
    setForm(blank);
  };

  return (
    <main className="px-4 pt-6">
      <h1 className="text-3xl font-bold">Progress</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {completedCount(state)} of {TOTAL_DAYS} days complete
      </p>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">New measurement</h2>
        <p className="text-sm text-muted-foreground">
          Measure cold, same spot on the arm each time.
        </p>
        <div className="mt-3 space-y-3">
          {MEASUREMENT_FIELDS.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm text-muted-foreground">{f.label}</span>
              <input
                inputMode="decimal"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-lg"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          className="tap-target mt-4 w-full rounded-xl bg-primary text-base font-bold uppercase text-primary-foreground"
        >
          Save measurement
        </button>
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Day 1 vs Day 22 photos</h2>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          {PHOTO_INSTRUCTIONS.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-accent">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PhotoSlot day={1} label="Day 1" photo={getDay(state, 1).photo} />
          <PhotoSlot day={22} label="Day 22" photo={getDay(state, 22).photo} />
        </div>
      </section>

      {state.measurements.length > 0 && (
        <section className="surface-card mt-5 rounded-2xl p-4">
          <h2 className="text-lg font-bold uppercase">Measurement history</h2>
          <ul className="mt-3 space-y-3">
            {[...state.measurements].reverse().map((m) => (
              <li key={m.id} className="rounded-xl bg-elevated p-3 text-sm">
                <p className="font-bold text-primary">{m.date}</p>
                <p className="text-muted-foreground">
                  L {m.leftFlexed || "–"} / R {m.rightFlexed || "–"} flexed · L{" "}
                  {m.leftRelaxed || "–"} / R {m.rightRelaxed || "–"} relaxed · waist{" "}
                  {m.waist || "–"} · BW {m.bodyweight || "–"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h2 className="mb-3 text-lg font-bold uppercase">Workout history</h2>
        {notice && <p className="mb-3 rounded-xl bg-elevated p-3 text-sm text-accent">{notice}</p>}
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">Finish a workout and it'll show up here.</p>
        )}
        <ul className="space-y-3">
          {history.map(({ day, log }) => {
            const plan = planForDay(day);
            const mins = Math.round((log.elapsedMs ?? 0) / 60000);
            const skipped = Object.values(log.exercises).filter((e) => e.skipped).length;
            const sets = Object.values(log.exercises).reduce(
              (n, e) => n + e.sets.filter((s) => s.done).length,
              0,
            );
            return (
              <li key={day} className="surface-card rounded-2xl p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Day {day} · {plan.weekday}
                </p>
                <h3 className="font-bold">{plan.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sets} sets · {skipped} skipped · {mins} min
                </p>
                {log.notes?.trim() && <p className="mt-1 text-sm text-accent">{log.notes}</p>}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to="/workout/$day"
                    params={{ day: String(day) }}
                    className="tap-target flex items-center justify-center rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    View workout
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      reopenWorkout(day);
                      navigate({ to: "/workout/$day", params: { day: String(day) } });
                    }}
                    className="tap-target flex items-center justify-center rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    Edit workout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = nextSlot(day);
                      if (target === null) return setNotice("No later day with this weekday left.");
                      repeatWorkout(day, target);
                      navigate({ to: "/workout/$day", params: { day: String(target) } });
                    }}
                    className="tap-target flex items-center justify-center rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    Repeat workout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reopenWorkout(day);
                      updateDay(day, (d) => ({ ...d, cursor: 0 }));
                      navigate({ to: "/workout/$day", params: { day: String(day) } });
                    }}
                    className="tap-target flex items-center justify-center rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    Redo workout
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = nextSlot(day);
                      if (target === null) return setNotice("No later day with this weekday left.");
                      repeatWorkout(day, target);
                      setNotice(`Duplicated Day ${day} into Day ${target}.`);
                    }}
                    className="tap-target flex items-center justify-center rounded-xl bg-elevated text-xs font-bold uppercase"
                  >
                    Duplicate as new
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete the saved Day ${day} workout?`)) deleteWorkout(day);
                    }}
                    className="tap-target flex items-center justify-center rounded-xl border border-destructive/50 bg-destructive/10 text-xs font-bold uppercase text-destructive"
                  >
                    Delete workout
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateDay(day, (d) => ({ ...d, completed: false, completedAt: undefined }))
                    }
                    className="tap-target col-span-2 flex items-center justify-center gap-1 rounded-xl border border-border text-xs font-bold uppercase"
                  >
                    <Undo2 className="size-4" /> Undo completion
                  </button>
                  <div className="col-span-2">
                    <ShareWorkout day={day} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="mb-1 text-lg font-bold uppercase">Exercise performance</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          What you actually lifted, set by set — the same memory the coach uses.
        </p>
        {summaries.length === 0 && (
          <p className="text-sm text-muted-foreground">Log some sets and they'll show up here.</p>
        )}
        <ul className="space-y-3">
          {summaries.map((sm) => {
            const open = openId === sm.exercise.id;
            const unit = state.settings.units;
            const trendLabel =
              sm.trend === "up"
                ? "Trending up"
                : sm.trend === "down"
                  ? "Down vs last"
                  : sm.trend === "flat"
                    ? "Holding"
                    : "First session";
            const trendClass =
              sm.trend === "up"
                ? "text-primary"
                : sm.trend === "down"
                  ? "text-destructive"
                  : "text-muted-foreground";
            const latest = sm.latest;
            return (
              <li key={sm.exercise.id} className="surface-card rounded-2xl p-4">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : sm.exercise.id)}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="min-w-0">
                    <h3 className="font-bold">{sm.exercise.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {dayDateLabel(state, latest.day)} ·{" "}
                      {sm.timed
                        ? `${latest.rounds.completed}/${latest.rounds.planned} rounds`
                        : `${latest.weight === "BW" ? "BW" : `${latest.weight} ${unit}`} × ${latest.reps.join(", ") || "–"}`}
                      {latest.rpeMax ? ` · RPE ${latest.rpeMax}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold uppercase tracking-wider ${trendClass}`}
                  >
                    {trendLabel}
                  </span>
                </button>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-elevated p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Best set</p>
                    <p className="text-sm font-bold tabular-nums">
                      {sm.best
                        ? `${sm.best.weight === "BW" ? "BW" : sm.best.weight} × ${sm.best.reps}`
                        : sm.timed
                          ? `${Math.max(...sm.sessions.map((x) => x.rounds.completed))} rounds`
                          : "–"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-elevated p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">
                      {sm.timed ? "Sessions" : "Est. 1RM"}
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {sm.timed
                        ? sm.sessions.length
                        : sm.best?.e1rm
                          ? `${sm.best.e1rm} ${unit}`
                          : "–"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-elevated p-2">
                    <p className="text-[10px] uppercase text-muted-foreground">Next time</p>
                    <p className="text-xs font-bold leading-tight">
                      {sm.next?.short ?? "Log more sets"}
                    </p>
                  </div>
                </div>

                {open && (
                  <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm">
                    {sm.sessions.map((ses) => (
                      <li
                        key={ses.day}
                        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
                      >
                        <span className="font-semibold">
                          Day {ses.day} · {dayDateLabel(state, ses.day)}
                        </span>
                        <span className="text-muted-foreground">
                          {ses.sets
                            .filter((x) => x.done || x.outcome)
                            .map((x, n) =>
                              sm.timed
                                ? `R${n + 1} ${x.outcome === "skipped" ? "skipped" : `${x.doneSec ?? "?"}s${x.outcome === "shortened" ? " (short)" : ""}`}`
                                : `${x.reps || "–"}×${x.weight || "BW"}${x.rpe ? `@${x.rpe}` : x.feel ? ` ${x.feel}` : ""}`,
                            )
                            .join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}