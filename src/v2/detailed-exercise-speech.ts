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

  // Never fall back to an unlabeled/default English voice. On several Android
  // devices that resolved to the robotic female voice the owner rejected.
  const blocked =
    /(female|samantha|zira|susan|hazel|ava|jenny|aria|emma|joanna|salli|victoria|karen)/i;
  const confidentlyMale =
    /(\bmale\b|david|mark|guy|christopher|chris|eric|brian|ryan|daniel|james|george|arthur)/i;
  const preferred = [
    /Microsoft (?:David|Mark|Guy|Christopher|Eric|Ryan)/i,
    /Google.*(?:male|guy)/i,
    /Samsung.*(?:male|voice\s*2)/i,
    confidentlyMale,
  ];

  for (const pattern of preferred) {
    const found = english.find((v) => pattern.test(v.name) && !blocked.test(v.name));
    if (found) return found;
  }

  // Silence is better than changing the coach into a robotic woman.
  return null;
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
  const voice = pickVoice();
  if (!voice) return false;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.voice = voice;
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
