/**
 * Lightweight process liveness endpoint for any Node-compatible host.
 *
 * This deliberately does not read credentials, query a database, check paid
 * providers or enumerate private storage. HTTP 200 means the app server
 * responded, NOT that optional voice/video/cloud features are healthy.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () =>
        new Response(
          JSON.stringify({
            service: "m3-flex",
            status: "ok",
            check: "process",
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
              "x-content-type-options": "nosniff",
            },
          },
        ),
    },
  },
});
