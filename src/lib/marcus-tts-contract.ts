/**
 * M3 FLEX Marcus TTS - fail-closed contract.
 * No fallback voice may ever replace the approved Marcus voice ID.
 * Dynamic speech requires separately authorized HeyGen API credits.
 */
export const APPROVED_MARCUS_VOICE_ID = "0fadce1e82af494a93873aa38ea8d106" as const;
export const MAX_MARCUS_TTS_CHARS = 350;

export function validMarcusLine(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const text = input.trim().replace(/\s+/g, " ");
  return text.length > 0 && text.length <= MAX_MARCUS_TTS_CHARS ? text : null;
}

export function approvedMarcusAudioUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  const item = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  const value = item.audio_url;
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password) return null;
    // Only HeyGen-generated delivery URLs may enter the playback element.
    if (host !== "heygen.ai" && !host.endsWith(".heygen.ai") &&
        host !== "heygen.com" && !host.endsWith(".heygen.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
