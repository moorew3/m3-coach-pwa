/**
 * Live heart rate from a Bluetooth chest strap / watch that exposes the
 * standard Heart Rate Service (0x180D). Real, free, on-device path on Android
 * Chrome — no vendor account and no paid data aggregator.
 */

type Listener = (bpm: number) => void;

export interface HeartRateReading {
  bpm: number;
  recordedAt: number;
  provider: string;
}

interface HrCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<unknown>;
}
interface HrDevice {
  name?: string;
  gatt?: {
    connect(): Promise<{
      getPrimaryService(service: number): Promise<{
        getCharacteristic(c: number): Promise<HrCharacteristic>;
      }>;
    }>;
    disconnect(): void;
  };
}
interface BluetoothLike {
  requestDevice(options: { filters: { services: number[] }[] }): Promise<HrDevice>;
}

const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT = 0x2a37;

function bt(): BluetoothLike | undefined {
  return (navigator as Navigator & { bluetooth?: BluetoothLike }).bluetooth;
}

let device: HrDevice | null = null;
let characteristic: HrCharacteristic | null = null;
const listeners = new Set<Listener>();
let last: number | null = null;
let lastAt = 0;
let providerName = "Bluetooth heart-rate monitor";
const samples: number[] = [];

/** True when this browser can talk to a Bluetooth heart-rate sensor at all. */
export function heartRateSupported(): boolean {
  return typeof navigator !== "undefined" && !!bt();
}

export function lastHeartRate(): number | null {
  return lastHeartRateReading()?.bpm ?? null;
}

/** A disconnected or older-than-15-second measurement is NOT live. */
export function lastHeartRateReading(maxAgeMs = 15_000): HeartRateReading | null {
  const age = Date.now() - lastAt;
  if (!device || last === null || lastAt <= 0 || age < 0 || age > maxAgeMs) return null;
  return { bpm: last, recordedAt: lastAt, provider: providerName };
}

export function averageHeartRate(): number | null {
  if (!samples.length) return null;
  return Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
}

export function onHeartRate(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function handle(event: Event) {
  const value = (event.target as HrCharacteristic).value;
  if (!value || value.byteLength < 2) return;
  const flags = value.getUint8(0);
  if ((flags & 0x01) !== 0 && value.byteLength < 3) return;
  const bpm = flags & 0x01 ? value.getUint16(1, true) : value.getUint8(1);
  if (!bpm) return;
  last = bpm;
  lastAt = Date.now();
  samples.push(bpm);
  if (samples.length > 3600) samples.shift();
  listeners.forEach((fn) => fn(bpm));
}

/** Ask the user to pick their strap/watch, then stream live BPM. */
export async function connectHeartRate(): Promise<{ ok: boolean; name?: string; error?: string }> {
  const bluetooth = bt();
  if (!bluetooth) return { ok: false, error: "This browser cannot connect to Bluetooth sensors." };
  try {
    disconnectHeartRate();
    device = await bluetooth.requestDevice({ filters: [{ services: [HEART_RATE_SERVICE] }] });
    providerName = device.name || "Bluetooth heart-rate monitor";
    const server = await device.gatt?.connect();
    const service = await server?.getPrimaryService(HEART_RATE_SERVICE);
    characteristic = (await service?.getCharacteristic(HEART_RATE_MEASUREMENT)) ?? null;
    await characteristic?.startNotifications();
    characteristic?.addEventListener("characteristicvaluechanged", handle);
    return { ok: true, name: device.name ?? "Heart rate monitor" };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not connect." };
  }
}

export function disconnectHeartRate() {
  characteristic?.removeEventListener("characteristicvaluechanged", handle);
  characteristic = null;
  device?.gatt?.disconnect();
  device = null;
  last = null;
  lastAt = 0;
  samples.length = 0;
}

export function resetHeartRateSamples() {
  samples.length = 0;
  last = null;
  lastAt = 0;
}