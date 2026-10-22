## October 22 original V2 build and phone-sized browser QA — latest

**Repository branch:** `work/m3-flex-v2-two-modes-oct22-offline`. **Production:** NO Railway deploy, merge, approved-media overwrite or new subscription.

The source now modifies the **original `/v2` screen**, not merely `/coach/$day` or the temporary HTML preview:

- `src/v2/set-sequence.ts`, `src/v2/session.ts`, `src/v2/types.ts`: deterministic regular sets with prescribed rest before the next set or different exercise. Optional grouped supersets perform A1 → B1 without a rest timer, then one rest countdown after B1; unequal group set totals preserve the unmatched extra set. Completing a rest phase cannot falsely mark a set done. `useSupersets` defaults off and old session-log structure remains compatible.
- `src/routes/v2.tsx`: in-app **Coach Session** and **Exercise Demonstrations** controls. Demonstrations pause the actual session, disable Start/Complete/Reset, permit video browsing, and preserve the user's exact workout checkpoint and remaining rest on return. Buttons wait for hydration before becoming enabled.
- `src/components/CoachMotion.tsx`: reports actual playing/paused/waiting/stalled/failed video events; original `/v2` session clock and automatic Marcus work audio require a **matching, visibly playing** stage clip. Audio stops when video stops/buffers; absent clips cannot silently advance or complete work. Rest text uses the actual `phaseSecondsLeft` value rather than the upcoming exercise's unrelated prescription. Rest/transition display text remains silent until its own approved trainer footage/audio exists.
- `package.json`: declares existing HeyGen LiveAvatar SDK's required **open-source** `livekit-client@2.15.7` and developer typings `@types/three@0.186.0`. Two preexisting TypeScript callback/timer type mismatches were corrected. No paid service was purchased.

**Verified in isolated cloud checkout of THIS branch, October 22:**
1. `npm install --no-audit --no-fund --ignore-scripts` completed.
2. `npx tsc --noEmit` **passed with zero errors**.
3. `npm run build:dev` **passed** (Vite/Nitro production-style build, with non-blocking third-party module directive warnings).
4. `npm run test:coach-rests`: **19/19** pass.
5. `npm run test:m3-flex-recovery`: **19/19** pass. These seated A/B plans are proposed staging data, NOT live.
6. `npm run test:v2-flow`: **21/21** pass against the actual V2 reducer, including regular rests, optional nonadjacent partner grouping, uneven set totals, preserving exactly completed sets, paused rest, no false rest-time logging.
7. Playwright headless Chromium at 420px mobile viewport on locally served `/v2`: **4/4** experience-switch smoke checks passed (two buttons, demonstration navigation, disabled logging during demos, return to coach controls).
8. Playwright video fault test: blocked all MP4 playback; the V2 work timer held at **0:00** and completing a set was disabled.
9. Playwright media play/pause/resume test: substituted a small **internal test MP4 in the test browser only**, not an owner video. Workout clock advanced to 0:02 while playing, remained at 0:02 when paused, then continued to 0:03 on resume.
10. Playwright checkpoint continuity: after the first completed set, demo browsing and returning preserved the existing rest phase, next exercise, logged set count and exact **30-second** remaining rest.

**Not yet verified / release remains BLOCKED:**
- A React hydration error (#418) appeared during the mobile-sized browser run. This needs root-cause investigation and a real Android Galaxy Fold acceptance test. Browser fixture media does not validate owner video behavior or real device audio output.
- Some V2 media URLs returned 404 in the isolated preview. The protected 11 recovery video records remain a staging manifest; the old V2 short-haired coach registry conflicts with the newer owner's approved braided recovery avatar and elevated anatomical LEFT boot. Do not swap clips or claim identity approval.
- Continuous fully performed coach-repetition video footage, first-set versus later-set spoken Marcus over the WHOLE exercise, realistic rest/handoff cues with matching presence video, reliable lip-sync and free-form coach question answering remain **unfinished**. The approved Marcus voice ID is `0fadce1e82af494a93873aa38ea8d106`; never substitute a browser or unrelated synthetic voice.
- Injury-safe Workout A/B proposals are **not activated**, have no treating clinician clearance recorded and must keep the left boot supported/unloaded. Existing original weekly workouts can include unsafe standing/leg-loading movements and are not a substitute.
- Railway's deployed source/branch/configuration and authorization remain unverified while the platform reconnect issue is unresolved. Owner review, explicit permission, and full media/audio tests are required BEFORE deploying or merging.


# M3 FLEX V2 — outage-safe development and integration checklist
Date: 2026-10-22

## Primary application
Original owner-designated app: https://m3-coach-v2-visual-production.up.railway.app/v2
This is the PRIMARY product. The dochost owner-preview page is a feature/test reference, NOT a replacement or an approved deployment target.

## Outage and source branch lock
- Railway OAuth / platform service access is unavailable. Do not hit Reconnect repeatedly; do not create a new Railway service/project or redeploy while recovery/security guidance is outstanding.
- This feature work is on **work/m3-flex-v2-two-modes-oct22-offline**, forked from **rebuild/m3-coach-v2**. It is NOT the production branch. The current Railway source repo/branch/commit could not be verified while the connection was unavailable.
- Do not merge, tag as production-ready, trigger a deploy, or overwrite live /v2 until its exact repo/branch/commit and latest successful deployment have been read and compared.

## Already staged on this branch
1. `src/routes/index.tsx`: visible side-by-side goal choices in one V2 home card:
   - **Coach Session** reuses existing guarded `/coach/$day` navigation, readiness check, session log and superset selection.
   - **Exercise Demonstrations** reuses the existing lazily loaded `ExerciseLibraryButton` / `ExerciseLibraryModal`. It must not start, complete or reset a workout.
   - The old independent library home button is moved into the shared mode chooser to avoid duplicate experiences.
2. `src/data/recovery/m3-flex-approved-media-staging.json`: the 11 approved source videos, including all seven immutable originals, latest lateral raise R3, and three owner-approved earlier visual versions. Every clip is **production-release blocked** until requirements below are met.
3. This file records constraints and the validation plan. No `public` media, source original video, V2 canonical coach identity, secrets or environment config have been changed.

## Audio and trainer/session requirements
- ONE required voice: **Marcus – Warm & Friendly English**, HeyGen ID `0fadce1e82af494a93873aa38ea8d106`. No female voice, browser TTS substitution or speech from generated video.
- The moving video and Marcus audio must share ONE playback state machine: tap-to-start unlock, play, pause, buffer, seek, end-of-exercise, rest, skip/repeat and navigation. Audio must never keep speaking when the current video stops or the phone backgrounds it.
- Each exercise: first set gets a concise form explanation; subsequent sets get personalized cues, coached tempo/repetition callouts, focused encouragement. No repeated full explanation on every set.
- The coach performs the movement on-screen through all prescribed reps and sets, with rest / next exercise transitions. Existing approved demos are short and do NOT yet meet that entire requirement; looping a 5-second clip is not the final answer.
- User can enter ACTUAL sets/reps, resistance, RPE and interruptions; do not mark coach-counted reps as user-completed. Session snapshots survive interruption. Supersets off by default; selecting them changes instructor action/transition and maintains the prescribed total set count.
- No self-claimed automated form recognition without camera consent, device testing and per-exercise accuracy validation. Camera/form feedback, if added, must never infer safe medical clearance.

## Existing code already available to reuse
- `src/routes/coach.$day.tsx` and `src/lib/coach-session.ts`: original shared coach screens/session state and set completion.
- `src/lib/coach-script.ts`, `src/lib/coach-narration.ts`, `src/lib/coach-voice.ts`, `src/components/CoachAudio.tsx` and `src/components/SessionAudio.tsx`: coach state, speech and mixing infrastructure.
- `src/components/WorkoutModeMenu.tsx`: current in-workout view switching.
- `src/components/ExerciseLibrary.tsx` and `src/components/ExerciseLibraryModal.tsx`: demonstration mode UI.
- `src/data/coach-identity.ts`: canonical source / media admission guard. Stage new clips in a manifest first, never silently bypass the existing guard.
- `src/data/program.ts` and `src/lib/store.ts`: existing program, set/rest prescriptions and app data; avoid replacing the original weekly plan with the recovery preview A/B scheme without explicit approval.
- User-provided Arm Tracker JSON is a state BACKUP, not app source. Preserve its original saved sets/settings/history and do not auto-import or overwrite them without a migration review.

## Safety gates
- Left foot and black orthopedic boot/cast supported on an independent raised footrest; no pushing from left leg, no standing transfers in a superset, and no unwanted leg-loading exercises in this recovery mode.
- Training prescription/intensity requires treating clinician clearance and individualized adaptation. Do not imply that merely ticking a box constitutes medical clearance.
- Earlier triceps / band / boxing files are owner-approved visual previews but still require later likeness/boot corrections before final master. Keep them separate from rejected candidate clips.
- Protected seven original video files remain immutable. Creating an edit always produces a NEW URL / asset record.

## Acceptance / verification before any merge or deployment
1. Verify actual Railway service domain, connected GitHub repository, deployed branch and exact current production commit. Diff staging branch with that confirmed source.
2. Run local TypeScript build/lint/tests in isolated development context, not Railway production. Check links for both modes and restore the original layout as needed.
3. Audit V2's existing verified motion allowlist against staging media. Add only owner-approved exact media, preserving original data and visuals; no auto-approval of unverified movement.
4. Instrument and test a complete Coach Session for each exercise: one explanation in first set; correct brief coach cues on subsequent sets; every set and rep visual; no premature auto-advance or missed chapter; voice plays only with active video.
5. Validate normal and optional superset schedules for A/B with set count preserved; test pause/resume, rest, logs, backups, screen backgrounding and device-level audio synchronization.
6. Perform Samsung Galaxy Fold physical playback QA. A simulated-browser test alone does not demonstrate Android audio or lip-sync fidelity.
7. Inspect Railway incident closure and any required credential rotation/security recommendations, then request explicit owner confirmation before deploying.
8. Deploy only after confirmed approved source, successful test results and rollback checkpoint. Preserve the current V2 app, media, routes and logs.

## October 22 continuation — V2 motion-synchronized Marcus, development branch ONLY

Implemented directly in the original V2 React/TanStack application, NOT the separate dochost demo:

- `src/lib/coach-work-video.ts`: an observable actual-video status keyed to the exact WORK set ID, rather than a timer guessing that a video should be playing. States include paused, buffering, playing and failed.
- `src/components/CoachMotion.tsx`: only the active coached work-set video emits playback status; it immediately pauses speech on video pause/stall/error/seek. Repeated sets using the same clip force a new playback transition and timestamp reset.
- `src/components/TrainerStageMedia.tsx` and `src/routes/coach.$day.tsx`: V2 uses the actual playback key and keeps the accepted moving exercise visible during countdown. The independent demonstration/library route is unchanged.
- `src/lib/coach-session.ts`: work-set audio, live cues and clocks wait for actual motion playback; the exact current set ID must match. No missing-motion set is silently timed or declared complete. Non-work, TTS-paced caption steps are shortened in staging to avoid long silent transitions.
- `src/lib/coach-voice.ts`: the V2 Coach Session is intentionally MARCUS-ONLY. It suppresses fallback to the unrelated OpenAI Onyx or Android/browser voice. The existing backend route explicitly returns HTTP 503 for Marcus until live TTS is integrated; do not claim live arbitrary speech works.
- `src/lib/marcus-approved-cues.ts`: stages already-created, owner-accepted Marcus — Warm & Friendly English recording slices, ID `0fadce1e82af494a93873aa38ea8d106`. First compatible work set gets the recorded exercise explanation; later sets get short motivational recordings. No other voice is substituted. Mappings are exact/limited and do not cover every movement.

**Static review:** 14 key wiring/source checks passed against the current branch (set identity, pause/buffer callbacks, voice-only policy, existing 11-approved-source inventory, same-URL next-set restart). These are NOT build, interactive runtime, network availability, audio-quality or real Samsung tests.

**Critical reality checks remaining:**
1. The existing V2 canonical motion registry (`src/data/coach-identity.ts`) was originally reviewed against a short fade haircut and portrait chest tattoo and explicitly quarantines braids. The newer approved recovery trainer has braids and a LEFT black boot on raised support. Do NOT bypass the registry or quietly substitute one identity. Reconcile and personally approve exact final mappings first.
2. The 11 newer owner-approved motion URLs are still **staging manifest entries**, not registered live clip replacements. The original V2 weekly program still includes exercises that would bear weight on the injured leg. DO NOT deploy that program as the user's recovery routine without an explicit seated, medically cleared selection and movement audit.
3. Existing 5–12-second recordings are short source demonstrations, not full coach-performed repetitions through every set. The video is currently visually looping for approved clips; continuous recorded A/B follow-along masters remain unproduced.
4. The approved Marcus voice cue slices cover some exercises; arbitrary trainer dialogue, full spoken rep synchronization, lip-sync, recovery instruction, guided rests and unmatched exercises do NOT yet have a validated Marcus playback track. They are intentionally silent rather than substituted with another speaker.
5. Existing V2 set/repetition logging and optional supersets are reused but have NOT been exercised against this new media gate in a compiled build. Pausing on missing media is intentional; a clear recovery-safe treatment or user action is needed before public release.
6. Railway authorization is unavailable during its platform incident. Do not merge/deploy until Railway source/branch/commit are verified and owner explicitly approves after source and security review.

Next code/QA targets in this same branch: build with `npm run build:dev`, adapt an injury-safe A/B session plan without overwriting historical tracking, write scripted tests for pause/resume/buffer/fail, first-versus-later Marcus cues, full sets and supersets, and conduct Galaxy Fold playback QA.

## Rest intervals and optional supersets — October 22 staged repair

The original V2 plan's `Exercise.rest` (seconds) is preserved for normal working sets, with a minimum 30-second main-work transition and 15-second warm-up transition if the old prescription was zero. No new hard-coded strength-rest number overrides a longer prescribed interval. The last exercise also triggers rest **before cooldown**.

- **Normal / straight sets:** finish and log Set 1 → rest countdown → Set 2. After a final set → a rest countdown before the next distinct exercise. For example, a 60-second curl prescription stays 60 seconds.
- **Superset mode (optional, off by default):** group partners within the same workout section even if the source list has an unrelated exercise between them. Set 1 of A → prompt for B with **no rest countdown** → Set 1 of B → a single superset rest countdown → next pair round. Each partner keeps its prescribed total set count; when set counts differ, the extra sets run alone with a rest interval. The first partner's handoff is a brief, not a misleading rest step.
- **Rest duration for supersets:** use the higher of the partner prescriptions (`supersetRest` if set, otherwise `rest`) so a longer specified rest is never truncated. A typical A/B pair in the existing V2 program is 75 seconds.
- **Controls:** the existing V2 coach route retains remaining-rest countdown and +15/-15 second adjustments. Counts pause while the session is paused; work-set video/audio remains separated from rest.
- **Verification:** 19 isolated source-derived logic tests passed in the current development session (grouped order, no-pair straight mode, source-set totals, 60-second single set, 75-second partner rest, end-of-exercise rest, before-cooldown rest, and section safety). Repeatable test committed as `scripts/qa-coach-rest-policy.mjs`; command `npm run test:coach-rests`. The actual compiled app and Galaxy Fold playback remain **untested** because Railway remains unavailable. No deployment or purchase.

## Workout A/B staged prescriptions and checks

The new `src/data/recovery/m3-flex-workouts-ab-staging.json` references all 11 owner-approved motion sources by ID (without copying, overwriting or generating the footage). It contains **proposed** injury-aware, fully seated recovery schedules: Workout A 16 working sets, Workout B 15 working sets, plus opening and closing breathing. These prescriptions are NOT yet approved by a clinician, and the file is **NOT wired into the deployed V2 app**. The original live program and historical logs are untouched.

Optional pairings: Workout A seated hammer curls + seated triceps pressdowns; Workout B seated front raises + alternating curls and seated band pull-aparts + triceps pressdowns. A paired round moves A1 → B1 without a recovery countdown, then rests according to its pair's `restSec`. If a pair has unequal prescribed set totals, the extra set completes alone and still gets its own rest countdown. After the final working set, a rest countdown precedes the cooldown chapter.

Additional checks: `npm run test:m3-flex-recovery` exercises 19 deterministic scenarios covering source media approval, exact set totals, normal/set-pair transitions, optional pairs, no internal pair rest, unequal sets, and cooldown entry. Together with `npm run test:coach-rests`, **38 focused logic checks** passed in source-driven evaluation. This is not a TypeScript/Vite build, real-time avatar-rep demonstration, Android audio test, medical clearance or production deployment.

Real release blockers remain: identity reconciliation (older V2 short-hair coach vs approved recovery avatar with braids and elevated anatomical left boot), full 8–15-rep action footage, synchronized Marcus voice for every coached rep/rest period, permission-based form observation if required, safe physical positioning, actual V2 end-to-end browser tests and owner-approved release after Railway recovery.

## Staging status
- GitHub changes: **created; NOT DEPLOYED**.
- Rails/Railway source verification: **BLOCKED BY PLATFORM AUTH/OUTAGE**.
- TypeScript build / real Samsung QA: **NOT YET RUN**.
- Complete trainer-visible all-set motion and tightly lip-synced Marcus: **NOT COMPLETE**.
