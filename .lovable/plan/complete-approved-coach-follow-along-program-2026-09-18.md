# Complete approved-coach follow-along program

## Goal
Turn Coach Mode into one continuous follow-along program led only by the approved coach, complete Manual Mode visual instruction, and correct the front entrance.

## Current audit result
- Check all 48 exercises individually rather than trusting existing labels.
- Replace the 17 already quarantined clips.
- Also replace `easyWalk` because identity is not verifiable and `trapBarDeadlift` because it shows the wrong equipment.
- Keep the 29 clips that pass identity, movement, and equipment checks unchanged.

## Build
1. Generate the missing exercise videos sequentially from the canonical full-body coach reference, one exercise per clip, with the exact equipment, full range of motion, fixed camera, and seamless follow-along cadence.
2. Review sampled frames and motion changes from every generated clip. Reject any identity drift, wrong exercise, wrong equipment, frozen-body motion, or camera movement before wiring it into the app.
3. Update the single coach-media registry only for accepted clips. Keep failed generations quarantined rather than showing a substitute.
4. Give every Manual Mode exercise a complete visual: approved coach video plus the existing title, setup, phases, equipment, work target, tempo, and cues. Use verified multi-stage approved-coach boards where available; never display the uploaded examples directly.
5. Generate and verify a separate portrait entrance clip: smoke-only opening, coach physically walks from the background with alternating arm and leg gait, stops near camera, then the exact readiness line and YES/NO. Keep the app unmounted behind the gate.
6. Correct direct Coach Mode entry so a new workout cannot begin without an explicit user choice; preserve resume behavior for an existing workout.

## Verification
- At 412x915, inspect every one of the 48 library entries: correct title, identity, movement, equipment, controls, cues, and return flow.
- Run all seven program days from warm-up through completion and verify every work step shows the current exercise's approved coach motion continuously.
- Verify entrance smoke, physical gait across sampled frames, fixed background, stop, exact spoken question, YES/NO, and YES-to-selection without auto-start.
- Report any rejected or still-missing clip honestly; do not mark the program complete unless all 48 pass.
- Do not publish.

## Cost and safety
- Video generation uses workspace credits. Generate sequentially in small verified batches and do not retry failed or refused jobs automatically.
- No paid external services, substitute people, borrowed exercise clips, fake zooms, or puppet animation.