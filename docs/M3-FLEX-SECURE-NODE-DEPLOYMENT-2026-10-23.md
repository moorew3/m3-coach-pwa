# M3 FLEX — independently hostable Node build and paid-AI release gates

Updated 2026-10-23. **Staging/documentation only; this is not a deployment record.**

## Source and immutable assets

- Source: `moorew3/m3-coach-pwa`; working branch `m3-flex/portable-hosting-audit-2026-10-23`, draft PR #25.
- Retain approved Recovery Coach scenes C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-PRE-BREATH-R2 and C10-POST-BREATH-R1. Keep their original source URLs and Marcus recordings unchanged.
- C11 finger-opening render is **not** approved or active. Independent preview only.
- Keep the existing user workout session engine and Supabase data; no second database or automatic migration.
- Do not substitute a different coach face, video, voice, or unsupported movement when a source is missing.

## Reproducible build contract

This is a TanStack Start / Nitro **Node server**, not a static-only website.

1. Use Node.js 22 on a user-controlled machine or compatible existing host.
2. Clone the GitHub repository; install dependencies with `npm install --no-audit --no-fund`.
3. Run `npm run build`, `npx tsc --noEmit`, and `node --experimental-strip-types --test scripts/*.test.mjs`.
4. Confirm `.output/server/index.mjs` exists, with `.output/public/recovery-coach/index.html` and `.output/public/recovery-coach/programs/index.html`.
5. Configure runtime `PORT` and the existing `SUPABASE_*` variables **privately**. For browser builds set corresponding `VITE_SUPABASE_*` values only for publishable, non-secret project keys.
6. Run `npm start`. Serve behind TLS/reverse proxy; check /, /recovery-coach/, and /recovery-coach/programs/ in mobile and desktop layouts.
7. Verify exact stage order, cast restrictions, superset final-slot rest (never between pair slots), media loop, voice, screenshots, fallback, pause/resume, recovery and data persistence before switching live traffic.

`npm start` calls `node .output/server/index.mjs`, not an external hosting command. GitHub Actions validates the artifact but does **not** deploy or keep a server running. Verify the actual account's Node availability, runtime limits and fees before selecting a host. Do not rely on a hosting tier's advertised support without checking the account.

## Optional paid-AI endpoints — CLOSED BY DEFAULT

Both `/api/public/coach-speech` and `/api/public/coach-talk` now share `src/lib/paid-ai-access.ts` (staging branch):

- By default `FLEX_PAID_AI_ENABLED` is unset/false and requests return HTTP 503 **without contacting a paid AI API**. The original approved/pre-recorded Marcus media remains available; this does not itself implement a local spoken AI replacement.
- An explicit `FLEX_PAID_AI_ENABLED=true`, Supabase server URL + publishable key, and `FLEX_AI_ALLOWED_USER_IDS` allowlist are ALL required before a paid request can proceed.
- A same-origin browser provides an existing Supabase Auth bearer token. The server validates it through `supabase.auth.getUser(token)` and checks its verified user ID against the allowlist. Tokens are never stored in the source or passed to another domain.
- Input requests require JSON and are bounded to 8 KB; responses never expose raw provider failure details. Both routes share a conservative per-user 10/minute and 60/day **per-process** limit.
- User origin checks add friction against browser abuse but are **not** authentication; client-controlled Origin and IP headers cannot replace verified user identity.
- On unavailable paid voice, the app intentionally does not switch to an unapproved browser voice, preserving the approved voice identity. Offline/from-file exercises continue without paid AI.
- `OPENAI_API_KEY` is server-side only; no VITE_ equivalent. No API key should be committed to GitHub, embedded in the app, logged, or sent in responses.
- Default conversation model configured in staging: `gpt-4.1-mini`. It is an API model, not the ChatGPT product model, and can be overridden with `OPENAI_COACH_MODEL`. Model cost, TTS voices, actual API permissions, and compatibility still need a nonproduction authorized validation **before** enabling.
- Do not enable just because the tests pass: the counter is **in-memory, per Node process**, resets on restart and is NOT a durable cross-instance hard budget. Put an account-level hard spending cap (if provided by the API vendor) and a shared persistent request quota in place. These must be verified for the deployed service; do not promise a hard stop that the API provider does not guarantee.
- Before enabling, verify an allowed signed-in account works, a disallowed account is blocked, missing JWT is rejected, provider outage is safe, and app recovery/approved media work with paid AI disabled.

## No-cost deterministic coaching (staging)

- The existing full workout route now answers a defined set of live session questions from its own state via `src/lib/local-coach-answer.ts`. These include exercise name, prescribed reps, actual set number, next script step, displayed rest time, entered load and recorded movement cues.
- A short safety response takes priority if pain, chest pain, breathing difficulty or cast loading is mentioned. The helper does not invent body measurements or clinician clearance.
- Camera form answers are refused when the camera is off or its confidence is below 0.70. Stronger readings quote an existing camera cue as an estimate, NOT a verified physical assessment.
- Session Controls contains a low-clutter text input, and answers appear as a dismissible on-screen caption. Browser speech recognition, when permitted and actually supported, uses the same local-answer path. **Browser speech recognition may itself depend on platform services and is not claimed to operate offline.**
- The local answer helper is deterministic, not a generative conversational model. Open-ended questions cannot always be answered; the app explicitly says when optional online AI is unavailable.
- By default `VITE_FLEX_PAID_AI_ENABLED=false` (browser build) and `FLEX_PAID_AI_ENABLED=false` (server); local factual questions are answered without sending audio/text to a paid AI provider. Both flags and all server allowlists must be deliberately configured before enabling external conversation or generating speech.
- This development pass DOES NOT make freshly composed local answers audible in Marcus's voice while optional paid speech is off. Owner-approved recorded clips remain the permitted spoken media; no robotic device-voice substitution has been added.
- QA requirements include real device input/caption usability, microphone permission checks, session persistence, pre-existing voice playback and no paid network usage with flags disabled.

## Read-along workout operation when paid speech is disabled

The owner-cost setting `VITE_FLEX_PAID_AI_ENABLED=false` now applies to the **entire shared coached-session voice layer**, not merely the conversation form:

- `speak`, speech prefetch, voice unlock, optional voice diagnostics and the underlying speech-request function all return without attempting an outside TTS request. The server independently denies these same paid calls.
- `useCoachEngine` treats generated narration as unavailable in this mode. Speech-led **intro / setup / handoff** steps use the visible-script read-along timer capped at 10 seconds; the app cannot hold them indefinitely while waiting for a non-existent audio completion event.
- **Actual exercise intervals, rep-based sets, rest periods, programmed cooldown seconds and 3–2–1 countdowns retain their original duration and logging behavior.** The cap applies only to steps explicitly marked `speechPaced`.
- Phone and glasses show the full on-screen scripted instruction during speech-led transitions and the read-along countdown; the TV/presentation view and glasses use the same no-voice policy. None displays a non-functional “Tap to enable AI voice” overlay while the paid service is off.
- The phone workout screen shows a passive **Read-along** indicator and a plain explanation in Session Controls. This is a precise limitation, not a substitute for the approved Marcus narrator.
- Owner-approved **pre-recorded Marcus MP3** remains separately testable in Audio Status. This pass does NOT automatically sync that MP3 to every dynamic scripted cue or claim new Marcus speech/lip-sync while live generated speech is disabled.
- Added `src/lib/speech-pacing.ts` and regression tests to protect exercises and rest from accidental shortening, along with source-level guards against paid speech calls while disabled.

`VITE_FLEX_PAID_AI_ENABLED` is a **build-time** value. Changing it requires a fresh application build; enabling the server alone must never bypass the browser opt-in. Every deployment requires an independent live user validation of workouts, local captions, motion, voice output, and timer transitions.

## Athlete-log integrity and timed superset QA (staging)

A coach repetition animation is an approximation of the **demonstrator's cadence**, not a verified count of the athlete's real reps. The old callback recorded the preset target as actual completion even when no clear camera observation or user confirmation existed. It now stops at the demonstrated target, shows an explicit "verify your own reps" message, and waits for the existing manual Done set / confirmed-camera action. Prescribed rep guidance is unchanged; **the app must not turn a demonstration timer into fabricated workout history**. A dedicated regression check enforces this separation.

The browser interaction suite now also inspects the live, locally persisted workout timer:

- An actual paused countdown must remain at the same value for longer than one second, then visibly decrement after Resume.
- Turn on supersets using the real application control and skip via the real coach rail to Monday's declared B1/B2 pair.
- Assert B1 first-round curls lead directly to B2's short **brief**, not a fake rest; then B2's work set, **75-second rest only after B2**, and round 2 restarting on B1.
- Pause mid-pair rest and verify no countdown decrement. Resume and verify the number decreases.
- These are fake-user browser tests using ephemeral local test data; no production logs, subscriptions or live user workouts are affected.

Release limitation: this validates timing and logging mechanics in an emulated 390px Chrome browser; it is **not** a biomechanics, seated-only programming, cast support, physical-device camera or voice certification. Verify injury-safe exercise selection separately before athlete use.

## Automated browser interaction QA (staging, NOT phone hardware certification)

A GitHub Actions step now installs a **temporary CI-only** Chrome browser and Playwright controller after the compiled Node build. Neither dependency is shipped with the app or requires a new paid subscription. The automated 390-pixel mobile-width browser workflow tests:

- A fresh session's opening gate, genuine tap and "Yes" acceptance
- The in-workout coach entrance, user-selected "Yes", required readiness confirmation and visible no-charge read-along state
- Actual React Pause/Resume controls updating the shared session's `data-running` state
- A typed factual coach question answered on screen without any request to a paid AI endpoint
- Browser uncaught errors throughout the main flow
- Simulated network failure of an existing approved MP4, followed by its still-image fallback and **exact same URL** retry (the tool does not approve or replace media). The entrance variant places the Retry control above the full-screen welcome tap and Yes/No overlay, so it can be clicked immediately without dismissing the introduction.
- Previous compiled Node health and default-denied speech/conversation smoke tests remain intact

If a browser test fails, GitHub Actions retains a screenshot for seven days. **This test emulates viewport and touch controls in desktop Chromium**. It cannot establish Galaxy Fold microphone permission, camera calibration, headset output, motion quality, video-host reachability, or genuine avatar lip synchronization. These remain live-device acceptance criteria. No production deployment is performed by the workflow.

## Media failure handling — approved motion only (staging)

The existing full-screen coach video player now detects direct clip source failures, browser autoplay blocks and playback stalls exceeding 12 seconds. It **does not** replace the clip with an unrelated demonstration. It displays the original approved still, an explicit message, and a tap-to-retry button that reloads the exact same source. Vimeo embed errors similarly display the original poster/still and permit a same-ID retry.

- The workout timer is **not paused automatically** by a media failure, and no set is automatically marked as complete. The notice explicitly reminds the user to use the normal Pause control if a demonstration is needed.
- The owner-approved still is used for visual fallback, but it is **not** represented as a moving demonstration.
- The preloader, active movement identity gate, approved-video allowlist, superset prescriptions and motion attribution remain unchanged.
- The full app's Audio status panel now separately offers a native play-control for the already-approved C09 Marcus English recording. It explicitly identifies recorded playback as no-charge and does not describe HTML playback as proof that the physical speaker made sound.
- The previous premium-generated-audio diagnostic is disabled by default when `VITE_FLEX_PAID_AI_ENABLED` is not true, avoiding a confusing 503 test that might be misdiagnosed as broken phone audio.
- Regression tests protect both retry controls, their unchanged original sources, absence of automatic set logging, and the approved Marcus test media ID. CI checks the React/TypeScript build, not actual CDN uptime or a physical Android speaker.

For live Galaxy Fold QA, verify three separate outcomes: normal approved motion and Marcus narration; video URL unavailable with the same-source retry and original still; phone autoplay blocked with retry after a tap. Repeat in portrait/landscape and with Bluetooth earbuds. Confirm the timer and set log do not change from retry alone. Do not claim complete video/audio device verification from unit tests.

## Portable uptime diagnosis (no monitoring subscription)

The staging app exposes `GET /api/health`: a no-credentials JSON process-liveness check containing only `service`, `status`, and `check`. It does not contact Supabase, OpenAI, HeyGen, or any paid provider. This route is covered by the compiled Node HTTP smoke test.

- `GET /api/health` returns 200 and `{"service":"m3-flex","status":"ok","check":"process"}` when this Node process responds. This alone **does not** certify login, database persistence, camera, voice, video CDN, or client hydration.
- If health fails, inspect DNS, TLS proxy, Node logs, port mapping and upstream process.
- If health succeeds but videos fail, test each immutable approved media URL, browser autoplay permission and content-policy/CORS problems separately. Never silently swap in unapproved footage.
- If health succeeds but an optional conversation or newly generated speech request returns 503 while the paid-AI flags are off, **that is the expected cost-safety setting, not server downtime**.
- After a real host is chosen, an existing owner-controlled scheduler can periodically check this endpoint without a paid uptime service; no external monitor is connected or scheduled by this commit.

## Database, rollback and live-traffic gate

- Preserve current Supabase security policy and existing sync data. No schemas or data have been migrated.
- Store runtime env vars and private credentials outside repository and redact logs.
- Maintain a known-good commit from `main`, immutable approved media URLs and a data export/backup verified in the actual cloud account.
- Run non-destructive staging checks on Android/Galaxy Fold and real sound output; a passing GitHub build is insufficient to certify live UX.
- Merge/publish only after complete tests and an operator-authorized production cutover. Keep DNS on current destination until independent host serves full runtime. Do not use an unverified external platform for failover, and do not change production site automatically.

**Current release status:** Application source on protected staging branch; no independent host or production DNS migration verified. No paid API use in the audit.
