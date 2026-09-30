/**
 * V2 CAMERA-OBSERVABLE BOXING COACH
 *
 * A straight punch is ONLY counted after we observe:
 * guarded start -> arm extension -> retraction -> hand back at guard.
 * Unlike the generic elbow-angle counter, an extended hand is NOT a
 * completed punch. No claims about impact, speed, power or hidden pivot.
 *
 * Camera positioning matters. All thresholds are conservative and only
 * apply after high-confidence landmarks persist for multiple frames.
 */
import { angleAt, IDX, type LM } from "@/lib/vision/analysis";

export type BoxingDrill =
  | "boxingStance" | "jab" | "cross" | "jabCross"
  | "boxingCombination" | "defensiveReset" | "guardReset";

export type BoxingStance = "orthodox" | "southpaw";
type PunchStage = "guard" | "extending" | "extended" | "returning";
type Hand = "lead" | "rear";
type Side = {
  stage: PunchStage;
  at: number;
  extensionAt: number;
  reps: number;
  guardWrist: { x: number; y: number; z: number };
  initialized: boolean;
};

export interface BoxingSnapshot {
  confidence: number;
  leadPunches: number;
  rearPunches: number;
  combinations: number;
  phase: "waiting" | "guard" | "extending" | "extended" | "returning";
  stance: "visible" | "guard-low" | "feet-hidden" | "camera-angle" | "unavailable";
  cue: string | null;
  lastCorrection: string | null;
  note: string;
}

const blank = (): Side => ({
  stage: "guard", at: 0, extensionAt: 0, reps: 0,
  guardWrist: { x: 0, y: 0, z: 0 }, initialized: false,
});
const visibility = (lm?: LM) => lm ? lm.visibility ?? 1 : 0;

export class BoxingFormTracker {
  private left = blank();
  private right = blank();
  private lowGuardFrames = 0;
  private loweredOtherHandFrames = 0;
  private straightKneesFrames = 0;
  private cameraAngleFrames = 0;
  private offBalanceFrames = 0;
  private lastCueAt = 0;
  private lastCue = "";
  private lastLeadAt = 0;
  private pairs = 0;
  private issues = new Map<string, { count: number; text: string }>();
  private seenFrames = 0;

  constructor(
    private readonly drill: BoxingDrill,
    private readonly stanceChoice: BoxingStance,
  ) {}

  getSnapshot(): BoxingSnapshot {
    return this.snapshot(0, "unavailable", "waiting", null);
  }

  summary(): string {
    const count = this.left.reps + this.right.reps;
    if (this.seenFrames < 8)
      return "I could not see enough of that round to judge your stance and punches. Keep your face, hands and feet in frame.";
    const top = [...this.issues.values()].sort((a, b) => b.count - a.count)[0];
    if (!count) {
      return top
        ? "I could not verify a complete punch and return. Focus on this: " + top.text
        : "Round complete. I saw your guard and stance, but no full punch-to-guard cycle could be confirmed.";
    }
    const total = count + " completed punch-and-return cycles";
    const followup = top ? " Main correction: " + top.text :
      " Keep returning both hands to guard.";
    return "Round complete: " + total + ", " + this.pairs +
      " complete jab-cross combinations." + followup;
  }

  update(lm: LM[] | null, now = Date.now()): BoxingSnapshot {
    const note = "Visible stance, hand guard, arm extension and full hand return only; contact, power, concealed foot pivot and exact hip rotation cannot be verified.";
    if (!lm || lm.length < 29)
      return this.snapshot(0, "unavailable", "waiting", null, "Move back until your upper body and arms are in view.");

    const key = [
      IDX.nose, IDX.shL, IDX.shR, IDX.elL, IDX.elR,
      IDX.wrL, IDX.wrR, IDX.hipL, IDX.hipR,
    ];
    const confidence = Math.min(...key.map((id) => visibility(lm[id])));
    const shoulders = Math.abs(lm[IDX.shL].x - lm[IDX.shR].x);
    const shoulderY = (lm[IDX.shL].y + lm[IDX.shR].y) / 2;
    const hipY = (lm[IDX.hipL].y + lm[IDX.hipR].y) / 2;
    const torso = Math.max(0.06, Math.abs(hipY - shoulderY));
    if (confidence < 0.65 || shoulders < 0.07)
      return this.snapshot(confidence, "unavailable", "waiting", null,
        "Move or reposition the camera until your face, shoulders, elbows and both hands are visible.");

    this.seenFrames++;
    const leadRight = this.stanceChoice === "southpaw";
    const leadState = leadRight ? this.right : this.left;
    const rearState = leadRight ? this.left : this.right;
    const guardL = this.inGuard(lm, false, torso, shoulders);
    const guardR = this.inGuard(lm, true, torso, shoulders);
    const armsInMotion = this.left.stage !== "guard" || this.right.stage !== "guard";
    let correction: string | null = null;

    const feetVisible =
      visibility(lm[IDX.ankL]) >= 0.65 &&
      visibility(lm[IDX.ankR]) >= 0.65 &&
      visibility(lm[IDX.knL]) >= 0.65 &&
      visibility(lm[IDX.knR]) >= 0.65;
    const feetSpacing = feetVisible
      ? Math.abs(lm[IDX.ankL].x - lm[IDX.ankR].x)
      : 0;
    let stance: BoxingSnapshot["stance"] = !feetVisible ? "feet-hidden" : "visible";

    // Only tell the athlete to change camera position when foot projection is
    // ambiguous. A single oblique camera cannot establish true stance width.
    if (feetVisible && shoulders >= 0.14 && feetSpacing < shoulders * 0.35) {
      this.cameraAngleFrames++;
      if (this.cameraAngleFrames >= 8) stance = "camera-angle";
      if (this.cameraAngleFrames === 8) correction =
        "Your feet overlap in this camera view. Adjust the angle so I can check your stance.";
    } else this.cameraAngleFrames = 0;

    if (feetVisible) {
      const lKnee = angleAt(lm[IDX.hipL], lm[IDX.knL], lm[IDX.ankL]);
      const rKnee = angleAt(lm[IDX.hipR], lm[IDX.knR], lm[IDX.ankR]);
      this.straightKneesFrames =
        lKnee !== null && rKnee !== null && lKnee > 175 && rKnee > 175
          ? this.straightKneesFrames + 1 : 0;
      if (this.straightKneesFrames === 12)
        correction = correction ?? "Both knees look almost straight. Soften your knees and keep your stance ready.";
    } else this.straightKneesFrames = 0;

    // A front/three-quarter projection can show pronounced upper-body drift,
    // but we never label it a weight-distribution or injury diagnosis.
    const hipMidX = (lm[IDX.hipL].x + lm[IDX.hipR].x) / 2;
    const shMidX = (lm[IDX.shL].x + lm[IDX.shR].x) / 2;
    const hipSpan = Math.abs(lm[IDX.hipL].x - lm[IDX.hipR].x);
    const frontView = shoulders >= 0.13 && hipSpan / shoulders > 0.55;
    this.offBalanceFrames =
      frontView && Math.abs(shMidX - hipMidX) > shoulders * 0.72
        ? this.offBalanceFrames + 1 : 0;
    if (this.offBalanceFrames === 7)
      correction = correction ?? "Bring your upper body back over your hips after the strike.";

    if (!armsInMotion && !guardL && !guardR) {
      this.lowGuardFrames++;
      if (this.lowGuardFrames >= 7) {
        stance = "guard-low";
        if (this.lowGuardFrames === 7)
          correction = correction ?? "Both hands are low. Raise your gloves close to your cheeks.";
      }
    } else this.lowGuardFrames = 0;

    // Only analyze individual punch cycles during an actual punching drill.
    const counting = this.drill === "jab" || this.drill === "cross" ||
      this.drill === "jabCross" || this.drill === "boxingCombination";
    if (counting) {
      const leadComplete = this.step(
        leadState, lm, leadRight, torso, shoulders, now,
        leadRight ? guardR : guardL,
      );
      const rearComplete = this.step(
        rearState, lm, !leadRight, torso, shoulders, now,
        leadRight ? guardL : guardR,
      );

      if (leadComplete) {
        this.lastLeadAt = now;
        if (this.drill === "cross")
          correction = correction ?? "That was your lead hand. This drill calls for the rear-hand cross.";
      }
      if (rearComplete) {
        if (this.lastLeadAt && now - this.lastLeadAt <= 4500) {
          this.pairs++;
          this.lastLeadAt = 0;
        } else if (this.drill === "jabCross") {
          correction = correction ?? "Lead-hand jab first, rear-hand cross second. Return each hand to guard.";
        }
        if (this.drill === "jab")
          correction = correction ?? "That was your rear hand. This drill calls for the lead-hand jab.";
      }

      const leadExtended = leadState.stage === "extended" ||
        leadState.stage === "returning";
      const rearExtended = rearState.stage === "extended" ||
        rearState.stage === "returning";
      if ((leadExtended && !this.inGuard(lm, !leadRight, torso, shoulders)) ||
          (rearExtended && !this.inGuard(lm, leadRight, torso, shoulders))) {
        this.loweredOtherHandFrames++;
        if (this.loweredOtherHandFrames === 4)
          correction = correction ?? "Keep your non-punching hand by your cheek while the other hand extends.";
      } else this.loweredOtherHandFrames = 0;

      if (leadState.stage === "extended" && now - leadState.extensionAt > 900)
        correction = correction ?? "Finish the jab: retract the lead hand all the way to guard.";
      else if (rearState.stage === "extended" && now - rearState.extensionAt > 900)
        correction = correction ?? "Finish the cross: bring your rear hand all the way back to guard.";
    }

    let phase: BoxingSnapshot["phase"] = "guard";
    for (const side of [this.left, this.right]) {
      if (side.stage === "extended") phase = "extended";
      else if (side.stage === "returning" && phase !== "extended") phase = "returning";
      else if (side.stage === "extending" && phase === "guard") phase = "extending";
    }
    const cue = correction ? this.recordCue(correction, now) : null;
    return this.snapshot(confidence, stance, phase, cue, note);
  }

  private inGuard(lm: LM[], right: boolean, torso: number, shoulderSpan: number) {
    const wr = lm[right ? IDX.wrR : IDX.wrL];
    const sh = lm[right ? IDX.shR : IDX.shL];
    const nose = lm[IDX.nose];
    if (Math.min(visibility(wr), visibility(sh), visibility(nose)) < 0.65)
      return false;
    return wr.y <= sh.y + torso * 0.29 &&
      wr.y >= sh.y - torso * 1.5 &&
      Math.abs(wr.x - nose.x) < shoulderSpan * 1.04;
  }

  private step(
    side: Side, lm: LM[], right: boolean, torso: number,
    shoulderSpan: number, now: number, guard: boolean,
  ): boolean {
    const sh = lm[right ? IDX.shR : IDX.shL];
    const el = lm[right ? IDX.elR : IDX.elL];
    const wr = lm[right ? IDX.wrR : IDX.wrL];
    if (Math.min(visibility(sh), visibility(el), visibility(wr)) < 0.65)
      return false;
    const angle = angleAt(sh, el, wr);
    if (angle === null) return false;

    if (guard && angle < 142 && side.stage === "guard") {
      const b = side.guardWrist;
      if (!side.initialized) {
        side.initialized = true;
        side.guardWrist = { x: wr.x, y: wr.y, z: wr.z ?? 0 };
      } else {
        b.x = b.x * 0.85 + wr.x * 0.15;
        b.y = b.y * 0.85 + wr.y * 0.15;
        b.z = b.z * 0.85 + (wr.z ?? 0) * 0.15;
      }
      return false;
    }
    if (!side.initialized) return false;

    const deltaXY = Math.hypot(
      (wr.x - side.guardWrist.x) / Math.max(0.08, shoulderSpan),
      (wr.y - side.guardWrist.y) / Math.max(0.06, torso),
    );
    const deltaDepth = Math.abs((wr.z ?? 0) - side.guardWrist.z) /
      Math.max(0.06, torso);
    const travel = Math.max(deltaXY, deltaDepth);
    const wristPunchHeight = wr.y <= sh.y + torso * 0.48;

    if (side.stage === "guard") {
      if (!guard && angle > 125 && wristPunchHeight && travel > 0.15) {
        side.stage = "extending";
        side.at = now;
      }
    } else if (side.stage === "extending") {
      if (now - side.at > 2200) {
        side.stage = "guard";
      } else if (wristPunchHeight && angle >= 151 && travel > 0.32) {
        side.stage = "extended";
        side.extensionAt = now;
      } else if (guard && angle < 142) {
        side.stage = "guard";
      }
    } else if (side.stage === "extended") {
      if (angle < 145) {
        side.stage = "returning";
        side.at = now;
      } else if (now - side.extensionAt > 2400) {
        side.stage = "guard"; // stale or lost tracking; NEVER count it
      }
    } else {
      if (guard && angle < 144) {
        side.reps++;
        side.stage = "guard";
        side.at = now;
        return true;
      }
      if (now - side.at > 2300) side.stage = "guard";
    }
    return false;
  }

  private recordCue(cue: string, now: number) {
    const issue = this.issues.get(cue);
    this.issues.set(cue, { count: (issue?.count ?? 0) + 1, text: cue });
    if (now - this.lastCueAt < 6500 || (cue === this.lastCue && now - this.lastCueAt < 14000))
      return null;
    this.lastCue = cue;
    this.lastCueAt = now;
    return cue;
  }

  private snapshot(
    confidence: number,
    stance: BoxingSnapshot["stance"],
    phase: BoxingSnapshot["phase"],
    cue: string | null,
    note = "One phone camera cannot measure impact, power, a hidden pivot or unobserved movement.",
  ): BoxingSnapshot {
    return {
      confidence,
      leadPunches: this.stanceChoice === "orthodox" ? this.left.reps : this.right.reps,
      rearPunches: this.stanceChoice === "orthodox" ? this.right.reps : this.left.reps,
      combinations: this.pairs,
      phase,
      stance,
      cue,
      lastCorrection: this.lastCue || null,
      note,
    };
  }
}
