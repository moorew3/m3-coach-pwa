/**
 * Free Android/browser speech output for live, non-pre-recorded answers.
 *
 * Marcus's approved recordings remain the primary workout cue voice. This
 * browser-native reply voice is explicitly a fallback, not a Marcus clone.
 * No API, subscription or provider credits are used here.
 */
let replyUtterance: SpeechSynthesisUtterance | null = null;
let replySpeaking = false;
let lastSpeechEnd = 0;
let speechGeneration = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

export function subscribeCoachReplySpeech(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function coachReplySpeaking() {
  return replySpeaking;
}

/** Including the brief trailing recognition delay prevents self-interviewing. */
export function coachReplySpeechActive() {
  return replySpeaking || Date.now() - lastSpeechEnd < 850;
}

export function canSpeakCoachReply() {
  return typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance === "function";
}

export function stopCoachReply() {
  speechGeneration += 1;
  replyUtterance = null;
  if (replySpeaking) {
    replySpeaking = false;
    lastSpeechEnd = Date.now();
    emit();
  }
  if (canSpeakCoachReply()) {
    try { window.speechSynthesis.cancel(); } catch { /* keep training */ }
  }
}

function replyVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang));
  // Prefer a lower-register installed English speaker, never assume
  // the host's installed voice is Marcus or that a male voice is present.
  return english.find((voice) =>
    /(?:male|david|daniel|guy|ryan|george|matthew|aaron|james)/i.test(voice.name))
    ?? english.find((voice) => /en[-_]US/i.test(voice.lang))
    ?? english[0];
}

/**
 * Return true only when the browser accepted a speech request. Browser
 * audio permission can still block playback; onerror/end update status.
 */
export function speakCoachReply(text: string): boolean {
  if (!canSpeakCoachReply() || !text.trim()) return false;
  stopCoachReply();
  const token = speechGeneration;
  try {
    const utterance = new window.SpeechSynthesisUtterance(text.trim().slice(0, 850));
    replyUtterance = utterance; // Retain for Android GC-sensitive synthesis.
    utterance.lang = "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 0.90;
    utterance.volume = 1;
    const voice = replyVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      if (token !== speechGeneration) return;
      replySpeaking = true;
      emit();
    };
    const finish = () => {
      if (token !== speechGeneration) return;
      replyUtterance = null;
      replySpeaking = false;
      lastSpeechEnd = Date.now();
      emit();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
    // Samsung/Chrome sometimes hold speech until the page is foregrounded.
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    return true;
  } catch {
    stopCoachReply();
    return false;
  }
}
