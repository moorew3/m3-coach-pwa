import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import type { KindFields } from "@/lib/exercise-kind";
import type { SetEntry } from "@/lib/store";

/**
 * One compact set row: SET | PREVIOUS | inputs | ✓
 * Only the inputs the movement actually needs are rendered — nobody
 * is ever asked to type pounds for a stretch.
 */
export interface SetColumn {
  key: keyof SetEntry;
  ph: string;
}

export function columnsFor(fields: KindFields, unit: string): SetColumn[] {
  const cols: SetColumn[] = [];
  if (fields.weight) cols.push({ key: "weight", ph: unit });
  if (fields.bodyweight) cols.push({ key: "weight", ph: "BW / +load" });
  if (fields.band) cols.push({ key: "band", ph: "band" });
  if (fields.assist) cols.push({ key: "assist", ph: "assist" });
  if (fields.reps) cols.push({ key: "reps", ph: "reps" });
  if (fields.time) cols.push({ key: "time", ph: "time" });
  if (fields.cardio) {
    cols.push({ key: "speed", ph: "speed" });
    cols.push({ key: "incline", ph: "incline" });
    cols.push({ key: "distance", ph: "dist" });
  }
  return cols;
}

const DECIMAL: string[] = ["weight", "speed", "incline", "distance"];
const NUMERIC: string[] = ["reps", "calories"];

function modeFor(key: string): "decimal" | "numeric" | "text" {
  if (DECIMAL.includes(key)) return "decimal";
  if (NUMERIC.includes(key)) return "numeric";
  return "text";
}

/**
 * Input that owns its value while focused. Timer ticks, auto-save and
 * re-renders can never overwrite what is being typed or steal the caret,
 * so the mobile keyboard stays open.
 */
function DraftInput({
  value,
  onCommit,
  ...rest
}: {
  value: string;
  onCommit: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
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
    <input
      {...rest}
      value={draft}
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
    />
  );
}

const input =
  "h-11 w-full min-w-0 rounded-lg border border-input bg-elevated px-1 text-center text-base";

export function SetRowCompact({
  label,
  warmup,
  previous,
  columns,
  set,
  index,
  active,
  showSide,
  onChange,
  onToggle,
}: {
  label: string;
  warmup?: boolean;
  previous: string;
  columns: SetColumn[];
  set: SetEntry;
  index: number;
  active: boolean;
  showSide?: boolean;
  onChange: (patch: Partial<SetEntry>) => void;
  onToggle: () => void;
}) {
  const n = index + 1;
  return (
    <div
      className={`rounded-xl px-1 py-1 ${
        active ? "bg-primary/15 ring-1 ring-primary" : set.done ? "bg-success/10" : ""
      }`}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`grid h-11 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold ${
            warmup ? "text-accent" : set.done ? "text-success" : "text-muted-foreground"
          }`}
        >
          {label}
        </span>
        <span className="w-20 shrink-0 truncate text-center text-[11px] font-semibold tabular-nums text-muted-foreground">
          {previous}
        </span>

        <div className="flex min-w-0 flex-1 gap-1">
          {columns.map((c) => (
            <DraftInput
              key={c.key}
              inputMode={modeFor(c.key as string)}
              type="text"
              autoComplete="off"
              enterKeyHint="done"
              placeholder={c.ph}
              aria-label={`Set ${n} ${c.ph}`}
              value={(set[c.key] as string | undefined) ?? ""}
              onCommit={(v) => onChange({ [c.key]: v } as Partial<SetEntry>)}
              className={input}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label={`Mark set ${n} complete`}
          aria-pressed={set.done}
          onClick={onToggle}
          className={`grid size-11 shrink-0 place-items-center rounded-lg ${
            set.done ? "bg-success/30 text-success" : "bg-elevated text-muted-foreground"
          }`}
        >
          <Check className="size-5" />
        </button>
      </div>

      {showSide && (
        <div className="mt-1 flex gap-1 pl-[7rem]">
          {["Left", "Right", "Both"].map((sd) => (
            <button
              key={sd}
              type="button"
              aria-pressed={set.side === sd}
              onClick={() => onChange({ side: set.side === sd ? undefined : sd })}
              className={`h-8 flex-1 rounded-lg text-[10px] font-bold uppercase ${
                set.side === sd
                  ? "bg-primary text-primary-foreground"
                  : "bg-elevated text-muted-foreground"
              }`}
            >
              {sd}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}