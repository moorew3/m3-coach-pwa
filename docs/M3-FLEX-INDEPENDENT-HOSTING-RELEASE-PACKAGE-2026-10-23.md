# M3 FLEX — Portable production image, not a deployed website

The source in `moorew3/m3-coach-pwa` now includes a **Dockerfile** and a secret-excluding **.dockerignore**. This supports an existing self-managed Linux server/VPS or any independently selected compatible container host. No Railway integration is required.

## Prerequisites

- A verified host that supports long-running Node 22 containers and persistent HTTPS reverse proxy.
- Domain/DNS and HTTPS under the owner's control, plus a container runtime supported by that host.
- A secure source checkout of the protected reviewed branch and a verified copy of the user-approved static media references.
- No new subscription should be purchased without confirming the current Hostinger account actually includes the necessary Node/container capability.

## Local non-production smoke procedure

```sh
docker build -t m3-flex:review .
docker run --rm --name m3-flex-review -p 127.0.0.1:3000:3000 m3-flex:review
# In another terminal:
curl --fail http://127.0.0.1:3000/api/health
curl --fail http://127.0.0.1:3000/recovery-coach/
curl --fail http://127.0.0.1:3000/recovery-coach/programs/
```

Open `http://127.0.0.1:3000/` in a separate browser tab and verify the original seven approved assets and rest timings. The image is built as an unprivileged `node` user and only publishes port 3000 behind the operator's TLS proxy. Docker defaults to chargeable AI features **off**. No secrets are baked into the image. Don't expose port 3000 publicly without TLS or authentication protections.

## Migration and release gates

1. Take a verified backup of the existing deployment and keep a stable rollback route. Do not rename the public domain before the replacement instance is ready.
2. Verify the container in staging, including host runtime support, resource limits, port, health check, restart behavior, and TLS.
3. Verify local user state and any existing Supabase project settings; do not silently create a second database or overwrite athlete logs.
4. Check the approved seat-only Recovery Coach with the original clips, the Marcus recording, a lost network connection, rest/skip/pause/resume, and device browser restart.
5. Confirm camera/mic permission handling and explicit consent on the **physical Samsung Galaxy Fold**; CI desktop Chromium does not certify mobile hardware.
6. Confirm exact approved mouth motion/Marcus lipsync, movement biomechanics and missing Workout A/B media. Until this happens, release should explicitly be labeled preview and not described as a fully finished interactive trainer.
7. Only then switch production traffic after owner acceptance and leave a reversible rollback. This repo's CI **never** automatically changes a live domain or starts a production server.

## Media licensing/availability caveat

Current original owner-approved clips are hosted on HeyGen and CloudFront URLs. Their continued availability is an external dependency even if the app itself is independently hosted. Exporting the actual approved original files to storage controlled by the owner is still a separate task; a URL or GitHub file does not prove the media are backed up. Never silently replace them with other people or expired-preview links.

## Payment/security

Build uses `VITE_FLEX_PAID_AI_ENABLED=false` and runtime `FLEX_PAID_AI_ENABLED=false`. Secrets must be injected through the production host's secure environment and *not* committed or written into Docker layers. The application is not suitable for public paid-TTS features until durable cost/rate gating and full live account validation exist.
