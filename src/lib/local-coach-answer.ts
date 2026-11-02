/**
 * LOCAL COACH ANSWERS — deterministic and no model / API usage.
 * Never infer movement quality from missing/weak camera observations.
 * The active script and explicit user logs remain authoritative.
 */
import type { LiveCoachContext } from "./coach-talk";

export function localCoachAnswer(question: string, ctx: LiveCoachContext): string | null {
  const q = question.toLowerCase().replace(/[’']/g, "'").trim();
  if (!q) return null;

  // Address immediate safety questions BEFORE conversational or form checks.
  if (/\b(chest pain|can't breathe|cannot breathe|difficulty breathing|fainting|pass(?:ing)? out)\b/.test(q)) {
    return "Stop exercising now. Chest pain, trouble breathing or fainting can be an emergency. Seek urgent medical help.";
  }
  if (/\b(hurt|hurts|hurting|pain|numb|numbness|tingling|dizzy|dizziness|sharp)\b/.test(q)) {
    return "Stop this exercise if you have pain, numbness or dizziness. Do not work through it. Follow your clinician's restrictions, and seek urgent care for severe symptoms.";
  }
  if (/\b(cast|injured (?:foot|leg)|put weight on|stand up)\b/.test(q)) {
    return "Keep the injured leg and cast fully supported. Do not bear weight or change your transfer position unless your clinician has cleared it.";
  }

  if (/\b(form|posture|technique|look right|look okay|doing (?:it|this) right|can you see me|see my movement)\b/.test(q)) {
    if (!ctx.camera?.active) {
      return "I don't have an active camera measurement. I can't verify your form. Use the approved movement demo and stay within your cleared range.";
    }
    if ((ctx.camera.confidence ?? 0) < 0.7) {
      return "The camera signal isn't reliable enough to judge your form. Adjust the view only if safe, and do not treat a guessed rep count as confirmed.";
    }
    if (ctx.camera.cue?.trim()) {
      return `Camera estimate: ${ctx.camera.cue.trim()} This is guidance, not a verified physical assessment.`;
    }
    return "The camera is tracking, but it hasn't produced a specific reliable form cue. I can't confirm that the movement is correct.";
  }

  if (/\b(what(?:'s| is) next|next exercise|next move|what comes next|after this)\b/.test(q)) {
    return ctx.next?.trim() ? `The workout script has ${ctx.next.trim()} next.` : "The next step is not recorded in the current coach state.";
  }

  if (/\b(rest|break|recover|how much (?:time|longer)|time left|countdown)\b/.test(q)) {
    const remaining = ctx.restRemainingSeconds;
    if (ctx.phase === "rest" && Number.isFinite(remaining) && remaining! >= 0) {
      return `You're resting. About ${Math.ceil(remaining!)} seconds remain on the current timer.`;
    }
    if (ctx.phase === "rest") return "You're in a rest interval. Follow the visible countdown and do not rush the next set.";
    return "The app will start the programmed rest after the last exercise in a superset pair. Follow the on-screen timer.";
  }

  if (/\b(sets? left|sets? remaining|which set|what set|how many sets|rounds? left|round are we on)\b/.test(q)) {
    const total = ctx.totalSets;
    const current = ctx.setNumber;
    if (total && current && total >= current) {
      return `You're on set ${current} of ${total} for ${ctx.exercise || "this movement"}. ${total - current} ${total - current === 1 ? "set" : "sets"} remain after this one.`;
    }
    return "The current set count isn't available from this step. Check the set indicator before logging.";
  }

  if (/\b(how many reps|rep target|how many repetitions|target reps|what reps)\b/.test(q)) {
    return ctx.target?.trim()
      ? `The prescribed target for ${ctx.exercise || "this movement"} is ${ctx.target.trim()}. Log what you actually complete.`
      : "The current rep target isn't available in the workout state.";
  }

  if (/\b(what weight|how heavy|how much weight|what load|which dumbbell)\b/.test(q)) {
    return ctx.weight?.trim()
      ? `The currently entered weight is ${ctx.weight.trim()}. Check the units displayed on your workout screen.`
      : "No weight is entered for this set. Choose only a weight permitted by your current restrictions.";
  }

  if (/\b(what exercise|what movement|what are we doing|what am i doing|which exercise)\b/.test(q)) {
    return ctx.exercise?.trim()
      ? `This step is ${ctx.exercise.trim()}.${ctx.target?.trim() ? ` The target is ${ctx.target.trim()}.` : ""}`
      : "I don't have a verified movement name for this step.";
  }

  if (/\b(why|how do i|how should i|what should i focus on|give me a cue|remind me how)\b/.test(q)) {
    const cue = ctx.cues?.find((x) => x.trim());
    if (cue) return `For ${ctx.exercise || "this step"}, use this programmed cue: ${cue.trim()}`;
    return null;
  }

  if (/\b(should i increase|go heavier|add weight|raise the weight|progress the weight)\b/.test(q)) {
    return "Do not increase weight from one camera reading or a hard set alone. Follow the prescribed rep range and your clinician's restrictions; only progress after consistently controlled sets.";
  }

  return null;
}
