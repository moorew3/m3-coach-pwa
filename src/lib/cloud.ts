/**
 * CLOUD SYNC — client layer
 * ------------------------------------------------------------------
 * Supabase is the source of truth for workout history, progress,
 * measurements, nutrition, settings and the live coached session.
 * localStorage stays on as an offline cache so the app keeps working
 * with no network and nothing is ever lost mid-set.
 *
 * No accounts: each install holds a long random "sync key". A second
 * device joins the same space by redeeming a short pairing code.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  cloudPull,
  cloudPush,
  createPairCode,
  redeemPairCode,
  sessionPull,
  sessionPush,
} from "@/lib/cloud.functions";
import type { AppState, DayLog } from "@/lib/store";

const KEY_STORE = "agt.sync.key.v1";
const REV_STORE = "agt.sync.rev.v1";

export type CloudStatus = "off" | "connecting" | "online" | "offline" | "error";

interface CloudState {
  enabled: boolean;
  status: CloudStatus;
  lastSyncAt: number | null;
  channelId: string | null;
  error: string | null;
  pairCode: string | null;
  pairExpiresAt: number | null;
}

let cloud: CloudState = {
  enabled: false,
  status: "off",
  lastSyncAt: null,
  channelId: null,
  error: null,
  pairCode: null,
  pairExpiresAt: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const patch = (p: Partial<CloudState>) => {
  cloud = { ...cloud, ...p };
  emit();
};

const serverSnapshot: CloudState = cloud;

export function useCloud(): CloudState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => cloud,
    () => serverSnapshot,
  );
}

/* ------------------------------- identity ------------------------------- */

function readKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(KEY_STORE);
  } catch {
    return null;
  }
}

function writeKey(key: string | null) {
  try {
    if (key) window.localStorage.setItem(KEY_STORE, key);
    else window.localStorage.removeItem(KEY_STORE);
  } catch {
    /* private mode — sync stays memory-only for this tab */
  }
  memKey = key;
}

let memKey: string | null = null;
const syncKey = () => memKey ?? readKey();

function newKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function readRev(): number {
  try {
    return Number(window.localStorage.getItem(REV_STORE) ?? 0) || 0;
  } catch {
    return 0;
  }
}
function writeRev(rev: number) {
  try {
    window.localStorage.setItem(REV_STORE, String(rev));
  } catch {
    /* ignore */
  }
}

/* -------------------------------- merge --------------------------------- */

function dayWeight(d: DayLog): number {
  const sets = Object.values(d.exercises ?? {}).reduce(
    (n, e) => n + (e.sets?.filter((s) => s.done).length ?? 0),
    0,
  );
  return (d.completed ? 10000 : 0) + sets * 10 + Math.round((d.elapsedMs ?? 0) / 60000);
}

/**
 * Union merge — never drops work. Per day we keep whichever side recorded
 * more (completed beats in-progress, more finished sets beats fewer), so a
 * first sync can't wipe history that only exists on one device.
 */
export function mergeStates(local: AppState, remote: AppState): AppState {
  const days: Record<number, DayLog> = { ...remote.days };
  for (const [k, l] of Object.entries(local.days ?? {})) {
    const n = Number(k);
    const r = days[n];
    days[n] = !r || dayWeight(l) >= dayWeight(r) ? l : r;
  }

  const byId = new Map(remote.measurements?.map((m) => [m.id, m]) ?? []);
  for (const m of local.measurements ?? []) byId.set(m.id, m);

  const nutrition = { ...remote.nutrition };
  for (const [date, day] of Object.entries(local.nutrition ?? {})) {
    const r = nutrition[date];
    const richer = !r || (day.entries?.length ?? 0) >= (r.entries?.length ?? 0);
    nutrition[date] = richer ? day : r;
  }

  const favs = new Map(remote.favorites?.map((f) => [f.id, f]) ?? []);
  for (const f of local.favorites ?? []) favs.set(f.id, f);

  const workouts = new Map(remote.savedWorkouts?.map((w) => [w.id, w]) ?? []);
  for (const w of local.savedWorkouts ?? []) {
    const prior = workouts.get(w.id);
    if (!prior || w.updatedAt >= prior.updatedAt) workouts.set(w.id, w);
  }

  return {
    ...remote,
    ...local,
    days,
    measurements: [...byId.values()].sort((a, b) => a.date.localeCompare(b.date)),
    nutrition,
    favorites: [...favs.values()],
    settings: { ...remote.settings, ...local.settings },
    targets: { ...remote.targets, ...local.targets },
    savedPairs: { ...remote.savedPairs, ...local.savedPairs },
    warmupPrefs: { ...remote.warmupPrefs, ...local.warmupPrefs },
    adaptiveOff: [...new Set([...(remote.adaptiveOff ?? []), ...(local.adaptiveOff ?? [])])],
    savedWorkouts: [...workouts.values()],
    userAvatar: local.userAvatar ?? remote.userAvatar ?? { kind: "default" },
  };
}

/* ------------------------------- transport ------------------------------ */

type StateApplier = (next: AppState) => void;
type SessionApplier = (next: unknown) => void;

let applyState: StateApplier | null = null;
let applySession: SessionApplier | null = null;
let readState: (() => AppState) | null = null;
let readSession: (() => unknown) | null = null;

/** Wired once by the store / coach-session modules. */
export function registerStateBridge(read: () => AppState, apply: StateApplier) {
  readState = read;
  applyState = apply;
}
export function registerSessionBridge(read: () => unknown, apply: SessionApplier) {
  readSession = read;
  applySession = apply;
}

let channel: RealtimeChannel | null = null;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let sessionTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let dirty = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const tabId = Math.random().toString(36).slice(2);

/** Tiny fire-and-forget bus for ephemeral cross-device messages. */
const liveHandlers = new Map<string, Set<(data: unknown) => void>>();

export function onLive(kind: string, fn: (data: unknown) => void) {
  const set = liveHandlers.get(kind) ?? new Set();
  set.add(fn);
  liveHandlers.set(kind, set);
  return () => set.delete(fn);
}

export function sendLive(kind: string, data: unknown) {
  if (!channel) return;
  void channel.send({ type: "broadcast", event: "live", payload: { from: tabId, kind, data } });
}

/** True when another physical device is sharing this session space. */
export const cloudTabId = () => tabId;

function openChannel(channelId: string) {
  if (channel) supabase.removeChannel(channel);
  const ch = supabase.channel(`agt-sync-${channelId}`, {
    config: { broadcast: { self: false } },
  });
  ch.on("broadcast", { event: "session" }, ({ payload }) => {
    const p = payload as { from: string; state: unknown };
    if (p?.from === tabId) return;
    applySession?.(p.state);
  });
  ch.on("broadcast", { event: "live" }, ({ payload }) => {
    const p = payload as { from: string; kind: string; data: unknown };
    if (!p || p.from === tabId) return;
    liveHandlers.get(p.kind)?.forEach((fn) => fn(p.data));
  });
  ch.on("broadcast", { event: "state" }, ({ payload }) => {
    const p = payload as { from: string };
    if (p?.from === tabId) return;
    void pullNow();
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") patch({ status: "online", error: null });
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") patch({ status: "offline" });
  });
  channel = ch;
}

async function pullNow() {
  const key = syncKey();
  if (!key || !readState || !applyState) return;
  try {
    const res = await cloudPull({ data: { key } });
    patch({ channelId: res.channelId, status: "online", error: null, lastSyncAt: Date.now() });
    if (!channel) openChannel(res.channelId);
    if (res.state) {
      const remote = JSON.parse(res.state) as AppState;
      applyState(mergeStates(readState(), remote));
      writeRev(res.rev);
    }
  } catch (e) {
    patch({ status: "offline", error: (e as Error).message });
  }
}

async function flushPush() {
  const key = syncKey();
  if (!key || !readState) return;
  if (inFlight) {
    dirty = true;
    return;
  }
  inFlight = true;
  dirty = false;
  try {
    const res = await cloudPush({
      data: { key, state: readState(), baseRev: readRev() },
    });
    writeRev(res.rev);
    patch({ status: "online", lastSyncAt: Date.now(), error: null, channelId: res.channelId });
    if (!channel) openChannel(res.channelId);
    void channel?.send({ type: "broadcast", event: "state", payload: { from: tabId } });
  } catch (e) {
    patch({ status: "offline", error: (e as Error).message });
    // Keep the change queued; the next edit or reconnect retries it.
    dirty = true;
  } finally {
    inFlight = false;
    if (dirty) {
      if (pushTimer) clearTimeout(pushTimer);
      pushTimer = setTimeout(flushPush, 4000);
    }
  }
}

/** Debounced full-state push. Safe to call on every keystroke. */
export function queueCloudPush() {
  if (!cloud.enabled || !syncKey()) return;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(flushPush, 1200);
}

/** Live coached-session state — pushed fast so other screens stay in step. */
export function queueSessionPush() {
  if (!cloud.enabled || !syncKey() || !readSession) return;
  const state = readSession();
  void channel?.send({ type: "broadcast", event: "session", payload: { from: tabId, state } });
  if (sessionTimer) clearTimeout(sessionTimer);
  sessionTimer = setTimeout(async () => {
    const key = syncKey();
    if (!key) return;
    try {
      const s = readSession?.() as { rev?: number } | undefined;
      await sessionPush({ data: { key, state: s ?? {}, rev: Number(s?.rev ?? 0) } });
    } catch {
      /* offline — the local session keeps running */
    }
  }, 900);
}

/** Restore the live session after a refresh or when joining from a new device. */
export async function restoreSession() {
  const key = syncKey();
  if (!key || !applySession) return;
  try {
    const res = await sessionPull({ data: { key } });
    if (!channel) openChannel(res.channelId);
    if (res.state) applySession(JSON.parse(res.state));
  } catch {
    /* offline — local session state stands */
  }
}

/* --------------------------------- api ---------------------------------- */

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (!cloud.enabled) return;
    if (typeof document !== "undefined" && document.hidden) return;
    void pullNow();
  }, 20000);
}

/** Turn sync on for this device (creates the space on first use). */
export async function enableCloud() {
  if (typeof window === "undefined") return;
  let key = syncKey();
  if (!key) {
    key = newKey();
    writeKey(key);
  }
  memKey = key;
  patch({ enabled: true, status: "connecting", error: null });
  await pullNow();
  await flushPush();
  await restoreSession();
  startPolling();
}

/** Boot: reconnect automatically if this device was already paired. */
export function bootCloud() {
  if (typeof window === "undefined") return;
  if (!readKey()) return;
  void enableCloud();
}

export function disableCloud() {
  patch({ enabled: false, status: "off", pairCode: null, pairExpiresAt: null });
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/** Stop syncing AND forget this device's key (local data is untouched). */
export function unlinkCloud() {
  disableCloud();
  writeKey(null);
  writeRev(0);
}

export async function newPairCode(): Promise<string> {
  if (!cloud.enabled) await enableCloud();
  const key = syncKey();
  if (!key) throw new Error("Sync is not ready yet.");
  const res = await createPairCode({ data: { key } });
  patch({ pairCode: res.code, pairExpiresAt: Date.parse(res.expiresAt) });
  return res.code;
}

/** Join an existing space from a second device. */
export async function joinWithCode(code: string) {
  patch({ status: "connecting", error: null });
  try {
    const res = await redeemPairCode({ data: { code } });
    writeKey(res.key);
    writeRev(0);
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
    await enableCloud();
  } catch (e) {
    patch({ status: "error", error: (e as Error).message });
    throw e;
  }
}

export const isCloudLinked = () => !!readKey();