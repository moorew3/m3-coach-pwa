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

## Container CI and physical Galaxy Fold acceptance checks (October 23)

- The GitHub pull request checks now run two separate jobs: a full Node TypeScript/Chrome suite and a portable **production Docker image build plus actual container HTTP smoke**. The container starts as the non-root `node` user, serves health, the original Recovery Coach and the Workout A/B review gallery, and rejects paid coach API calls with HTTP 503. These tests never change production.
- `/recovery-coach/device-check/` is a one-screen phone diagnostic linked from the seated player. With user-initiated clicks, it plays the **original** approved Marcus file, analyses microphone *level locally* for five seconds, and previews the front camera **without uploading any data**. Closing, hiding, or stopping the page releases the camera and microphone tracks. It saves a local JSON QA receipt, not a server-side log.
- The diagnostic does **not** establish accurate voice recognition, coach listening on a locked phone, actual headset audibility (user must confirm), AI movement-form detection, virtual trainer lip-sync, foot-cast clearance, or real Galaxy Fold hardware compatibility. These remain release-blocking acceptance tests.
- Advisory `scripts/check-approved-media-availability.mjs` sends only HEAD/range requests to each original media URL. It neither creates a backup nor downloads full recordings. External CDN failure is reported but does not corrupt or alter the independent build.

**Privacy**: The GitHub repository is public. Original **plaintext** media, the owner recovery key, and private QA reports must never enter GitHub source or Actions artifacts. A single-use CI job temporarily uploaded **AES-256-GCM encrypted ciphertext only**, then the workflow job was removed after owner-private Drive transfer. Never put the private recovery key in GitHub or beside the encrypted archive.

## Migration and release gates

1. Take a verified backup of the existing deployment and keep a stable rollback route. Do not rename the public domain before the replacement instance is ready.
2. Verify the container in staging, including host runtime support, resource limits, port, health check, restart behavior, and TLS.
3. Verify local user state and any existing Supabase project settings; do not silently create a second database or overwrite athlete logs.
4. Check the approved seat-only Recovery Coach with the original clips, the Marcus recording, a lost network connection, rest/skip/pause/resume, and device browser restart.
5. Confirm camera/mic permission handling and explicit consent on the **physical Samsung Galaxy Fold**; CI desktop Chromium does not certify mobile hardware.
6. Confirm exact approved mouth motion/Marcus lipsync, movement biomechanics and missing Workout A/B media. Until this happens, release should explicitly be labeled preview and not described as a fully finished interactive trainer.
7. Only then switch production traffic after owner acceptance and leave a reversible rollback. This repo's CI **never** automatically changes a live domain or starts a production server.

## Original media backup — encrypted, transferred and independently verified

The source now inventories the **seven originally approved Flex MP4 videos and nine approved Marcus audio tracks** in `approved-recovery-media.json`.

```sh
# No external downloads or media-generation charges:
node scripts/backup-approved-media.mjs --check

# The original media have already been exported and sealed once, with
# original SHA-256 receipts checked. This is a future independent recovery option:
node scripts/backup-approved-media.mjs --download
```

The one-time export validated HTTPS origins, media file signatures, sizes and SHA-256 hashes of all original files. An X25519 public recipient key and fresh ephemeral encryption key were used to seal the originals in an authenticated AES-256-GCM archive. The **private decryption key never entered public GitHub**. A local verification subsequently decrypted the sealed artifact in a temporary directory and independently checked **all 16 originals, file sizes and SHA-256 hashes**; 7 MP4, 7 MP3 and 2 WAV passed. The encrypted package was uploaded to an owner-only, unshared Google Drive folder; Drive confirmed a 13,891,572-byte ZIP. The private recovery key was delivered separately through the owner conversation as a downloadable kit. Protect it offline; losing the key makes the sealed backup unrecoverable.

The one-time CI export job **was removed after the successful transfer**, so future builds do not repeat the backup. Normal CI retains the safe `--check` and lightweight HEAD/range reachability probes. No approved source was rewritten or used for any unapproved replacement clip.

## Media licensing/availability caveat

Current original owner-approved clips are hosted on HeyGen and CloudFront URLs. Their continued availability is an external dependency even if the app itself is independently hosted. An authenticated encrypted owner-controlled copy is now verified and private. The live application still streams its original URLs; this backup has **not** been substituted into production or exposed as a public CDN. Never silently replace them with other people or expired-preview links.

## Payment/security

Build uses `VITE_FLEX_PAID_AI_ENABLED=false` and runtime `FLEX_PAID_AI_ENABLED=false`. Secrets must be injected through the production host's secure environment and *not* committed or written into Docker layers. The application is not suitable for public paid-TTS features until durable cost/rate gating and full live account validation exist.
