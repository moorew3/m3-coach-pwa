/**
 * DYNAMIC CUE ENGINE
 * ------------------------------------------------------------------
 * Short, situational trainer lines tied to the workout phase and to
 * real tracking events — never a long prerecorded track. Everything is
 * throttled so the coach sounds like a trainer, not a chatterbox, and
 * a cue is only spoken when the data genuinely supports it.
 */
import type { MoveMetrics } from "@/lib/vision/analysis";
import type { WorkoutPhase } from "@/lib/workout-phase";
import type { TrackingRules } from "@/lib/exercise-player";

export type CueId =
  | "goodRep"
  | "slowDown"
  | "chestUp"
  | "followPace"
  | "fullRange"
  | "twoMore"
  | "lastRep"
  | "greatSet"
  | "restNow"
  | "nextExercise"
  | "cantSee";

export interface Cue {
  id: CueId;
  text: string;
  tone: "instructional" | "reassuring" | "hype";
}

const pick = (a: string[]) => a[Math.floor(Math.random() * a.length)];

const LINES: Record<CueId, string[]> = {
  goodRep: ["Good rep.", "That's it.", "Nice and clean."],
  slowDown: ["Slow it down — control the way down.", "Easy on the tempo, three seconds down."],
  chestUp: ["Chest up.", "Tall through the chest.", "Ribs down, chest proud."],
  followPace: ["Match my pace.", "Follow my pace — same speed.", "Stay with my rhythm."],
  fullRange: ["Full range — all the way up.", "Give me the full range on that."],
  twoMore: ["Two more.", "Two left — stay tight."],
  lastRep: ["Last rep. Make it the best one.", "This is the last one — finish it clean."],
  greatSet: ["Great set.", "That's the set — good work."],
  restNow: ["Rest.", "Breathe. Rest up."],
  nextExercise: ["Next exercise.", "We're moving on."],
  cantSee: ["I can't see you clearly — I'll hold off on form calls."],
};

/** Minimum gap between two spoken cues of the same id, ms. */
const COOLDOWN: Record<CueId, number> = {
  goodRep: 12000,
  slowDown: 15000,
  chestUp: 18000,
  followPace: 20000,
  fullRange: 18000,
  twoMore: 60000,
  lastRep: 60000,
  greatSet: 5000,
  restNow: 5000,
  nextExercise: 5000,
  cantSee: 30000,
};

export interface CueContext {
  phase: WorkoutPhase;
  metrics: MoveMetrics | null;
  rules: TrackingRules;
  /** Top of the programmed rep target, when there is one. */
  repTarget: number | null;
  /** Pace verdict from the shared tempo model. */
  pace?: "ahead" | "onPace" | "behind" | "unknown";
  restSeconds?: number;
}

export class CueEngine {
  private last: Partial<Record<CueId, number>> = {};
  private lastReps = 0;

  reset() {
    this.last = {};
    this.lastReps = 0;
  }

  private ready(id: CueId, now: number) {
    const t = this.last[id] ?? 0;
    if (now - t < COOLDOWN[id]) return false;
    this.last[id] = now;
    return true;
  }

  private make(id: CueId, now: number, text?: string): Cue | null {
    if (!this.ready(id, now)) return null;
    const tone: Cue["tone"] =
      id === "greatSet" || id === "lastRep"
        ? "hype"
        : id === "restNow"
          ? "reassuring"
          : "instructional";
    return { id, text: text ?? pick(LINES[id]), tone };
  }

  /** Called on every tracking tick during a set. Returns at most one cue. */
  tick(ctx: CueContext, now = Date.now()): Cue | null {
    if (ctx.phase !== "ACTIVE_SET" && ctx.phase !== "WARMUP") return null;
    const m = ctx.metrics;
    if (!m) return null;

    if (m.confidence < ctx.rules.minConfidence) return this.make("cantSee", now);

    const reps = m.reps;
    const newRep = reps > this.lastReps;
    this.lastReps = reps;

    if (ctx.repTarget && reps > 0) {
      const left = ctx.repTarget - reps;
      if (left === 1) return this.make("lastRep", now);
      if (left === 2) return this.make("twoMore", now);
    }
    if (!newRep) return null;

    // Real, measured faults first — praise only when nothing is off.
    const half = Math.max(m.tempoDown, m.tempoUp);
    if (ctx.rules.paceTargetSec && half > 0 && half < ctx.rules.paceTargetSec * 0.6)
      return this.make("slowDown", now);
    if (ctx.pace === "ahead" || ctx.pace === "behind") return this.make("followPace", now);
    if (ctx.rules.romTargetDeg && m.rom > 0 && m.rom < ctx.rules.romTargetDeg * 0.7)
      return this.make(
        m.pattern === "squat" || m.pattern === "lunge" ? "chestUp" : "fullRange",
        now,
      );
    if (m.cue) return this.make("goodRep", now, m.cue);
    return this.make("goodRep", now);
  }

  /** Called once when a set closes. */
  setFinished(now = Date.now()): Cue | null {
    this.lastReps = 0;
    return this.make("greatSet", now);
  }

  /** Called once when rest opens. */
  restStarted(seconds?: number, now = Date.now()): Cue | null {
    return this.make("restNow", now, seconds ? `Rest ${seconds} seconds.` : undefined);
  }

  /** Called once when the next movement is armed. */
  nextExercise(name?: string, now = Date.now()): Cue | null {
    return this.make("nextExercise", now, name ? `Next exercise — ${name}.` : undefined);
  }
}