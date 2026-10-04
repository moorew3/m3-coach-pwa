/**
 * Conservative camera-visible kick cycle tracker.
 * Counts a FRONT-KICK chamber -> extension -> grounded return only when the
 * foot and leg are clearly visible. For ROUND-KICK it counts a visible leg
 * cycle, NOT a verified pivot, impact, hip rotation, or technical score.
 * One phone camera cannot reliably establish depth, foot pivot or contact.
 */
import { angleAt, IDX, type LM } from "@/lib/vision/analysis";

export type KickKind = "frontKick" | "roundKick";
type Stage = "ready" | "chamber" | "extended" | "retracting";

type Side = {
  stage: Stage;
  baselineKneeY: number | null;
  baselineAnkleY: number | null;
  at: number;
  reps: number;
};
export type KickSnapshot = {
  reps: number;
  phase: "waiting" | "ready" | "chamber" | "extended" | "returning";
  confidence: number;
  cue: string | null;
  note: string;
};

const side = (): Side => ({
  stage: "ready",
  baselineKneeY: null,
  baselineAnkleY: null,
  at: 0,
  reps: 0,
});
const visibility = (p?: LM) => p?.visibility ?? (p ? 1 : 0);

export class KickTracker {
  private left = side();
  private right = side();
  private lastCueAt = 0;
  private unguardedFrames = 0;
  constructor(private readonly kind: KickKind) {}

  update(lm: LM[] | null, now = Date.now()): KickSnapshot {
    const note =
      this.kind === "roundKick"
        ? "Leg cycle only: this single camera cannot verify hip rotation, support-foot pivot or impact."
        : "Visible chamber, leg extension and controlled return only; no impact or injury assessment.";
    if (!lm || lm.length < 29)
      return { reps: this.total(), phase: "waiting", confidence: 0, cue: null, note };

    const torsoL = Math.abs(lm[IDX.hipL].y - lm[IDX.shL].y);
    const torsoR = Math.abs(lm[IDX.hipR].y - lm[IDX.shR].y);
    const scale = Math.max(0.08, (torsoL + torsoR) / 2);
    const needed = [
      IDX.hipL, IDX.hipR, IDX.knL, IDX.knR, IDX.ankL, IDX.ankR,
      IDX.shL, IDX.shR,
    ];
    const conf = Math.min(...needed.map((i) => visibility(lm[i])));
    if (conf < 0.6) {
      this.unguardedFrames = 0;
      return { reps: this.total(), phase: "waiting", confidence: conf, cue: null,
        note: "Step back until shoulders, hips, knees and feet are visible." };
    }

    this.advance(this.left, lm, false, scale, now);
    this.advance(this.right, lm, true, scale, now);

    const guardL =
      visibility(lm[IDX.wrL]) > 0.6 &&
      lm[IDX.wrL].y < lm[IDX.shL].y + scale * 0.35;
    const guardR =
      visibility(lm[IDX.wrR]) > 0.6 &&
      lm[IDX.wrR].y < lm[IDX.shR].y + scale * 0.35;
    const wristsVisible =
      visibility(lm[IDX.wrL]) > 0.6 && visibility(lm[IDX.wrR]) > 0.6;
    // A hidden wrist is "cannot judge", not evidence that guard was dropped.
    this.unguardedFrames = wristsVisible && !guardL && !guardR
      ? this.unguardedFrames + 1
      : 0;
    let cue: string | null = null;
    if (this.unguardedFrames >= 12 && now - this.lastCueAt > 7000) {
      cue = "Bring both hands back up to guard during the kick.";
      this.lastCueAt = now;
      this.unguardedFrames = 0;
    }

    const active = [this.left.stage, this.right.stage];
    const phase = active.includes("extended")
      ? "extended"
      : active.includes("retracting")
        ? "returning"
        : active.includes("chamber")
          ? "chamber"
          : "ready";
    return { reps: this.total(), phase, confidence: conf, cue, note };
  }

  private total() {
    return this.left.reps + this.right.reps;
  }

  private advance(
    state: Side, lm: LM[], right: boolean, scale: number, now: number,
  ) {
    const hip = lm[right ? IDX.hipR : IDX.hipL];
    const knee = lm[right ? IDX.knR : IDX.knL];
    const ankle = lm[right ? IDX.ankR : IDX.ankL];
    const kneeAngle = angleAt(hip, knee, ankle);
    if (kneeAngle === null) return;

    if (state.baselineKneeY === null) state.baselineKneeY = knee.y;
    if (state.baselineAnkleY === null) state.baselineAnkleY = ankle.y;
    const kneeLift = (state.baselineKneeY - knee.y) / scale;
    const footLift = (state.baselineAnkleY - ankle.y) / scale;
    const planted = Math.abs(footLift) < 0.25;

    if (state.stage === "ready") {
      if (kneeAngle > 150 && planted) {
        state.baselineKneeY = state.baselineKneeY * 0.98 + knee.y * 0.02;
        state.baselineAnkleY = state.baselineAnkleY * 0.98 + ankle.y * 0.02;
      }
      if (kneeAngle < 125 && kneeLift > 0.24 && footLift > 0.18) {
        state.stage = "chamber";
        state.at = now;
      }
    } else if (state.stage === "chamber") {
      if (now - state.at > 3500 || (planted && kneeAngle > 145)) {
        state.stage = "ready";
      } else if (kneeAngle > 148 && footLift > 0.23) {
        state.stage = "extended";
        state.at = now;
      }
    } else if (state.stage === "extended") {
      // A kick is NOT finished at extension or when the foot drops. We need
      // to see a controlled re-chamber before grounded return.
      if (now - state.at > 3500) {
        state.stage = "ready";
      } else if (kneeAngle < 138 && footLift > 0.18) {
        state.stage = "retracting";
        state.at = now;
      }
    } else {
      if (now - state.at > 3500) {
        state.stage = "ready";
      } else if (planted && kneeAngle > 145) {
        state.reps += 1;
        state.stage = "ready";
        state.at = now;
      }
    }
  }
}
