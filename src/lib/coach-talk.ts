/**
 * LIVE COACH CONVERSATION
 * ------------------------------------------------------------------
 * Thin client for short, contextual back-and-forth with the trainer.
 * The browser sends only the current workout facts needed to answer the
 * athlete. The OpenAI key remains server-side.
 */

import { paidAiHeaders } from "@/lib/paid-ai-client";
import { localCoachAnswer } from "@/lib/local-coach-answer";

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
  /** On-screen script cues only; never invented by the responder. */
  cues?: string[];
  restRemainingSeconds?: number;
}

/** Build-time opt-in. The server independently requires authorized access. */
export function premiumAiAvailableOnClient(): boolean {
  return import.meta.env["VITE_FLEX_PAID_AI_ENABLED"] === "true";
}

export async function askLiveCoach(
  message: string,
  context: LiveCoachContext,
): Promise<string | null> {
  const text = message.trim();
  if (!text) return null;
  const local = localCoachAnswer(text, context);
  if (local) return local;
  if (!premiumAiAvailableOnClient()) {
    return "I can answer questions about this exercise, its sets, reps, next move, rest timer, and camera readings. More open-ended coaching requires live AI, which is currently off.";
  }
  try {
    const res = await fetch("/api/public/coach-talk", {
      method: "POST",
      headers: await paidAiHeaders(),
      body: JSON.stringify({ message: text, context }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { reply?: string };
    return data.reply?.trim() || null;
  } catch {
    return null;
  }
}
