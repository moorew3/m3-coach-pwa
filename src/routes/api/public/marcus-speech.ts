/**
 * M3 FLEX Marcus-only live spoken replies.
 * Strictly uses HeyGen Turbo Free through Nov 30, 2026.
 * The prepaid $5 wallet is not intentionally consumed and there is NO
 * automatic fallback to another voice or billable TTS model.
 *
 * Auth: a 256-bit owner pairing token, hashed in Railway; not a public API.
 * All secrets remain on the Railway server; the browser sends no HeyGen key.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { aiError, readBoundedAiJson } from "@/lib/paid-ai-access";
import { authorizeMarcusOwner, marcusVoiceConfigured, MARCUS_VOICE_MODEL, verifyMarcusOwner } from "@/lib/marcus-owner-access";
import {
  APPROVED_MARCUS_VOICE_ID,
  MAX_MARCUS_TTS_CHARS,
  approvedMarcusAudioUrl,
  validMarcusLine,
} from "@/lib/marcus-tts-contract";

const Payload = z.object({ text: z.string().min(1).max(MAX_MARCUS_TTS_CHARS) });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store",
    "x-content-type-options": "nosniff" },
});

export const Route = createFileRoute("/api/public/marcus-speech")({
  server: {
    handlers: {
      GET: async ({ request }) => json({
        voice: "Marcus – Warm & Friendly English",
        enabled: marcusVoiceConfigured() && verifyMarcusOwner(request),
        configured: marcusVoiceConfigured(),
        freeModel: MARCUS_VOICE_MODEL,
        expiry: "2026-11-30T23:59:59Z",
        dynamic: true,
        fallbackVoice: false,
        cost: "HeyGen Turbo Free only. No paid-model fallback; disables December 1, 2026.",
      }),
      POST: async ({ request }) => {
        const unauthorized = authorizeMarcusOwner(request);
        if (unauthorized) return unauthorized;

        const input = await readBoundedAiJson(request);
        if (input instanceof Response) return input;
        const parsed = Payload.safeParse(input.value);
        if (!parsed.success) return aiError(400, "Marcus reply text is missing or too long.");
        const line = validMarcusLine(parsed.data.text);
        if (!line) return aiError(400, "Marcus reply text is empty or exceeds the safe limit.");

        // Require the exact, explicitly free model. An API failure, quota error,
        // or discontinued free offer NEVER triggers a chargeable model retry.
        let upstream: Response;
        try {
          upstream = await fetch("https://api.heygen.com/v3/models/audio/tts", {
            method: "POST",
            headers: {
              "X-Api-Key": process.env["HEYGEN_API_KEY"]!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: MARCUS_VOICE_MODEL,
              voice_id: APPROVED_MARCUS_VOICE_ID,
              text: line,
              language: "en",
            }),
            signal: AbortSignal.timeout(30_000),
          });
        } catch {
          return aiError(504, "HeyGen's free Marcus voice did not respond. No paid retry was made.");
        }
        if (!upstream.ok) {
          if (upstream.status === 429) return aiError(429,
            "HeyGen's shared free-voice capacity is busy. No paid model was used.");
          if (upstream.status === 400 || upstream.status === 404 || upstream.status === 422)
            return aiError(502,
              "The approved Marcus voice may be incompatible with HeyGen Turbo Free. A different voice or paid model was NOT substituted.");
          if (upstream.status === 401 || upstream.status === 403)
            return aiError(503, "HeyGen rejected the scoped API key. Verify Voices: Write and account access.");
          if (upstream.status === 402)
            return aiError(402, "HeyGen reported a billing issue. The voice service is stopping without a paid retry.");
          return aiError(502, "HeyGen speech generation failed. No other voice or model was used.");
        }
        let payload: unknown;
        try { payload = await upstream.json(); }
        catch { return aiError(502, "HeyGen returned invalid audio metadata."); }
        const audioUrl = approvedMarcusAudioUrl(payload);
        if (!audioUrl) return aiError(502, "HeyGen returned no trusted Marcus audio URL.");
        return json({ audioUrl, voiceId: APPROVED_MARCUS_VOICE_ID, model: MARCUS_VOICE_MODEL });
      },
    },
  },
});
