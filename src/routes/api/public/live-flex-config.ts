import { createFileRoute } from "@tanstack/react-router";

function normalizeDidEmbedValue(raw: string | undefined, attribute: string) {
  const value = raw?.trim() || "";
  if (!value) return "";

  const attributeMatch = value.match(
    new RegExp(`\${attribute}\\s*=\\s*["']([^"']+)["']`, "i"),
  );
  if (attributeMatch?.[1]) return attributeMatch[1].trim();

  return value.replace(/^["']|["']$/g, "").trim();
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export const Route = createFileRoute("/api/public/live-flex-config")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const didAgentId = normalizeDidEmbedValue(
          process.env["DID_AGENT_ID"],
          "data-agent-id",
        );
        const didClientKey = normalizeDidEmbedValue(
          process.env["DID_CLIENT_KEY"],
          "data-client-key",
        );

        const requestUrl = new URL(request.url);
        if (requestUrl.searchParams.get("plain") === "1") {
          if (!didAgentId || !didClientKey) {
            return new Response("D-ID is not configured.", {
              status: 503,
              headers: { "content-type": "text/plain; charset=utf-8" },
            });
          }

          const agentId = escapeHtmlAttribute(didAgentId);
          const clientKey = escapeHtmlAttribute(didClientKey);

          return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>D-ID Plain Production Test</title>
  <style>
    html,body{margin:0;min-height:100%;background:#0a1118;color:#fff;font-family:Arial,sans-serif}
    main{padding:24px;max-width:720px;margin:auto}
    .status{padding:16px;border:1px solid #4dd7e7;border-radius:14px;background:#101b25}
    pre{white-space:pre-wrap;word-break:break-word;background:#071018;padding:12px;border-radius:10px;color:#bff7ff}
  </style>
</head>
<body>
  <main>
    <h1>D-ID plain production test</h1>
    <div class="status">Only D-ID's official embed is running on this production domain.</div>
    <h2>Provider diagnostics</h2>
    <pre id="did-status">Loading D-ID script…</pre>
  </main>
  <script
    id="did-script"
    type="module"
    src="https://agent.d-id.com/v2/index.js"
    data-mode="fabio"
    data-client-key="${clientKey}"
    data-agent-id="${agentId}"
    data-name="did-agent"
    data-monitor="true"
    data-open-mode="expanded"
    data-auto-connect="true"
  ></script>
  <script>
    (function () {
      var status = document.getElementById("did-status");
      var didScript = document.getElementById("did-script");
      var lines = [];
      function write(line) {
        lines.push(new Date().toISOString() + " " + line);
        status.textContent = lines.join("\\n");
      }

      didScript.addEventListener("load", function () {
        write("embed script loaded");
      });
      didScript.addEventListener("error", function () {
        write("embed script failed to load");
      });

      window.addEventListener("error", function (event) {
        write("window error: " + (event.message || "unknown"));
      });
      window.addEventListener("unhandledrejection", function (event) {
        var reason = event.reason;
        var message = reason && reason.message ? reason.message : String(reason || "unknown");
        write("unhandled rejection: " + message);
      });

      var tries = 0;
      var timer = setInterval(function () {
        tries += 1;
        var api = window.DID_AGENTS_API;
        if (!api) {
          if (tries === 50) write("DID_AGENTS_API still unavailable after 5s");
          if (tries >= 120) {
            write("DID_AGENTS_API unavailable after 12s");
            clearInterval(timer);
          }
          return;
        }

        clearInterval(timer);
        write("DID_AGENTS_API available");

        try {
          api.events.on("connection", function (payload) {
            write("connection: " + JSON.stringify(payload));
          });
        } catch (error) {
          write("connection listener failed: " + (error && error.message ? error.message : String(error)));
        }

        try {
          api.events.on("error", function (payload) {
            write("D-ID error: " + JSON.stringify(payload));
          });
        } catch (error) {
          write("error listener failed: " + (error && error.message ? error.message : String(error)));
        }

        try {
          api.configure({ openMode: "expanded", autoConnect: true });
          write("configured expanded + autoConnect");
        } catch (error) {
          write("configure failed: " + (error && error.message ? error.message : String(error)));
        }
      }, 100);
    })();
  </script>
</body>
</html>`, {
            headers: {
              "content-type": "text/html; charset=utf-8",
              "cache-control": "no-store",
            },
          });
        }

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
