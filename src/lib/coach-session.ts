/**
 * SHARED COACHED-SESSION ENGINE
 * ------------------------------------------------------------------
 * One coached session, four screens. Phone (/coach/$day), Glasses
 * (/glasses), Desktop (the wide layout on /coach) and Presentation
 * (/presentation) all read and write the SAME session state, so
 * switching views never restarts the workout at step 1.
 *
 * Sync scope: same browser/device (localStorage + BroadcastChannel)
 * AND, once cloud sync is on, across separate physical devices through
 * a Supabase realtime channel plus a persisted `live_sessions` row, so
 * a refresh or a freshly joined screen restores the exact same step.
 *
 * A single "leader" screen owns the timers, the beeps and the coach
 * voice, so two open windows never tick twice or speak over
 * each other. Any screen can claim leadership ("This screen speaks").
 */
import { useCallback, useEffect, useReducer, useRef, useState, useSyncExternalStore } from "react";
import type { CoachStep } from "@/lib/coach-script";
import { beep, logIntervalFromCoach, markSetFromCoach, useApp, type SetEntry } from "@/lib/store";
import {
  dropPending,
  flushPending,
  loadVoices,
  onCoachSpeech,
  prefetchSpeech,
  speak,
  stopSpeech,
  unlockVoice,
  useVoiceStatus,
  estimateSpeechSeconds,
  type CoachTone,
} from "@/lib/coach-voice";
import {
  onLive,
  queueSessionPush,
  registerSessionBridge,
  restoreSession,
  sendLive,
} from "@/lib/cloud";

const KEY = "agt.coach.session.v1";

/** How a work step ended — lets the caller log timed intervals honestly. */
export interface FinishInfo {
  outcome: "completed" | "shortened" | "skipped";
  plannedSec?: number;
  doneSec: number;
}

function finishInfo(step: CoachStep, left: number | null, lead: number | null): FinishInfo {
  if (!step.seconds) return { outcome: "completed", doneSec: 0 };
  const remaining = lead !== null ? step.seconds : Math.max(0, left ?? step.seconds);
  const doneSec = Math.max(0, step.seconds - remaining);
  return { outcome: remaining <= 0 ? "completed" : "shortened", plannedSec: step.seconds, doneSec };
}
const LEADER_KEY = "agt.coach.leader.v1";
const HEARTBEAT_MS = 1000;
const STALE_MS = 3000;

export interface CoachSessionState {
  day: number;
  /** index into the coach script */
  i: number;
  left: number | null;
  lead: number | null;
  running: boolean;
  mirrored: boolean;
  rev: number;
}

const blank = (day = 1): CoachSessionState => ({
  day,
  i: 0,
  left: null,
  lead: null,
  running: true,
  mirrored: false,
  rev: 0,
});

let snap: CoachSessionState = blank();
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let booted = false;

const emit = () => listeners.forEach((l) => l());

function boot() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) snap = { ...blank(), ...(JSON.parse(raw) as CoachSessionState) };
  } catch {
    /* ignore corrupt state — never wipe workout history */
  }
  try {
    channel = new BroadcastChannel("agt-coach");
    channel.onmessage = (e) => {
      const next = e.data as CoachSessionState;
      if (next && typeof next.rev === "number" && next.rev !== snap.rev) {
        snap = next;
        emit();
      }
    };
  } catch {
    channel = null;
  }
  registerSessionBridge(
    () => snap,
    (next) => {
      const s = next as CoachSessionState | null;
      if (!s || typeof s.rev !== "number" || s.rev === snap.rev) return;
      snap = { ...blank(s.day ?? 1), ...s };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(snap));
      } catch {
        /* ignore */
      }
      emit();
    },
  );
  onLive("owner", (d) => {
    const o = d as { id: string; ts: number };
    if (!o?.id || o.id === myId) return;
    if (Date.now() - claimedAt < 10000) return; // we just claimed this screen
    // Deterministic tie-break so two devices never both drive the clock.
    remoteOwner = o.id < myId ? o : null;
  });
  void restoreSession();

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      snap = JSON.parse(e.newValue) as CoachSessionState;
      emit();
    } catch {
      /* ignore */
    }
  });
}

function commit(next: CoachSessionState) {
  snap = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* quota — state still lives in memory */
    }
    try {
      channel?.postMessage(next);
    } catch {
      /* ignore */
    }
  }
  emit();
  queueSessionPush();
}

export function patchSession(patch: Partial<CoachSessionState>) {
  boot();
  commit({ ...snap, ...patch, rev: snap.rev + 1 });
}

function subscribe(l: () => void) {
  boot();
  listeners.add(l);
  return () => listeners.delete(l);
}

const server = blank();

export function useCoachSession(): CoachSessionState {
  return useSyncExternalStore(
    subscribe,
    () => snap,
    () => server,
  );
}

/* ------------------------------ leader ------------------------------ */

const myId = Math.random().toString(36).slice(2);
let remoteOwner: { id: string; ts: number } | null = null;
let claimedAt = 0;

function readLeader(): { id: string; ts: number } | null {
  try {
    const raw = window.localStorage.getItem(LEADER_KEY);
    return raw ? (JSON.parse(raw) as { id: string; ts: number }) : null;
  } catch {
    return null;
  }
}

function writeLeader() {
  try {
    window.localStorage.setItem(LEADER_KEY, JSON.stringify({ id: myId, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

/**
 * Drives the coached session on whichever screen currently owns it.
 * Every screen renders the same state; only the leader ticks, beeps
 * and speaks.
 *
 * `passive` views (presentation / glasses) are display-first: they
 * mirror the session silently and only take the clock and the voice if
 * no other screen has claimed it after a short grace period, or when
 * the user taps "This screen speaks".
 */
const PASSIVE_GRACE_MS = 4000;

export function useCoachEngine(
  day: number,
  script: CoachStep[],
  onFinishWork: (step: CoachStep, info: FinishInfo) => void,
  opts: { passive?: boolean } = {},
) {
  const passive = !!opts.passive;
  const session = useCoachSession();
  const state = useApp();
  const voiceOn = state.settings.coachVoice !== false;
  const [isLeader, setIsLeader] = useState(false);
  const voiceStatus = useVoiceStatus();
  const spoken = useRef("");
  const armed = useRef("");
  const countdownStep = useRef("");
  const countdownStarted = useRef(false);
  const countdownSpoken = useRef(new Set<number>());
  const [countdownEpoch, startCountdown] = useReducer((n: number) => n + 1, 0);
  const [countdownEvents, setCountdownEvents] = useState<string[]>([]);
  const finishRef = useRef(onFinishWork);
  finishRef.current = onFinishWork;
  /* the coach is mid-sentence on the step opener: clocks wait for him */
  const [speaking, setSpeaking] = useState(false);
  const speakingSince = useRef(0);
  const [, recheck] = useReducer((n: number) => n + 1, 0);
  /* bumped after the unlock confirmation so the opener re-narrates cleanly */
  const [epoch, bumpEpoch] = useReducer((n: number) => n + 1, 0);
  const scriptRef = useRef(script);
  scriptRef.current = script;

  /* leader heartbeat — first screen open wins, others follow */
  useEffect(() => {
    const mountedAt = Date.now();
    const tick = () => {
      const cur = readLeader();
      const remoteLive =
        !!remoteOwner && Date.now() - remoteOwner.ts < STALE_MS && Date.now() - claimedAt > 10000;
      let mine = !remoteLive && (!cur || cur.id === myId || Date.now() - cur.ts > STALE_MS);
      // Display-only views wait: the phone should stay the controller.
      if (mine && passive && cur?.id !== myId && Date.now() - claimedAt > 10000) {
        if (Date.now() - mountedAt < PASSIVE_GRACE_MS) mine = false;
      }
      if (mine) {
        writeLeader();
        sendLive("owner", { id: myId, ts: Date.now() });
      }
      setIsLeader(mine);
    };
    tick();
    const t = setInterval(tick, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [passive]);

  /* handing the voice over: the old leader must go quiet immediately so
     two screens never overlap, and the next step re-narrates cleanly. */
  useEffect(() => {
    if (isLeader) return;
    stopSpeech();
    spoken.current = "";
    armed.current = "";
  }, [isLeader]);

  /* Called from a real tap: unlocks browser speech AND takes coaching. */
  const claimVoice = useCallback(() => {
    claimedAt = Date.now();
    remoteOwner = null;
    writeLeader();
    sendLive("owner", { id: myId, ts: Date.now() });
    setIsLeader(true);
    void unlockVoice("Coach audio on. This screen is coaching now — I've got you.", "calm").then(
      (s) => {
        if (s === "ready") flushPending(true);
      },
    );
  }, []);

  /**
   * The audio-unlock gesture at the start of a coached session.
   * Must be wired to an onClick — never to an effect.
   */
  const enableAudio = useCallback(async () => {
    const s = await unlockVoice("Coach audio's on. Here we go.", "calm");
    if (s === "ready") {
      dropPending();
      // Let the confirmation land, then the episode opener follows as one flow.
      setTimeout(() => {
        spoken.current = "";
        bumpEpoch();
      }, 2200);
    }
    return s;
  }, []);

  /* warm the voice list up early so the first tap is instant */
  useEffect(() => {
    void loadVoices();
  }, []);

  /* the session belongs to one day at a time. Compare against the live
     store, not the render snapshot: the first hydration render still holds
     the blank server snapshot (day 1), and using it here wiped an
     in-progress session for every other day on refresh. */
  useEffect(() => {
    boot();
    if (snap.day !== day) patchSession({ ...blank(day), rev: snap.rev });
  }, [day, session.day]);

  const step: CoachStep | undefined = script[session.i];

  const resetCountdown = useCallback((stepId: string) => {
    countdownStep.current = stepId;
    countdownStarted.current = false;
    countdownSpoken.current.clear();
    setCountdownEvents([]);
  }, []);

  /* new step: arm timers (leader only), separately from narration */
  useEffect(() => {
    if (!step || !isLeader) return;
    if (armed.current === step.id) {
      // Muted after this step was armed: shorten the read-along clock in place.
      if (!voiceOn && step.speechPaced && snap.left !== null && snap.left > 10)
        patchSession({ left: 10 });
      return;
    }
    armed.current = step.id;
    // Speech-led steps fall back to a read-along clock when the coach is
    // muted; cap it so a silent session still flows instead of stalling.
    const secs =
      step.speechPaced && !voiceOn && step.seconds ? Math.min(step.seconds, 10) : step.seconds;
    // Rep-based sets count down too (lead runs, no clock); timed sets arm both.
    if (step.countdownIn) {
      resetCountdown(step.id);
      patchSession({ lead: 3, left: secs ?? null });
    } else patchSession({ lead: null, left: secs ?? null });
  }, [step, isLeader, voiceOn, resetCountdown]);

  /* a new step always clears the "still talking" hold */
  useEffect(() => {
    setSpeaking(false);
  }, [step?.id]);

  /* HONEST SPEAKING STATE — driven by audible playback only. The voice
     layer flips this when a path actually starts producing sound, so the
     UI can never show "Coach speaking" over a silent phone. */
  useEffect(() => {
    const off = onCoachSpeech((on) => {
      if (on) speakingSince.current = Date.now();
      setSpeaking(on);
    });
    return () => {
      off();
    };
  }, []);

  /* narration — leader only, and re-fires the moment audio is unlocked */
  useEffect(() => {
    if (!step || !isLeader) return;
    if (!voiceOn) {
      stopSpeech();
      spoken.current = "";
      return;
    }
    if (spoken.current === step.id) return;
    spoken.current = step.id;
    const id = step.id;
    speak(step.say, voiceOn, {
      tone: step.tone,
      onEnd: () => {
        setSpeaking(false);
        // Speech-led chapter: the coach finishing the line IS the transition.
        if (step.speechPaced && snap.running && scriptRef.current[snap.i]?.id === id) {
          setTimeout(() => {
            if (snap.running && scriptRef.current[snap.i]?.id === id) {
              patchSession({ i: Math.min(scriptRef.current.length - 1, snap.i + 1) });
            }
          }, 900);
        }
      },
    });
  }, [step, isLeader, voiceOn, voiceStatus, epoch]);

  /* PRE-BUFFER: this step's live cues and the next two openers, so every
     transition plays instantly instead of waiting on the network. */
  useEffect(() => {
    if (!step || !isLeader || !voiceOn || voiceStatus !== "ready") return;
    const lines: { text: string; tone: CoachTone }[] = [];
    (step.liveCues ?? []).forEach((c) => lines.push({ text: c.say, tone: c.tone }));
    const n1 = script[session.i + 1];
    const n2 = script[session.i + 2];
    if (n1) {
      lines.push({ text: n1.say, tone: n1.tone });
      (n1.liveCues ?? []).slice(0, 2).forEach((c) => lines.push({ text: c.say, tone: c.tone }));
    }
    if (n2) lines.push({ text: n2.say, tone: n2.tone });
    if (step.kind === "rest" && n1?.countdownIn)
      lines.push(
        { text: "Go", tone: "urgent" },
        { text: "3", tone: "urgent" },
        { text: "2", tone: "urgent" },
        { text: "1", tone: "urgent" },
      );
    prefetchSpeech(lines);
  }, [step, session.i, script, isLeader, voiceOn, voiceStatus]);

  /* LIVE CUES — spaced coaching inside a step, so the coach stays with the
     user through the set instead of going silent after the opening line. */
  useEffect(() => {
    if (!step || !isLeader || !voiceOn || !session.running) return;
    const cues = step.liveCues;
    if (!cues?.length) return;
    // A screen that takes the voice mid-set joins where the clock already
    // is, so it never replays cues the user has already heard.
    let elapsed = step.seconds && snap.left !== null ? Math.max(0, step.seconds - snap.left) : 0;
    let fired = 0;
    while (fired < cues.length && cues[fired].at <= elapsed) fired++;
    const t = setInterval(() => {
      elapsed += 1;
      while (fired < cues.length && cues[fired].at <= elapsed) {
        const cue = cues[fired++];
        // Never interrupt: these layer over training, they don't restart it.
        speak(cue.say, true, { tone: cue.tone, interrupt: false });
      }
      if (fired >= cues.length) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [step, isLeader, voiceOn, session.running]);

  useEffect(() => () => stopSpeech(), []);

  const advance = useCallback(() => {
    patchSession({ i: Math.min(script.length - 1, snap.i + 1) });
  }, [script.length]);

  const back = useCallback(() => patchSession({ i: Math.max(0, snap.i - 1) }), []);
  const goto = useCallback(
    (n: number) => patchSession({ i: Math.max(0, Math.min(script.length - 1, n)) }),
    [script.length],
  );
  const setRunning = useCallback((v: boolean) => {
    if (!v) stopSpeech();
    patchSession({ running: v });
  }, []);
  const toggleMirror = useCallback(() => patchSession({ mirrored: !snap.mirrored }), []);
  const bumpRest = useCallback(
    (d: number) => patchSession({ left: Math.max(0, (snap.left ?? 0) + d) }),
    [],
  );

  const finishWork = useCallback(() => {
    if (step?.kind === "work") finishRef.current(step, finishInfo(step, snap.left, snap.lead));
    beep(state.settings, 720);
    advance();
  }, [step, advance, state.settings]);

  /** Skip — a timed effort that hasn't finished is recorded as skipped/shortened. */
  const skipStep = useCallback(() => {
    if (step?.kind === "work" && step.seconds && isLeader) {
      const info = finishInfo(step, snap.left, snap.lead);
      finishRef.current(step, info.doneSec > 0 ? info : { ...info, outcome: "skipped" });
    }
    advance();
  }, [step, advance, isLeader]);

  const repeatStep = useCallback(() => {
    if (!step) return;
    if (step.countdownIn) resetCountdown(step.id);
    patchSession({ left: step.seconds ?? null, lead: step.countdownIn ? 3 : null });
    // Only the audio leader re-speaks, so a follower's Repeat never doubles up.
    if (isLeader) {
      // "speaking" is set by the voice layer when sound really starts.
      speak(step.say, voiceOn, { tone: step.tone, onEnd: () => setSpeaking(false) });
    }
  }, [step, voiceOn, isLeader, resetCountdown]);

  /* The coach finishing his sentence gates the clocks — but never for
     more than a bounded window, so a lost `onended` can't stall the session. */
  const holdCapMs = step ? (estimateSpeechSeconds(step.say) * 1.6 + 8) * 1000 : 8000;
  const holding = speaking && Date.now() - speakingSince.current < holdCapMs;

  /* The opener may delay the START of a countdown. Once released, global
     speaking state is deliberately ignored: countdown speech itself changes
     that state and must never cancel/re-arm its own progression timer. */
  useEffect(() => {
    if (!step || !isLeader || !session.running || session.lead !== 3) return;
    if (countdownStep.current !== step.id || countdownStarted.current) return;
    if (holding) {
      const t = setTimeout(recheck, 500); // re-evaluate the hold
      return () => clearTimeout(t);
    }
    countdownStarted.current = true;
    startCountdown();
  }, [step, isLeader, session.lead, session.running, holding]);

  /* 3 · 2 · 1 · GO — one monotonic timer per lead value. This effect does
     not depend on `speaking`, `holding`, or voice status, so TTS start/end
     callbacks cannot clean up a pending decrement. */
  useEffect(() => {
    if (!step || !isLeader || session.lead === null || !session.running) return;
    if (snap.lead !== session.lead) return; // stale render — the store already moved on
    if (countdownStep.current !== step.id) return;
    if (session.lead === 3 && !countdownStarted.current) return;

    const lead = session.lead;
    if (!countdownSpoken.current.has(lead)) {
      countdownSpoken.current.add(lead);
      const token = lead === 0 ? "Go" : String(lead);
      setCountdownEvents((events) => [...events, token]);
      speak(token, voiceOn, { tone: "urgent", interrupt: lead === 0 });
      if (lead === 0) beep(state.settings, 880);
    }

    const stepId = step.id;
    const t = setTimeout(
      () => {
        if (!snap.running || scriptRef.current[snap.i]?.id !== stepId || snap.lead !== lead) return;
        patchSession({ lead: lead === 0 ? null : lead - 1 });
      },
      lead === 0 ? 600 : 1000,
    );
    return () => clearTimeout(t);
    // Voice settings are intentionally captured for this tick. Changing them
    // must not restart or cancel a countdown already in flight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, isLeader, session.lead, session.running, countdownEpoch]);

  /* the single countdown driving work, rest, briefs and cooldowns */
  useEffect(() => {
    if (!isLeader || !session.running || session.left === null || session.lead !== null || !step)
      return;
    // The arm effect above may have just re-armed this step in the same
    // commit; never act on a clock value the store has already replaced.
    if (snap.left !== session.left || snap.lead !== session.lead) return;
    if (session.left <= 0 && step.speechPaced && holding) {
      // Clock ran out but the coach is still talking — wait for him.
      const t = setTimeout(recheck, 700);
      return () => clearTimeout(t);
    }
    if (session.left <= 0) {
      if (!step.speechPaced) beep(state.settings, step.kind === "rest" ? 880 : 660);
      if (step.kind === "work") finishWork();
      else advance();
      return;
    }
    if (session.left === 3 && step.kind === "rest")
      speak(`Three seconds. ${step.next ?? ""}`, voiceOn, { tone: "reassuring" });
    const t = setTimeout(
      () => patchSession({ left: snap.left === null ? null : snap.left - 1 }),
      1000,
    );
    return () => clearTimeout(t);
  }, [
    isLeader,
    session.left,
    session.lead,
    session.running,
    step,
    advance,
    finishWork,
    state.settings,
    voiceOn,
    holding,
  ]);

  return {
    step,
    i: session.i,
    left: session.left,
    lead: session.lead,
    running: session.running,
    mirrored: session.mirrored,
    isLeader,
    speaking,
    claimVoice,
    voiceStatus,
    enableAudio,
    advance,
    back,
    goto,
    setRunning,
    toggleMirror,
    bumpRest,
    finishWork,
    skipStep,
    repeatStep,
    countdownEvents,
    progress: Math.round((session.i / Math.max(1, script.length - 1)) * 100),
  };
}

/**
 * One write path for every coached screen: rep sets are marked done with
 * whatever the user entered; timed efforts are recorded exactly as they
 * ended (completed / shortened / skipped). Nothing else in the log moves.
 */
export function recordWorkStep(
  day: number,
  step: CoachStep,
  info: FinishInfo,
  patch: Partial<SetEntry> = {},
) {
  if (!step.exerciseId || step.setIndex === undefined) return;
  if (step.seconds && info.plannedSec) {
    logIntervalFromCoach(day, step.exerciseId, step.setIndex, {
      plannedSec: info.plannedSec,
      doneSec: info.doneSec,
      outcome: info.outcome,
      feel: patch.feel,
      rpe: patch.rpe,
    });
    return;
  }
  markSetFromCoach(day, step.exerciseId, step.setIndex, patch);
}

/** Restart the coached session for a day (used by "Back to the session"). */
export function resetCoachSession(day: number) {
  patchSession({ ...blank(day), rev: snap.rev });
}