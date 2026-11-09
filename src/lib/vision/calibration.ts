/**
 * Exercise-aware, locally evaluated camera framing gate.
 *
 * Upper-body coaching must not require visible knees/ankles when the athlete is
 * safely seated, with injured leg supported. Standing, lunge and kick tracking
 * must still verify full-body visibility. These are camera limits, not medical
 * clearance or an exercise prescription.
 */
import type { LM } from "./analysis";

export type CameraFraming = "upper" | "full";
export interface FrameCalibration {
  bodyVisible: boolean;
  upperVisible: boolean;
  lowerVisible: boolean;
  farEnough: boolean;
  upright: boolean;
  bright: boolean;
  ready: boolean;
  prompt: string;
}
const vis = (l?: LM) => l ? (l.visibility ?? 1) : 0;
const blank: FrameCalibration = {
  bodyVisible: false, upperVisible: false, lowerVisible: false,
  farEnough: false, upright: false, bright: false, ready: false,
  prompt: "Turn the camera on so I can see you.",
};

export function calibratePose(lm: LM[] | null, framing: CameraFraming = "full"): FrameCalibration {
  if (!lm || lm.length < 29) return { ...blank, prompt: "Step or move into frame — I can't see you yet." };
  const [shL, shR, elL, elR, wrL, wrR] = [11,12,13,14,15,16];
  const upper = [shL,shR,elL,elR,wrL,wrR].every((i) => vis(lm[i]) >= 0.55);
  const lower = [23,24,25,26,27,28].every((i) => vis(lm[i]) >= 0.5);
  const head = vis(lm[0]) >= 0.5;
  const shoulderSpread = Math.abs(lm[shL].x - lm[shR].x);
  const shoulderTilt = Math.abs(lm[shL].y - lm[shR].y);
  const top = Math.min(lm[shL].y, lm[shR].y);
  const bottom = Math.max(lm[27]?.y ?? 1, lm[28]?.y ?? 1);
  const height = bottom - top;
  // An upper-body camera can be framed waist-up; don't require shoe visibility.
  const farEnough = framing === "upper"
    ? shoulderSpread > 0.075 && shoulderSpread < 0.83
    : height >= 0.25 && height <= 0.92;
  const upright = shoulderTilt < 0.12;
  const bright = [shL, shR, elL, elR].every((i) => vis(lm[i]) >= 0.55);
  const visibilityOK = framing === "upper" ? upper : (head && upper && lower);
  const prompt = !upper
    ? "Show both shoulders, elbows and wrists. I cannot assess the movement without them."
    : framing === "full" && !head
      ? "Point the camera higher so your head is in frame."
      : framing === "full" && !lower
        ? "Full-body exercise: show both knees and ankles."
        : !farEnough
          ? framing === "upper"
            ? "Reframe so both shoulders and arms are clearly visible."
            : "Reframe your full body without cutting off your feet."
          : !upright
            ? "Keep the camera level and square to you."
            : !bright
              ? "Improve lighting in front of you."
              : framing === "upper"
                ? "Upper-body framing ready. Your lower legs may remain supported outside the image."
                : "Full-body framing ready.";
  return {
    bodyVisible: head && upper, upperVisible: upper, lowerVisible: lower,
    farEnough, upright, bright, ready: visibilityOK && farEnough && upright && bright,
    prompt,
  };
}
