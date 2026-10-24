# M3 FLEX — Hostinger deployment plan without buying another service
Updated October 23, 2026. No live account or domain changed.

Hostinger's current official documentation says **Business Web Hosting and Cloud plans** can run long-lived Node.js applications deployed directly from GitHub. **Hostinger VPS** supports containers and Docker separately; ordinary Business/Cloud Node app plans do **not** support Docker. Therefore avoid requiring a VPS if the existing Hostinger subscription already supports Node.

Official references:
- https://www.hostinger.com/support/node-js-hosting-options-at-hostinger/
- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/

## Preferred deployment path — existing eligible managed plan

1. In the actual Hostinger account, inspect plan entitlements; do **not** buy, upgrade, or transfer a domain to continue testing. Eligibility cannot be inferred from having a WordPress or email account.
2. Create a **separate preview Node web app** on the plan if a Node slot exists. Do not replace an existing live WordPress site.
3. Select GitHub repository `moorew3/m3-coach-pwa`, protected staging branch `m3-flex/portable-hosting-audit-2026-10-23`, and turn **automatic production deployment off** for this preview.
4. Select Node.js 22, or the nearest currently supported patched Node 22 within the same major version. The project is TanStack Start (Vite + Nitro) and is **not** static-only. If framework auto-detection fails, choose Hostinger's supported "Other" Node app option.
5. Build: `npm install --no-audit --no-fund && npm run build`.
6. Entry/server command: `node .output/server/index.mjs` (the package's `npm start`). Output must include `.output/server` and `.output/public`. Don't point an SSR app at a `dist` folder or publish `.output/public` as the entire application.
7. Configure runtime host/port through Hostinger's Node application controls; don't hardcode a public port or expose secrets in GitHub.
8. Keep `FLEX_PAID_AI_ENABLED=false` and build with `VITE_FLEX_PAID_AI_ENABLED=false`; no new paid AI calls.
9. Test `/api/health`, `/recovery-coach/`, `/recovery-coach/programs/`, live phone-width browser, and original Marcus/video streams on the **preview URL**.
10. If all checks pass, verify Galaxy Fold camera and actual headset audio; media voice synchronization, clips and physical form still need real-world acceptance before calling the system finished.
11. Only after owner approval and a proven rollback switch traffic to the new app. Existing business domains and WordPress sites should remain separate unless an explicit migration is approved.

Hostinger's documented managed Node restrictions currently include **no inbound WebSockets, Docker, custom ports or always-running workers**, and a 120-second request timeout; assess future two-way coach video features against these boundaries. The present app's deterministic local captions and conventional HTTP endpoints are a more plausible fit than a permanent real-time socket server.

## Alternative — existing VPS with Docker

Use the root `Dockerfile` with Node 22 only when the user **already** owns a compatible VPS or another Docker-capable server. The Dockerfile defaults paid AI off, runs as non-root and provides a health check. Do not infer that Hostinger's managed Business/Cloud plans permit Docker.

## Current media dependency

Even on a self-hosted Node server, owner-approved video and Marcus tracks reference HeyGen and CloudFront. The source includes `approved-recovery-media.json` and `scripts/backup-approved-media.mjs` for exact-original read-only export with a SHA-256 receipt. The original 16 files have now been exported once, encrypted using the owner's offline-held key, verified byte-for-byte against the SHA-256 receipt and transferred to owner-only Google Drive storage. This secures disaster-recovery originals, but the live video host remains a separate external streaming dependency. Never replace with the review-only media candidates or infer a missing clip has been approved.

## Release blocker summary

Staging source is ready for a preview host once account entitlements are checked. The team must still verify this Hostinger account's plan capabilities, deploy and accept a separate preview app, finish unapproved Workout A/B movement films, verify authentic Marcus voice and video synchronization, and test permissions/form on a physical Galaxy Fold. The encrypted approved-media backup is now complete. A successful HTTP health check alone is not product readiness.
