type LiveFlexController = {
  speakText: (text: string) => boolean;
  interrupt: () => void;
};

let controller: LiveFlexController | null = null;

export function setLiveFlexController(next: LiveFlexController | null) {
  controller = next;
}

/**
 * Returns true only when a connected LiveAvatar accepted the line.
 * Callers can keep a truthful text-only fallback when this returns false.
 */
export function speakThroughLiveFlex(text: string): boolean {
  const clean = text.trim();
  if (!clean || !controller) return false;
  try {
    return controller.speakText(clean);
  } catch {
    return false;
  }
}

export function interruptLiveFlex() {
  try { controller?.interrupt(); } catch { /* session can be between states */ }
}
