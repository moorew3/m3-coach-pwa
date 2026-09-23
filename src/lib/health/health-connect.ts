import type { HealthMetrics } from "@/lib/store";

/**
 * ANDROID HEALTH CONNECT ADAPTER (native-ready, no paid service)
 * ------------------------------------------------------------------
 * A browser PWA cannot read Samsung Health / Android Health Connect. This
 * file is the seam a later thin Android wrapper (Capacitor plugin or a
 * WebView bridge) can fill without touching the rest of the app: the wrapper
 * injects `window.HealthConnect`, and everything else here keeps working.
 *
 * Until that wrapper exists, `healthConnectStatus()` returns "unavailable"
 * and the app uses its web paths (Bluetooth heart rate, phone walk tracking,
 * export-file import, manual entry).
 */

export interface HealthConnectBridge {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readDay(isoDate: string): Promise<{
    steps?: number;
    heartRate?: number;
    calories?: number;
    /** miles */
    distance?: number;
    durationMin?: number;
    activeMinutes?: number;
  } | null>;
}

function bridge(): HealthConnectBridge | undefined {
  return (globalThis as { HealthConnect?: HealthConnectBridge }).HealthConnect;
}

export type HealthConnectStatus = "unavailable" | "available" | "granted";

let granted = false;

/** Honest capability check — never claims support the device cannot provide. */
export async function healthConnectStatus(): Promise<HealthConnectStatus> {
  const api = bridge();
  if (!api) return "unavailable";
  const ok = await api.isAvailable().catch(() => false);
  if (!ok) return "unavailable";
  return granted ? "granted" : "available";
}

export const HEALTH_CONNECT_NOTE =
  "Health Connect (Samsung Health, Google Fit, watch and ring data) requires the installed Android app version. In the browser, use a Bluetooth heart-rate sensor, phone walk tracking, a health export file, or manual entry.";

export async function connectHealthConnect(): Promise<{ ok: boolean; error?: string }> {
  const api = bridge();
  if (!api) return { ok: false, error: HEALTH_CONNECT_NOTE };
  try {
    granted = await api.requestPermissions();
    return granted ? { ok: true } : { ok: false, error: "Permission was not granted." };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not connect." };
  }
}

/** Reads one day of metrics through the native wrapper, when present. */
export async function readHealthConnectDay(date = new Date()): Promise<HealthMetrics | null> {
  const api = bridge();
  if (!api || !granted) return null;
  const raw = await api.readDay(date.toISOString().slice(0, 10)).catch(() => null);
  if (!raw) return null;
  return {
    ...raw,
    source: "wearable",
    provider: "Health Connect",
    recordedAt: new Date().toISOString(),
  };
}