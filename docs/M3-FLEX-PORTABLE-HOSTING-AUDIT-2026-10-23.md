# M3 FLEX — hosting-independent recovery audit (2026-10-23)

Status: AUDIT / PREPARATION ONLY. Nothing here is deployed, approved as a new exercise, or activated in a workout.

## Owner directive

- Stop connection/reconnect attempts to the previous deployment platform. Do not make deployment changes there.
- Use the existing owner-controlled GitHub source, existing approved assets, and already-paid capabilities first.
- No additional subscriptions, hosting upgrades, or paid video/AI generation without owner approval.
- Preserve approved appearance, English Marcus voice, immutable media links, the white left cast, right-foot position, exercise ordering, rest and superset behavior.
- Keep M3 Coach PWA and M3 FLEX Recovery Coach as related but distinct interfaces; the dry-erase-board **Workout Data Extractor** is a distinct structured-record extraction workflow, not a replacement for either application.

## Verified inventory (GitHub / HeyGen, 2026-10-23)

- Owner source: `moorew3/m3-coach-pwa`, default `main`; last fetched head `2db010df10da6cbb63f59432e6de2ea370c72eaf` (Oct 19).
- Framework: TanStack Start, React/TypeScript, Vite, Nitro Node server; package scripts already include `npm run build` and `npm start` (`node .output/server/index.mjs`). This is not a static-only website.
- Recovery Coach: `public/recovery-coach/index.html`; isolated Workout A/B preview: `public/recovery-coach/programs/index.html`.
- Approved and protected seven scenes: C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-PRE-BREATH-R2, C10-POST-BREATH-R1. See `docs/M3-FLEX-MASTER-QA-2026-10-17.md`; do not change/overwrite media.
- C11 hand-opening animation was logged as an unapproved candidate. Rendering completion is not biomechanical or owner approval.
- Backup HeyGen account (m3alertsbackup@gmail.com) is active with a Creator subscription; 171 premium credits reported Oct 23. Primary account (m3alert23@gmail.com) is on the Free plan with 51 add-on credits reported. These are balances, NOT consent to spend.
- Existing rollback / preservation documents remain authoritative when making changes: `src/data/recovery/current-feature-preservation.md`, `current-verified-motion-manifest.ts`, `current-workout-integrity-manifest.ts` and `rollback-plan.md`.

## Portable implementation strategy

1. Retain `main` unchanged. Develop only on a staging branch and verify test routes, stage controls, audio and media before a production merge.
2. Preserve Nitro Node runtime and the existing `npm start` contract; any compatible owner-chosen Node host may run the bundle. Do not pretend GitHub Pages/static hosting can serve `/api/public/coach-speech` and `/api/public/coach-talk` unchanged.
3. First evaluate the user's **existing** Hostinger service, if eligible for Node apps and not already occupied beyond plan limits. Hostinger's official documentation says Business Web Hosting and supported Cloud plans allow Node web apps via GitHub or ZIP. Current account plan, available Node capacity, and compatibility with TanStack Start/Nitro are NOT verified; never assume they are free/included.
4. Keep the backend URL, DNS and database configurable rather than hardwired to one vendor. Use environment variables; do not commit passwords, API tokens, signing keys, or private workout data.
5. Use approved pre-recorded Marcus audio whenever it covers a scene. Preserve browser speech as a fallback if explicitly acceptable. Live synthesized speech and open-ended model conversations are **not** locally autonomous today and may incur API usage fees; pursue an owner-controlled alternative separately before advertising them as unlimited or free.
6. Reuse existing workout state and local/manual logging; do not create a second workout database or rewrite Supabase integration until coverage, migration and rollback are tested.
7. Do not deploy any public paid-model route without server-side authentication, durable rate limiting, origin/access checks, spend caps and logs. Current `coach-speech.ts` requires `OPENAI_API_KEY` and lacks its own authentication and rate limiter; `coach-talk.ts` has only process-local IP counting and trusts forwarded IP headers. This is a cost/security release gate, not a production-approved endpoint.

## QA acceptance gates, in order

- [x] Find canonical owner GitHub source and most recent commit.
- [x] Confirm existing runtime build/start scripts; no duplicate app is needed.
- [x] Confirm HeyGen backup access and identify existing video library without generating anything.
- [x] Cross-check the seven owner-approved Recovery Coach scenes in the current QA record.
- [ ] Obtain non-destructive source snapshot, compile/build and test the candidate on a staging runner; **not verified in this audit**.
- [ ] Confirm the existing Hostinger account's hosting tier, Node process limit, use limits and compatibility, without purchasing or upgrading.
- [ ] Secure AI endpoints and establish a configurable local/low-cost voice/coach fallback, with no unapproved charges.
- [ ] Validate superset timing: rest occurs after the last exercise in a superset, with rest between complete supersets and after standalone sets.
- [ ] QA exercise identity, movement biomechanics, audio timing, lip-sync, Android restart/resume, screen orientation, TV and gesture controls.
- [ ] Ensure clinician clearance gate remains intact for cast-related recovery training.
- [ ] Confirm preview/owner approval before activating any new motion; keep old references immutable.
- [ ] Validate backup, rollback, and a working external URL on the selected deployment destination.

## Release status

NOT READY FOR RELEASE. This staging audit is safe to review and contains no modifications to approved media or production application behavior. No hosting, publishing, AI usage or HeyGen credits were consumed by recording this plan.

Authoritative references: Hostinger's Node hosting instructions https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/ ; TanStack Start generic Node hosting https://tanstack.com/start/latest/docs/framework/react/guide/hosting .
