/**
 * Dynamic Marcus speech gateway. DISABLED by default, even when users are
 * signed in; no request can reach HeyGen before explicit budget approval.
 *
 * Required protected Railway config (never browser env):
 * FLEX_PAID_AI_ENABLED=true, FLEX_MARCUS_TTS_ENABLED=true,
 * HEYGEN_API_KEY, FLEX_AI_ALLOWED_USER_IDS, and existing Supabase auth.
 *
 * The API key must be scoped to voice generation. Billing/overage must be
 * controlled by the HeyGen prepaid API wallet; the in-process limiter is
 * a second line of defence, NOT a financial spending cap.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { aiError, authorizePaidAi, readBoundedAiJson } from "@/lib/paid-ai-access";
import {
  APPROVED_MARCUS_VOICE_ID,
  MAX_MARCUS_TTS_CHARS,
  approvedMarcusAudioUrl,
  validMarcusLine,
} from "@/lib/marcus-tts-contract";

const Payload = z.object({ text: z.string().min(1).max(MAX_MARCUS_TTS_CHARS) });
const disabled = () => process.env["FLEX_MARCUS_TTS_ENABLED"] !== "true";
const safeJson = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
});

export const Route = createFileRoute("/api/public/marcus-speech")({
  server: {
    handlers: {
      GET: async () => safeJson({
        voice: "Marcus – Warm & Friendly English",
        enabled: !disabled() && process.env["FLEX_PAID_AI_ENABLED"] === "true" &&
          !!process.env["HEYGEN_API_KEY"],
        dynamic: true,
        fallbackVoice: false,
        cost: "Requires separately funded HeyGen API credits; no auto-charges authorized.",
      }),
      POST: async ({ request }) => {
        // SECURITY & COST: check hard switch and server secret BEFORE ANY paid
        // request. Never permit client-side override of voice_id or model.
        if (disabled()) return aiError(503,
          "Live Marcus voice is awaiting approval and HeyGen API activation. No charges were made.");
        if (!process.env["HEYGEN_API_KEY"]) return aiError(503,
          "Live Marcus voice key is not configured. No charges were made.");

        const user = await authorizePaidAi(request, "speech");
        if (user instanceof Response) return user;
        const body = await readBoundedAiJson(request);
        if (body instanceof Response) return body;
        const parsed = Payload.safeParse(body.value);
        if (!parsed.success) return aiError(400, "Marcus speech text is invalid.");
        const line = validMarcusLine(parsed.data.text);
        if (!line) return aiError(400, "Marcus speech text is empty or exceeds limits.");

        // No retries, implicit billing, voice substitution, or cross-provider
        // fallback. If this stock voice is unsupported by a provisioned key,
        // return an explicit error rather than using another voice.
        let upstream: Response;
        try {
          upstream = await fetch("https://api.heygen.com/v3/models/audio/tts", {
            method: "POST",
            headers: {
              "X-Api-Key": process.env["HEYGEN_API_KEY"]!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              voice_id: APPROVED_MARCUS_VOICE_ID,
              text: line,
              language: "en",
            }),
            signal: AbortSignal.timeout(40_000),
          });
        } catch {
          return aiError(504, "Marcus synthesis did not respond. No automatic retry was attempted.");
        }
        if (!upstream.ok) {
          if (upstream.status === 402) return aiError(402,
            "HeyGen API credits are insufficient. Speech was not generated.");
          if (upstream.status === 400 || upstream.status === 404) return aiError(502,
            "HeyGen did not accept the exact approved Marcus voice on this endpoint. No other voice was used.");
          return aiError(upstream.status === 429 ? 429 : 502,
            "HeyGen Marcus voice generation is unavailable. No substitute voice was used.");
        }
        let payload: unknown;
        try { payload = await upstream.json(); }
        catch { return aiError(502, "HeyGen response was not valid audio metadata."); }
        const url = approvedMarcusAudioUrl(payload);
        if (!url) return aiError(502,
          "HeyGen did not provide a trusted Marcus audio URL. No substitute was played.");

        return safeJson({ audioUrl: url, voiceId: APPROVED_MARCUS_VOICE_ID });
      },
    },
  },
});
