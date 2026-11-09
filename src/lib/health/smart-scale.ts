/**
 * Web Bluetooth standard Weight Scale Service adapter (0x181D / 0x2A9D).
 * Explicit user choice; display each real indication for confirmation before saving.
 * Not a generic proprietary scale connector; no guessed values, no cloud transfer.
 * Standard weight field units: 0.005 kg (SI) / 0.01 lb (Imperial).
 */
export type WeightUnit = "lb" | "kg";
export interface ScaleReading {
  value: number;
  unit: WeightUnit;
  receivedAt: number;
  provider: string;
}
type ScaleListener = (reading: ScaleReading) => void;
interface ScaleCharacteristic extends EventTarget {
  value?: DataView;
  startNotifications(): Promise<unknown>;
}
interface ScaleDevice {
  name?: string;
  gatt?: {
    connect(): Promise<{
      getPrimaryService(service: number): Promise<{
        getCharacteristic(characteristic: number): Promise<ScaleCharacteristic>;
      }>;
    }>;
    disconnect(): void;
  };
}
interface BluetoothWithWeight {
  requestDevice(options: { filters: { services: number[] }[] }): Promise<ScaleDevice>;
}
const WEIGHT_SERVICE = 0x181d;
const WEIGHT_MEASUREMENT = 0x2a9d;

function bluetooth(): BluetoothWithWeight | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as Navigator & { bluetooth?: BluetoothWithWeight }).bluetooth;
}
let device: ScaleDevice | null = null;
let characteristic: ScaleCharacteristic | null = null;
let latest: ScaleReading | null = null;
const listeners = new Set<ScaleListener>();

export function scaleSupported(): boolean {
  return !!bluetooth();
}

/** Parses the adopted Weight Measurement characteristic, not vendor-specific packets. */
export function parseWeightMeasurement(value: DataView | null, receivedAt = Date.now(), provider = "Bluetooth scale"): ScaleReading | null {
  if (!value || value.byteLength < 3) return null;
  const flags = value.getUint8(0);
  const raw = value.getUint16(1, true);
  if (raw === 0xffff || raw === 0) return null;
  const unit: WeightUnit = (flags & 0x01) !== 0 ? "lb" : "kg";
  const number = raw * (unit === "lb" ? 0.01 : 0.005);
  if (!Number.isFinite(number) || number < (unit === "lb" ? 22 : 10) ||
    number > (unit === "lb" ? 1100 : 500)) return null;
  return { value: Math.round(number * 100) / 100, unit, receivedAt, provider };
}

export function convertWeight(value: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return value;
  return from === "kg" ? value * 2.2046226218 : value / 2.2046226218;
}
export function latestScaleReading(maxAgeMs = 5 * 60_000): ScaleReading | null {
  if (!device || !latest) return null;
  const age = Date.now() - latest.receivedAt;
  return age >= 0 && age <= maxAgeMs ? latest : null;
}
export function onScaleReading(fn: ScaleListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function handleMeasurement(event: Event) {
  const incoming = (event.target as ScaleCharacteristic).value;
  const reading = parseWeightMeasurement(incoming ?? null, Date.now(), device?.name || "Bluetooth scale");
  if (!reading) return;
  latest = reading;
  listeners.forEach((listener) => listener(reading));
}
export async function connectWeightScale(): Promise<{ ok: boolean; name?: string; error?: string }> {
  const adapter = bluetooth();
  if (!adapter) return { ok: false, error: "Web Bluetooth is unavailable in this browser. Use manual weight entry." };
  disconnectWeightScale();
  try {
    device = await adapter.requestDevice({ filters: [{ services: [WEIGHT_SERVICE] }] });
    const server = await device.gatt?.connect();
    if (!server) throw new Error("The scale does not expose a usable Bluetooth connection.");
    const service = await server.getPrimaryService(WEIGHT_SERVICE);
    characteristic = await service.getCharacteristic(WEIGHT_MEASUREMENT);
    await characteristic.startNotifications(); // Indications from a standards-compliant scale.
    characteristic.addEventListener("characteristicvaluechanged", handleMeasurement);
    return { ok: true, name: device.name || "Bluetooth scale" };
  } catch (error) {
    disconnectWeightScale();
    return { ok: false, error: error instanceof Error ? error.message : "Unable to connect to this scale." };
  }
}
export function disconnectWeightScale() {
  characteristic?.removeEventListener("characteristicvaluechanged", handleMeasurement);
  characteristic = null;
  device?.gatt?.disconnect();
  device = null;
  latest = null;
}
