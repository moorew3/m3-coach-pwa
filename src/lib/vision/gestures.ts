/**
 * HAND GESTURE CONTROL
 * ------------------------------------------------------------------
 * A deliberately small, reliable gesture set. Static shapes come from
 * the MediaPipe gesture recogniser; swipes come from wrist travel.
 * Everything is debounced and rate-limited so a held hand cannot fire
 * a command over and over.
 */
export type GestureId = "pauseResume" | "completeSet" | "next" | "previous" | "demo" | "attention";

export const GESTURE_LABEL: Record<GestureId, string> = {
  pauseResume: "open palm — pause / resume",
  completeSet: "thumbs up — complete set",
  next: "swipe right — next",
  previous: "swipe left — previous",
  demo: "peace sign — show the demo",
  attention: "raised hand — repeat the cue",
};

/** Human-readable name of the raw shape, for the live status line. */
export const SHAPE_LABEL: Record<string, string> = {
  Open_Palm: "open palm",
  Thumb_Up: "thumbs up",
  Victory: "peace sign",
  Pointing_Up: "raised hand",
  Closed_Fist: "fist",
};

const HOLD_MS = 700; // static shapes must be held
const COOLDOWN_MS = 1600; // after any gesture fires
const SWIPE_DX = 0.22; // normalised wrist travel
const SWIPE_MS = 600;

interface Trail {
  x: number;
  t: number;
}

export class GestureReader {
  private shape: string | null = null;
  private shapeSince = 0;
  private lastFire = 0;
  private trail: Trail[] = [];
  /** Last recognised shape name for the on-screen status. */
  seen: string | null = null;

  /**
   * @param name  top gesture category from the recogniser ("None" when idle)
   * @param wrist normalised wrist x (0–1) of the tracked hand, if any
   */
  read(name: string | null, wrist: number | null, now = Date.now()): GestureId | null {
    this.seen = name && name !== "None" ? (SHAPE_LABEL[name] ?? null) : null;

    if (wrist !== null) {
      this.trail.push({ x: wrist, t: now });
      this.trail = this.trail.filter((p) => now - p.t < SWIPE_MS);
    } else {
      this.trail = [];
    }

    if (now - this.lastFire < COOLDOWN_MS) return null;

    // swipes take priority: they are a movement, not a pose
    if (this.trail.length > 3) {
      const dx = this.trail[this.trail.length - 1].x - this.trail[0].x;
      if (Math.abs(dx) > SWIPE_DX) {
        this.trail = [];
        this.lastFire = now;
        // camera image is mirrored for the user, so a rightward swipe on
        // screen is a decreasing x in the raw frame
        return dx < 0 ? "next" : "previous";
      }
    }

    if (!name || name === "None") {
      this.shape = null;
      return null;
    }
    if (name !== this.shape) {
      this.shape = name;
      this.shapeSince = now;
      return null;
    }
    if (now - this.shapeSince < HOLD_MS) return null;

    const map: Record<string, GestureId> = {
      Open_Palm: "pauseResume",
      Thumb_Up: "completeSet",
      Victory: "demo",
      Pointing_Up: "attention",
    };
    const id = map[name];
    if (!id) return null;
    this.shape = null;
    this.lastFire = now;
    return id;
  }

  reset() {
    this.shape = null;
    this.trail = [];
  }
}