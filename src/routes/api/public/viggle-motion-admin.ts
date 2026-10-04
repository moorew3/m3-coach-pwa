import { createFileRoute } from "@tanstack/react-router";

const VIGGLE_BASE = "https://apis.viggle.ai/v1";
const COACH_IMAGE =
  "https://m3-coach-v2-visual-production.up.railway.app/coach-source/coach-primary-standing.png";
const CABLE_PUNCH_MOTION =
  "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/52121fcd-b4d3-4d8f-b486-23173ebea24e/cablePunch.mp4";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
    },
  });
}

async function viggle(path: string, init: RequestInit = {}) {
  const key = process.env["VIGGLE_API_KEY"];
  if (!key) return json({ message: "Viggle API key is not configured." }, 503);

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${key}`);

  const upstream = await fetch(`${VIGGLE_BASE}${path}`, {
    ...init,
    headers,
  });

  const text = await upstream.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    // Keep the raw upstream body when it is not JSON.
  }
  return json(body, upstream.status);
}

export const Route = createFileRoute("/api/public/viggle-motion-admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const supplied = url.searchParams.get("token") ?? "";
        const expected = process.env["M3_VIGGLE_TRIGGER_TOKEN"] ?? "";

        if (!expected || supplied !== expected) {
          return new Response("Not found.", { status: 404 });
        }

        const action = url.searchParams.get("action") ?? "credits";

        if (action === "credits") {
          return viggle("/credits");
        }

        if (action === "start") {
          const form = new FormData();
          form.append("image_url", COACH_IMAGE);
          form.append("motion_video_url", CABLE_PUNCH_MOTION);
          form.append("background_mode", "original");

          return viggle("/renders", {
            method: "POST",
            headers: {
              "Idempotency-Key": "m3-cable-punch-20261004-v1",
            },
            body: form,
          });
        }

        if (action === "startAnimate") {
          const form = new FormData();
          form.append("character_image_url", COACH_IMAGE);
          form.append("driving_video_url", CABLE_PUNCH_MOTION);
          form.append(
            "prompt",
            "Use the exact approved coach identity from the character image while preserving the source cable-punch movement, stance, cable equipment, camera, and timing.",
          );
          form.append("watermark", "false");

          return viggle("/videos", {
            method: "POST",
            headers: {
              "Idempotency-Key": "m3-cable-punch-animate-20261004-v1",
            },
            body: form,
          });
        }

        if (action === "status") {
          const id = url.searchParams.get("id") ?? "";
          if (!/^[A-Za-z0-9_-]{8,128}$/.test(id)) {
            return json({ message: "Invalid video id." }, 400);
          }
          return viggle(`/videos/${encodeURIComponent(id)}`);
        }

        return json({ message: "Unknown action." }, 400);
      },
    },
  },
});
