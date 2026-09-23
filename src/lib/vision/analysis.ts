/**
 * MOVEMENT ANALYSIS
 * ------------------------------------------------------------------
 * Turns pose landmarks into a small set of things a single phone
 * camera can honestly measure: rep count, rep phase, a key joint
 * angle / range of motion, tempo, obvious left-right drift and a
 * confidence score.
 *
 * Rules are deliberately conservative. When the camera cannot see the
 * joints a pattern depends on, confidence drops and the analyser
 * refuses to produce form cues — the coach then says he cannot judge
 * the movement instead of guessing.
 *
 * This is coaching feedback from visible body position only. It is not
 * a medical or injury assessment.
 */
import type { PatternId } from "./patterns";

export interface LM {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type Phase = "idle" | "top" | "lowering" | "bottom" | "rising";

export interface MoveMetrics {
  pattern: PatternId;
  reps: number;
  phase: Phase;
  /** Key joint angle right now, degrees. */
  angle: number;
  /** Range of motion of the last completed rep, degrees. */
  rom: number;
  /** Mean ROM across the set. */
  romAvg: number;
  /** Seconds for the lowering and the lifting half of the last rep. */
  tempoDown: number;
  tempoUp: number;
  /** 0–1; 1 = both sides matched. null when only one side is visible. */
  symmetry: number | null;
  /** 0–1 tracking confidence for the joints this pattern needs. */
  confidence: number;
  /** Newest coaching cue, if one is warranted. */
  cue: string | null;
  /** Notable cues seen during this set, most useful first. */
  cues: string[];
}

export const IDX = {
  nose: 0,
  shL: 11,
  shR: 12,
  elL: 13,
  elR: 14,
  wrL: 15,
  wrR: 16,
  hipL: 23,
  hipR: 24,
  knL: 25,
  knR: 26,
  ankL: 27,
  ankR: 28,
} as const;

const vis = (l?: LM) => (l ? (l.visibility ?? 1) : 0);

export function angleAt(a?: LM, b?: LM, c?: LM): number | null {
  if (!a || !b || !c) return null;
  const abx = a.x - b.x,
    aby = a.y - b.y,
    cbx = c.x - b.x,
    cby = c.y - b.y;
  const dot = abx * cbx + aby * cby;
  const m = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (!m) return null;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
}

/** Which joints each pattern needs to see, and how it reads a rep. */
interface Spec {
  /** Landmarks that must be visible for any judgement at all. */
  needs: number[];
  /** Per-side key angle. */
  side: (lm: LM[], right: boolean) => number | null;
  /** True when the "contracted" end of the rep is the SMALLER angle. */
  contractedIsLow: boolean;
  /** Angle at the contracted end that counts as a full rep. */
  deep: number;
  /** Angle at the extended end that counts as a reset. */
  open: number;
  /** Per-side reps (punches, alternating steps) instead of both together. */
  perSide?: boolean;
}

const SPECS: Record<PatternId, Spec> = {
  squat: {
    needs: [IDX.hipL, IDX.hipR, IDX.knL, IDX.knR, IDX.ankL, IDX.ankR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.hipR : IDX.hipL], lm[r ? IDX.knR : IDX.knL], lm[r ? IDX.ankR : IDX.ankL]),
    contractedIsLow: true,
    deep: 105,
    open: 160,
  },
  lunge: {
    needs: [IDX.hipL, IDX.hipR, IDX.knL, IDX.knR, IDX.ankL, IDX.ankR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.hipR : IDX.hipL], lm[r ? IDX.knR : IDX.knL], lm[r ? IDX.ankR : IDX.ankL]),
    contractedIsLow: true,
    deep: 110,
    open: 158,
  },
  curl: {
    needs: [IDX.shL, IDX.shR, IDX.elL, IDX.elR, IDX.wrL, IDX.wrR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.shR : IDX.shL], lm[r ? IDX.elR : IDX.elL], lm[r ? IDX.wrR : IDX.wrL]),
    contractedIsLow: true,
    deep: 65,
    open: 150,
  },
  row: {
    needs: [IDX.shL, IDX.shR, IDX.elL, IDX.elR, IDX.wrL, IDX.wrR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.shR : IDX.shL], lm[r ? IDX.elR : IDX.elL], lm[r ? IDX.wrR : IDX.wrL]),
    contractedIsLow: true,
    deep: 80,
    open: 150,
  },
  press: {
    needs: [IDX.shL, IDX.shR, IDX.elL, IDX.elR, IDX.wrL, IDX.wrR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.shR : IDX.shL], lm[r ? IDX.elR : IDX.elL], lm[r ? IDX.wrR : IDX.wrL]),
    contractedIsLow: false,
    deep: 90,
    open: 155,
  },
  /* lateral / rear-delt raise: the angle that matters is the arm opening
     away from the torso (elbow–shoulder–hip), not the elbow bend. */
  raise: {
    needs: [IDX.shL, IDX.shR, IDX.elL, IDX.elR, IDX.hipL, IDX.hipR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.elR : IDX.elL], lm[r ? IDX.shR : IDX.shL], lm[r ? IDX.hipR : IDX.hipL]),
    contractedIsLow: false,
    deep: 25,
    open: 78,
  },
  punch: {
    needs: [IDX.shL, IDX.shR, IDX.elL, IDX.elR, IDX.wrL, IDX.wrR],
    side: (lm, r) =>
      angleAt(lm[r ? IDX.shR : IDX.shL], lm[r ? IDX.elR : IDX.elL], lm[r ? IDX.wrR : IDX.wrL]),
    contractedIsLow: false,
    deep: 100,
    open: 150,
    perSide: true,
  },
};

interface SideState {
  phase: Phase;
  partial: boolean;
  startAngle: number;
  extreme: number;
  start: number;
  downMs: number;
  upMs: number;
  reps: number;
  lastRom: number;
  romSum: number;
}

const blankSide = (): SideState => ({
  phase: "idle",
  partial: false,
  startAngle: 0,
  extreme: 0,
  start: 0,
  downMs: 0,
  upMs: 0,
  reps: 0,
  lastRom: 0,
  romSum: 0,
});

/**
 * One analyser per set. Feed it landmarks; it keeps the rep state
 * machine and emits cues only when a pattern actually persists.
 */
export class MoveAnalyzer {
  readonly pattern: PatternId;
  private spec: Spec;
  private left = blankSide();
  private right = blankSide();
  private conf = 0;
  private angleNow = 0;
  private symNow: number | null = null;
  private cueAt = 0;
  private cueList: string[] = [];
  private lastCue: string | null = null;
  private lowSince = 0;
  private goodStreak = 0;
  private shallowStreak = 0;
  private fastStreak = 0;
  private guardMiss = 0;

  constructor(pattern: PatternId) {
    this.pattern = pattern;
    this.spec = SPECS[pattern];
  }

  /** @returns a fresh metrics snapshot (never throws on bad input). */
  push(lm: LM[] | null, now = Date.now()): MoveMetrics {
    const s = this.spec;
    if (!lm || lm.length < 29) {
      this.conf = 0;
      return this.snapshot(now, null);
    }
    const seen = s.needs.map((i) => vis(lm[i]));
    this.conf = seen.reduce((a, b) => a + b, 0) / seen.length;
    const weak = Math.min(...seen) < 0.4;

    const aL = s.side(lm, false);
    const aR = s.side(lm, true);
    if (aL !== null) this.step(this.left, aL, now);
    if (aR !== null) this.step(this.right, aR, now);

    const both = [aL, aR].filter((v): v is number => v !== null);
    this.angleNow = both.length ? both.reduce((a, b) => a + b, 0) / both.length : 0;
    this.symNow = aL !== null && aR !== null ? Math.max(0, 1 - Math.abs(aL - aR) / 60) : null;

    if (weak || this.conf < 0.55) {
      if (!this.lowSince) this.lowSince = now;
      return this.snapshot(now, null);
    }
    this.lowSince = 0;
    return this.snapshot(now, this.judge(lm, now));
  }

  /** Rep state machine on one side's key angle. */
  private step(st: SideState, angle: number, now: number) {
    const s = this.spec;
    /* if a phase stalls the person has stopped — start clean rather than
       holding a half rep open forever */
    if (st.phase !== "top" && st.phase !== "idle" && now - st.start > 8000) {
      st.phase = "idle";
      st.partial = false;
    }
    const contracted = s.contractedIsLow ? angle <= s.deep : angle >= s.open;
    const extended = s.contractedIsLow ? angle >= s.open : angle <= s.deep;

    if (st.phase === "idle") {
      st.phase = extended ? "top" : "lowering";
      st.extreme = angle;
      st.startAngle = angle;
      st.start = now;
      return;
    }
    if (st.phase === "top") {
      /* remember the resting angle — depth is judged against it */
      st.startAngle = st.startAngle
        ? s.contractedIsLow
          ? Math.max(st.startAngle, angle)
          : Math.min(st.startAngle, angle)
        : angle;
      if (!extended) {
        st.phase = "lowering";
        st.start = now;
        st.extreme = angle;
      }
      return;
    }
    if (st.phase === "lowering") {
      st.extreme = s.contractedIsLow ? Math.min(st.extreme, angle) : Math.max(st.extreme, angle);
      if (contracted) {
        st.partial = false;
        st.phase = "bottom";
        st.downMs = now - st.start;
        st.start = now;
        return;
      }
      /* a short rep that turned around early still counts — as a partial,
         which is exactly what earns the "go deeper" cue */
      const travelled = Math.abs(st.extreme - st.startAngle);
      const turned = s.contractedIsLow ? angle > st.extreme + 10 : angle < st.extreme - 10;
      if (turned && travelled > 22) {
        st.partial = true;
        st.phase = "bottom";
        st.downMs = now - st.start;
        st.start = now;
      }
      return;
    }
    if (st.phase === "bottom") {
      st.extreme = s.contractedIsLow ? Math.min(st.extreme, angle) : Math.max(st.extreme, angle);
      const leaving = st.partial
        ? true
        : s.contractedIsLow
          ? angle > s.deep + 8
          : angle < s.open - 8;
      if (leaving) {
        st.phase = "rising";
        st.start = now;
      }
      return;
    }
    // rising
    if (extended) {
      st.upMs = now - st.start;
      st.reps += 1;
      st.lastRom = Math.abs((s.contractedIsLow ? s.open : s.deep) - st.extreme);
      st.romSum += st.lastRom;
      st.phase = "top";
      st.partial = false;
      st.start = now;
      st.extreme = angle;
      st.startAngle = angle;
    }
  }

  /** Conservative, explainable cues from what is actually visible. */
  private judge(lm: LM[], now: number): string | null {
    const both = this.spec.perSide ? Math.max(this.left.reps, this.right.reps) : this.reps();
    const lastRom = Math.max(this.left.lastRom, this.right.lastRom);
    const down = Math.max(this.left.downMs, this.right.downMs) / 1000;

    let cue: string | null = null;

    if (this.symNow !== null && this.symNow < 0.6) {
      cue = "Your right side is drifting — even them out.";
    } else if (this.pattern === "punch") {
      const guardL = (lm[IDX.wrL]?.y ?? 1) < (lm[IDX.shL]?.y ?? 0) + 0.05;
      const guardR = (lm[IDX.wrR]?.y ?? 1) < (lm[IDX.shR]?.y ?? 0) + 0.05;
      const resting = this.left.phase === "top" && this.right.phase === "top";
      if (resting && !guardL && !guardR) {
        this.guardMiss += 1;
        if (this.guardMiss > 6) cue = "Bring your hands back to guard.";
      } else this.guardMiss = 0;
    } else if (both > 0 && lastRom > 0) {
      const shallow =
        lastRom <
        (this.pattern === "squat" || this.pattern === "lunge"
          ? 45
          : this.pattern === "raise"
            ? 42
            : 55);
      if (shallow) {
        this.shallowStreak += 1;
        this.goodStreak = 0;
        if (this.shallowStreak >= 2) cue = "Go a little deeper — full range.";
      } else if (down > 0 && down < 0.5) {
        this.fastStreak += 1;
        if (this.fastStreak >= 2) cue = "Slow the lowering — three seconds down.";
      } else {
        const improved = this.shallowStreak > 0;
        this.shallowStreak = 0;
        this.fastStreak = 0;
        this.goodStreak += 1;
        if (improved) cue = "That rep was cleaner — hold that.";
        else if (this.goodStreak === 3) cue = "Good reps. Hold that tempo.";
      }
    }

    if ((this.pattern === "curl" || this.pattern === "press") && !cue) {
      const drift =
        Math.abs((lm[IDX.elL]?.x ?? 0) - (lm[IDX.shL]?.x ?? 0)) > 0.16 ||
        Math.abs((lm[IDX.elR]?.x ?? 0) - (lm[IDX.shR]?.x ?? 0)) > 0.16;
      if (drift && this.phase() !== "idle") cue = "Keep your elbows steadier.";
    }

    if (!cue) return null;
    if (cue === this.lastCue && now - this.cueAt < 12000) return null;
    if (now - this.cueAt < 4000) return null;
    this.lastCue = cue;
    this.cueAt = now;
    if (!this.cueList.includes(cue)) this.cueList = [cue, ...this.cueList].slice(0, 4);
    return cue;
  }

  private reps() {
    return Math.max(this.left.reps, this.right.reps);
  }

  private phase(): Phase {
    const l = this.left.phase;
    const r = this.right.phase;
    return l === r ? l : this.left.reps >= this.right.reps ? l : r;
  }

  private snapshot(_now: number, cue: string | null): MoveMetrics {
    const reps = this.spec.perSide ? this.left.reps + this.right.reps : this.reps();
    const romReps = Math.max(1, this.reps());
    return {
      pattern: this.pattern,
      reps,
      phase: this.conf < 0.55 ? "idle" : this.phase(),
      angle: Math.round(this.angleNow),
      rom: Math.round(Math.max(this.left.lastRom, this.right.lastRom)),
      romAvg: Math.round(Math.max(this.left.romSum, this.right.romSum) / romReps),
      tempoDown: +(Math.max(this.left.downMs, this.right.downMs) / 1000).toFixed(1),
      tempoUp: +(Math.max(this.left.upMs, this.right.upMs) / 1000).toFixed(1),
      symmetry: this.symNow === null ? null : +this.symNow.toFixed(2),
      confidence: +this.conf.toFixed(2),
      cue,
      cues: this.cueList,
    };
  }
}

export const emptyMetrics = (pattern: PatternId): MoveMetrics => ({
  pattern,
  reps: 0,
  phase: "idle",
  angle: 0,
  rom: 0,
  romAvg: 0,
  tempoDown: 0,
  tempoUp: 0,
  symmetry: null,
  confidence: 0,
  cue: null,
  cues: [],
});