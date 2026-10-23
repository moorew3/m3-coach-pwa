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

## Database, rollback and live-traffic gate

- Preserve current Supabase security policy and existing sync data. No schemas or data have been migrated.
- Store runtime env vars and private credentials outside repository and redact logs.
- Maintain a known-good commit from `main`, immutable approved media URLs and a data export/backup verified in the actual cloud account.
- Run non-destructive staging checks on Android/Galaxy Fold and real sound output; a passing GitHub build is insufficient to certify live UX.
- Merge/publish only after complete tests and an operator-authorized production cutover. Keep DNS on current destination until independent host serves full runtime. Do not use an unverified external platform for failover, and do not change production site automatically.

**Current release status:** Application source on protected staging branch; no independent host or production DNS migration verified. No paid API use in the audit.
