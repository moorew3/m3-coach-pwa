# M3 Coach V2 — Coach Rig Asset Contract

The V2 renderer looks for the production coach at:

`public/v2/coach.glb` → runtime URL `/v2/coach.glb`

Until the exact approved rig, action clips, identity review and mobile QA are complete, V2 preserves the already-approved coach-performed MP4 demonstrations. **There is no mannequin/stick-figure fallback.**

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


## Approved athlete is a separate identity

The owner's personal athlete avatar is NOT the shirtless, tattooed demonstration
coach. Do not use the coach's portrait for the athlete, or the athlete's
portrait for the coach. The original approved coach remains in
`public/coach-source/coach-primary-standing.png` and in the identity-gated
`src/data/coach-identity.ts` motion library.

The older athletic illustration in the owner's saved Library contains three
poses of the braided-hair athlete in a blue tank top and dark shorts.
Until the final approved personal image is present in the application, the
new V2 entrance provides an explicit choose-your-approved-avatar control.
The selected image is stored **only in that browser**, without regenerating
or modifying a person's face. The separate working exercise videos continue
to show the original approved coach.

The athlete's eventual model path is `public/v2/athlete-approved.glb`,
but merely adding a file does NOT authorize it for display.

## Reuse before producing anything new

1. Inventory the original source's clip and skeletal animation assets. A
   completed MP4 is a baked 2D video: the person in it cannot be reskinned
   by swapping a GLB mesh. The existing MP4 must continue to play until its
   own correctly approved motion-bearing source is available.
2. For existing FBX/GLB animations, extract the original animation clips and
   bone names. Keep clip timing, rest/work cadence, exercise identifiers,
   movement phase, equipment and camera behavior unchanged.
3. Put the approved coach/athlete appearance on a compatible copy of the
   **same skeleton**. If skeletons differ, retarget the existing motion data
   in Blender and verify joint axes/rest pose instead of reanimating the
   exercise from scratch.
4. `scripts/assemble-coach-glb.py` checks exact same-skeleton FBX actions
   and packs them into one reusable GLB. Extend this pipeline to an approved
   athlete model only after the original action-bearing files are located.
5. Identity, facial/tattoo detail, correct exercise/equipment, clean motion
   loops and Android playback must be visually reviewed **per movement**
   before the GLB release gate may enable that movement.
6. Any missing or unapproved model/motion uses the original verified MP4
   rather than a stock actor, stick figure, guessed exercise or paused
   generic trainer. Do not use a still portrait as proof that an exercise
   is animated.

The existing program, timing, coaching-session logic and recovery manifest
are locked by `scripts/test-avatar-only-preservation.mjs` in CI. The intro
does not dispatch workout actions or play audio; it is a purely visual,
skippable overlay.
