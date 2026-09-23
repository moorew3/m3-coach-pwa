# Feature preservation notes — snapshot 2026-09-20

Everything below was added AFTER the rollback target commit
`a516c62b586bf9a052be9ba1d72e8223c86abce4` ("Fixed coach identity & audio", 2026-09-15)
or was materially reworked since then. If the restore removes any of it, reapply
from this list. Paths are current-tree paths.

## Opening / front gate
- `src/components/AppEntryIntro.tsx` — once-per-session gate: dark gym + drifting
  smoke, approved coach still (no fake walk), exact spoken line
  "Are you ready to work your ass off?", YES/NO. YES lands on workout selection,
  NO never starts a workout. Session flag `coach-intro-seen-v1` in sessionStorage.
- `src/routes/__root.tsx` — mounts the gate ahead of all app content; secondary
  displays (TV / glasses) bypass it.
- `src/lib/session-intro.ts` — intro copy/state helpers.
- Rule kept: no fake walk-in (no zoom/pan/scale/slide). Real walking footage only.

## Approved coach voice wiring
- `src/lib/coach-voice.ts`, `src/lib/coach-script.ts`, `src/lib/coach-narration.ts`,
  `src/lib/coach-cue-engine.ts`, `src/components/CoachAudio.tsx`,
  `src/components/CoachAudioPanel.tsx`, `src/routes/api/public/coach-speech.ts`.
- Audio mixing/ducking: `src/lib/audio-mix.ts`, `src/components/SessionAudio.tsx` —
  music never stops, it only dips while the coach speaks; separate coach/music
  volume + mute + duck-depth controls in the workout screen and Settings.

## Canonical scene registry (single source of truth)
- `src/data/exercise-library.ts` — per-entry `verifiedMotion`, `manualSequence`,
  `still`, `tempo`, `coaching`, `actor`, `sceneStatus`.
- `src/data/coach-identity.ts` — locked actor, approved motion allowlist,
  `CANONICAL_IDENTITY_MOTION`, `INVALID_COACH_MOTION` quarantine, aliases, posters.
- `src/data/mirror-boards.ts` — approved same-coach manual phase sequences
  (`MANUAL_COACH_SEQUENCES`) under `src/assets/coach/manual/`.
- `src/lib/trainer-media-state.ts`, `src/components/TrainerStageMedia.tsx` —
  verified video else stationary approved actor + "FULL MOTION DEMO IN PRODUCTION".

## Coach Mode prescription parity (must not regress)
- `src/lib/coach-motion-plan.ts` — pass-through only; no filtering/substitution.
- `src/lib/alt-sessions.ts` — recovery/stretch rows unfiltered.
- `src/routes/coach.$day.tsx` — no auto-skip guard for missing motion.
- Invariant: missing media changes ONLY what is on screen, never order, sets,
  reps, time, rest, or logging keys.

## Manual Mode / Exercise Library
- `src/components/MirrorMe.tsx` — button-controlled phases (Previous / Next /
  Start / All Phases). No auto-cycling, sliding, pan/zoom, or crossfade.
- `src/components/ExerciseLibraryModal.tsx`, `src/components/ExerciseLibrary.tsx`,
  `src/components/ExerciseInstruction.tsx` — status badges, "Manual phases" label,
  instructional sequence for gap movements.

## TV / presentation mode
- `src/routes/presentation.tsx`, `src/components/CastConnect.tsx`,
  `src/components/DisplayConnect.tsx`, `src/lib/cast-link.ts`,
  `src/lib/display-link.ts`, `src/routes/display.tsx`, `src/lib/pairing.ts`.

## Glasses mode
- `src/routes/glasses.tsx` — same registry, same actor, same sequence.

## Other post-Sept-15 additions still wanted
- `src/routes/motion-backlog.tsx` — `/motion-backlog`, lists the 19 gap scenes with
  purpose and equipment; linked from the Program page.
- `src/components/CameraCoach.tsx`, `src/lib/vision/*`, `src/lib/form-score.ts`,
  `src/lib/rep-cadence.ts`, `src/lib/game-score.ts`, `src/components/GameHud.tsx`.
- Health / wearables seams: `src/lib/health/*`, `src/lib/wearables.ts`,
  `src/components/HealthPanel.tsx`.
- Nutrition + settings routes: `src/routes/nutrition.tsx`, `src/routes/settings.tsx`,
  `src/routes/progress.tsx`, `src/routes/program.tsx`, `src/routes/safety.tsx`.
- Substitutions / custom workouts / resume / manual log in `src/lib/store.ts`,
  `src/components/SubstitutionSelect.tsx`, `src/components/ExerciseOptions.tsx`.
- QA scripts: `scripts/audit-coach-motion.ts` (coverage report, non-failing).

## Explicitly NOT to be carried back or revived
- Mirror/profile/barcode/supplement build (reverted commit `7a38a98`).
- Old `src/assets/coach/coach-reference.png` as the active identity source —
  preserved on disk only; the locked primary is
  `src/assets/coach/identity/coach-primary-standing.png.asset.json`.
- Every clip listed in `INVALID_COACH_MOTION` (wrong avatar / wrong equipment),
  including the rejected Hammer Curl proofs.