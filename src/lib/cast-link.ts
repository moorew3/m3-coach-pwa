/**
 * Optional app-only casting to Google Cast devices (Chromecast / Google TV /
 * Cast-enabled TVs).
 *
 * Sender-and-receiver architecture: we never mirror the phone screen. Only the
 * live workout snapshot is sent as small JSON messages on a custom namespace,
 * so the phone can be used normally while the workout stays on the TV.
 *
 * Falls back to the existing QR / pairing-code Display Mode when Cast is not
 * available (no Cast device, unsupported browser, or no receiver configured).
 */
import { useSyncExternalStore } from "react";
import type { DisplayCommand, DisplaySnapshot } from "./display-link";

export const CAST_NAMESPACE = "urn:x-cast:com.armtracker.workout";

/** Custom workout receiver app id (registered in the Cast console). */
const RECEIVER_ID = (import.meta.env["VITE_CAST_APP_ID"] as string | undefined)?.trim() || "";

export type CastStatus =
  | "unsupported"
  | "no-devices"
  | "idle"
  | "searching"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

interface CastState {
  status: CastStatus;
  deviceName: string;
  lastDeviceName: string;
  devicesAvailable: boolean;
  configured: boolean;
  error: string | null;
}

const LAST_DEVICE_KEY = "wm-cast-last-device";

let state: CastState = {
  status: RECEIVER_ID ? "idle" : "unsupported",
  deviceName: "",
  lastDeviceName: "",
  devicesAvailable: false,
  configured: !!RECEIVER_ID,
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<CastState>) => {
  state = { ...state, ...patch };
  emit();
};

/* ------------------------------ sdk plumbing ------------------------------ */

type AnyCast = any; // the Cast sender SDK ships no types

const w = () => window as unknown as Record<string, AnyCast>;

let sdkPromise: Promise<boolean> | null = null;
let commandHandler: ((c: DisplayCommand) => void) | null = null;

function loadSdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<boolean>((resolve) => {
    if (!RECEIVER_ID) {
      set({ status: "unsupported", configured: false });
      resolve(false);
      return;
    }
    const done = (ok: boolean) => resolve(ok);

    w()["__onGCastApiAvailable"] = (available: boolean) => {
      if (!available) {
        set({ status: "unsupported" });
        done(false);
        return;
      }
      try {
        initContext();
        done(true);
      } catch {
        set({ status: "error", error: "Casting could not start on this browser." });
        done(false);
      }
    };

    const existing = document.querySelector<HTMLScriptElement>("script[data-cast-sdk]");
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1";
      s.async = true;
      s.dataset["castSdk"] = "1";
      s.onerror = () => {
        set({ status: "unsupported" });
        done(false);
      };
      document.head.appendChild(s);
    }

    // Chrome never calls the hook on non-Cast browsers.
    setTimeout(() => {
      if (!w()["cast"]?.framework) {
        set({ status: "unsupported" });
        done(false);
      }
    }, 6000);
  });

  return sdkPromise;
}

function context(): AnyCast | null {
  return w()["cast"]?.framework?.CastContext?.getInstance?.() ?? null;
}

function initContext() {
  const cast = w()["cast"];
  const chrome = w()["chrome"];
  const ctx = context();
  if (!ctx) return;

  ctx.setOptions({
    receiverApplicationId: RECEIVER_ID,
    // Never rejoin a session the user did not approve in this session.
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.PAGE_SCOPED,
    resumeSavedSession: false,
    androidReceiverCompatible: true,
  });

  ctx.addEventListener(cast.framework.CastContextEventType.CAST_STATE_CHANGED, (e: AnyCast) => {
    const s = String(e.castState);
    const available = s !== "NO_DEVICES_AVAILABLE";
    set({ devicesAvailable: available });
    if (!available && state.status !== "connected") set({ status: "no-devices" });
    else if (s === "NOT_CONNECTED" && state.status !== "connecting") {
      if (state.status !== "idle" && state.status !== "disconnected")
        set({ status: "disconnected" });
      else set({ status: "idle" });
    }
  });

  ctx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (e: AnyCast) => {
    const st = String(e.sessionState);
    if (st === "SESSION_STARTING" || st === "SESSION_RESUMING") {
      set({ status: st === "SESSION_RESUMING" ? "reconnecting" : "connecting" });
      return;
    }
    if (st === "SESSION_STARTED" || st === "SESSION_RESUMED") {
      const name: string = e.session?.getCastDevice?.()?.friendlyName ?? "Display";
      try {
        localStorage.setItem(LAST_DEVICE_KEY, name);
      } catch {
        /* private mode */
      }
      attachMessages(e.session);
      set({ status: "connected", deviceName: name, lastDeviceName: name, error: null });
      if (lastSent) sendSnapshot(lastSent, true);
      return;
    }
    if (st === "SESSION_ENDED") {
      set({ status: "disconnected", deviceName: "" });
    }
  });

  const castState = String(ctx.getCastState?.() ?? "");
  set({
    devicesAvailable: castState !== "NO_DEVICES_AVAILABLE",
    status: castState === "NO_DEVICES_AVAILABLE" ? "no-devices" : "idle",
    lastDeviceName: readLastDevice(),
  });
}

function readLastDevice() {
  try {
    return localStorage.getItem(LAST_DEVICE_KEY) ?? "";
  } catch {
    return "";
  }
}

function attachMessages(session: AnyCast) {
  try {
    session.addMessageListener(CAST_NAMESPACE, (_ns: string, message: string) => {
      try {
        const payload = JSON.parse(message) as DisplayCommand;
        commandHandler?.(payload);
      } catch {
        /* ignore malformed receiver chatter */
      }
    });
  } catch {
    /* namespace already attached */
  }
}

/* --------------------------------- api ---------------------------------- */

/** Warm the SDK up so we can report whether devices exist before the user taps. */
export async function initCast() {
  set({ lastDeviceName: readLastDevice() });
  await loadSdk();
}

/** Open the Cast device chooser — this is the OS-provided device list. */
export async function searchAndConnect() {
  set({ status: "searching", error: null });
  const ok = await loadSdk();
  if (!ok) {
    set({
      status: "unsupported",
      error: "This browser can't discover Cast devices — use the pairing code below.",
    });
    return;
  }
  const ctx = context();
  if (!ctx) {
    set({ status: "unsupported" });
    return;
  }
  try {
    set({ status: "connecting" });
    await ctx.requestSession();
  } catch (err) {
    const msg = String((err as { code?: string })?.code ?? err ?? "");
    if (msg.includes("cancel"))
      set({ status: state.deviceName ? "connected" : "idle", error: null });
    else if (msg.includes("receiver_unavailable"))
      set({ status: "no-devices", error: "No compatible displays found on this Wi-Fi network." });
    else set({ status: "error", error: "Could not connect to that display." });
  }
}

/** Re-run discovery without connecting. */
export async function refreshDevices() {
  const ok = await loadSdk();
  if (!ok) return;
  const ctx = context();
  if (!ctx) return;
  const castState = String(ctx.getCastState?.() ?? "");
  const available = castState !== "NO_DEVICES_AVAILABLE";
  set({
    devicesAvailable: available,
    status: state.status === "connected" ? "connected" : available ? "idle" : "no-devices",
    error: available ? null : "No compatible displays found on this Wi-Fi network.",
  });
}

export function stopCasting() {
  const ctx = context();
  try {
    ctx?.endCurrentSession?.(true);
  } catch {
    /* nothing to end */
  }
  set({ status: "idle", deviceName: "" });
}

/* ------------------------------ phone → tv ------------------------------- */

let lastSent: DisplaySnapshot | null = null;
let lastSerialized = "";

export function sendSnapshot(snapshot: DisplaySnapshot, force = false) {
  lastSent = snapshot;
  if (state.status !== "connected") return;
  const ctx = context();
  const session = ctx?.getCurrentSession?.();
  if (!session) return;
  const serialized = JSON.stringify(snapshot);
  if (!force && serialized === lastSerialized) return;
  lastSerialized = serialized;
  try {
    session.sendMessage(CAST_NAMESPACE, { type: "state", snapshot });
  } catch {
    /* transient send failure — the next tick retries */
  }
}

export function setCastCommandHandler(fn: ((c: DisplayCommand) => void) | null) {
  commandHandler = fn;
}

/* --------------------------------- react ---------------------------------- */

const serverSnapshot: CastState = state;

export function useCast(): CastState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverSnapshot,
  );
}