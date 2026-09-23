/**
 * Optional large-screen Display Mode.
 *
 * The phone is always the session owner: it keeps the official clock, writes
 * localStorage and broadcasts a snapshot of the CURRENT SESSION ONLY.
 * The display is a dumb viewer that may send commands back.
 *
 * Transport = one ephemeral realtime broadcast channel per pairing code.
 * Nothing is stored in the cloud, no accounts, no history, no nutrition.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type LinkRole = "phone" | "display";
export type LinkStatus = "off" | "waiting" | "connected" | "lost";

export interface DisplaySet {
  reps: string;
  weight: string;
  time?: string;
  done: boolean;
}

/** Only live-session data — never history, measurements or nutrition. */
export interface DisplaySnapshot {
  day: number;
  weekday: string;
  planTitle: string;
  guideSrc?: string;
  guideAlt?: string;
  exerciseName: string;
  targetSets: number;
  targetReps: string;
  restLength: number;
  superset?: string | null;
  supersetSlot?: string | null;
  round?: { n: number; of: number } | null;
  sets: DisplaySet[];
  setIndex: number;
  lastResult?: string | null;
  clockMs: number;
  clockRunning: boolean;
  restOpen: boolean;
  restSeconds: number;
  restRunning: boolean;
  restDone: boolean;
  nextLabel: string;
  exerciseIndex: number;
  exerciseTotal: number;
  doneSets: number;
  totalSets: number;
  status: "not started" | "running" | "paused" | "resting" | "completed";
  units: string;
}

export interface DisplayCommand {
  type:
    | "toggleClock"
    | "pause"
    | "resume"
    | "stop"
    | "restart"
    | "saveExit"
    | "completeSet"
    | "prev"
    | "next"
    | "goTo"
    | "list"
    | "startRest"
    | "pauseRest"
    | "skipRest"
    | "resetRest"
    | "addRest"
    | "subRest"
    | "finish"
    | "edit";
  index?: number;
  field?: "reps" | "weight" | "time";
  value?: string;
}

/** Pairing codes are short-lived: unpaired codes die after this. */
export const CODE_TTL_MS = 5 * 60 * 1000;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

interface LinkState {
  role: LinkRole | null;
  status: LinkStatus;
  code: string;
  expiresAt: number;
  /** Latest snapshot — display side only. */
  snapshot: DisplaySnapshot | null;
  error: string | null;
}

let state: LinkState = {
  role: null,
  status: "off",
  code: "",
  expiresAt: 0,
  snapshot: null,
  error: null,
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<LinkState>) => {
  state = { ...state, ...patch };
  emit();
};

let channel: RealtimeChannel | null = null;
let commandHandler: ((c: DisplayCommand) => void) | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

const channelName = (code: string) => `wm-display-${code.toUpperCase()}`;

function teardown() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  if (expiryTimer) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}

function peersFor(role: LinkRole): boolean {
  if (!channel) return false;
  const presence = channel.presenceState() as Record<string, Array<{ role?: string }>>;
  return Object.values(presence)
    .flat()
    .some((p) => p?.role === role);
}

function open(role: LinkRole, code: string) {
  teardown();
  const other: LinkRole = role === "phone" ? "display" : "phone";
  set({
    role,
    code: code.toUpperCase(),
    status: "waiting",
    error: null,
    snapshot: null,
    expiresAt: Date.now() + CODE_TTL_MS,
  });

  const ch = supabase.channel(channelName(code), {
    config: { broadcast: { self: false }, presence: { key: role } },
  });

  ch.on("presence", { event: "sync" }, () => {
    const paired = peersFor(other);
    if (paired) {
      set({ status: "connected" });
      // A freshly-arrived peer needs the current picture immediately.
      if (role === "phone" && lastSnapshot) publish(lastSnapshot, true);
    } else if (state.status === "connected") {
      set({ status: "lost" });
    }
  });

  ch.on("broadcast", { event: "state" }, ({ payload }) => {
    if (state.role !== "display") return;
    set({ snapshot: payload as DisplaySnapshot, status: "connected" });
  });

  ch.on("broadcast", { event: "cmd" }, ({ payload }) => {
    commandHandler?.(payload as DisplayCommand);
  });

  ch.on("broadcast", { event: "bye" }, () => {
    set({ status: "lost" });
  });

  ch.subscribe((status) => {
    if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
      set({ error: "Connection problem — create a new code.", status: "lost" });
      return;
    }
    if (status === "SUBSCRIBED") void ch.track({ role });
  });

  channel = ch;

  // Unpaired codes expire so a code can never be reused later.
  expiryTimer = setTimeout(() => {
    if (state.status === "waiting") {
      teardown();
      set({ status: "off", code: "", error: "Pairing code expired — create a new one." });
    }
  }, CODE_TTL_MS);
}

/** Display side: create a fresh code and wait for the phone. */
export function hostDisplay(): string {
  const code = makeCode();
  open("display", code);
  return code;
}

/** Phone side: join an existing display by code. */
export function connectPhone(code: string) {
  const clean = code.trim().toUpperCase();
  if (clean.length < 4) {
    set({ error: "Enter the code shown on the display." });
    return;
  }
  open("phone", clean);
}

export function disconnectLink() {
  channel?.send({ type: "broadcast", event: "bye", payload: {} });
  teardown();
  lastSnapshot = null;
  set({ role: null, status: "off", code: "", snapshot: null, error: null, expiresAt: 0 });
}

/* ------------------------------ phone → display ------------------------------ */

let lastSnapshot: DisplaySnapshot | null = null;
let lastSerialized = "";

export function publish(snapshot: DisplaySnapshot, force = false) {
  lastSnapshot = snapshot;
  if (!channel || state.role !== "phone") return;
  const serialized = JSON.stringify(snapshot);
  if (!force && serialized === lastSerialized) return;
  lastSerialized = serialized;
  void channel.send({ type: "broadcast", event: "state", payload: snapshot });
}

/* ------------------------------ display → phone ------------------------------ */

export function sendCommand(cmd: DisplayCommand) {
  if (!channel || state.role !== "display") return;
  void channel.send({ type: "broadcast", event: "cmd", payload: cmd });
}

export function setCommandHandler(fn: ((c: DisplayCommand) => void) | null) {
  commandHandler = fn;
}

/* --------------------------------- react ---------------------------------- */

const serverSnapshot: LinkState = state;

export function useDisplayLink(): LinkState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverSnapshot,
  );
}