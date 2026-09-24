/**
 * COACH SPEECH — server-side text-to-speech proxy
 * ------------------------------------------------------------------
 * The coached session's PRIMARY audio path. The browser never talks to
 * OpenAI directly (the API key must stay server-side); it posts a
 * line of coaching plus an emotional tone and receives a raw PCM audio
 * stream it can play through Web Audio.
 *
 * This is what makes coaching audible on Android Chrome, Samsung
 * Internet and in-app webviews where `speechSynthesis` is missing or
 * silently broken — those browsers all support AudioContext.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Delivery direction per phase of the session. The TTS model is
 * explicitly style-prompted so the coach is calm in the intro,
 * assertive under the bar, urgent on the last reps and settled during
 * the cooldown — never one flat voice for 50 minutes.
 *
 * VOICE IDENTITY: one preset for every phase so the coach never changes
 * person mid-session. "onyx" is the provider's deep, resonant adult male
 * preset — the lowest register available — which fits the approved
 * mature (late-40s) coach far better than the lighter, younger-sounding
 * "ash". The persona block below is prepended to every phase so the
 * maturity, warmth and register stay constant while only the energy
 * changes.
 */
const COACH_VOICE = "onyx";

const PERSONA =
  "Voice identity: one single consistent speaker for the whole session — a 47-year-old Black American man, an elite private strength coach. Deep, full, resonant chest voice in a low register, with natural warmth, easy confidence and the slight gravel of maturity. Athletic presence: grounded, unhurried, quietly authoritative. Speak like a real trainer standing beside one client — short phrases, natural pauses, meaningful emphasis, genuine encouragement. Never an announcer, radio host, game narrator or chirpy assistant. Never youthful, thin, breathy, sing-song or over-enthusiastic. No exaggerated dialect, no slang, no caricature, no performance accent — just believable natural speech.";

const TONE_STYLE: Record<string, { voice: string; speed: number; instructions: string }> = {
  calm: {
    voice: COACH_VOICE,
    speed: 0.95,
    instructions: `${PERSONA} Context: greeting the client at the start of the session. Warm, grounded, relaxed pacing, clear articulation. Focused — not sleepy, not hyped.`,
  },
  instructional: {
    voice: COACH_VOICE,
    speed: 0.97,
    instructions: `${PERSONA} Context: teaching the warm-up. Encouraging and clear, gently building energy. Small pauses between cues so the client can follow along.`,
  },
  assertive: {
    voice: COACH_VOICE,
    speed: 1.0,
    instructions: `${PERSONA} Context: standing over a working set. Precise, firm, motivating. Crisp consonants, short phrases, steady low drive. Controlled power — never shouting.`,
  },
  urgent: {
    voice: COACH_VOICE,
    speed: 1.06,
    instructions: `${PERSONA} Context: the final reps of a hard set. More intensity and urgency, a little louder and faster, strong emphasis on key words, clipped phrasing that pushes the client to finish. Still deep, controlled and coach-like — never screaming or cheesy.`,
  },
  reassuring: {
    voice: COACH_VOICE,
    speed: 0.93,
    instructions: `${PERSONA} Context: rest between sets. Controlled and reassuring, bringing the heart rate down while keeping focus. Lower volume, slower pace, easy breathing in the delivery.`,
  },
  attentive: {
    voice: COACH_VOICE,
    speed: 0.95,
    instructions: `${PERSONA} Context: checking in on how the client actually feels. Human, attentive, genuinely asking. Conversational and unrushed.`,
  },
  hype: {
    voice: COACH_VOICE,
    speed: 1.04,
    instructions: `${PERSONA} Context: the finisher. Strongest motivational energy of the workout: driving, big, committed — but it comes from depth and conviction, not pitch. A real coach, not a hype video.`,
  },
  settle: {
    voice: COACH_VOICE,
    speed: 0.88,
    instructions: `${PERSONA} Context: cooldown. Calm, low energy, reassuring. Soft volume, long relaxed phrasing, audible breathing room between sentences.`,
  },
  proud: {
    voice: COACH_VOICE,
    speed: 0.94,
    instructions: `${PERSONA} Context: the end of the session. Satisfied, earned praise from a coach who watched the whole workout. Warm, sincere, understated — proud, not gushing.`,
  },
};

const Body = z.object({
  text: z.string().trim().min(1).max(1200),
  tone: z.string().optional(),
  /**
   * "mp3" returns ONE complete audio file — the reliable path for Android /
   * Samsung Internet / in-app webviews, played with an HTMLAudioElement that
   * the user's tap already unlocked. "pcm" keeps the low-latency SSE stream.
   */
  format: z.enum(["mp3", "pcm"]).default("pcm"),
});

export const Route = createFileRoute("/api/public/coach-speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env["OPENAI_API_KEY"];
        if (!key) {
          return new Response(
            JSON.stringify({ message: "Coach voice is not configured on this server." }),
            { status: 503, headers: { "content-type": "application/json" } },
          );
        }

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ message: "Invalid coach speech request." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const style = TONE_STYLE[parsed.tone ?? "assertive"] ?? TONE_STYLE.assertive;
        const mp3 = parsed.format === "mp3";

        const upstream = await fetch("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: process.env["OPENAI_TTS_MODEL"]?.trim() || "gpt-4o-mini-tts",
            input: parsed.text,
            voice: process.env["OPENAI_TTS_VOICE"]?.trim() || style.voice,
            speed: style.speed,
            instructions: style.instructions,
            ...(mp3
              ? { response_format: "mp3" }
              : { stream_format: "sse", response_format: "pcm" }),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          return new Response(
            JSON.stringify({
              message: detail || `Coach voice unavailable (${upstream.status}).`,
            }),
            { status: upstream.status, headers: { "content-type": "application/json" } },
          );
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": mp3 ? "audio/mpeg" : "text/event-stream",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});