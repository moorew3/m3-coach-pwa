# M3 FLEX — Seated Recovery Coach and Training Tracker

M3 FLEX is an owner's personal workout and progress-tracking system. This repository includes a web application, a portable container and a separate Android **debug test APK** build for the approved seated Recovery Coach. The older 22-day workout tracker remains present but **includes standing/leg-loading movements and is not suitable for foot-cast recovery**.

## Current working parts

- `/recovery-coach/`: the seven original owner-approved seated/moving Flex video scenes with original Marcus English audio, timed sets and rest, optional paired supersets, clinician-gated start, safe pause/reload and Android Voice Access-compatible buttons.
- `/recovery-coach/form-check/`: opt-in MediaPipe local upper-body landmark preview. It cannot measure medical clearance, verified reps, actual resistance, technique safety or every aspect of posture.
- `/recovery-coach/logbook/`: manually entered real repetitions, optional pounds, body weight, waist and arm measurements; local-only backup/restore, latest actual performance, measurement trends and **nonautomatic, clinician-dependent** progression discussion cues.
- `/recovery-coach/bench-core/`: seated/core timers and a separate clinician-gated exercise checklist. **These core motions do not yet have approved moving Flex footage and synced Marcus for every exercise.**
- `/recovery-coach/programs/`: owner-only **Workout A/B development review**. Missing or unapproved movements are not enabled as finished guided workouts.
- `/api/health`: process liveness only. Chargeable AI coach endpoints are off by default.

## Release and safety status

**Protected draft PR #25 is not an approved production release.** Completing automated checks does not establish physical Galaxy Fold compatibility, human-readable true lip-sync, Android Bluetooth audio, medical clearance, safe equipment form, or real two-way spoken Marcus coaching.

The app's timers do **not** automatically count actual athlete repetitions. User input is explicitly labeled as self-reported, stored locally by the current browser/app, and may be exported/imported with user action; **automatic two-device synchronization is not yet available**.

No external original video, voice or owner portrait may be silently replaced or newly generated; consult the release safety audit and approved source manifest. A private encrypted backup of the original media is handled independently of this public repository. Never commit private media archives, owner data, API credentials, APK signing keys or private decryption keys.

## Build and validate locally

Requires Node.js 22, npm and Internet access for downloading the official publicly distributed pose model **during the build**. The original Flex and Marcus videos continue to stream from approved media hosts at playback time.

```sh
npm install --no-audit --no-fund
node scripts/stage-pose-runtime.mjs
npm run build
npx tsc --noEmit
node --experimental-strip-types --test scripts/*.test.mjs
node scripts/node-runtime-smoke.mjs
```

For full automated mobile Chrome testing, follow `.github/workflows/build-check.yml`; it installs Playwright and Chrome only in CI. If operating an existing compatible Node 22 host, `npm start` runs the compiled `.output/server/index.mjs` after building. A portable root `Dockerfile` also packages the production app as a non-root container, verified in GitHub Actions. Neither route silently deploys or changes an existing website.

To build the separate static recovery review ZIP:

```sh
python3 scripts/package-static-recovery-preview.py
```

The ZIP is for a **separate HTTPS preview**, not a replacement for the entire server-based application or proof of offline coach videos. The first-party MediaPipe WASM/model is bundled, but original owner-approved Flex/Marcus MP4/MP3 tracks still require the network. See `docs/M3-FLEX-HOSTINGER-NODE-RELEASE-PATH-2026-10-23.md` for preview-host options and restrictions.

## Android test installer

The workflow `.github/workflows/android-apk.yml` builds the bundled seated Recovery Coach using Capacitor/Gradle for testing. Download the artifact associated with the **latest matching protected branch commit**, verify its checksum, and inspect the contained APK; do not confuse GitHub's artifact ZIP with the actual `.apk`. It is **debug-signed**, not a production-signed Play Store release. Do not overwrite an unrelated live app or claim Galaxy Fold camera/speech behavior without physical testing.

## Open acceptance gates

1. Get separate owner + clinician acceptance of outstanding Workout A/B and bench-core media, actual equipment biomechanics and movement prescriptions. Do not invent approval or substitute another person's face.
2. Verify real Marcus voice sync, real Galaxy Fold headphones, speech/permission behavior and shoulder/cast-safe biomechanics.
3. Deliver secure account-backed cross-device workout sync and real interactive Marcus **only after** an approved architecture/provider and transparent cost/privacy controls exist.
4. Test and explicitly accept a preview deployment and rollback before changing production. No purchases, media generation, live deployment or PR merge from a successful CI run alone.


## Protected, manual workout-history transfer between devices

Open `/recovery-coach/logbook/`, enter only real completed reps and measurements, then choose **Export password-protected backup**. Enter a memorable password of at least 12 characters and save the resulting `m3-flex-password-protected-workout-log.json` privately. The browser derives an AES-256-GCM key through PBKDF2-SHA-256 with a fresh 16-byte salt and 310,000 iterations, then generates a fresh 12-byte nonce. On your second device open the logbook, supply the **same password**, and select that file through Restore. The existing plain-text JSON export still works but is **not encrypted**.

Neither the password nor workout history is uploaded by M3 FLEX. The app does not automatically synchronize your phone and computer; this is an authenticated *manual* backup. Losing the password means losing access to the protected file. When reinstalling a debug-signed Android test APK, back up actual reps/measurements first because an app uninstall can clear local workout history. An encrypted archive is not a medical-record service, a login or a replacement for an accepted cloud architecture.

The approved seated workout now displays the most recent **self-reported** set next to each loaded movement. It does not fabricate repetitions based on the video timer, auto-select resistance or infer a pound load for the INNSTAR band. If the logbook changes in another same-origin window, its view updates via the browser's local storage notification; this is **not** cross-device cloud sync.
