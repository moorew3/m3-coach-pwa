# M3 Coach V2 — Coach Rig Asset Contract

The V2 renderer looks for the production coach at:

`public/v2/coach.glb` → runtime URL `/v2/coach.glb`

Until that file exists, V2 deliberately displays a neutral gray rig placeholder.

## Required model properties

- Format: GLB preferred. FBX is acceptable only as a source file; export the web runtime copy to GLB.
- Full-body humanoid skeleton.
- Real geometry, not a baked video plane.
- Neutral standing bind/rest pose.
- Feet at Y=0.
- Model origin centered between the feet.
- Forward direction: local -Z.
- Height after import: approximately 1.7–1.85 scene units.
- No embedded environment, floor, camera, or lights.
- Textures must be packaged into the GLB or stored under `public/v2/textures/`.
- Mobile-first geometry/texture budget. Use a lightweight LOD rather than a cinematic MetaHuman-scale mesh.
- Same approved coach identity in every exercise. Never swap people between animation clips.

## Skeleton / animation rule

One skeleton owns every movement. Exercise changes swap animation clips; they do not swap character models.

V2 first attempts to play an animation clip whose name exactly equals the current `motionKey`.
If no exact clip exists, it falls back to `Idle` or `idle`.

Initial clip names:

- Idle
- inclinePress
- chestPress
- lateralRaise
- tricepsPressdown
- boxingCombination
- frontKick
- roundKick

Future strength and conditioning clips should follow the same camelCase naming rule.

## Animation quality

- Root stays stable unless locomotion is intended.
- Hands/feet return naturally instead of snapping to rest.
- No hard cut or pose reset inside a working set.
- Boxing clips must preserve guard between combinations.
- Kickboxing clips must preserve stance, chamber, strike, retraction, and balanced return.
- Weight-training clips must use the correct equipment geometry and hand placement.
- Exercise animations should loop cleanly where appropriate.
- Transitions may blend into/out of Idle.

## Camera independence

The model must not contain the intended user camera. Coach, Manual, Shadow and Glasses camera positions are owned by V2's scene contract so the exact same character/workout can be viewed from different perspectives.

## Acceptance gate

The coach asset is not considered production-ready until:
1. identity is visually approved,
2. all required joints deform cleanly,
3. at least one strength animation and one boxing animation retarget correctly,
4. mode switching does not move or replace the coach,
5. the same GLB works on Android/mobile WebGL without crashing or severe frame loss.
