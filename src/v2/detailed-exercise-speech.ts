/**
 * Detailed exercise announcer for V2.
 * Marcus remains the branded recorded cue voice. This local speech layer is
 * used only when Marcus cannot dynamically synthesize exercise-specific lines.
 * It never claims to be Marcus.
 */
let activeUtterance: SpeechSynthesisUtterance | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const english = voices.filter((v) => /^en(?:-|_)/i.test(v.lang));
  const preferred = [
    /Google US English/i,
    /Microsoft (?:David|Mark|Guy)/i,
    /Samsung.*English/i,
  ];
  for (const pattern of preferred) {
    const found = english.find((v) => pattern.test(v.name));
    if (found) return found;
  }
  return english.find((v) => /en-US/i.test(v.lang)) ?? english[0] ?? voices[0] ?? null;
}

export function stopDetailedExerciseSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  activeUtterance = null;
}

export function speakDetailedExercise(text: string): boolean {
  if (typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      typeof window.SpeechSynthesisUtterance !== "function") return false;

  const clean = text.trim();
  if (!clean) return false;

  stopDetailedExerciseSpeech();
  const utterance = new SpeechSynthesisUtterance(clean);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.96;
  utterance.pitch = 0.92;
  utterance.volume = 0.72;
  utterance.onend = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };
  utterance.onerror = () => {
    if (activeUtterance === utterance) activeUtterance = null;
  };
  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return true;
}
