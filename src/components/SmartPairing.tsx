import { useState } from "react";
import { Zap, RotateCcw, Save, Trash2, X } from "lucide-react";
import type { Exercise } from "@/data/program";
import {
  applyPairs,
  clearDefaultPairs,
  saveDefaultPairs,
  type CustomPair,
  type DayLog,
  type Readiness,
} from "@/lib/store";
import { pairBlocked, pairWarning, recommendedPairs } from "@/lib/pairing";

/**
 * Smart superset pairing panel — recommended pairs are pre-selected,
 * and the user can change, remove, create, save or restore them.
 */
export function SmartPairing({
  day,
  planKey,
  base,
  log,
  readiness,
  savedDefault,
  onFlash,
  onTurnOff,
}: {
  day: number;
  planKey: string;
  base: Exercise[];
  log: DayLog;
  readiness?: Readiness;
  savedDefault?: CustomPair[];
  onFlash: (m: string) => void;
  onTurnOff: () => void;
}) {
  const pairs = log.customPairs ?? [];
  const notes = log.pairNotes ?? [];
  const [pairA, setPairA] = useState("");
  const [pairB, setPairB] = useState("");

  const uid = () =>
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `pair-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  const byId = (id: string) => base.find((e) => e.id === id);
  const label = (id: string) => log.exercises[id]?.replacedWith || byId(id)?.name || id;

  /**
   * Any exercise can go in any slot. Choosing one that already sits in a
   * different pair moves it here instead of silently creating a duplicate,
   * and choosing the exercise already on the other side swaps the two.
   */
  const setSide = (pairId: string, side: "a" | "b", value: string) => {
    const other = side === "a" ? "b" : "a";
    const next = pairs
      .map((p) => {
        if (p.id === pairId) {
          if (p[other] === value) return { ...p, [side]: value, [other]: p[side] } as CustomPair;
          return { ...p, [side]: value } as CustomPair;
        }
        // Free the exercise from whatever pair it was in before.
        if (p.a === value || p.b === value)
          return { ...p, [p.a === value ? "a" : "b"]: "" } as CustomPair;
        return p;
      })
      .filter((p) => p.a && p.b);
    applyPairs(day, next, notes);
    onFlash("Pairing updated");
  };

  const remove = (pairId: string) => {
    applyPairs(
      day,
      pairs.filter((p) => p.id !== pairId),
      notes,
    );
    onFlash("Pairing removed");
  };

  const restore = () => {
    const plan = recommendedPairs(base, log, readiness);
    applyPairs(day, plan.pairs, plan.notes);
    onFlash("Recommended pairings restored");
  };

  return (
    <section className="surface-card mt-4 rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        <Zap className="size-4 text-accent" aria-hidden /> Smart superset pairing
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Recommended pairs are selected automatically. Change, remove or save your own — one rest
        timer runs after both exercises.
      </p>

      {notes.length > 0 && (
        <ul className="mt-3 space-y-1">
          {notes.map((n) => (
            <li key={n} className="rounded-xl bg-elevated p-3 text-xs text-accent">
              {n}
            </li>
          ))}
        </ul>
      )}

      {pairs.length === 0 && (
        <p className="mt-3 rounded-xl bg-elevated p-3 text-xs text-muted-foreground">
          No pairings today — every exercise runs as a straight set.
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {pairs.map((p, i) => {
          const warn = pairWarning(byId(p.a), byId(p.b));
          return (
            <li key={p.id} className="rounded-xl bg-elevated p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-accent">
                  Pair {String.fromCharCode(65 + i)}
                </span>
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="flex items-center gap-1 rounded-lg bg-card px-3 py-2 text-xs font-bold uppercase text-muted-foreground"
                >
                  <Trash2 className="size-4" aria-hidden /> Remove
                </button>
              </div>
              {(["a", "b"] as const).map((side) => (
                <select
                  key={side}
                  aria-label={`Pair ${String.fromCharCode(65 + i)} exercise ${side.toUpperCase()}`}
                  value={p[side]}
                  onChange={(e) => setSide(p.id, side, e.target.value)}
                  className="tap-target mt-2 w-full rounded-xl border border-input bg-card px-3 text-base"
                >
                  {base.map((e) => (
                    <option key={e.id} value={e.id}>
                      {label(e.id)}
                    </option>
                  ))}
                </select>
              ))}
              {warn && <p className="mt-2 text-xs font-semibold text-accent">{warn}</p>}
            </li>
          );
        })}
      </ul>

      <h3 className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Create a pairing
      </h3>
      <div className="mt-2 grid gap-2">
        {[
          { v: pairA, set: setPairA, label: "Exercise A" },
          { v: pairB, set: setPairB, label: "Exercise B" },
        ].map((f) => (
          <select
            key={f.label}
            aria-label={f.label}
            value={f.v}
            onChange={(e) => f.set(e.target.value)}
            className="tap-target w-full rounded-xl border border-input bg-elevated px-3 text-base"
          >
            <option value="">{f.label}</option>
            {base.map((e) => (
              <option key={e.id} value={e.id}>
                {label(e.id)}
              </option>
            ))}
          </select>
        ))}
        {pairBlocked(byId(pairA), byId(pairB)) ? (
          <p className="text-xs font-semibold text-destructive">
            {pairBlocked(byId(pairA), byId(pairB))}
          </p>
        ) : (
          pairWarning(byId(pairA), byId(pairB)) && (
            <p className="text-xs font-semibold text-accent">
              {pairWarning(byId(pairA), byId(pairB))}
            </p>
          )
        )}
        <button
          type="button"
          disabled={!pairA || !pairB || !!pairBlocked(byId(pairA), byId(pairB))}
          onClick={() => {
            applyPairs(
              day,
              [
                // Keep every other pair, minus the two exercises moving here.
                ...pairs
                  .map((p) => ({
                    ...p,
                    a: p.a === pairA || p.a === pairB ? "" : p.a,
                    b: p.b === pairA || p.b === pairB ? "" : p.b,
                  }))
                  .filter((p) => p.a && p.b),
                { id: uid(), a: pairA, b: pairB },
              ],
              notes,
            );
            setPairA("");
            setPairB("");
            onFlash("Pairing created");
          }}
          className="tap-target rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground disabled:opacity-40"
        >
          Pair these two
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={restore}
          className="tap-target flex items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-xs font-bold uppercase"
        >
          <RotateCcw className="size-4" aria-hidden /> Restore recommended
        </button>
        <button
          type="button"
          onClick={() => {
            saveDefaultPairs(planKey, pairs);
            onFlash("Saved as your default for this day");
          }}
          className="tap-target flex items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-xs font-bold uppercase"
        >
          <Save className="size-4" aria-hidden /> Save for future
        </button>
        {savedDefault && (
          <button
            type="button"
            onClick={() => {
              clearDefaultPairs(planKey);
              restore();
            }}
            className="tap-target flex items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-xs font-bold uppercase"
          >
            <Trash2 className="size-4" aria-hidden /> Forget saved default
          </button>
        )}
        <button
          type="button"
          onClick={onTurnOff}
          className="tap-target flex items-center justify-center gap-2 rounded-xl border border-border bg-elevated text-xs font-bold uppercase text-destructive"
        >
          <X className="size-4" aria-hidden /> Supersets off today
        </button>
      </div>
    </section>
  );
}