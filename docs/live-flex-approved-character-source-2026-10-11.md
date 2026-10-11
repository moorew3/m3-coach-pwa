# LIVE FLEX V2 — Approved character reconstruction reference (2026-10-11)

**Status:** Identity reference recovered. No new rig approved. Main V2 is unchanged.

## Critical finding
The file `public/coach-source/coach-primary-standing.png` (1024×1536) accurately establishes the approved face, beard, haircut, build, tattoos, skin tone and black shorts, but the image **crops below the upper shorts/upper thighs** and contains large motivational text. It is **not a usable head-to-toe image-to-3D source** despite the old code comment describing it as full body. Do not infer feet/legs from this cropped still.

## Authentic full-body reference recovered
Extracted directly from the existing, **approved** `/media/approved/shoulderMobility.mp4` clip (no synthetic appearance changes), at **1.2 seconds**, where the same coach faces front, fully in frame from head to shoes, legs apart and arms angled down/out from the body. No hand-to-shorts contact and no dumbbells or cables held. This reference is suitable for judging proportions and preparing a clean 3D source; it is a photographed **motion frame, not a verified neutral rigging-pose capture**, so there may still be pose inconsistencies.

- Source clip: https://m3-coach-v2-visual-production.up.railway.app/media/approved/shoulderMobility.mp4
- **Saved standalone front reference** (user's already-connected Higgsfield media library): https://d2ol7oe51mr4n9.cloudfront.net/user_3JXmCGSXSFw5lD08HDyoQd7zNaY/dba9dabb-873b-4e31-9875-75223eca4464.jpg
- Higgsfield media ID: `dba9dabb-873b-4e31-9875-75223eca4464`
- Supplemental view: `/media/approved/easyWalk.mp4` at 1s, visible side profile and lower-body proportions.
- Original face and tattoo reference remains `/coach-source/coach-primary-standing.png`; retain it and do not silently change the live COACH_REFERENCE mapping.

## Required 3D asset approval
1. Use the approved full-body *photographic* source, **not** the rejected `Meshy_AI_Tattooed_Titan` or orange/blue `LIVE_FLEX_Apose_Rigging_Source_v5` mesh. No fabricated new face, no disproportionately huge shoulders, no random tattoos, no cartoon textures.
2. Obtain high-fidelity photorealistic body, matching short fade, face/beard, torso tattoos, skin tone, black shorts and black shoes. Proportions must match the front and side video; feet and hands fully in frame.
3. Rig only after topology inspection confirms hands and shorts are disconnected with actual gap; correct neutral A-pose and 50+ bone skinning; test elbow/shoulder/wrist/hip/knee deformations from all angles.
4. Build one accurate cable punch using real approved motion footage (or licensed verified trainer biomechanics), including foot support, hip/torso rotation, scapular motion, elbow extension, natural recoil and cable line of pull.
5. QA it against the approved coach and workout timing including Marcus voice before enabling any 3D replacement inside /v2. Preserve original 7-day workouts, restored Cable Punch video, recorded Marcus audio and working 2D footage until sign-off.

## Current blockers
- Uploaded Meshy A-pose model accepted but **visually rejected** by the owner; no further rigging on that version.
- No approved high-fidelity new 3D GLB / skeletal animation exists yet.
- The extracted image helps identity fidelity but does not itself create a 3D avatar. Do not suggest it did.
- Confirm Meshy's cost and license/privacy before new generation. Do not auto-spend credits or upload another branded likeness under an unwanted public license.
