import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Glasses } from "lucide-react";
import { useState } from "react";
import {
  SESSIONS,
  TOTAL_DAYS,
  exercisesForDay,
  planForDay,
  PROGRESSION_RULES,
  type DayPlan,
} from "@/data/program";
import { LEGACY_WEEK } from "@/data/legacy-program";
import { currentDayNumber, dayDateLabel, getDay, useApp } from "@/lib/store";
import { MirrorMeButton } from "@/components/MirrorMe";
import { ActivityChooser } from "@/components/ActivityChooser";
import { COACH_REFERENCE } from "@/data/coach-identity";

export const Route = createFileRoute("/program")({
  head: () => ({
    meta: [
      { title: "Weekly Program — Arm Growth & Conditioning Tracker" },
      {
        name: "description",
        content:
          "Strength A, Weighted Cardio, Strength B, Recovery, Strength C and Boxing/Kickboxing — the full weekly training schedule with Mirror Me demos.",
      },
      { property: "og:title", content: "Weekly Program — Arm Growth & Conditioning Tracker" },
      {
        property: "og:description",
        content:
          "Six training sessions a week: strength, low-impact weighted cardio, boxing and recovery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Program,
});

const SESSION_KEYS = SESSIONS.map((s) => s.key);

/** First upcoming calendar day that matches this weekday plan. */
function nextDayFor(key: string, current: number): number {
  for (let d = current; d <= TOTAL_DAYS; d++) if (planForDay(d).key === key) return d;
  for (let d = 1; d <= TOTAL_DAYS; d++) if (planForDay(d).key === key) return d;
  return current;
}

function Program() {
  const state = useApp();
  const current = currentDayNumber(state);
  const currentKey = planForDay(current).key;
  const [tab, setTab] = useState<string>(SESSION_KEYS.includes(currentKey) ? currentKey : "mon");
  const [legacy, setLegacy] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const session = SESSIONS.find((s) => s.key === tab) ?? SESSIONS[0];
  const plan: DayPlan = session.plan;
  const dayNumber = nextDayFor(plan.key, current);
  const list = exercisesForDay(dayNumber);

  return (
    <main className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <img
          src={COACH_REFERENCE}
          alt="The approved coach"
          className="size-14 shrink-0 rounded-full object-cover object-top ring-2 ring-primary/60"
        />
        <div>
          <h1 className="text-3xl font-bold">Program</h1>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            If you want it, get off your ass and get it!
          </p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Six sessions a week — strength, low-impact weighted cardio, boxing conditioning and a
        recovery day. Sunday is full rest.
      </p>
      <button
        type="button"
        onClick={() => setChooserOpen(true)}
        className="tap-target mt-4 w-full rounded-xl border-2 border-primary bg-primary/10 text-sm font-black uppercase text-primary"
      >
        Choose activity or build a workout
      </button>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {SESSIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setTab(s.key)}
            aria-pressed={s.key === tab}
            className={`tap-target rounded-xl border px-1 text-[11px] font-bold uppercase leading-tight ${
              s.key === tab
                ? "border-primary bg-primary/20 text-primary"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {s.plan.weekday.slice(0, 3)}
            <span className="block text-[10px] font-semibold normal-case">{s.label}</span>
          </button>
        ))}
      </div>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          {plan.weekday} · Day {dayNumber} · {dayDateLabel(state, dayNumber)}
        </p>
        <h2 className="text-2xl font-bold">{plan.title}</h2>
        <p className="text-sm text-accent">{plan.focus}</p>
        <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link
            to="/workout/$day"
            params={{ day: String(dayNumber) }}
            className="tap-target flex items-center justify-center rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
          >
            Start session
          </Link>
          <Link
            to="/glasses"
            search={{ day: dayNumber }}
            className="tap-target flex items-center justify-center gap-2 rounded-xl border-2 border-accent bg-accent/10 text-sm font-bold uppercase text-accent"
          >
            <Glasses className="size-4" /> Glasses mode
          </Link>
        </div>

        {plan.key === "sat" && (
          <p className="mt-3 rounded-xl bg-elevated px-3 py-2 text-xs text-muted-foreground">
            Prefer dumbbells today? Run the Tuesday Weighted Cardio session instead — both count as
            Saturday conditioning.
          </p>
        )}

        <ul className="mt-4 space-y-2">
          {list.map((e) => (
            <li key={e.id} className="rounded-xl bg-elevated p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {e.name}
                    {e.optional && (
                      <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                        Optional
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {e.sets} × {e.reps} · {e.target}
                  </p>
                </div>
                <MirrorMeButton mirrorKey={e.mirror} work={`${e.sets} × ${e.reps}`} compact />
              </div>
              {e.notes && <p className="mt-1 text-xs text-muted-foreground">{e.notes}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-4 rounded-2xl p-4">
        <h2 className="text-lg font-bold">How the weight goes up</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          {PROGRESSION_RULES.map((r) => (
            <li key={r} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-4 rounded-2xl p-4">
        <h2 className="text-lg font-bold">Calendar</h2>
        <p className="text-xs text-muted-foreground">
          The weekly schedule repeats. Every day you have already logged is kept.
        </p>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 28 }, (_, i) => {
            const base = Math.floor((current - 1) / 7) * 7;
            const d = Math.max(1, Math.min(TOTAL_DAYS, base - 6 + i));
            const done = getDay(state, d).completed;
            const p = planForDay(d);
            return (
              <Link
                key={i}
                to="/workout/$day"
                params={{ day: String(d) }}
                className={`grid aspect-square place-items-center rounded-lg text-[10px] font-bold ${
                  done
                    ? "bg-success/25 text-success"
                    : d === current
                      ? "bg-primary/25 text-primary ring-1 ring-primary"
                      : "bg-elevated text-muted-foreground"
                }`}
              >
                <span>{d}</span>
                <span className="text-[8px] font-semibold uppercase">{p.weekday.slice(0, 3)}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="surface-card mt-4 mb-6 rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setLegacy((v) => !v)}
          aria-expanded={legacy}
          className="flex w-full items-center justify-between text-left"
        >
          <span>
            <span className="block text-lg font-bold">Legacy — 22-Day Arm Program</span>
            <span className="block text-xs text-muted-foreground">
              The original plan, kept for reference. Your old logs are untouched.
            </span>
          </span>
          <span className="text-xs font-bold uppercase text-primary">
            {legacy ? "Hide" : "View"}
          </span>
        </button>
        {legacy && (
          <div className="mt-3 space-y-3">
            {LEGACY_WEEK.map((d) => (
              <div key={d.key} className="rounded-xl bg-elevated p-3">
                <p className="font-semibold">
                  {d.weekday} — {d.title}
                </p>
                <p className="text-xs text-muted-foreground">{d.focus}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[...d.warmup, ...d.main, ...d.finisher].map((e) => e.name).join(" · ") || "Rest"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
      <ActivityChooser day={current} open={chooserOpen} onClose={() => setChooserOpen(false)} />
    </main>
  );
}