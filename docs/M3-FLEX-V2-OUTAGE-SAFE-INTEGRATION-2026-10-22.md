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

## Staging status
- GitHub changes: **created; NOT DEPLOYED**.
- Rails/Railway source verification: **BLOCKED BY PLATFORM AUTH/OUTAGE**.
- TypeScript build / real Samsung QA: **NOT YET RUN**.
- Complete trainer-visible all-set motion and tightly lip-synced Marcus: **NOT COMPLETE**.
