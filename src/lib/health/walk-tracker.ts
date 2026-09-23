/**
 * Walk / treadmill session tracking using only free device APIs:
 * GPS for distance and pace outdoors, motion sensing for a step estimate.
 * Everything stays on the device.
 */

export interface WalkSample {
  seconds: number;
  meters: number;
  steps: number;
  /** minutes per mile; null until there is enough distance. */
  paceMinPerMile: number | null;
  gps: boolean;
  motion: boolean;
}

type Listener = (sample: WalkSample) => void;

let watchId: number | null = null;
let tickId: ReturnType<typeof setInterval> | null = null;
let startedAt = 0;
let meters = 0;
let steps = 0;
let last: { lat: number; lon: number } | null = null;
let gpsOn = false;
let motionOn = false;
const listeners = new Set<Listener>();

/* simple peak counter over total acceleration — good enough for a step estimate */
let lastPeak = 0;
let above = false;

export function walkTrackingSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function onWalkSample(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function distance(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function onMotion(event: DeviceMotionEvent) {
  const a = event.accelerationIncludingGravity;
  if (!a || a.x === null || a.y === null || a.z === null) return;
  motionOn = true;
  const mag = Math.sqrt(a.x ** 2 + a.y ** 2 + a.z ** 2);
  const now = Date.now();
  if (mag > 12.5 && !above && now - lastPeak > 250) {
    steps += 1;
    lastPeak = now;
    above = true;
  } else if (mag < 10.5) {
    above = false;
  }
}

function emit() {
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  const miles = meters / 1609.34;
  listeners.forEach((fn) =>
    fn({
      seconds,
      meters,
      steps,
      paceMinPerMile: miles > 0.02 ? seconds / 60 / miles : null,
      gps: gpsOn,
      motion: motionOn,
    }),
  );
}

export async function startWalkTracking(): Promise<{ ok: boolean; error?: string }> {
  if (!walkTrackingSupported())
    return { ok: false, error: "This device does not share location data with the browser." };
  stopWalkTracking();
  startedAt = Date.now();
  meters = 0;
  steps = 0;
  last = null;
  gpsOn = false;
  motionOn = false;

  const motionApi = window.DeviceMotionEvent as
    | (typeof DeviceMotionEvent & {
        requestPermission?: () => Promise<PermissionState>;
      })
    | undefined;
  try {
    if (motionApi?.requestPermission) await motionApi.requestPermission();
    window.addEventListener("devicemotion", onMotion);
  } catch {
    /* step estimate simply stays off */
  }

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      gpsOn = true;
      const point = { lat: pos.coords.latitude, lon: pos.coords.longitude };
      if (last && (pos.coords.accuracy ?? 99) < 40) {
        const d = distance(last, point);
        if (d > 1.5) meters += d;
      }
      last = point;
    },
    () => {
      gpsOn = false;
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
  );

  tickId = setInterval(emit, 1000);
  emit();
  return { ok: true };
}

export function stopWalkTracking(): WalkSample | null {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  window.removeEventListener("devicemotion", onMotion);
  if (tickId) clearInterval(tickId);
  watchId = null;
  tickId = null;
  if (!startedAt) return null;
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  const miles = meters / 1609.34;
  const sample: WalkSample = {
    seconds,
    meters,
    steps,
    paceMinPerMile: miles > 0.02 ? seconds / 60 / miles : null,
    gps: gpsOn,
    motion: motionOn,
  };
  startedAt = 0;
  return sample;
}

export function walkTrackingActive(): boolean {
  return startedAt > 0;
}