import { createFileRoute } from "@tanstack/react-router";

const VIGGLE_BASE = "https://apis.viggle.ai/v1";
const COACH_IMAGE =
  "https://m3-coach-v2-visual-production.up.railway.app/coach-source/coach-primary-standing.png";
const MOTION_BY_EXERCISE: Record<string, string> = {
  bentOverRow:
    "https://m3-coach-v2-visual-production.up.railway.app/media/motion-reference/bentOverRow.mp4",
  shoulderPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/332dd309-aaf6-4b52-8c61-c24b8a4ee596/shoulderPress.mp4",
  rearDeltFly:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/dda4926f-4c1a-425d-b1fb-c11814ddf571/rearDeltFly.mp4",
  dumbbellCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/0c6f7ce9-22f8-43cc-a979-1e2681e6f9ae/dumbbellCurl.mp4",
  battleRopeFinisher:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/e87a2f34-5473-45df-b40e-8963bc7a3a4d/battleRopeFinisher.mp4",
  squatToCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/801f032b-7e52-4db2-9ea2-18a8a128ce26/squatToCurl.mp4",
  stepAltCurl:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/d86607bc-1cbf-48fd-b0de-203d792d1930/stepAltCurlV2.mp4",
  stepShoulderPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ed18e6d3-0f06-4272-b24c-718164e186a8/stepShoulderPressV2.mp4",
  reverseStepRow:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/d700a842-1844-4813-9e6d-fb5a6985e0a2/reverseStepRow.mp4",
  farmerMarch:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/62335289-13e9-4390-b070-723cb2a9e376/farmerMarch.mp4",
  chestSupportedRow:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/242f8087-efb6-4b71-bfd2-1b739cd081a2/chestSupportedRowV3.mp4",
  legPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/0b3034aa-9266-42d9-bb9d-f83a5ef3cb1f/legPressV2.mp4",
  bulgarianSplitSquat:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/160c1726-61b7-4f3b-8350-0399cb72d5f8/bulgarianSplitSquatV3.mp4",
  chestPress:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/ae3d443d-1b7e-4562-80e3-e44b54b55ac9/chestPressV3.mp4",
  cablePunch:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/52121fcd-b4d3-4d8f-b486-23173ebea24e/cablePunch.mp4",
  medBallChestPass:
    "https://twenty-two-gainz-tracker.lovable.app/__l5e/assets-v1/e038259e-e307-4f9d-a2ea-fb6fd7d0b26e/medBallChestPassV2.mp4",
};

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
          const exercise = url.searchParams.get("exercise") ?? "cablePunch";
          const motion = MOTION_BY_EXERCISE[exercise];
          if (!motion) return json({ message: "Unknown exercise." }, 404);
          form.append("motion_video_url", motion);
          form.append("background_mode", "original");

          return viggle("/renders", {
            method: "POST",
            headers: {
              "Idempotency-Key": `m3-${exercise}-render-20261006-v1`,
            },
            body: form,
          });
        }

        if (action === "startAnimate") {
          const form = new FormData();
          form.append("character_image_url", COACH_IMAGE);
          const exercise = url.searchParams.get("exercise") ?? "cablePunch";
          const motion = MOTION_BY_EXERCISE[exercise];
          if (!motion) return json({ message: "Unknown exercise." }, 404);
          form.append("driving_video_url", motion);
          form.append(
            "prompt",
            `Use the exact approved coach identity from the character image while preserving the source ${exercise} movement, stance, equipment, camera, and timing.`,
          );
          form.append("watermark", "false");

          return viggle("/videos", {
            method: "POST",
            headers: {
              "Idempotency-Key": `m3-${exercise}-animate-20261004-v1`,
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
