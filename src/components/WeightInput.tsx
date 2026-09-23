import { useId } from "react";

/**
 * Weight field that is BOTH a searchable dropdown and a free-text input.
 * Accepts 0–1500+ lb, decimals (22.5, 47.5), "Bodyweight", "Band",
 * machine settings and custom text like "Bodyweight + 25" or "Pin 12".
 */
const numeric = () => {
  const out: string[] = [];
  for (let w = 2.5; w <= 100; w += 2.5) out.push(String(w));
  for (let w = 105; w <= 300; w += 5) out.push(String(w));
  for (let w = 310; w <= 500; w += 10) out.push(String(w));
  for (let w = 525; w <= 1500; w += 25) out.push(String(w));
  return out;
};

const PRESETS = [
  "Bodyweight",
  "Bodyweight + 10",
  "Bodyweight + 25",
  "Band — light",
  "Band — medium",
  "Band — heavy",
  "Machine level 5",
  "Machine level 10",
  "Pin 5",
  "Pin 8",
  "Pin 12",
  ...numeric(),
];

export function WeightInput({
  value,
  onChange,
  unit,
  ariaLabel,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  ariaLabel: string;
  className?: string;
}) {
  const id = useId();
  return (
    <>
      <input
        list={id}
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder={`weight (${unit})`}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`tap-target w-full rounded-lg border border-input bg-elevated px-3 ${className}`}
      />
      <datalist id={id}>
        {PRESETS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </>
  );
}