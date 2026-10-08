import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/live-flex-config")({
  server: {
    handlers: {
      GET: async () => {
        const didAgentId = process.env["DID_AGENT_ID"]?.trim() || "";
        const didClientKey = process.env["DID_CLIENT_KEY"]?.trim() || "";
        const liveAvatarKey = process.env["LIVEAVATAR_API_KEY"]?.trim() || "";
        const liveAvatarId = process.env["LIVEAVATAR_AVATAR_ID"]?.trim() || "";
        const heygenApiKey = process.env["HEYGEN_API_KEY"]?.trim() || "";

        const provider = didAgentId && didClientKey
          ? "did"
          : liveAvatarKey && liveAvatarId
            ? "liveavatar"
            : "none";

        return new Response(JSON.stringify({
          provider,
          did: {
            configured: Boolean(didAgentId && didClientKey),
            agentId: didAgentId || null,
            // D-ID client keys are designed for browser use and should be
            // restricted to the V2 production origin in D-ID Studio.
            clientKey: didClientKey || null,
          },
          liveavatar: {
            configured: Boolean(liveAvatarKey && liveAvatarId),
          },
          marcusTts: {
            configured: Boolean(heygenApiKey),
            voiceId: process.env["HEYGEN_MARCUS_VOICE_ID"]?.trim()
              || "0fadce1e82af494a93873aa38ea8d106",
          },
        }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
