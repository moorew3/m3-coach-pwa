# M3 Coach V2 — clean rebuild

V2 is intentionally isolated on the `rebuild/m3-coach-v2` branch until it is clearly better than production.

## Non-negotiable product rule

There is one workout session. Coach, Manual, Shadow and Glasses are camera/control viewpoints over that same session. Changing modes must never restart, duplicate, or fork the workout.

## Runtime layers

1. **Workout session engine**
   - exercise, set, phase, timer, completion and progress
   - independent of any UI or renderer

2. **Scene contract**
   - one gym world
   - fixed coach, athlete and equipment anchors
   - camera pose changes by mode
   - one motion key for the current exercise

3. **Renderer adapter**
   - future 3D runtime consumes the scene contract
   - must support GLB/FBX rig + reusable animation clips
   - MP4 files are references/fallbacks, not the primary movement system

4. **Mode UI**
   - Coach: face the trainer
   - Manual: coach-eye camera aimed at athlete; manual logging remains available
   - Shadow: face trainer; continuous boxing/kickboxing flow
   - Glasses: first-person compact HUD

## Quality gates before V2 can replace production

- Same coach identity throughout.
- Full-body motion for exercises that require legs/footwork.
- Equipment and body occupy the same 3D scene.
- No wrong-exercise flash between movements.
- No disconnected clip montage feel.
- Mode switching preserves the exact session position.
- Phone-first controls are reachable one-handed.
- Boxing and kickboxing have continuous guard, footwork and recovery, not isolated punch clips.
- Unsupported pose analysis reports “not scored” instead of inventing a score.

## Asset rule

Do not call V2 “3D” until a real rigged coach asset is loaded into a 3D renderer. The current repository does not contain a usable FBX/GLB coach model, so V2’s core is renderer-neutral until that asset is recovered or created.
