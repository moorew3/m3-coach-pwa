import { createFileRoute } from "@tanstack/react-router";

const VIGGLE_BASE = "https://apis.viggle.ai/v1";

const VIDEO_ID_BY_KEY: Record<string, string> = {
  cablePunch: "anim_4cf5adfc-6911-4314-ba73-89247d699a03",
  medBallChestPass: "anim_171a7c7d-89ae-4db6-8729-04a194bd1b0d",
  legPress: "anim_400bb9f7-4e80-4b21-9a17-a652d5c5c870",
  bulgarianSplitSquat: "anim_f92bd259-9d71-42db-b1bc-21cc18cc3ba9",
  chestPress: "anim_6651c88c-06d3-4145-bda2-6681c88afad8",
};

export const Route = createFileRoute("/api/public/approved-coach-motion")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const key = url.searchParams.get("key") ?? "";
        const videoId = VIDEO_ID_BY_KEY[key];
        if (!videoId) return new Response("Unknown approved motion.", { status: 404 });

        const apiKey = process.env["VIGGLE_API_KEY"];
        if (!apiKey) return new Response("Approved motion service is not configured.", { status: 503 });

        const meta = await fetch(`${VIGGLE_BASE}/videos/${encodeURIComponent(videoId)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!meta.ok) {
          return new Response("Approved motion metadata is unavailable.", { status: 502 });
        }

        const data = (await meta.json()) as { status?: string; video_url?: string | null };
        if (data.status !== "ready" || !data.video_url) {
          return new Response("Approved motion is not ready.", { status: 503 });
        }

        const range = request.headers.get("range");
        const video = await fetch(data.video_url, {
          headers: range ? { Range: range } : undefined,
        });
        if (!video.ok || !video.body) {
          return new Response("Approved motion video is unavailable.", { status: 502 });
        }

        const headers = new Headers();
        headers.set("Content-Type", video.headers.get("content-type") || "video/mp4");
        headers.set("Cache-Control", "public, max-age=300");
        for (const name of ["content-length", "content-range", "accept-ranges"]) {
          const value = video.headers.get(name);
          if (value) headers.set(name, value);
        }

        return new Response(video.body, {
          status: video.status,
          headers,
        });
      },
    },
  },
});
