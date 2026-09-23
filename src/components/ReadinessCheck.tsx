import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { Readiness } from "@/lib/store";

const PAIN_SPOTS = [
  { key: "shoulder", label: "Shoulder" },
  { key: "elbow", label: "Elbow" },
  { key: "knee", label: "Knee" },
  { key: "back", label: "Back" },
] as const;

/** Pre-workout readiness check. Must be completed before Start Workout. */
export function ReadinessCheck({
  onSave,
  onCancel,
}: {
  onSave: (r: Readiness) => void;
  onCancel: () => void;
}) {
  const [pain, setPain] = useState<Record<string, boolean>>({});
  const [sharpPain, setSharp] = useState(false);
  const [numbness, setNumb] = useState(false);
  const [energy, setEnergy] = useState(3);
  const [slept6, setSlept] = useState(true);

  const warn = sharpPain || numbness;
  const flagged = PAIN_SPOTS.filter((s) => pain[s.key]).map((s) => s.label);

  return (
    <section className="surface-card mt-4 rounded-2xl p-4">
      <h2 className="text-lg font-bold uppercase">Readiness check</h2>
      <p className="text-sm text-muted-foreground">
        Quick honest answers keep you training for 22 days.
      </p>

      <p className="mt-4 text-sm font-semibold">Any pain today?</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {PAIN_SPOTS.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={!!pain[s.key]}
            onClick={() => setPain((p) => ({ ...p, [s.key]: !p[s.key] }))}
            className={`tap-target rounded-xl text-sm font-bold uppercase ${
              pain[s.key]
                ? "bg-destructive/25 text-destructive"
                : "bg-elevated text-muted-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          aria-pressed={sharpPain}
          onClick={() => setSharp((v) => !v)}
          className={`tap-target rounded-xl text-sm font-bold uppercase ${
            sharpPain ? "bg-destructive/25 text-destructive" : "bg-elevated text-muted-foreground"
          }`}
        >
          Sharp pain
        </button>
        <button
          type="button"
          aria-pressed={numbness}
          onClick={() => setNumb((v) => !v)}
          className={`tap-target rounded-xl text-sm font-bold uppercase ${
            numbness ? "bg-destructive/25 text-destructive" : "bg-elevated text-muted-foreground"
          }`}
        >
          Numbness
        </button>
      </div>

      <p className="mt-4 text-sm font-semibold">Energy level</p>
      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={energy === n}
            onClick={() => setEnergy(n)}
            className={`tap-target flex-1 rounded-xl text-base font-bold ${
              energy === n
                ? "bg-primary text-primary-foreground"
                : "bg-elevated text-muted-foreground"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        aria-pressed={slept6}
        onClick={() => setSlept((v) => !v)}
        className="tap-target mt-4 flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-base font-semibold"
      >
        Slept at least 6 hours
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
            slept6 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {slept6 ? "Yes" : "No"}
        </span>
      </button>

      {warn && (
        <div className="mt-4 flex gap-3 rounded-xl border-2 border-destructive bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="size-6 shrink-0 text-destructive" aria-hidden />
          <p>
            Sharp pain or numbness is a stop sign. Skip the movement that causes it — or stop the
            session entirely. Do not train through it.
          </p>
        </div>
      )}
      {!warn && flagged.length > 0 && (
        <p className="mt-3 text-sm text-accent">
          {flagged.join(", ")} flagged — use the substitute on any exercise that provokes it.
        </p>
      )}
      {!slept6 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Under 6 hours of sleep: keep the loads where they were and stop 2 reps shy of failure.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="tap-target rounded-xl border border-border bg-elevated text-sm font-bold uppercase"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              shoulder: !!pain.shoulder,
              elbow: !!pain.elbow,
              knee: !!pain.knee,
              back: !!pain.back,
              sharpPain,
              numbness,
              energy,
              slept6,
              at: new Date().toISOString(),
            })
          }
          className="tap-target rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
        >
          Save & continue
        </button>
      </div>
    </section>
  );
}