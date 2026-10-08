import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  text: z.string().trim().min(1).max(1200),
});

export const Route = createFileRoute("/api/public/flex-speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["HEYGEN_API_KEY"]?.trim();
        if (!apiKey) {
          return new Response(JSON.stringify({
            message: "Marcus live speech is not configured.",
          }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch {
          return new Response(JSON.stringify({ message: "Invalid speech request." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const voiceId = process.env["HEYGEN_MARCUS_VOICE_ID"]?.trim()
          || "0fadce1e82af494a93873aa38ea8d106";

        try {
          const upstream = await fetch("https://api.heygen.com/v3/voices/speech", {
            method: "POST",
            headers: {
              "X-Api-Key": apiKey,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              text: parsed.text,
              voice_id: voiceId,
              input_type: "text",
              speed: 1,
              locale: "en-US",
            }),
          });

          const raw = await upstream.text();
          if (!upstream.ok) {
            return new Response(raw || JSON.stringify({
              message: "Marcus speech generation failed.",
            }), {
              status: upstream.status,
              headers: {
                "content-type": upstream.headers.get("content-type") || "application/json",
                "cache-control": "no-store",
              },
            });
          }

          const data = JSON.parse(raw) as Record<string, any>;
          const audioUrl =
            data.audio_url
            || data.url
            || data.data?.audio_url
            || data.data?.url;

          if (!audioUrl || typeof audioUrl !== "string") {
            return new Response(JSON.stringify({
              message: "HeyGen did not return Marcus audio.",
            }), {
              status: 502,
              headers: { "content-type": "application/json" },
            });
          }

          return new Response(JSON.stringify({
            audioUrl,
            duration: data.duration ?? data.data?.duration ?? null,
            voiceId,
          }), {
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        } catch (error) {
          return new Response(JSON.stringify({
            message: error instanceof Error
              ? error.message
              : "Marcus speech generation failed.",
          }), {
            status: 502,
            headers: { "content-type": "application/json" },
          });
        }
      },
    },
  },
});
