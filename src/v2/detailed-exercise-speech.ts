/** Only verified Marcus recordings may speak. Unrecorded live answers stay text. */
import { MARCUS_GENERAL_RECORDINGS } from './marcus-trainer-recordings';
import { playRecordedCoachAudio, stopRecordedCoachAudio } from './recorded-coach-player';
function recordingFor(text: string) {
  const key = /^Rest\b/i.test(text) ? 'rest'
    : /^Recovery\b/i.test(text) ? 'recovery'
    : /^Five seconds\b/i.test(text) ? 'ready'
    : /^Ten seconds\b/i.test(text) ? 'finish'
    : /^Workout complete\b/i.test(text) ? 'complete'
    : /^Coach voice is on\b/i.test(text) ? 'voiceOn'
    : /^Coach is ready\. Starting your workout\b/i.test(text) ? 'intro'
    : undefined;
  return key ? MARCUS_GENERAL_RECORDINGS[key]?.url : undefined;
}
export function stopDetailedExerciseSpeech() {
  stopRecordedCoachAudio('trainer-general');
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
}
export function speakDetailedExercise(text: string): boolean {
  const url = recordingFor(text);
  if (!url) return false;
  void playRecordedCoachAudio(url, 'trainer-general');
  return true;
}
export async function speakDetailedExerciseWhenReady(text: string): Promise<boolean> {
  const url = recordingFor(text);
  return url ? playRecordedCoachAudio(url, 'trainer-general') : false;
}
