# Phase 5 — TV / Big-Screen Continuity

## Scope
Update only the existing `/presentation` big-screen surface. Preserve Coach Mode, workout structure, logging, identity allowlists, opening, glasses, and all unrelated features.

## Direct fixes
- Make presentation use the same fail-closed media decision as mobile Coach Mode: no ambient exercise footage and no visible next-exercise preview during rest.
- Show verified motion only for the exact current work/cooldown movement.
- Show the stationary approved coach and exact `FULL MOTION DEMO IN PRODUCTION` label for a current movement without verified motion.
- Keep any next verified clip as a hidden preload only, never visible.
- Preserve existing big-screen controls, voice behavior, timing, workout progression, and current actor source.
- Keep large exercise, set/target/time, rest, and next-up information readable without changing other surfaces.

## Verification
- Confirm 29 verified clips, 19 gaps, and 69 scheduled slots remain unchanged.
- Run the project’s automatic type/build checks.
- Exercise verified, gap, verified→gap, gap→verified, rest, pause/resume, and next-up states at 1920×1080 and 1366×768.
- Confirm hidden preload has no visible box, no stale/wrong media appears, and no page errors occur.
- Do not publish.