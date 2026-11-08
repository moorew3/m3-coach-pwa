/**
 * Browser-side owner pairing and Marcus-only speech fetch.
 * HeyGen API key never enters browser code or any URL.
 * Owner pairing is shared once via URL fragment, not HTTP request/query.
 * Store only in this browser tab's sessionStorage.
 */
import { APPROVED_MARCUS_VOICE_ID, MAX_MARCUS_TTS_CHARS, approvedMarcusAudioUrl } from "@/lib/marcus-tts-contract";

const OWNER_KEY = "m3-flex-marcus-owner-pair-v1";

export function claimMarcusOwnerPairingLink(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash;
  if (!hash.includes("marcus_access=")) return false;
  try {
    const args = new URLSearchParams(hash.slice(1));
    const token = args.get("marcus_access") || "";
    if (!/^[a-zA-Z0-9_-]{32,80}$/.test(token)) return false;
    window.sessionStorage.setItem(OWNER_KEY, token);
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    return true;
  } catch { return false; }
}

export function isMarcusOwnerPaired(): boolean {
  return !!marcusOwnerToken();
}

function marcusOwnerToken(): string {
  if (typeof window === "undefined") return "";
  try { return window.sessionStorage.getItem(OWNER_KEY) || ""; }
  catch { return ""; }
}

function marcusOwnerHeaders(): Record<string, string> {
  const token = marcusOwnerToken();
  return token && /^[a-zA-Z0-9_-]{32,80}$/.test(token)
    ? { "x-m3-flex-owner": token } : {};
}

export async function getMarcusSpeechAvailability(): Promise<boolean> {
  if (!isMarcusOwnerPaired()) return false;
  try {
    const response = await fetch("/api/public/marcus-speech", {
      method: "GET", cache: "no-store", headers: marcusOwnerHeaders(),
    });
    if (!response.ok) return false;
    const data = await response.json() as { enabled?: boolean };
    return data.enabled === true;
  } catch { return false; }
}

export async function requestMarcusLiveSpeech(text: string, signal: AbortSignal): Promise<string> {
  if (!isMarcusOwnerPaired()) throw new Error("Pair this phone with the owner's M3 FLEX voice link.");
  const prepared = text.trim().slice(0, MAX_MARCUS_TTS_CHARS);
  if (!prepared) throw new Error("Marcus has nothing to say.");

  const res = await fetch("/api/public/marcus-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...marcusOwnerHeaders() },
    body: JSON.stringify({ text: prepared }),
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    let message = "Approved Marcus voice could not be generated.";
    try {
      const data = await res.json() as { message?: string };
      if (typeof data.message === "string") message = data.message.slice(0, 260);
    } catch { /* keep generic */ }
    throw new Error(message);
  }
  const payload = await res.json() as {audioUrl?: unknown; voiceId?: unknown; model?: unknown};
  if (payload.voiceId !== APPROVED_MARCUS_VOICE_ID)
    throw new Error("Returned voice did not match the approved Marcus identity.");
  if (payload.model !== "heygen-voice-1-turbo-free")
    throw new Error("Unexpected paid or unapproved voice model was rejected.");
  const trusted = approvedMarcusAudioUrl({ data: { audio_url: payload.audioUrl } });
  if (!trusted) throw new Error("The Marcus audio link was not trusted.");
  return trusted;
}
