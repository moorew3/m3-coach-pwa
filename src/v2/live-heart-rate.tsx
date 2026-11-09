/**
 * Opt-in live HR badge inside the ORIGINAL V2 workout stage.
 * Uses the existing Bluetooth adapter; never estimates BPM from the camera.
 * A missing/stale value is deliberately displayed as unavailable.
 */
import { useEffect, useState } from "react";
import { Bluetooth, BluetoothOff, HeartPulse } from "lucide-react";
import {
  connectHeartRate, disconnectHeartRate, heartRateSupported,
  lastHeartRateReading, onHeartRate,
  type HeartRateReading,
} from "@/lib/health/hr-monitor";

export function V2LiveHeartRate() {
  const [reading, setReading] = useState<HeartRateReading | null>(() => lastHeartRateReading());
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Existing shared heart-rate stream: never request Bluetooth automatically.
    const off = onHeartRate(() => {
      setReading(lastHeartRateReading());
      setConnected(true);
      setMessage("");
    });
    const timer = window.setInterval(() => setReading(lastHeartRateReading()), 1000);
    return () => { off(); window.clearInterval(timer); };
  }, []);

  const connect = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await connectHeartRate();
      setConnected(result.ok);
      setMessage(result.ok
        ? "Waiting for the first measured beat…"
        : (result.error ?? "No compatible heart-rate sensor connected."));
      if (!result.ok) setReading(null);
    } finally {
      setBusy(false);
    }
  };

  const disconnect = () => {
    disconnectHeartRate();
    setConnected(false);
    setReading(null);
    setMessage("Disconnected. No live heart-rate reading.");
  };

  const supported = heartRateSupported();
  return (
    <aside
      className="absolute left-3 top-[113px] z-[6] max-w-[min(230px,68%)] rounded-xl border border-white/15 bg-black/85 p-2 text-white shadow-lg backdrop-blur-sm"
      aria-label="Live Bluetooth heart rate"
      data-testid="v2-live-heart-rate"
    >
      <div className="flex items-center gap-2">
        <HeartPulse className="size-4 shrink-0 text-cyan-300" aria-hidden="true" />
        <div className="min-w-0">
          <div className="text-xs font-black" aria-live="polite">
            {reading ? `${reading.bpm} bpm` : "BPM unavailable"}
          </div>
          <div className="text-[10px] leading-tight text-white/65">
            {reading ? "Measured · Bluetooth" : connected ? "Waiting for fresh signal" : "Sensor not connected"}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!supported || busy}
          onClick={() => void connect()}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-cyan-300 px-2 text-[10px] font-black text-black disabled:opacity-50"
        >
          <Bluetooth className="size-3.5" aria-hidden="true" />
          {busy ? "Connecting…" : connected ? "Reconnect HR" : "Connect HR"}
        </button>
        {connected && (
          <button type="button" onClick={disconnect}
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/25 px-2 text-[10px] font-bold"
          >
            <BluetoothOff className="size-3.5" aria-hidden="true" /> Disconnect
          </button>
        )}
      </div>
      {!supported && <p className="mt-1 text-[10px] text-amber-300">Bluetooth unavailable in this browser.</p>}
      {message && <p className="mt-1 text-[10px] text-white/65" role="status">{message}</p>}
      <p className="mt-1 text-[9px] text-white/45">Real sensor only · stale after 15 s</p>
    </aside>
  );
}
