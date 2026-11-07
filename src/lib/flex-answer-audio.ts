/**
 * RETIRED DEVICE-TTS FALLBACK
 * --------------------------
 * Never generate spoken Flex replies using Android's generic voice.
 * Marcus – Warm & Friendly is the only approved coach voice. This module
 * remains as a safe compatibility shim for older imports; playback is off.
 */
export interface FlexSpeechHandlers {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (message: string) => void;
}

/** Cancel any legacy browser-speech utterances from older app versions. */
export function stopFlexSpeech() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try { window.speechSynthesis.cancel(); } catch { /* unavailable */ }
}

/** Generic device narration is intentionally not a permitted output. */
export function flexDeviceVoiceAvailable(): boolean {
  return false;
}

/** Kept only so old imports fail safely and never speak in the wrong voice. */
export function speakFlexAnswer(_text: string, handlers: FlexSpeechHandlers = {}): boolean {
  stopFlexSpeech();
  handlers.onError?.("Generic phone narration is disabled. Only original approved Marcus audio may play.");
  return false;
}

/** Compatibility helper, not used for voice generation. */
export function splitFlexSpeech(_text: string): string[] {
  return [];
}
