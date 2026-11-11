# M3 FLEX COACH — Bench press video owner + visual audit
**Date:** 2026-11-11
**Money policy:** Do not spend video-generation, voice-generation or subscription credits until a zero-credit pose/bench-angle still has passed review. Earlier video generations are preserved only as history.

## Existing footage inspected, not inferred
No relabeling, interchange, or silent promotion into the workout app.

| Requested exercise | HeyGen generated ID | Owner feedback | Eight-frame inspection | Result |
|---|---|---|---|---|
| Decline dumbbell bench press | `dc8a74a3feda442ab467616c05c80188` | Looks close, but says **"seated chest press"** | On the retrieved eight-frame sheet, the model's head is visually higher than hips on a backrest sloping up toward the head. This is an **incline-oriented geometry**, not decline. The booted leg is pictured elevated and the other leg used for ground contact. | **REJECT geometry and embedded audio**. Keep as technical reference only. |
| Incline dumbbell bench press | `434a4dc35d9245d18c62e4e639b3df00` | Incorrect exercise | The eight-frame sheet shows torso nearly upright, with a steep backrest; this is much more seated overhead/shoulder-press-like than a moderately inclined 30–45° chest press. | **REJECT**. Do not use it as incline or shoulder press. |

## Free technical repair actually completed
The existing decline candidate was recovered through GitHub Actions and its original H.264 video stream copied **without re-encoding**, while the entire AAC audio track carrying incorrect speech was removed. FFprobe confirmed the corrected clip has H.264 video ONLY, no audio stream.

**Artifact**, GitHub Actions job (14-day retention): https://github.com/moorew3/m3-coach-pwa/actions/runs/43028484514/artifacts/13860400507
- `decline-video-only-SILENT.mp4`: mute-only candidate, **NOT** an approved decline scene.
- `decline-8-frame-contact-sheet.jpg`: actual retrieved candidate frames at ~one-second intervals.
- `incline-REJECTED-8-frame-contact-sheet.jpg`: actual retrieved incline candidate frames.
- `decline-original-streams.json`, `incline-original-streams.json`, `silent-video-sha256.txt`: evidence.

No video or voice synthesis was used. Runner time may consume GitHub's existing CI quota. **The silent copy does not repair the wrong exercise angle.**

## Correct source references
- NASM, Two-Arm Incline Dumbbell Chest Press: https://www.nasm.org/resource-center/exercise-library/two-arm-incline-dumbbell-chest-press (example 45° up, elbows around 45° from torso, weights beside upper chest)
- PureGym, Decline Dumbbell Bench Press: https://www.puregym.com/exercises/chest/bench-press/decline-dumbbell-bench-press/ (head below hips, legs secured for standard setup, dumbbells lowered in line with mid-chest)

## Owner-required final scripts (text preflight, not synthesized)
**Incline:** "Incline dumbbell bench press. The bench rises toward your head, with your upper back supported. Start with both dumbbells beside your upper chest. Press upward over the upper chest, then lower smoothly. Two controlled repetitions."

**Decline:** "Decline dumbbell bench press. The head end of the bench is lower than your hips. Secure your position. Start with both dumbbells beside your chest, press upward above your chest, then lower slowly. Two controlled repetitions."

**Never use** "Seated chest press" for either of these bench movements. The app already contains its own separate seated INNSTAR chest-press exercise and approved C08 footage.

## Release blockers
1. Incline: no visual with correct 30–45° UP bench and exact Marcus-approved face/movement.
2. Decline: no visual with correct DOWN bench (head below hips); no proof of feasible leg restraint for injured, unloaded LEFT boot.
3. Neither video has separately approved, lip-synced Marcus narration. Never reuse generated speech containing a different exercise name.
4. New videos would require explicit user approval of credit use AFTER preflight geometry (not a promise to render correctly).

Leave `src/v2/approved-coach-media.ts`, Coach, Hologram, Glasses and interval timers unchanged until these release blockers are resolved.
