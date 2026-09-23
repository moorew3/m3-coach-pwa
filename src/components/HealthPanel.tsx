import { useEffect, useRef, useState } from "react";
import { Activity, Bluetooth, Footprints, HeartPulse, Upload } from "lucide-react";
import {
  averageHeartRate,
  connectHeartRate,
  disconnectHeartRate,
  heartRateSupported,
  onHeartRate,
} from "@/lib/health/hr-monitor";
import { HEALTH_CONNECT_NOTE } from "@/lib/health/health-connect";
import { parseHealthExport } from "@/lib/health/import";

import {
  onWalkSample,
  startWalkTracking,
  stopWalkTracking,
  walkTrackingSupported,
  type WalkSample,
} from "@/lib/health/walk-tracker";
import { currentDayNumber, getDay, updateDay, useApp, type HealthMetrics } from "@/lib/store";

const fieldLabels: [keyof HealthMetrics, string][] = [
  ["steps", "Steps"],
  ["heartRate", "Heart rate"],
  ["calories", "Calories"],
  ["distance", "Distance (mi)"],
  ["durationMin", "Duration (min)"],
  ["activeMinutes", "Active minutes"],
  ["paceMinPerMile", "Pace (min/mi)"],
];

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Everything the phone can genuinely measure today — a Bluetooth heart-rate
 * reading, a GPS/motion walk, an exported file from a health app — plus plain
 * manual entry. Nothing here costs anything to run.
 */
export function HealthPanel({ day: dayProp }: { day?: number }) {
  const state = useApp();
  const day = dayProp ?? currentDayNumber(state);
  const saved = getDay(state, day).health;
  const fileRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fieldLabels.map(([k]) => [k, saved?.[k] != null ? String(saved[k]) : ""])),
  );
  const [bpm, setBpm] = useState<number | null>(null);
  const [hrName, setHrName] = useState<string | null>(null);
  const [walk, setWalk] = useState<WalkSample | null>(null);
  const [tracking, setTracking] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => onHeartRate(setBpm), []);
  useEffect(() => onWalkSample(setWalk), []);

  const put = (patch: Record<string, string>) => setValues((p) => ({ ...p, ...patch }));

  const save = (source: HealthMetrics["source"], provider?: string) => {
    const num = (k: string) => (values[k] ? Number(values[k]) : undefined) || undefined;
    updateDay(day, (d) => ({
      ...d,
      health: {
        source,
        provider,
        steps: num("steps"),
        heartRate: num("heartRate"),
        calories: num("calories"),
        distance: num("distance"),
        durationMin: num("durationMin"),
        activeMinutes: num("activeMinutes"),
        paceMinPerMile: num("paceMinPerMile") ?? walk?.paceMinPerMile ?? d.health?.paceMinPerMile,
        recordedAt: new Date().toISOString(),
      },
    }));
    setNote("Saved to today’s session.");
  };

  const connect = async () => {
    const result = await connectHeartRate();
    setNote(result.ok ? `Connected to ${result.name}.` : (result.error ?? "Could not connect."));
    if (result.ok) setHrName(result.name ?? "Monitor");
  };

  const toggleWalk = async () => {
    if (tracking) {
      const sample = stopWalkTracking();
      setTracking(false);
      if (sample) {
        put({
          steps: sample.steps ? String(sample.steps) : (values.steps ?? ""),
          distance: sample.meters ? (sample.meters / 1609.34).toFixed(2) : (values.distance ?? ""),
          durationMin: String(Math.max(1, Math.round(sample.seconds / 60))),
          activeMinutes: String(Math.max(1, Math.round(sample.seconds / 60))),
          heartRate: averageHeartRate() ? String(averageHeartRate()) : (values.heartRate ?? ""),
          paceMinPerMile: sample.paceMinPerMile
            ? sample.paceMinPerMile.toFixed(1)
            : (values.paceMinPerMile ?? ""),
        });

        setNote("Walk finished — check the numbers, then save.");
      }
      return;
    }
    const result = await startWalkTracking();
    setTracking(result.ok);
    setNote(result.ok ? "Tracking your walk." : (result.error ?? "Could not start tracking."));
  };

  return (
    <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        <HeartPulse className="size-5 text-primary" />
        <h2 className="text-lg font-bold uppercase">Activity data</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        This app runs in your browser, so it cannot read your watch or ring app directly. What it
        can do: read a Bluetooth heart-rate sensor, track a walk with your phone, load an export
        file from your health app, or take your numbers by hand.
      </p>
      <p className="rounded-xl bg-elevated p-3 text-xs text-muted-foreground">
        {HEALTH_CONNECT_NOTE}
      </p>
      <p className="text-xs text-muted-foreground">
        Import accepts a .csv or .json export from Samsung Health, Google Fit / Health Connect,
        Fitbit or Garmin. Columns named for steps, heart rate, calories, distance, duration, active
        minutes or pace are read; anything else is ignored.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={connect}
          disabled={!heartRateSupported()}
          className="tap-target flex items-center justify-center gap-2 rounded-xl bg-elevated px-3 text-sm font-bold disabled:opacity-40"
        >
          <Bluetooth className="size-4" /> {hrName ? "Heart rate live" : "Connect heart rate"}
        </button>
        <button
          type="button"
          onClick={toggleWalk}
          disabled={!walkTrackingSupported()}
          className={`tap-target flex items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold disabled:opacity-40 ${tracking ? "bg-primary text-primary-foreground" : "bg-elevated"}`}
        >
          <Footprints className="size-4" /> {tracking ? "Stop walk tracking" : "Track a walk"}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="tap-target flex items-center justify-center gap-2 rounded-xl bg-elevated px-3 text-sm font-bold"
        >
          <Upload className="size-4" /> Import health file
        </button>
      </div>
      {!heartRateSupported() && (
        <p className="text-xs text-muted-foreground">
          This phone or browser does not offer Bluetooth sensor access — use manual entry or an
          export file.
        </p>
      )}

      {(bpm || tracking) && (
        <div className="flex flex-wrap gap-3 rounded-xl bg-elevated p-3 text-sm font-bold">
          {bpm && (
            <span className="flex items-center gap-1">
              <HeartPulse className="size-4 text-accent" />
              {bpm} bpm
            </span>
          )}
          {walk && tracking && (
            <>
              <span className="flex items-center gap-1">
                <Activity className="size-4 text-accent" />
                {clock(walk.seconds)}
              </span>
              <span>{(walk.meters / 1609.34).toFixed(2)} mi</span>
              <span>{walk.steps} steps</span>
              {walk.paceMinPerMile && <span>{walk.paceMinPerMile.toFixed(1)} min/mi</span>}
            </>
          )}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.json,text/csv,application/json"
        className="sr-only"
        aria-label="Import health export file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const parsed = parseHealthExport(file.name, await file.text());
          e.target.value = "";
          if (!parsed) {
            setNote("That file did not contain activity numbers we could read.");
            return;
          }
          put(
            Object.fromEntries(
              fieldLabels.filter(([k]) => parsed[k] != null).map(([k]) => [k, String(parsed[k])]),
            ),
          );
          setNote("Imported — check the numbers, then save.");
        }}
      />

      <div className="grid grid-cols-2 gap-2">
        {fieldLabels.map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-[11px] uppercase text-muted-foreground">{label}</span>
            <input
              inputMode="decimal"
              value={values[key] ?? ""}
              onChange={(e) => put({ [key]: e.target.value })}
              className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => save(bpm || walk ? "sensor" : "manual", hrName ?? undefined)}
        className="tap-target w-full rounded-xl bg-primary text-sm font-black uppercase text-primary-foreground"
      >
        Save today’s activity
      </button>
      {note && <p className="text-sm text-accent">{note}</p>}
      <button
        type="button"
        onClick={() => {
          disconnectHeartRate();
          setHrName(null);
          setBpm(null);
        }}
        className="text-xs font-bold uppercase text-muted-foreground underline"
      >
        Disconnect sensor
      </button>
    </section>
  );
}