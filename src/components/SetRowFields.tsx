import { WeightInput } from "@/components/WeightInput";
import { ASSIST_PRESETS, BAND_COLORS, BAND_LEVELS, type KindFields } from "@/lib/exercise-kind";
import type { SetEntry } from "@/lib/store";

const box = "tap-target w-full rounded-lg border border-input bg-elevated px-3 text-base";

/**
 * Entry fields for a single set — only the inputs the movement actually
 * needs. Nobody is ever asked to type zero pounds.
 */
export function SetRowFields({
  fields,
  set,
  index,
  unit,
  onChange,
}: {
  fields: KindFields;
  set: SetEntry;
  index: number;
  unit: string;
  onChange: (patch: Partial<SetEntry>) => void;
}) {
  const n = index + 1;
  const bandId = `band-opts-${index}`;
  const assistId = `assist-opts-${index}`;

  return (
    <div className="grid grid-cols-2 gap-2">
      {fields.reps && (
        <input
          inputMode="numeric"
          placeholder="reps"
          aria-label={`Set ${n} reps`}
          value={set.reps}
          onChange={(e) => onChange({ reps: e.target.value })}
          className={box}
        />
      )}

      {fields.weight && (
        <WeightInput
          ariaLabel={`Set ${n} weight`}
          unit={unit}
          value={set.weight}
          onChange={(v) => onChange({ weight: v })}
        />
      )}

      {fields.bodyweight && (
        <input
          list={assistId}
          placeholder="bodyweight / + added"
          aria-label={`Set ${n} load`}
          value={set.weight}
          onChange={(e) => onChange({ weight: e.target.value })}
          className={box}
        />
      )}

      {fields.band && (
        <>
          <input
            list={bandId}
            placeholder="band colour / level"
            aria-label={`Set ${n} band`}
            value={set.band ?? ""}
            onChange={(e) => onChange({ band: e.target.value })}
            className={box}
          />
          <datalist id={bandId}>
            {[...BAND_LEVELS, ...BAND_COLORS.map((c) => `${c} band`)].map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </>
      )}

      {fields.assist && (
        <>
          <input
            list={assistId}
            placeholder="assistance / machine setting"
            aria-label={`Set ${n} assistance`}
            value={set.assist ?? ""}
            onChange={(e) => onChange({ assist: e.target.value })}
            className={box}
          />
          <datalist id={assistId}>
            {ASSIST_PRESETS.map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </>
      )}

      {fields.time && (
        <input
          placeholder="time / duration"
          aria-label={`Set ${n} duration`}
          value={set.time ?? ""}
          onChange={(e) => onChange({ time: e.target.value })}
          className={box}
        />
      )}

      {fields.cardio && (
        <>
          <input
            placeholder="speed"
            aria-label={`Set ${n} speed`}
            value={set.speed ?? ""}
            onChange={(e) => onChange({ speed: e.target.value })}
            className={box}
          />
          <input
            placeholder="incline %"
            aria-label={`Set ${n} incline`}
            value={set.incline ?? ""}
            onChange={(e) => onChange({ incline: e.target.value })}
            className={box}
          />
          <input
            placeholder="distance"
            aria-label={`Set ${n} distance`}
            value={set.distance ?? ""}
            onChange={(e) => onChange({ distance: e.target.value })}
            className={box}
          />
          <input
            placeholder="calories (optional)"
            aria-label={`Set ${n} calories`}
            value={set.calories ?? ""}
            onChange={(e) => onChange({ calories: e.target.value })}
            className={box}
          />
        </>
      )}

      {fields.side && (
        <div className="col-span-2 flex gap-2">
          {["Left", "Right", "Both"].map((sd) => (
            <button
              key={sd}
              type="button"
              aria-pressed={set.side === sd}
              onClick={() => onChange({ side: set.side === sd ? undefined : sd })}
              className={`tap-target flex-1 rounded-lg text-xs font-bold uppercase ${
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