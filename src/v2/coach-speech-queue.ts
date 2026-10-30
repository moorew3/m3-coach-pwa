/**
 * V2 COACH SPEECH QUEUE
 * ------------------------------------------------------------------
 * V2 used to call speak(... interrupt:true) from several independent paths:
 * phase changes, camera corrections, boxing summaries and Q&A. Those calls
 * could cancel audio already playing, producing the user's "skipping" voice.
 *
 * This queue guarantees one audible coach line at a time. While the current
 * line plays we retain only the newest pending cue, preventing a backlog of
 * stale form corrections while never chopping the sentence already speaking.
 */
import {
  getVoiceStatus,
  isCoachSpeaking,
  onCoachSpeech,
  speak,
  stopSpeech,
  type CoachTone,
} from "@/lib/coach-voice";

type QueuedLine = {
  text: string;
  tone: CoachTone;
};

let pending: QueuedLine | null = null;
let dispatching = false;
let lastText = "";
let listenerReady = false;
let watchdog: ReturnType<typeof setTimeout> | null = null;

function armListener() {
  if (listenerReady) return;
  listenerReady = true;
  onCoachSpeech((on) => {
    if (on) {
      dispatching = false;
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
      return;
    }
    dispatching = false;
    if (watchdog) {
      clearTimeout(watchdog);
      watchdog = null;
    }
    setTimeout(flush, 100);
  });
}

function flush() {
  if (!pending || dispatching || isCoachSpeaking() || getVoiceStatus() !== "ready") return;
  const line = pending;
  pending = null;
  dispatching = true;
  lastText = line.text;
  // Ordinary V2 coaching never cancels the sentence already speaking.
  speak(line.text, true, { tone: line.tone, interrupt: false });
  // Network/audio failures may never fire a speech-active event. Release the
  // queue eventually without allowing rapid duplicate requests.
  watchdog = setTimeout(() => {
    if (!isCoachSpeaking()) {
      dispatching = false;
      flush();
    }
  }, 15000);
}

export function queueV2CoachSpeech(text: string, tone: CoachTone = "instructional") {
  const clean = text.trim();
  if (!clean || getVoiceStatus() !== "ready") return;
  armListener();
  // De-duplicate the exact line that is already active / most recently sent.
  if ((isCoachSpeaking() || dispatching) && clean === lastText) return;
  pending = { text: clean, tone };
  flush();
}

export function clearV2CoachSpeech() {
  pending = null;
  dispatching = false;
  lastText = "";
  if (watchdog) {
    clearTimeout(watchdog);
    watchdog = null;
  }
  stopSpeech();
}
