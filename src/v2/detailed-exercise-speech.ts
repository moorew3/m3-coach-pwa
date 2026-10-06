/** Device speech is disabled: only the approved recorded Marcus voice may speak. */
export function stopDetailedExerciseSpeech() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}
export function speakDetailedExercise(_text: string): boolean { return false; }
export async function speakDetailedExerciseWhenReady(_text: string): Promise<boolean> { return false; }
