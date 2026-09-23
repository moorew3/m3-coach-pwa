# Coach-led flexible sessions

- [x] Flexible activity, saved-workout, avatar, and health metric state
- [x] Workout chooser and custom workout builder
- [x] Coach-led setup and always-visible session controls
- [x] Coach scripts and shared displays adapt to selected sessions
- [x] Real phone activity data: Bluetooth heart rate, GPS/motion walk tracking, health-file import, manual fallback
- [x] Session model covers warm-up / work / drop / back-off sets, timed and unilateral work
- [x] Camera rep count offered as a correctable suggestion during logging
- [x] Validated mobile layout, persistence, and zero new recurring cost

## Health + avatar polish pass

- [x] Coach speaks full set context (set number, target, load, counted reps)
- [x] Camera reps stay a suggestion; unsupported movements say so and log by hand
- [x] Pace field plus explicit CSV/JSON import format notes
- [x] Native-ready Health Connect adapter with honest "Android app version" copy
- [x] User avatar: photo crop, shape, frame, display name; shown in Coach Mode

## Coach presence showcase pass (done)

- Coach states (ready / demonstrating / observing / encouraging / rest / transition / celebrate) in `src/lib/coach-states.ts`.
- Coach stays on screen during demos as a corner tile; full tile when no demo.
- Set-intelligence chips: set kind, set X of Y, target, load, rest, side, swap, camera/manual/unsupported.
- Coached rest card (next set + last camera form cue) and in-session exercise swap.
- Recap now shows logged work plus progression notes from `recapLines`.
- Mobile 412x915: coach tile ~340-475, set fields ~671 (above sticky action bar).

## Train-with-Coach correction pass (done)

- Verified coach clip (`coachMotionFor`) is the MAIN visual on work / warm-up / cool-down steps; loops until set is marked done.
- Static `CoachPresence` only for intro, rest, transition, no-clip fallback, recap. No corner tile over a verified clip.
- Labels: "Train with Coach" (was "Your avatar" / "View example"); no-clip fallback says "Coach motion pending for this movement".
- Coverage audit: all 7 program days = 100% verified coach clips (Mon 11/11, Tue 10/10, Wed 11/11, Thu 7/7, Fri 15/15, Sat 14/14, Sun 1/1). No new aliases.
- 412x915: clip 314-490, weight/reps 677-730, Done set bar 735.

## Canonical coach identity guard (done)

- [x] Invalidated Step + Alternating Curl motion/poster: different person and unstable movement continuity.
- [x] Invalidated Step + Shoulder Press motion/poster: different person.
- [x] Motion URLs now require a separate canonical-identity attestation before any coach view can play them.
- [x] Both affected movements fall back to the unchanged approved coach still until matching clean clips exist.

## Self-playing workout game pass (done)

- Every set (rep or timed) opens with the coach's brief then 3·2·1·GO (`countdownIn: true`, engine arms `lead` without a clock for rep sets).
- Muted coach: speech-led steps fall back to a capped 10s read-along clock so the session never stalls.
- Game HUD (`src/components/GameHud.tsx`): exercise, set X/Y, target, live camera reps, load, rest clock, camera status, heart rate, progress, XP, mission.
- Manual logging collapsed behind "Done set will log … · Adjust"; camera count offered once by voice + "Confirm camera count" one-tap when confidence ≥70% and count ≥ target top. Never auto-applied.
- XP / grade (`src/lib/game-score.ts`): +10 set, +5 warm-up set, +25 exercise cleared, +5 camera-confirmed, +5 target-range hit, +100 finished; grade S/A/B/C/D from planned-set completion. Recap shows the breakdown.
- Today → Coach Mode re-verified at 412x915 (fresh, readiness done, resume).

## Full-screen game stage + motion continuity pass (done)

- Coach Mode is a fixed edge-to-edge stage (`data-testid="coach-stage"`): the verified coach clip / approved still is the backdrop; only translucent HUD, cue line, primary button and a 7-button control rail (Pause · Skip · Swap · Camera · Voice · Gestures · More) overlay it. Manual log, swap, camera panel and every extra control live in sheets.
- `src/components/CoachMotion.tsx`: two-layer video player. Same clip is pre-loaded in the standby layer and crossfades 0.28s before the end (no native-loop jump); movement change loads the next clip in standby and only swaps once `canplay` (no black frame, no remount); hidden third element warms the following clip. Pause freezes both layers. Load failure = approved coach still.
- Mirror Me `MotionPlayer` and the stage both use it; `key={url}` remount removed.
- Sandbox Chromium cannot decode H.264 (MEDIA_ERR 4) — DOM lifecycle verified (0 remounts across 3 loop windows, pause/resume, rest, same-move next set, different-move transition); visual smoothness still needs a real Samsung/Chrome check.

## Coach stage clip-selection fix (correction pass)

- Root cause: `stageClip` fell back to `clipAfter(i + 1)` (a LATER movement's clip),
  and `CoachMotion` kept the previous clip visible while a new one loaded.
- Fix: strict invariant — visible clip is only `coachMotionFor(currentMove.id)`;
  `clipAfter()` now feeds a hidden `coach-preload` element only. `CoachMotion`
  hides both video layers until the CURRENT url is ready (`shownUrl === url`),
  so the approved coach still/poster covers every transition.
- Verified: warm-up walk step shows easyWalk.mp4 with shoulderMobility.mp4 as
  hidden preload only; no page errors; shoulderMobility.mp4 asset confirmed to
  show the approved coach doing shoulder work (frame extract).

## Game-layer architecture (this pass)

- [x] `src/lib/workout-phase.ts` — INTRO/WARMUP/EXERCISE_PREP/ACTIVE_SET/REST/NEXT_EXERCISE/COOLDOWN/WORKOUT_COMPLETE
- [x] `src/lib/exercise-player.ts` — centralized per-exercise player config (motion clip, sets/reps/duration/rest, cues, tracking rules)
- [x] `src/lib/form-score.ts` — 0-100 form score from real ROM/tempo/symmetry, null when camera confidence < 0.55
- [x] `src/lib/coach-cue-engine.ts` — throttled dynamic cues tied to phase + tracking events
- [x] HUD shows phase, form score and streak
- [ ] Replicate the vertical slice across every program day (mapping already generic)

## Unified workout shell + global identity guard (done)

- One shared view control (WorkoutModeMenu) in Coach, Manual, Glasses, Presentation; library opens in-context.
- isIdentityQuarantined() now gates motion, phase boards and exercise images globally.
- Remaining: identity-matched motion for stepAltCurl + stepShoulderPress (blocked, needs paid generation).

## Canonical coach motion complete (done)

- stepAltCurl + stepShoulderPress re-shot from coach-reference.png (V2 clips), frame-verified, added to CANONICAL_IDENTITY_MOTION.
- Old wrong-avatar asset pointers deleted (coach/motion, motion, mirror). INVALID_COACH_MOTION now empty.
- All 48 catalog movements have verified canonical motion.

## Global avatar identity sweep (done, 2026-09-14)

- Full visual audit of all 48 coach clips: 21 verified canonical, 27 quarantined (wrong man, unverifiable, or athlete out of frame).
- Multi-panel phase boards (MIRROR_BOARDS + REFERENCE_BOARDS) disabled behind an empty VERIFIED_IDENTITY_BOARDS allowlist — several showed other athletes.
- coachStillFor() added: single canonical still source; MirrorMe falls back to the verified coach frame, else COACH_REFERENCE. No generic athlete fallback remains.
- Exercise example cards (EXERCISE_IMAGES, 31) frame-checked against COACH_REFERENCE — consistent, kept.
- Remaining: re-shoot motion for the 27 quarantined movements (needs video generation credits).

## Canonical motion replacement (done, 2026-09-14)

- All 27 quarantined movements regenerated from COACH_REFERENCE; 11 required a corrected start-position still (lying/seated/machine) before the video step.
- Frame-checked twice: identity against COACH_REFERENCE, then movement fidelity vs the exercise name. Rejected 11 first-pass clips (standing bias) and 2 start stills (braided hair) and regenerated them.
- COACH_MOTION urls swapped, COACH_FRAMES posters re-extracted from the approved clips, CANONICAL_IDENTITY_MOTION now 48/48, INVALID_COACH_MOTION empty.
- Old wrong-person assets deleted from CDN via lovable-assets delete (27 pointers).

## Always-ready coach + living stage (done)

- `src/components/CoachWake.tsx` — wake phrase "Good morning, Coach" (browser speech
  recognition when available) or tap; coach approaches (camera push-in on a real
  approved clip, never procedural body warping), asks "Are you ready to work your ass
  off?" with large YES/NO. NO keeps him present and offers Start anyway / Lighter /
  Recovery / Stretching / Not today. Replaces PortalIntro in `/coach/$day`.
- `src/lib/coach-ambient.ts` + `resolveTrainerMedia` — every non-working state
  (intro, prep, countdown, set complete, rest, transition, cooldown prep, complete)
  now plays a verified approved-coach presence clip instead of a frozen portrait.
  Identity gate unchanged: ambience comes from coachMotionFor() only.
- `src/lib/alt-sessions.ts` — lighter / recovery / stretching plans built from the
  existing catalogue, applied as ordinary SessionPlans (only when nothing is logged).
- Portrait-TV typography: GameHud + caption strip use vh-based clamp() sizing.

## Dedicated walk-forward opening (complete)

- [x] Generate and identity-check a portrait entrance of the approved coach walking from the gym background toward the viewer.
- [x] Replace the simulated startup push-in with continuous entrance footage, haze-to-clear treatment, foreground question, and reaction states.
- [x] Preserve voice/touch YES and NO flows plus direct entry into the canonical workout.
- [x] Validate at 412x915 and 1080x1920 without changing the 48 approved exercise demonstrations.

## Bad global athlete substitution (reverted)

- [x] Remove the invented separate athlete identity and global still fallback.
- [x] Remove the recovered August 31 artwork from every app surface.
- [x] Restore the approved coach system and all exercise-specific media.

## Global media correction (complete)

- [x] Audit every media surface and stale avatar reference
- [x] Restore exercise-specific images, posters, and motion everywhere
- [x] Validate requested screens and count unique assets

## Phase 4 — Coach continuity (complete)

- [x] Keep non-working states on the stationary approved coach; never use exercise footage as ambience.
- [x] Show only the exact current exercise's verified clip during active work.
- [x] Keep upcoming clips hidden as preload data only.
- [x] Use the exact “FULL MOTION DEMO IN PRODUCTION” fallback for motion gaps.
- [x] Preserve workout structure, logging, controls, voice, and the 29/19 media split.
## Phase 5 — TV / big-screen continuity
- [x] Audit presentation and display surfaces against Coach Mode canonical scenes.
- [ ] Fix only directly observed TV continuity defects.
- [ ] Verify 29 verified clips, 19 gaps, 69 workout slots, typecheck, and both big-screen sizes.