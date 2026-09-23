import { Repeat2 } from "lucide-react";
import type { Exercise } from "@/data/program";

/** Substitution picker shown directly on every exercise card. */
export function SubstitutionSelect({
  exercise,
  value,
  onChange,
}: {
  exercise: Exercise;
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const options = exercise.substitutions ?? [];

  return (
    <label className="mt-3 block">
      <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Repeat2 className="size-4" aria-hidden /> Substitute
      </span>
      <select
        aria-label={`Substitute for ${exercise.name}`}
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__custom") {
            const custom = prompt("Type the exercise you're doing instead:");
            onChange(custom || undefined);
            return;
          }
          onChange(v || undefined);
        }}
        className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-base"
      >
        <option value="">{exercise.name} (as programmed)</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {value && !options.includes(value) && <option value={value}>{value}</option>}
        <option value="__custom">Other…</option>
      </select>
    </label>
  );
}