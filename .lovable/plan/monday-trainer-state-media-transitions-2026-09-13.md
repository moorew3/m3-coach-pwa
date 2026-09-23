# Monday trainer-state media transitions

## Goal
Make Monday Coach Mode switch deliberately between the completely static approved coach still and the exact current exercise clip. Preserve the existing session engine, audio, tracking, logging, controls, and clip continuity.

## Implementation
1. Add one reusable trainer-media resolver/component that owns the visible-media decision.
   - Inputs: current coached step, countdown, timer, verified speaking state, current exact clip, next preload clip, playback state, mirror setting, and cadence rate.
   - Outputs/test markers: explicit trainer state, `static` or `motion`, current visible clip URL, and hidden preload URL.
   - It will never select a future clip for visible playback and will fall back to the approved still when the exact current clip is unavailable.

2. Encode Monday’s trainer-state mapping without rebuilding the workout script.
   - `INTRO`: static still + voice.
   - `WARMUP_PREP`: static still during the warm-up brief.
   - `WARMUP_ACTIVE`: exact warm-up clip after countdown.
   - `EXERCISE_PREP`: static still + set/rep/load/rest briefing.
   - `COUNTDOWN`: static still through 3-2-1/Go; exact clip begins only when the active set starts.
   - `ACTIVE_SET`: exact current exercise clip loops continuously at the cadence rate.
   - `SET_COMPLETE`: static still when the set-ending/rest opener is spoken.
   - `REST`: static still for the remainder of rest.
   - `NEXT_EXERCISE`: static still while the next exact clip preloads invisibly.
   - `COOLDOWN_PREP`: static still during the cooldown opener.
   - `COOLDOWN_ACTIVE`: exact cooldown clip once the opener ends and its timer runs.
   - `COMPLETE`: static still + spoken recap from logged results.

3. Replace the route’s scattered `showMovement` / `eyeContact` / `stageClip` decisions with the resolver component.
   - Keep `CoachMotion`’s two-layer loop, readiness gating, pause/resume, cadence, and crossfade behavior.
   - Keep future media in hidden preload elements only.
   - Add deterministic `data-*` markers for state, media mode, and visible/preloaded URLs so each checkpoint can be tested directly.

4. Enforce the static-still rule.
   - Keep `CoachFace` free of animation, transition, filter, and dynamic transform classes/styles.
   - Remove the route-level close-up/work framing transform from any wrapper containing the still.
   - Allow only static horizontal mirroring when the user explicitly enables mirror mode; no speaking-driven movement.
   - Keep portal/UI opacity, light sweep, captions, and speaking indicator motion separate from the image itself.

5. Keep Monday scope and all existing behavior intact.
   - No program expansion, new media, database work, or unrelated screen changes.
   - Camera tracking, rep/form/ROM/pace, cadence, voice/audio ducking, gestures, substitutions, local logging, XP, history, custom workouts, and display modes remain unchanged.

## Technical details
- Extend the existing phase vocabulary or add a dedicated trainer-media state type so countdown, set-complete, warm-up prep/active, and cooldown prep/active are explicit without creating duplicate timers.
- Use existing `CoachStep`, `lead`, `left`, verified `engine.speaking`, `coachMotionFor(currentMove.id)`, and `clipAfter()` preload data.
- Completion currently has a separate recap screen; keep its real-data summary and route its coach presence through the same static media component.

## Verification
- Run type and focused code-quality checks.
- At 412×915, drive Monday through intro, equipment/setup, first prep, countdown, active set, set completion/rest, next movement, cooldown prep/active, and completion.
- At every static checkpoint inspect computed styles on the coach image and containing media layer: no animation, transform, filter, scale, translate, or keyframe motion.
- Confirm active playback references only the exact current exercise URL, while the next URL exists only in a hidden preload element.
- Confirm clean still-to-motion and motion-to-still handoffs, no visible future clip, no console errors, and no ordinary page scrolling.
- Report Samsung-only validation for real H.264 smoothness, speaker/audio routing, camera permissions/tracking, and hardware performance. New recurring cost remains $0.