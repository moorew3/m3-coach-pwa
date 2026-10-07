import { createFileRoute } from "@tanstack/react-router";

const LIVEAVATAR_BASE_URL = "https://api.liveavatar.com";

function config() {
  const apiKey = process.env["LIVEAVATAR_API_KEY"]?.trim() || "";
  const avatarId = process.env["LIVEAVATAR_AVATAR_ID"]?.trim() || "";
  const sandbox = (process.env["LIVEAVATAR_SANDBOX"] ?? "true").toLowerCase() !== "false";
  return { apiKey, avatarId, sandbox };
}

export const Route = createFileRoute("/api/public/live-avatar-token")({
  server: {
    handlers: {
      GET: async () => {
        const { apiKey, avatarId, sandbox } = config();
        return new Response(JSON.stringify({
          configured: Boolean(apiKey && avatarId),
          hasApiKey: Boolean(apiKey),
          hasAvatarId: Boolean(avatarId),
          sandbox,
          mode: "LITE",
        }), {
          headers: {
            "content-type": "application/json",
            "cache-control": "no-store",
          },
        });
      },

      POST: async () => {
        const { apiKey, avatarId, sandbox } = config();
        if (!apiKey || !avatarId) {
          return new Response(JSON.stringify({
            message: "Live Flex is not configured yet.",
            missing: [
              ...(!apiKey ? ["LIVEAVATAR_API_KEY"] : []),
              ...(!avatarId ? ["LIVEAVATAR_AVATAR_ID"] : []),
            ],
          }), {
            status: 503,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }

        try {
          const upstream = await fetch(`${LIVEAVATAR_BASE_URL}/v1/sessions/token`, {
            method: "POST",
            headers: {
              "X-API-KEY": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              mode: "LITE",
              avatar_id: avatarId,
              is_sandbox: sandbox,
            }),
          });

          const body = await upstream.text();
          if (!upstream.ok) {
            return new Response(body || JSON.stringify({
              message: "LiveAvatar session token request failed.",
            }), {
              status: upstream.status,
              headers: {
                "content-type": upstream.headers.get("content-type") || "application/json",
                "cache-control": "no-store",
              },
            });
          }

          const parsed = JSON.parse(body) as {
            data?: { session_token?: string; session_id?: string };
          };
          const sessionToken = parsed.data?.session_token;
          if (!sessionToken) {
            return new Response(JSON.stringify({
              message: "LiveAvatar did not return a session token.",
            }), {
              status: 502,
              headers: {
                "content-type": "application/json",
                "cache-control": "no-store",
              },
            });
          }

          return new Response(JSON.stringify({
            sessionToken,
            sessionId: parsed.data?.session_id ?? null,
            sandbox,
            mode: "LITE",
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
              : "LiveAvatar session token request failed.",
          }), {
            status: 502,
            headers: {
              "content-type": "application/json",
              "cache-control": "no-store",
            },
          });
        }
      },
    },
  },
});
