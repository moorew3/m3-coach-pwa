/**
 * Speech-led intro/transition pacing when newly generated coach narration is
 * unavailable. Never shorten work or rest, which must keep their prescription.
 */
export const MAX_SILENT_READALONG_SECONDS = 10;

export function scheduledStepSeconds(
  step: { seconds?: number; speechPaced?: boolean },
  spokenCoachReady: boolean,
): number | undefined {
  if (!spokenCoachReady && step.speechPaced && step.seconds !== undefined) {
    return Math.min(step.seconds, MAX_SILENT_READALONG_SECONDS);
  }
  return step.seconds;
}
