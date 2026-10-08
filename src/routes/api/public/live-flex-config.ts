import { createFileRoute } from "@tanstack/react-router";

function normalizeDidEmbedValue(raw: string | undefined, attribute: string) {
  const value = raw?.trim() || "";
  if (!value) return "";

  // Accept either the bare value (preferred) or an accidentally pasted
  // D-ID embed attribute such as data-agent-id="v2_agt_...".
  const attributeMatch = value.match(
    new RegExp(`\${attribute}\\s*=\\s*["']([^"']+)["']`, "i"),
  );
  if (attributeMatch?.[1]) return attributeMatch[1].trim();

  return value.replace(/^["']|["']$/g, "").trim();
}

export const Route = createFileRoute("/api/public/live-flex-config")({
  server: {
    handlers: {
      GET: async () => {
        const didAgentId = normalizeDidEmbedValue(
          process.env["DID_AGENT_ID"],
          "data-agent-id",
        );
        const didClientKey = normalizeDidEmbedValue(
          process.env["DID_CLIENT_KEY"],
          "data-client-key",
        );
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
