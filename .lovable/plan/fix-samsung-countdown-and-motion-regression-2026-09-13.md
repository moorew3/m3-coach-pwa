# Fix Samsung countdown and motion regression

## Goal
Restore Monday Coach Mode so every set advances once through `3 → 2 → 1 → Go`, then immediately enters the active exact-exercise motion state. Keep all prep, rest, and speaking states on the approved pixel-stable coach still.

## Implementation
1. Make the countdown sequence monotonic in the shared coach session engine.
   - Allow opener narration to delay only the initial start at `lead=3`.
   - Once countdown begins, stop using transient global speaking/holding changes to control its timers.
   - Track the current step/countdown generation and spoken lead tokens so `3`, `2`, `1`, and `Go` each fire at most once.
   - Advance using the lead value captured by that countdown tick, with stale-step and leader checks before committing.
   - Reset countdown tracking only for a genuinely new/repeated work step; preserve pause/resume and leader handoff behavior.

2. Preserve and verify the media handoff.
   - Keep `COUNTDOWN` static.
   - Confirm `lead=null` resolves a current work step to `ACTIVE_SET` or `WARMUP_ACTIVE` with `mode=motion` whenever `coachMotionFor(currentMove.id)` exists.
   - Keep `engine.speaking` out of active-set media selection.
   - Keep future clips hidden preload-only and ensure movement changes replace the visible current URL.

3. Add deterministic non-visual test signals only where needed.
   - Expose countdown token/progression markers through existing `data-*` test surfaces or a small internal event hook.
   - Expose whether the active `CoachMotion` video is actually playing, without adding production UI.

## Technical details
- The current effect depends on `holding`. Speaking `3` flips the global speech state, re-runs cleanup, cancels the pending decrement, and can speak `3` again indefinitely.
- The fix will separate “waiting for opener narration” from “countdown has started,” and de-duplicate speech by `step.id + lead`.
- Countdown progression will no longer be restarted by TTS start/end callbacks, voice-status changes, or mid-set cues.

## Verification
- Run focused type/code-quality checks.
- At 412×915, drive Monday through Shoulder Press prep, countdown, active set, rest, Lateral Raise prep, countdown, and active set.
- Record exactly one event each for `3`, `2`, `1`, and `Go` per set; prove `lead` becomes `null` after Go.
- Verify Shoulder Press shows only `shoulderPress.mp4`, rest/prep returns to the static still, and Lateral Raise shows only `lateralRaise.mp4`.
- Verify the active video element is mounted, selected, unpaused, and advancing when browser codec support permits; otherwise distinguish sandbox codec limits from app state.
- Confirm no repeated `3`, no stuck `COUNTDOWN`, and no console/page errors.
- Samsung-only validation remains limited to real-device H.264 playback, Android audio routing/TTS timing, and camera permissions/performance. New recurring cost remains $0.