/**
 * FLEX PRESENCE STATE
 * ------------------------------------------------------------------
 * One honest contract between V2's workout/conversation brain and the
 * eventual real-time avatar renderer. Do not fake lip movement here.
 */
export type FlexPresenceState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "demonstrating";

export function resolveFlexPresence({
  thinking,
  speaking,
  demonstrating,
  listening,
}: {
  thinking: boolean;
  speaking: boolean;
  demonstrating: boolean;
  listening: boolean;
}): FlexPresenceState {
  if (thinking) return "thinking";
  if (speaking) return "speaking";
  if (demonstrating) return "demonstrating";
  if (listening) return "listening";
  return "idle";
}

export const FLEX_PRESENCE_LABEL: Record<FlexPresenceState, string> = {
  idle: "Flex · Ready",
  listening: "Flex · Listening",
  thinking: "Flex · Thinking",
  speaking: "Flex · Speaking",
  demonstrating: "Flex · Demonstrating",
};
