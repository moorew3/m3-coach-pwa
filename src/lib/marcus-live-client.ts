/**
 * Explicitly authorized live Marcus speech client.
 * Uses original approved HeyGen voice only. Never chooses browser TTS or
 * substitutes another actor, voice model or clip.
 */
import { paidAiHeaders } from "@/lib/paid-ai-client";
import { APPROVED_MARCUS_VOICE_ID, MAX_MARCUS_TTS_CHARS, approvedMarcusAudioUrl } from "@/lib/marcus-tts-contract";

export async function getMarcusSpeechAvailability(): Promise<boolean> {
  try {
    const result = await fetch("/api/public/marcus-speech", {
      method: "GET", cache: "no-store",
    });
    if (!result.ok) return false;
    const data = await result.json() as {enabled?: boolean};
    return data.enabled === true;
  } catch { return false; }
}

export async function requestMarcusLiveSpeech(text: string, signal: AbortSignal): Promise<string> {
  const prepared = text.trim().slice(0, MAX_MARCUS_TTS_CHARS);
  if (!prepared) throw new Error("Nothing to say.");
  const headers = await paidAiHeaders();
  const res = await fetch("/api/public/marcus-speech", {
    method: "POST",
    headers,
    body: JSON.stringify({ text: prepared }),
    signal,
  });
  if (!res.ok) {
    let message = "Approved Marcus voice could not be generated.";
    try {
      const json = await res.json() as {message?: string};
      if (typeof json.message === "string") message = json.message.slice(0, 220);
    } catch { /* leave generic */ }
    throw new Error(message);
  }
  const payload = await res.json() as {audioUrl?: unknown; voiceId?: unknown};
  if (payload.voiceId !== APPROVED_MARCUS_VOICE_ID)
    throw new Error("Returned voice identity did not match Marcus. Playback stopped.");
  const valid = approvedMarcusAudioUrl({data:{audio_url:payload.audioUrl}});
  if (!valid) throw new Error("Marcus did not return a trusted audio link. Playback stopped.");
  return valid;
}
