/**
 * Small, strictly no-AI fallback for common everyday conversation.
 * Never pretend to offer arbitrary open-ended conversation or speak in an
 * unapproved voice. A real on-device language model handles open-ended topics
 * once the user explicitly enables it.
 */
export interface EverydayTurn { role: "user" | "assistant"; content: string }

export function everydayFallback(question: string, prior: EverydayTurn[] = []): string | null {
  const raw = question.trim().toLowerCase().replace(/[’']/g, "'");
  if (!raw) return null;
  // The athlete calls the avatar "Marcus" as well as "Flex". Both are
  // recognized as natural forms of address, without renaming the avatar
  // or substituting the approved Marcus voice.
  const q = raw
    .replace(/^(?:(?:hey|hi|hello)[,\s]+)?(?:marcus|flex|coach)[,:\s]+/, "")
    .replace(/(?:,\s*|\s+)(?:marcus|flex|coach)(?=[.!?,\s]*$)/, "")
    .trim();
  const previousUser = [...prior].reverse().find(x => x.role === "user")?.content.toLowerCase() || "";
  if (/^(?:hi|hey|hello|yo|what's up|sup|good morning|morning|good afternoon|afternoon|good evening|evening|good night|night)[!?. ,]*$/.test(q) || /^(?:flex|marcus|coach)[!?. ,]*$/.test(raw))
    return /morning/.test(q)
      ? "Good morning! I'm here. How's your morning going?"
      : /afternoon/.test(q)
        ? "Good afternoon! How's your day going?"
        : /evening|night/.test(q)
          ? "Hey, good evening! How has your day been?"
          : "Hey! I'm here. Want to tell me about your day, talk about something interesting, or get into training?";
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
  if (/\b(i'm (?:okay|ok|fine|good|doing well|all right|alright)|not bad|pretty good|could be better)\b/.test(q))
    return "Good to hear from you. Anything you want to talk about today?";
  if (/\b(i (?:just )?woke up|starting my day|getting ready for (?:work|the day)|just got home)\b/.test(q))
    return "What's on your agenda? We can talk first or pick up your training whenever you're ready.";
  if (/\b(i'm (?:tired|exhausted)|i feel tired|long day|busy day)\b/.test(q))
    return "Sounds like you've had a full day. Want to tell me about it, or would you rather just chat for a bit?";
  if (/\b(i (?:have|got) (?:some )?good news|something exciting happened)\b/.test(q))
    return "I'd like to hear it. What happened?";
  if (/\b(what are you (?:up to|doing)|how about you|and you\??)\b/.test(q))
    return "I'm here to listen and talk, or help you work through something. What's on your mind?";
  if (/\b(my (?:son|daughter|kids?|grandson|granddaughter|family|friend)|at work|my business|my job)\b/.test(q) &&
      !/\b(calori|protein|workout|exercise|meal)\b/.test(q))
    return "I'm listening. What's going on with that?";
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
