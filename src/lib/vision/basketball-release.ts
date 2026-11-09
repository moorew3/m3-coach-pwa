/**
 * Basketball SHOOTING-ARM mechanics from the existing private MediaPipe landmarks.
 * No ball trajectory, rim result, grip or shot accuracy can be inferred from a single
 * person-only camera. The drill works seated; it never requires leg loading.
 */
import { angleAt, IDX, type LM } from "./analysis";

export type ShootingArm = "left" | "right";
export type ShootingPhase = "not-visible" | "ready" | "set" | "extended";
export interface ShootingSnapshot {
  cycles: number;
  phase: ShootingPhase;
  elbowAngle: number | null;
  confidence: number;
  wristAboveShoulder: boolean | null;
  cue: string | null;
  /** What was actually observed; not a shot-made statistic. */
  measured: "upper-arm-extension-only";
}
function visibility(point?: LM): number {
  return point ? point.visibility ?? 1 : 0;
}

export class BasketballReleaseTracker {
  private cycles = 0;
  private phase: ShootingPhase = "not-visible";
  private setAt = 0;
  private lastReleaseAt = 0;
  private lastFeedback = "";
  private feedbackAt = 0;
  constructor(readonly arm: ShootingArm) {}

  reset() {
    this.cycles = 0;
    this.phase = "not-visible";
    this.setAt = 0;
    this.lastReleaseAt = 0;
    this.lastFeedback = "";
    this.feedbackAt = 0;
  }

  push(landmarks: LM[] | null, now = Date.now()): ShootingSnapshot {
    const sh = landmarks?.[this.arm === "left" ? IDX.shL : IDX.shR];
    const el = landmarks?.[this.arm === "left" ? IDX.elL : IDX.elR];
    const wr = landmarks?.[this.arm === "left" ? IDX.wrL : IDX.wrR];
    const confidence = Math.round(Math.min(visibility(sh), visibility(el), visibility(wr)) * 100) / 100;
    const angle = angleAt(sh, el, wr);
    if (!sh || !el || !wr || angle === null || confidence < 0.6) {
      this.phase = "not-visible";
      this.setAt = 0;
      return this.snapshot(null, confidence, null,
        "Show me your shooting shoulder, elbow, and wrist clearly. I cannot judge this angle yet.");
    }

    // MediaPipe uses a 0-to-1 image plane; smaller y is higher.
    const handUp = wr.y < sh.y - 0.05;
    const loaded = angle < 130 && angle > 50;
    const fullyExtended = angle >= 155;
    let cue: string | null = null;

    if (loaded && this.phase !== "set") {
      this.phase = "set";
      this.setAt = now;
    }
    if (this.phase === "set" && fullyExtended) {
      if (!handUp) {
        cue = "Your shooting hand appears below your shoulder at extension. Check your camera angle and raise your arm only as comfortable.";
      } else if (now - this.setAt >= 180 && now - this.setAt <= 5000 && now - this.lastReleaseAt >= 400) {
        this.cycles++;
        this.phase = "extended";
        this.lastReleaseAt = now;
        cue = "I can see an overhead elbow extension. Return to your set position when ready.";
      }
    }
    if (this.phase === "not-visible" && !loaded) this.phase = "ready";
    // This is a cue based on visible arm angles only; it is NOT a made-basket count.
    if (cue && cue === this.lastFeedback && now - this.feedbackAt < 4000) cue = null;
    if (cue) {
      this.lastFeedback = cue;
      this.feedbackAt = now;
    }
    return this.snapshot(Math.round(angle), confidence, handUp, cue);
  }

  private snapshot(angle: number | null, confidence: number,
    handUp: boolean | null, cue: string | null): ShootingSnapshot {
    return {
      cycles: this.cycles,
      phase: this.phase,
      elbowAngle: angle,
      confidence,
      wristAboveShoulder: handUp,
      cue,
      measured: "upper-arm-extension-only",
    };
  }
}
