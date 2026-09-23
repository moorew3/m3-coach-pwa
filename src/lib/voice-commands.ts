/**
 * VOICE CONTROL — hands-free workout commands
 * ------------------------------------------------------------------
 * Uses the browser's own speech recognition (Chrome / Samsung Internet
 * / Edge). Nothing is uploaded by this module; it only turns recognised
 * phrases into app commands. Manual buttons keep working at all times.
 *
 * The coach's own voice is ignored: results that land while he is
 * speaking are dropped, so the app never answers itself.
 */
import { isCoachSpeaking } from "@/lib/coach-voice";

export type VoiceCommand =
  | "start"
  | "pause"
  | "resume"
  | "next"
  | "previous"
  | "repeat"
  | "skip"
  | "addTime"
  | "lessTime"
  | "swap"
  | "whatsNext"
  | "showDemo"
  | "muteCoach"
  | "unmuteCoach"
  | "coachLouder"
  | "coachQuieter"
  | "musicLouder"
  | "musicQuieter"
  | "musicPause"
  | "musicResume"
  | "cameraOn"
  | "cameraOff"
  | "gesturesOn"
  | "gesturesOff"
  | "changeWorkout"
  | "useProgram"
  | "setWeight"
  | "setReps"
  | "end";

/** Spoken small numbers, so "I got nine reps" works like "I got 9 reps". */
const WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

const numFrom = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = /^[\d.]+$/.test(raw) ? Number(raw) : WORDS[raw];
  return Number.isFinite(n) ? (n as number) : null;
};

const NUM = "(\\d{1,3}(?:\\.\\d)?|" + Object.keys(WORDS).join("|") + ")";
const WEIGHT_RE = new RegExp(
  `\\b${NUM}\\s*(?:pounds?|lbs?|kilograms?|kilos?|kgs?)\\b|\\b(?:set|make|change)\\s+(?:the\\s+)?weight\\s+(?:to\\s+)?${NUM}\\b`,
);
const REPS_RE = new RegExp(
  `\\b${NUM}\\s*reps?\\b|\\b(?:i\\s+(?:got|did)|that\\s+was|log|make\\s+(?:it|that))\\s+${NUM}\\b`,
);

/** The weight a spoken correction asked for, in the app's current units. */
export function weightIn(phrase: string): number | null {
  const m = WEIGHT_RE.exec(phrase.toLowerCase());
  return m ? (numFrom(m[1]) ?? numFrom(m[2])) : null;
}

/** The rep count a spoken correction asked for. */
export function repsIn(phrase: string): number | null {
  const m = REPS_RE.exec(phrase.toLowerCase());
  return m ? (numFrom(m[1]) ?? numFrom(m[2])) : null;
}

/** Ordered — the first phrase that matches wins, so longer forms come first. */
const RULES: [VoiceCommand, RegExp][] = [
  // Set corrections are checked first: "make that 135 pounds" must never be
  // mistaken for a navigation word inside the same sentence.
  ["setWeight", WEIGHT_RE],
  ["setReps", REPS_RE],
  [
    "cameraOn",
    /\b(camera|form coaching) on\b|\bwatch my form\b|\byes(,)? (use|turn on) (the )?camera\b/,
  ],
  ["cameraOff", /\b(camera|form coaching) off\b|\bno camera\b/],
  ["gesturesOn", /\bgestures? on\b|\bturn on gestures?\b|\byes(,)? (use|turn on) gestures?\b/],
  ["gesturesOff", /\bgestures? off\b|\bno gestures?\b/],
  [
    "changeWorkout",
    /\bchange today'?s workout\b|\bchoose (an )?activity\b|\bdifferent workout\b|\bweighted vest walk\b|\btreadmill walk\b/,
  ],
  ["useProgram", /\b(use|follow) (today'?s|the) program\b|\bprogrammed workout\b/],
  ["musicPause", /\b(pause|stop|hold) (the )?music\b/],
  ["musicResume", /\b(resume|play|start|continue) (the )?music\b/],
  ["musicLouder", /\bmusic (louder|up|higher)\b|\b(turn )?up (the )?music\b/],
  ["musicQuieter", /\bmusic (quieter|down|lower|softer)\b|\b(turn )?down (the )?music\b/],
  ["coachLouder", /\b(coach|voice) (louder|up|higher)\b|\blouder\b/],
  ["coachQuieter", /\b(coach|voice) (quieter|down|lower|softer)\b|\bquieter\b/],
  ["muteCoach", /\bmute( the)?( coach| voice)?\b|\bbe quiet\b|\bsilence\b/],
  ["unmuteCoach", /\bunmute( the)?( coach| voice)?\b|\btalk to me\b/],
  ["whatsNext", /\bwhat('| i)?s next\b|\bwhat is next\b|\bwhat now\b/],
  ["showDemo", /\bshow (me )?(the )?(form|demo|example|movement)\b|\bhow do i do (this|it)\b/],
  [
    "swap",
    /\bswap( the)? exercise\b|\bchange( the)? exercise\b|\bsubstitute\b|\breplace( the)? exercise\b/,
  ],
  ["addTime", /\b(add|plus|more) (thirty|30|fifteen|15|sixty|60)( seconds)?\b|\bmore time\b/],
  [
    "lessTime",
    /\b(reduce|minus|less|cut|take off) (thirty|30|fifteen|15|sixty|60)( seconds)?\b|\bless time\b/,
  ],
  ["next", /\bnext (exercise|step|set|move)\b|\bnext\b|\bmove on\b/],
  [
    "previous",
    /\b(previous|last|go back|back) (exercise|step|set|move)\b|\bgo back\b|\bprevious\b/,
  ],
  ["repeat", /\brepeat\b|\bsay (that )?again\b|\bagain\b/],
  ["skip", /\bskip\b/],
  ["end", /\bend (the )?workout\b|\bfinish (the )?workout\b|\bi'?m done\b|\bstop workout\b/],
  ["pause", /\bpause\b|\bhold on\b|\bwait\b/],
  ["resume", /\bresume\b|\bcontinue\b|\bkeep going\b|\bgo on\b/],
  ["start", /\bstart\b|\blet'?s go\b|\bbegin\b/],
];

/** How many seconds a time command asked for (default 30). */
export function secondsIn(phrase: string): number {
  if (/\b(fifteen|15)\b/.test(phrase)) return 15;
  if (/\b(sixty|60|a minute|one minute)\b/.test(phrase)) return 60;
  return 30;
}

export function matchCommand(phrase: string): VoiceCommand | null {
  const p = phrase.toLowerCase().trim();
  if (!p) return null;
  for (const [cmd, re] of RULES) if (re.test(p)) return cmd;
  return null;
}

/* --------------------------- recognition shell -------------------------- */

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number; [i: number]: { 0: { transcript: string }; isFinal: boolean } };
};

function Ctor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const voiceControlAvailable = () => !!Ctor();

export interface VoiceControlState {
  listening: boolean;
  heard: string | null;
  lastCommand: VoiceCommand | null;
  error: string | null;
}

const idle: VoiceControlState = { listening: false, heard: null, lastCommand: null, error: null };
let vc: VoiceControlState = idle;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<VoiceControlState>) => {
  vc = { ...vc, ...patch };
  emit();
};

let rec: Recognition | null = null;
let handler: ((cmd: VoiceCommand, phrase: string) => void) | null = null;
let wanted = false;

export function setCommandHandler(fn: ((cmd: VoiceCommand, phrase: string) => void) | null) {
  handler = fn;
}

export function startListening() {
  const C = Ctor();
  if (!C) {
    set({ error: "This browser can't listen for spoken commands." });
    return false;
  }
  wanted = true;
  if (rec) return true;
  const r = new C();
  rec = r;
  r.lang = "en-US";
  r.continuous = true;
  r.interimResults = false;
  r.onresult = (e) => {
    for (let n = e.resultIndex; n < e.results.length; n++) {
      const res = e.results[n];
      if (!res.isFinal) continue;
      const phrase = res[0].transcript.trim();
      // The coach's own line must never be treated as a user command.
      if (isCoachSpeaking()) continue;
      const cmd = matchCommand(phrase);
      set({ heard: phrase, lastCommand: cmd, error: null });
      if (cmd && handler) handler(cmd, phrase.toLowerCase());
    }
  };
  r.onerror = (e) => {
    const err = e?.error ?? "unknown";
    if (err === "not-allowed" || err === "service-not-allowed") {
      wanted = false;
      set({ listening: false, error: "Microphone access was blocked for this site." });
    } else if (err !== "no-speech" && err !== "aborted") {
      set({ error: `Listening error: ${err}` });
    }
  };
  r.onend = () => {
    // Recognition stops itself constantly on Android — restart while wanted.
    if (wanted) {
      try {
        r.start();
        return;
      } catch {
        /* fall through */
      }
    }
    rec = null;
    set({ listening: false });
  };
  try {
    r.start();
    set({ listening: true, error: null });
    return true;
  } catch {
    rec = null;
    set({ listening: false, error: "Could not start listening." });
    return false;
  }
}

export function stopListening() {
  wanted = false;
  try {
    rec?.stop();
  } catch {
    /* ignore */
  }
  rec = null;
  set({ listening: false });
}

import { useSyncExternalStore } from "react";

export function useVoiceControl(): VoiceControlState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => vc,
    () => idle,
  );
}