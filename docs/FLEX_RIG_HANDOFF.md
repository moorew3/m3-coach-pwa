# LIVE FLEX — full-body coach asset delivery and release contract

**Goal:** A single identity-consistent, full-body Flex character performs the user's existing seven-day workouts while Marcus provides synchronized coaching. D-ID's head-only talking agent is not the exercise rig and is not a dependency for moving the body.

## Assets required from character / animation production

1. **Rigged identity-matched full-body coach:** Export \`public/v2/coach.glb\` as glTF 2.0 binary. Use \`public/coach-source/coach-primary-standing.png\` as the locked body/face reference (not a generic mannequin). The artist must confirm face, body proportions, tattoos, hair, clothing, and lighting with the owner. Do not infer approval merely because the mesh resembles the photo.
2. **Skeleton:** Skinned mesh with full-body joints, including left/right shoulder, elbow, wrist, hips, knees, ankles and a stable hip/root. No T-pose for ready, workout, or rest.
3. **Named animation clips (exact spelling):** \`Idle\`, \`cablePunch\`, \`jabCross\` as the first milestone. Each is an actual animated skeletal clip, not a still pose or a renamed unrelated exercise.
4. **Cable Punch mechanics:** Feet stable in a staggered stance, cable line/load behind the working arm, trunk rotation under control, fist extends and retracts, shoulders/elbows follow mechanically plausible arcs, repeat continuously through each 40-second work interval. The exercise must use the real cable-punch technique, not a no-load shadowboxing animation.
5. **Jab–Cross mechanics:** Correct guard, stance and foot placement, clear alternating jab and rear cross with hip pivot/recoil, complete extension and safe return to guard.
6. **Performance:** Test on Android as well as desktop and the owner’s TV/mirror layout. No freezing after play/pause, next exercise or background/foreground transitions.
7. **Audio:** Marcus remains the trainer voice; don't enable a competing D-ID voice. Animation cycles should be aligned with the existing 40-second intervals and transitions, independent of D-ID account authorization.

## Preflight before any real-avatar release

From repo root after placing the candidate GLB:

\`\`\`bash
npm run audit:flex-rig
\`\`\`

The check fails if the GLB is missing, non-skeletal, or lacks animated \`cablePunch\`/\`jabCross\` tracks. **A structural PASS is only a preflight.** Human visual sign-off is still required for likeness, mechanical form, equipment correctness, motion-loop seams, Marcus voice timing and phone/TV performance.

The runtime loader is \`src/v2/coach-rig.tsx\`, the Three.js gym is \`src/v2/renderer.tsx\`, the original workout-to-motion keys live in \`src/v2/original-week-workouts.ts\`, and the review gate is \`src/v2/rig-release.ts\`.

**Never set** \`identityApproved\`, \`rigAndMobileApproved\` or \`reviewedMotionKeys\` to pass until the owner has reviewed and approved the actual character and clips. Never show an Idle action as though an exercise is running. Retain the current approved/recovered moving workout videos for each exercise until its 3D equivalent passes.

## Acceptance test — first complete animated movement

- Start the original Saturday Boxing/Kickboxing program and choose **Cable Punch (#8)**.
- Start Workout. The **same full-body avatar** performs cable-punch mechanics continuously through the prescribed work interval.
- Marcus delivers the original coaching cues, with no duplicate voice.
- Pause / Resume preserves correct posture and animation timing.
- The rest interval changes to a natural idle/guard/reset, not a blank screen.
- The next movement transitions correctly; Cable Punch must not be substituted for Jab–Cross or vice versa.
- Repeat on Android and desktop. Capture video proof and request explicit owner approval before authorizing \`cablePunch\`.

## Current verified blocker (2026-10-10)

The production repo has the React Three Fiber viewer but no \`.glb\`/\`.gltf\`/\`.fbx\`/\`.vrm\`/\`.bvh\` file at all. Therefore no deploy can turn the present photo/head into a true full-body 3D coach until a rigged model and animations are created or sourced. Issue #22 tracks the delivery.
