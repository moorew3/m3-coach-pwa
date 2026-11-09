/**
 * The workout clock may only advance after the selected approved scene has
 * rendered a decoded video frame AND is currently playing. A paused, stalled,
 * failed, or previously selected exercise must never count training seconds.
 *
 * No media is required for deliberately audio-only or unanimated phases.
 */
export type MotionPlaybackGate = {
  mediaRequired: boolean;
  expectedKey: string;
  decodedKey: string;
  playingKey: string;
};

export function motionFrameMayAdvance(gate: MotionPlaybackGate): boolean {
  if (!gate.mediaRequired) return true;
  return Boolean(gate.expectedKey) &&
    gate.decodedKey === gate.expectedKey &&
    gate.playingKey === gate.expectedKey;
}
