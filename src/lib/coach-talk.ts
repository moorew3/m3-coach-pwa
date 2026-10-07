/**
 * LIVE COACH CONVERSATION
 * ------------------------------------------------------------------
 * Thin client for short, contextual back-and-forth with the trainer.
 * The browser sends only the current workout facts needed to answer the
 * athlete. The OpenAI key remains server-side.
 */

export interface LiveCoachContext {
  athlete?: string;
  workout?: string;
  exercise?: string;
  phase?: string;
  setNumber?: number;
  totalSets?: number;
  target?: string;
  weight?: string;
  reps?: string;
  rpe?: number;
  feel?: string;
  next?: string;
  nutrition?: string;
  camera?: {
    active: boolean;
    confidence?: number;
    reps?: number;
    romAvg?: number;
    symmetry?: number | null;
    cue?: string | null;
  };
  recent?: string[];
  /** Recent athlete/Flex turns so short follow-ups keep their meaning. */
  dialogue?: string[];
}

export async function askLiveCoach(
  message: string,
  context: LiveCoachContext,
): Promise<string | null> {
  const text = message.trim();
  if (!text) return null;
  try {
    const res = await fetch("/api/public/coach-talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, context }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: string };
    return data.reply?.trim() || null;
  } catch {
    return null;
  }
}
