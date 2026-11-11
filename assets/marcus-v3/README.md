# M3 FLEX / Marcus V3 — human basemesh experiment (NOT approved)

**Status:** Separate, nonproduction test. No automated replacement of Coach Session, Hologram, Recovery or prior approved Marcus videos/voice. Preserve existing production models and original references.

## Why V2 failed
- V2 Meshy single-view and multi-view shape did not reproduce Marcus' facial anatomy, eyes, beard, hairline, deltoids, pectorals, or abdominal geometry.
- Retexturing and photo projection into the distorted UV atlas introduced warped and misplaced tattoos, not exact artwork.
- The originally animated GLB was temporarily shown as an unskinned mesh due to incorrect parent armature scaling. A static A-pose is not a functioning exercise coach.
- A clean 360-degree viewer alone is NOT likeness approval. Rebuilding the mesh on an anatomically constructed human basemesh is required.

## V3 open building block
Ara 3D Gen: https://github.com/olatunde85/3d-gen — MIT engine source; MakeHuman CC0 data; CMU motion capture subject to upstream motion restrictions. Keep original licenses/credits. `assets/marcus-v3/ara-params.json` is our editable engine-agnostic source-of-truth for the **base character only**.

GitHub Actions build deliberately produces a downloadable prototype artifact for QA. It must not be merged into the approved workout asset path or used as proof of facial match. This test runs on the repo's standard GitHub-hosted Ubuntu runner, in a public repo, not a large paid runner.

## Canonical reference (do not alter or invent)
Use **Muscular Tattooed Athlete Turnaround Sheet.png** as the geometry/face/ink/left-boot reference, including its close-up of the *single upper-back tattoo*. This was previously provided in the user's asset library and remains user-controlled. Additional photo: `public/coach-source/coach-primary-standing.png` for the original gym-photo facial reference. Other old six-view sheets disagree on back tattoos or omit the boot; do NOT silently combine these conflicting designs.

Match 47-year-old mature Black male trainer Marcus: short neat cornrows, beard, sharply defined shoulders/pectorals/abdominals, authentic head anatomy. Black gym shorts. Left medical orthopedic boot strapped securely. **Support/unload left leg for every recovery demonstration.**

## Blocking quality gates (none can be bypassed by success of a mesh build)
1. Exact face vs front and side approved references (head shape, expression, eyes, nose, beard and braid pattern). No generic replacement face.
2. Muscular anatomy with convincing proportions and clean deformation under arm motion.
3. Tattoo layout hand-reconstructed on corresponding body regions from user-approved pictures (including ONE upper-back tattoo). Generic Ara tattoos are intentionally OFF; adding stock ink would be incorrect.
4. Correct LEFT orthopedic boot, strapped, visually anchored, and no load on that leg during approved recovery activity. Generic shoes in test output are **placeholders**, never final.
5. Full humanoid skin/bones (not just a textured mesh), facial blendshapes and realistic motions. Confirm neutral stance, blink, speaking, 2 reps seated cable/dumbbell demonstration, resting.
6. Android Fold sustained render, loads within acceptable memory, 360 orbit, body motion, lip sync, no blank screen; exact exercise and rest rules remain in V2 controls.
7. Production gates: identityApproved=false, reviewedMotionKeys=[], bootSafetyApproved=false, never replace prior approved clips/voice until signed off.

## Workflow
1. Generate high-detail anatomical baseline with Ara from params, export GLB to short-lived GitHub artifact.
2. Inspect full body from six angles against canonical sheet; reject if physique still toy-like.
3. If base quality supports it, precision sculpt face and apply manually registered skin/tattoo maps; model the custom LEFT boot as its own skinned component.
4. Retarget existing approved movement clips to the final rig only after likeness and injury gates pass.

Owner metadata for subsequent assets: `Created for and owned by Willie Moore III` / `WM3-20261111-M3FLEX-V3-001`.
