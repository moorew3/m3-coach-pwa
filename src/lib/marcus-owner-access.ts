/**
 * Owner-only Marcus speech access for the existing M3 FLEX preview.
 *
 * There is no configured Supabase server in this Railway service.
 * This short, explicit pairing token is hashed on the server and never
 * committed to GitHub, sent to HeyGen, or embedded in public JavaScript.
 * A browser receives it through a one-time URL fragment (not sent by HTTP).
 *
 * With one Railway replica, per-process quotas protect accidental loops.
 * They are NOT an accounting ledger or a hard multi-replica USD cap.
 * Zero-charge HeyGen Turbo Free is the only allowed model (through 2026-11-30).
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { aiError, PaidAiLimiter } from "@/lib/paid-ai-access";

const ownerLimiter = new PaidAiLimiter();
const ENABLED_UNTIL_UTC = Date.UTC(2026, 11, 1, 0, 0, 0);
const VOICE_MODEL = "heygen-voice-1-turbo-free";
export const MARCUS_VOICE_MODEL = VOICE_MODEL;

export function marcusVoiceConfigured(env: NodeJS.ProcessEnv = process.env, now = Date.now()): boolean {
  return now < ENABLED_UNTIL_UTC &&
    env["FLEX_MARCUS_TTS_ENABLED"] === "true" &&
    env["FLEX_MARCUS_TTS_MODEL"] === VOICE_MODEL &&
    !!env["HEYGEN_API_KEY"] &&
    /^[a-f0-9]{64}$/i.test(env["FLEX_MARCUS_OWNER_TOKEN_SHA256"] ?? "");
}

export function verifyMarcusOwner(request: Request, env: NodeJS.ProcessEnv = process.env): boolean {
  const expected = env["FLEX_MARCUS_OWNER_TOKEN_SHA256"];
  if (!expected || !/^[a-f0-9]{64}$/i.test(expected)) return false;
  const provided = request.headers.get("x-m3-flex-owner") ?? "";
  if (!/^[a-zA-Z0-9_-]{32,80}$/.test(provided)) return false;
  const hash = createHash("sha256").update(provided).digest();
  const correct = Buffer.from(expected, "hex");
  return hash.length === correct.length && timingSafeEqual(hash, correct);
}

export function authorizeMarcusOwner(request: Request): Response | null {
  if (!marcusVoiceConfigured()) {
    return aiError(503, "Marcus live voice is disabled. Your original workout media is unaffected.");
  }
  const origin = request.headers.get("origin");
  const expectedOrigin = process.env["FLEX_PUBLIC_ORIGIN"] || new URL(request.url).origin;
  if (origin && origin !== expectedOrigin) {
    return aiError(403, "This website is not authorized to request Marcus speech.");
  }
  if (!verifyMarcusOwner(request)) {
    return aiError(401, "This phone is not paired to the M3 FLEX owner's Marcus voice access.");
  }
  if (!ownerLimiter.allow("marcus-owner", Date.now(), 4, 35)) {
    return aiError(429, "Marcus voice request limit reached. No audio was generated.", 60);
  }
  return null;
}
