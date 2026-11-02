type LiveFlexController = {
  speakText: (text: string) => Promise<boolean>;
  interrupt: () => void;
};

let controller: LiveFlexController | null = null;
let speaking = false;
const speakingListeners = new Set<() => void>();

function emitSpeaking() {
  speakingListeners.forEach((listener) => listener());
}

export function setLiveFlexController(next: LiveFlexController | null) {
  controller = next;
  if (!next && speaking) {
    speaking = false;
    emitSpeaking();
  }
}

export function setLiveFlexSpeaking(next: boolean) {
  if (speaking === next) return;
  speaking = next;
  emitSpeaking();
}

export function liveFlexSpeaking() {
  return speaking;
}

export function subscribeLiveFlexSpeaking(listener: () => void) {
  speakingListeners.add(listener);
  return () => speakingListeners.delete(listener);
}

/**
 * Returns true only when a connected live-face provider accepted the line.
 * Callers keep the truthful text/prerecorded fallback when this returns false.
 */
export async function speakThroughLiveFlex(text: string): Promise<boolean> {
  const clean = text.trim();
  if (!clean || !controller) return false;
  try {
    return await controller.speakText(clean);
  } catch {
    return false;
  }
}

export function interruptLiveFlex() {
  try { controller?.interrupt(); } catch { /* provider may be between states */ }
}
