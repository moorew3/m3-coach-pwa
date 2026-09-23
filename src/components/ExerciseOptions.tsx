import { useEffect, useRef, useState } from "react";
import { SheetPanel, SheetButton } from "@/components/Sheet";
import { SubstitutionSelect } from "@/components/SubstitutionSelect";
import { MirrorMeButton } from "@/components/MirrorMe";
import { variationHistory } from "@/lib/progression";
import type { Exercise } from "@/data/program";
import type { AppState, ExerciseLog, SetEntry } from "@/lib/store";

/** Notes field that keeps focus and the keyboard open while typing. */
function NotesField({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <textarea
      rows={4}
      value={draft}
      placeholder="Setup, seat height, grip, anything to remember."
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        const v = e.target.value;
        setDraft(v);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => onCommit(v), 400);
      }}
      onBlur={() => {
        focused.current = false;
        if (timer.current) clearTimeout(timer.current);
        onCommit(draft);
      }}
      className="w-full rounded-xl border border-input bg-elevated p-3 text-base"
    />
  );
}

/**
 * Per-exercise three-dot menu. Everything that is not weight, reps or a
 * checkmark lives here so the workout list stays quiet.
 */
export function ExerciseOptions({
  state,
  exercise,
  entry,
  sets,
  dayKey,
  weekday,
  restLength,
  paired,
  onClose,
  onWrite,
  onMeta,
  onRestart,
  onUnpair,
  onRestorePairs,
}: {
  state: AppState;
  exercise: Exercise;
  entry?: ExerciseLog;
  sets: SetEntry[];
  dayKey: string;
  weekday: string;
  restLength: number;
  paired: boolean;
  onClose: () => void;
  onWrite: (next: SetEntry[]) => void;
  onMeta: (patch: Partial<ExerciseLog>) => void;
  onRestart: () => void;
  onUnpair: () => void;
  onRestorePairs: () => void;
}) {
  const [view, setView] = useState<"menu" | "history" | "notes" | "targets">("menu");
  const name = entry?.replacedWith || exercise.name;
  const history = variationHistory(state, exercise.id, entry?.replacedWith);

  if (view === "history") {
    return (
      <SheetPanel
        title={`${name} — history`}
        subtitle="Most recent sessions first."
        onClose={onClose}
      >
        {history.length === 0 && (
          <p className="text-sm text-muted-foreground">No logged sessions yet.</p>
        )}
        <ul className="space-y-2">
          {[...history].reverse().map((h) => (
            <li key={h.day} className="rounded-xl bg-elevated p-3 text-sm">
              <p className="font-bold">Day {h.day}</p>
              <p className="text-muted-foreground">
                {h.weightLabel || "—"} · {h.reps.join(", ")} reps
                {h.pain ? ` · pain ${h.pain}/10` : ""}
              </p>
            </li>
          ))}
        </ul>
        <SheetButton onClick={() => setView("menu")}>Back</SheetButton>
      </SheetPanel>
    );
  }

  if (view === "notes") {
    return (
      <SheetPanel title={`${name} — notes`} onClose={onClose}>
        <NotesField value={entry?.notes ?? ""} onCommit={(v) => onMeta({ notes: v })} />
        <SheetButton onClick={() => setView("menu")}>Back</SheetButton>
      </SheetPanel>
    );
  }

  if (view === "targets") {
    return (
      <SheetPanel
        title={`${name} — targets`}
        subtitle="Applies to this workout only."
        onClose={onClose}
      >
        <label className="block text-sm font-semibold">
          Rest between sets (seconds)
          <input
            inputMode="numeric"
            value={entry?.restOverride ?? restLength}
            onChange={(e) => onMeta({ restOverride: Number(e.target.value) || 0 })}
            className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-base"
          />
        </label>
        <label className="block text-sm font-semibold">
          Rep target
          <input
            value={entry?.repTarget ?? exercise.reps}
            onChange={(e) => onMeta({ repTarget: e.target.value })}
            className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-base"
          />
        </label>
        <SheetButton onClick={() => setView("menu")}>Back</SheetButton>
      </SheetPanel>
    );
  }

  return (
    <SheetPanel title={name} subtitle={exercise.target} onClose={onClose}>
      <MirrorMeButton
        mirrorKey={exercise.mirror}
        work={`${exercise.sets} × ${entry?.repTarget ?? exercise.reps}`}
        label="Mirror Me demo"
      />
      <SubstitutionSelect
        exercise={exercise}
        value={entry?.replacedWith}
        onChange={(v) => onMeta({ replacedWith: v })}
      />
      <SheetButton onClick={() => setView("history")}>Exercise history</SheetButton>
      <SheetButton onClick={() => setView("targets")}>Change rest time / rep target</SheetButton>
      <SheetButton onClick={() => setView("notes")}>Notes</SheetButton>
      <SheetButton onClick={() => onWrite([...sets, { reps: "", weight: "", done: false }])}>
        Add set
      </SheetButton>
      <SheetButton onClick={() => sets.length > 1 && onWrite(sets.slice(0, -1))}>
        Delete last set
      </SheetButton>
      <SheetButton
        onClick={() =>
          onWrite(
            sets
              .map((s) => ({ ...s, warmup: false }))
              .map((s, i) => (i === 0 ? { ...s, warmup: true } : s)),
          )
        }
      >
        Mark first set as warm-up
      </SheetButton>
      <SheetButton onClick={() => onMeta({ skipped: !entry?.skipped })}>
        {entry?.skipped ? "Unskip exercise" : "Skip exercise"}
      </SheetButton>
      <SheetButton onClick={onRestart}>Restart exercise</SheetButton>
      {paired && (
        <>
          <SheetButton onClick={onUnpair}>Remove from superset</SheetButton>
          <SheetButton onClick={onRestorePairs}>Restore recommended pairing</SheetButton>
        </>
      )}
    </SheetPanel>
  );
}