/**
 * Small, strictly no-AI fallback for common everyday conversation.
 * Never pretend to offer arbitrary open-ended conversation or speak in an
 * unapproved voice. A real on-device language model handles open-ended topics
 * once the user explicitly enables it.
 */
export interface EverydayTurn { role: "user" | "assistant"; content: string }

export function everydayFallback(question: string, prior: EverydayTurn[] = []): string | null {
  const q = question.trim().toLowerCase().replace(/[’']/g, "'");
  if (!q) return null;
  const previousUser = [...prior].reverse().find(x => x.role === "user")?.content.toLowerCase() || "";
  if (/^(hi|hey|hello|yo|what's up|sup|good morning|good afternoon|good evening|hey flex|hello flex)[!?. ]*$/.test(q))
    return "Hey! I'm here. Want to tell me about your day, talk about something interesting, or get into training?";
  if (/\b(how are you|how's it going|what's up with you|how have you been)\b/.test(q))
    return "I'm ready to talk. How has your day been going?";
  if (/\b(bad day|rough day|hard day|stressed|overwhelmed|frustrated|upset)\b/.test(q))
    return "Sounds like you've had a lot going on. Want to tell me what happened, or would you rather switch to something lighter?";
  if (/\b(good day|great day|awesome day|feeling good|feeling great|excited)\b/.test(q))
    return "Nice. What was the best part?";
  if (/\b(tell me a joke|make me laugh|say something funny|joke)\b/.test(q))
    return "Why did the dumbbell take a day off? It needed to get a little weight off its shoulders. Want another topic or a different kind of joke?";
  if (/\b(who are you|what's your name|what is your name)\b/.test(q))
    return "I'm Flex, your fitness and everyday conversation assistant. Marcus is the approved voice for my recorded workout coaching. We can talk about more than exercise.";
  if (/\b(thanks|thank you|appreciate it)\b/.test(q))
    return "You're welcome. What else is on your mind?";
  if (/\b(can we talk|let's talk|just chat|chat with me|i want to talk|keep me company)\b/.test(q)) {
    if (/family|work|business|music|movies|sports|life|my day/.test(q))
      return "Absolutely. What about that would you like to get into?";
    return "Absolutely. Pick any subject—your day, family, music, sports, work, or something you're curious about.";
  }
  if (/\b(what can you do|can you talk about anything|are you only a trainer)\b/.test(q))
    return "We can talk about everyday life, training, food, work, interests, and more. For genuinely open-ended questions and natural follow-ups, enable the optional on-device AI. Without it, I can only answer familiar questions and verified fitness logs.";
  if (/^(why|how so|tell me more|what do you mean)[?.! ]*$/.test(q) && /bad day|rough day|hard day|stressed|overwhelmed|frustrated/.test(previousUser))
    return "If you're up for it, I'm interested in what made the day difficult. We don't have to turn it into a workout conversation.";
  return null;
}
