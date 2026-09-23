import { useState } from "react";
import { Flame, Sparkles, Check } from "lucide-react";
import type { Exercise } from "@/data/program";
import { saveWarmupPref, toggleAdaptiveFor, type AppState, type SetEntry } from "@/lib/store";
import {
  formatWeight,
  needsWarmup,
  suggestFor,
  variationKey,
  warmupPlan,
  weightValue,
  type WarmupSet,
} from "@/lib/progression";

/**
 * "Suggested today" card — warm-up ladder, working weight and the reason,
 * with the user in control of every value.
 */
export function AdaptiveSuggestion({
  state,
  exercise,
  replacedWith,
  sets,
  onWrite,
  onFlash,
}: {
  state: AppState;
  exercise: Exercise;
  replacedWith?: string;
  sets: SetEntry[];
  onWrite: (next: SetEntry[]) => void;
  onFlash: (m: string) => void;
}) {
  const unit = state.settings.units;
  const key = variationKey(exercise.id, replacedWith, unit);
  const off = state.adaptiveOff.includes(key);
  const suggestion = suggestFor(state, exercise, replacedWith);

  const plannedFromSets = weightValue(sets.find((s) => !s.warmup && s.weight)?.weight);
  const planned = suggestion?.workWeightNum ?? plannedFromSets;
  const pref = state.warmupPrefs[key];
  const baseWarmups: WarmupSet[] =
    planned !== null && planned !== undefined && needsWarmup(exercise, replacedWith)
      ? pref
        ? pref.map((p) => ({ pct: p.pct, weight: Math.round(planned * p.pct), reps: p.reps }))
        : warmupPlan(planned, exercise, state.settings, replacedWith)
      : [];

  const [warmups, setWarmups] = useState<WarmupSet[] | null>(null);
  const rows = warmups ?? baseWarmups;
  const hasWarmupRows = sets.some((s) => s.warmup);

  if (!state.settings.adaptive) return null;

  const addWarmupSets = () => {
    const working = sets.filter((s) => !s.warmup);
    const created: SetEntry[] = rows.map((w) => ({
      reps: w.reps,
      weight: formatWeight(w.weight, unit),
      warmup: true,
      done: false,
    }));
    onWrite([...created, ...working]);
    onFlash("Warm-up sets added");
  };

  const applyWorking = (weight: string) => {
    onWrite(sets.map((s) => (s.warmup ? s : { ...s, weight })));
    onFlash(`Working weight set to ${weight}`);
  };

  return (
    <section className="surface-card mt-3 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-4 text-accent" aria-hidden /> Suggested today
        </h2>
        <button
          type="button"
          onClick={() => {
            toggleAdaptiveFor(key);
            onFlash(off ? "Suggestions on for this exercise" : "Suggestions off for this exercise");
          }}
          className="rounded-lg bg-elevated px-3 py-2 text-[11px] font-bold uppercase text-muted-foreground"
        >
          {off ? "Turn on" : "Turn off"}
        </button>
      </div>

      {off ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Adaptive suggestions are off for this exercise.
        </p>
      ) : (
        <>
          {rows.length > 0 && (
            <div className="mt-3">
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-accent">
                <Flame className="size-4" aria-hidden /> Warm-up
              </p>
              <ul className="mt-2 space-y-2">
                {rows.map((w, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      inputMode="decimal"
                      aria-label={`Warm-up ${i + 1} weight`}
                      value={String(w.weight)}
                      onChange={(e) =>
                        setWarmups(
                          rows.map((x, j) =>
                            j === i ? { ...x, weight: Number(e.target.value) || 0 } : x,
                          ),
                        )
                      }
                      className="tap-target w-full rounded-lg border border-input bg-elevated px-3 text-base"
                    />
                    <input
                      aria-label={`Warm-up ${i + 1} reps`}
                      value={w.reps}
                      onChange={(e) =>
                        setWarmups(
                          rows.map((x, j) => (j === i ? { ...x, reps: e.target.value } : x)),
                        )
                      }
                      className="tap-target w-24 shrink-0 rounded-lg border border-input bg-elevated px-3 text-base"
                    />
                    <button
                      type="button"
                      aria-label={`Skip warm-up ${i + 1}`}
                      onClick={() => setWarmups(rows.filter((_, j) => j !== i))}
                      className="tap-target w-16 shrink-0 rounded-lg bg-card text-[11px] font-bold uppercase text-muted-foreground"
                    >
                      Skip
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setWarmups([
                      ...rows,
                      {
                        pct: 0.9,
                        weight: Math.round((planned ?? 0) * 0.9),
                        reps: "2–3",
                      },
                    ])
                  }
                  className="tap-target rounded-xl bg-elevated text-[11px] font-bold uppercase"
                >
                  + Add warm-up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    saveWarmupPref(
                      key,
                      rows.map((w) => ({
                        pct: planned ? Math.round((w.weight / planned) * 100) / 100 : w.pct,
                        reps: w.reps,
                      })),
                    );
                    onFlash("Warm-up pattern saved");
                  }}
                  className="tap-target rounded-xl bg-elevated text-[11px] font-bold uppercase"
                >
                  Save pattern
                </button>
              </div>
              <button
                type="button"
                onClick={addWarmupSets}
                disabled={hasWarmupRows}
                className="tap-target mt-2 w-full rounded-xl bg-accent/20 text-xs font-bold uppercase text-accent disabled:opacity-40"
              >
                {hasWarmupRows ? "Warm-ups added" : "Accept warm-ups"}
              </button>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Warm-up sets are logged separately and do not count as working volume.
              </p>
            </div>
          )}

          <div className="mt-3 rounded-xl bg-elevated p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Working</p>
            <p className="text-lg font-bold">
              {suggestion?.workWeight ?? "Pick a weight"} · {exercise.sets} × {exercise.reps}
            </p>
            <p className="text-xs text-muted-foreground">rest {exercise.rest || 60}s</p>
            <p className="mt-2 text-sm text-accent">
              {suggestion?.reason ??
                "No history yet — log today's sets and suggestions start next session."}
            </p>
          </div>

          {suggestion && (
            <div className="mt-2 grid gap-2">
              {suggestion.options.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => applyWorking(o.weight)}
                  className="tap-target flex items-center justify-between rounded-xl bg-elevated px-4 text-sm font-bold"
                >
                  <span className="truncate">{o.label}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs uppercase text-muted-foreground">
                    {o.reps} reps <Check className="size-4 text-accent" aria-hidden />
                  </span>
                </button>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Nothing changes until you tap an option — you can always type your own weight below.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}