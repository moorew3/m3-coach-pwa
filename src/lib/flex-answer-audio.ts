/**
 * FREE, EXPLICITLY LABELED DEVICE SPEECH FOR FLEX ANSWERS
 * -------------------------------------------------------
 * The canonical Marcus voice is reserved for approved recorded workout
 * footage. Browser speech is a temporary reader for generated/locally
 * computed answers, never a Marcus impersonation or paid synthesis.
 *
 * Android Web Speech often drops long utterances, so we serialise short
 * chunks and only say audio is playing after receiving onstart.
 */
export type FlexSpeechHandlers = {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (message: string) => void;
};

let generation = 0;
let watchdog: ReturnType<typeof setTimeout> | null = null;

function clearWatchdog() {
  if (watchdog !== null) clearTimeout(watchdog);
  watchdog = null;
}

export function flexDeviceVoiceAvailable(): boolean {
  return typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof SpeechSynthesisUtterance !== "undefined";
}

export function splitFlexSpeech(text: string, limit = 185): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let sentence = "";
  const words = clean.split(" ");
  for (const word of words) {
    if (!word) continue;
    const candidate = sentence ? sentence + " " + word : word;
    if (candidate.length > limit && sentence) {
      chunks.push(sentence);
      sentence = word;
    } else if (candidate.length > limit) {
      for (let i = 0; i < candidate.length; i += limit) {
        if (i + limit < candidate.length) chunks.push(candidate.slice(i, i + limit));
        else sentence = candidate.slice(i);
      }
    } else {
      sentence = candidate;
    }
    if (sentence.length > 60 && /[.!?]$/.test(word)) {
      chunks.push(sentence);
      sentence = "";
    }
  }
  if (sentence) chunks.push(sentence);
  return chunks;
}

/** Cancel all pending Flex device-reading, but never stop Marcus MP4 playback. */
export function stopFlexSpeech() {
  generation++;
  clearWatchdog();
  if (!flexDeviceVoiceAvailable()) return;
  try { window.speechSynthesis.cancel(); } catch { /* browser unsupported */ }
}

/**
 * Returns false if browser speech is unavailable; true only means submitted.
 * onStart is the confirmation that actual playback was started by the OS.
 */
export function speakFlexAnswer(text: string, handlers: FlexSpeechHandlers = {}): boolean {
  stopFlexSpeech();
  if (!flexDeviceVoiceAvailable()) {
    handlers.onError?.("This browser has no device speech reader. You can still read the answer.");
    return false;
  }
  const chunks = splitFlexSpeech(text);
  if (!chunks.length) return false;
  const token = generation;
  const synth = window.speechSynthesis;
  let index = 0;
  let started = false;
  const fail = (reason: string) => {
    if (token !== generation) return;
    generation++;
    clearWatchdog();
    try { synth.cancel(); } catch { /* ignore */ }
    handlers.onError?.(reason);
  };
  const next = () => {
    if (token !== generation) return;
    if (index >= chunks.length) {
      clearWatchdog();
      handlers.onDone?.();
      return;
    }
    const u = new SpeechSynthesisUtterance(chunks[index++]);
    u.lang = "en-US";
    u.rate = 0.94;
    u.pitch = 1;
    u.volume = 1;
    let partStarted = false;
    u.onstart = () => {
      if (token !== generation) return;
      partStarted = true;
      clearWatchdog();
      if (!started) {
        started = true;
        handlers.onStart?.();
      }
    };
    u.onend = () => {
      if (token !== generation) return;
      clearWatchdog();
      next();
    };
    u.onerror = (event) => {
      if (token !== generation) return;
      const reason = (event as SpeechSynthesisErrorEvent).error || "unknown";
      fail("Phone speech failed (" + reason + "). Tap Hear answer again or check Text-to-speech settings.");
    };
    watchdog = setTimeout(() => {
      if (!partStarted) fail("Phone speech did not start. Tap Hear answer, check media volume, or enable an Android text-to-speech voice.");
    }, 4500);
    try {
      synth.resume();
      synth.speak(u);
    } catch {
      fail("Phone speech could not start. Check Android text-to-speech and site sound settings.");
    }
  };
  next();
  return true;
}
