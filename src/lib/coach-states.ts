/**
 * COACH STATES — what the trainer is doing right now.
 * ------------------------------------------------------------------
 * The approved coach is on screen for the whole session. This maps the
 * current script step onto a small set of readable states so the UI can
 * label the coach honestly ("Watching your form", "Resting with you")
 * without generating any new media. Purely local + reusable.
 */
export type CoachStateId =
  | "ready"
  | "demonstrating"
  | "training"
  | "observing"
  | "encouraging"
  | "rest"
  | "transition"
  | "celebrate";

export interface CoachState {
  id: CoachStateId;
  /** Short chip label shown on the coach tile. */
  label: string;
  /** One-line description of what the coach is doing. */
  detail: string;
}

const STATES: Record<CoachStateId, Omit<CoachState, "id">> = {
  ready: { label: "Listen in", detail: "Talking you through the plan." },
  demonstrating: { label: "Watch me", detail: "Showing you the movement." },
  training: { label: "With you", detail: "Doing the set with you — match his pace." },
  observing: { label: "Watching you", detail: "Counting reps and checking your range." },
  encouraging: { label: "With you", detail: "Calling the reps and keeping you honest." },
  rest: { label: "Rest", detail: "Coaching the rest and setting up the next set." },
  transition: { label: "Next up", detail: "Moving you to what's next." },
  celebrate: { label: "Recap", detail: "Going through what you actually did." },
};

export function coachStateFor(
  step: { kind: string; seconds?: number } | undefined,
  opts: {
    cameraOn?: boolean;
    speaking?: boolean;
    demoVisible?: boolean;
    /** A verified coach motion clip is playing for this movement. */
    coachClip?: boolean;
  } = {},
): CoachState {
  const kind = step?.kind ?? "intro";
  let id: CoachStateId = "ready";
  if (kind === "work" || kind === "cooldown")
    id = opts.coachClip ? "training" : opts.cameraOn ? "observing" : "encouraging";
  else if (kind === "rest") id = "rest";
  else if (kind === "complete" || kind === "recap") id = "celebrate";
  else if (kind === "brief" || kind === "demo") id = opts.demoVisible ? "demonstrating" : "ready";
  else if (kind === "transition" || kind === "prompt") id = "transition";
  return { id, ...STATES[id] };
}