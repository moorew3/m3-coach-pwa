/**
 * One-device real Bluetooth scale bridge for the existing nutrition day log.
 * Display/confirm only; never silently overwrite a manually entered weight.
 */
import { useEffect, useState } from "react";
import { Bluetooth, BluetoothOff, Scale } from "lucide-react";
import {
  connectWeightScale, convertWeight, disconnectWeightScale,
  latestScaleReading, onScaleReading, scaleSupported,
  type ScaleReading, type WeightUnit,
} from "@/lib/health/smart-scale";

export function SmartScalePanel({
  units, onSave,
}: {
  units: WeightUnit;
  onSave: (value: number, reading: ScaleReading) => void;
}) {
  const [reading, setReading] = useState<ScaleReading | null>(() => latestScaleReading());
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => onScaleReading((next) => {
    setReading(next);
    setNotice("Measurement received. Check the number before saving.");
  }), []);

  const connect = async () => {
    setBusy(true);
    try {
      const result = await connectWeightScale();
      setConnected(result.ok);
      setReading(null);
      setNotice(result.ok
        ? `Connected to ${result.name}. Step on the scale, then review its measurement.`
        : result.error || "Could not connect a standard Bluetooth weight scale.");
    } finally {
      setBusy(false);
    }
  };
  const disconnect = () => {
    disconnectWeightScale();
    setConnected(false);
    setReading(null);
    setNotice("Scale disconnected.");
  };
  const recent = reading && Date.now() - reading.receivedAt <= 300_000
    ? reading : null;
  const converted = recent ? convertWeight(recent.value, recent.unit, units) : null;

  return (
    <section className="mt-3 rounded-xl border border-border bg-elevated p-3"
      data-testid="m3-standard-bluetooth-scale">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Scale className="size-5 text-primary" /> Smart scale (optional)
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Works with scales exposing the standard Bluetooth Weight Scale Service.
        Proprietary app-only scales may not connect. No weight is saved automatically.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void connect()}
          disabled={!scaleSupported() || busy}
          className="tap-target inline-flex items-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-50">
          <Bluetooth className="size-4" />
          {busy ? "Connecting…" : connected ? "Reconnect scale" : "Connect scale"}
        </button>
        {connected && (
          <button type="button" onClick={disconnect}
            className="tap-target inline-flex items-center gap-2 rounded-lg border border-border px-3 text-xs font-bold">
            <BluetoothOff className="size-4" /> Disconnect
          </button>
        )}
      </div>
      {!scaleSupported() && (
        <p className="mt-2 text-xs text-amber-500">This browser has no Web Bluetooth scale access. Keep using manual weight entry.</p>
      )}
      {converted !== null && recent && (
        <div className="mt-3 rounded-lg border border-primary/30 p-3">
          <p className="text-xs font-semibold text-muted-foreground">Actual sensor measurement — confirm before logging</p>
          <p className="mt-1 text-2xl font-black tabular-nums">
            {converted.toFixed(1)} {units}
          </p>
          <p className="text-xs text-muted-foreground">
            {recent.provider} · received at {new Date(recent.receivedAt).toLocaleTimeString()}
          </p>
          <button type="button" onClick={() => {
            const current = latestScaleReading();
            if (!current || current.receivedAt !== recent.receivedAt) {
              setNotice("That reading expired. Take another measurement.");
              setReading(null);
              return;
            }
            onSave(Math.round(convertWeight(current.value, current.unit, units) * 10) / 10, current);
            setNotice("Confirmed measurement saved in today's existing nutrition log.");
          }} className="tap-target mt-3 rounded-lg bg-primary px-4 text-xs font-black text-primary-foreground">
            Save measured weight
          </button>
        </div>
      )}
      {notice && <p className="mt-2 text-xs text-muted-foreground" role="status">{notice}</p>}
    </section>
  );
}
