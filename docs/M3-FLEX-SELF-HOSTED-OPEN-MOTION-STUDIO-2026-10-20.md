# M3 FLEX — Self-Hosted Open Motion Studio, stage 1
Status: DEVELOPMENT TOOLING BUILT, AI MODEL NOT DEPLOYED, WORKOUTS NOT COMPLETED
Date: 2026-10-20

## Core direction
Eliminate repeated subscription/credit-based guessing by running reusable open-source motion transfer on user-controlled GPU hardware, provided the user's PC passes hardware and workflow checks. Reuse exact owner-approved Flex image. Keep 7 approved video/audio assets unchanged, never use rejected cartoon/still/wrong-motion material, add only owner-approved new exercise scenes to two continuous workout MP4s.

## Verified existing source of truth
- Canonical Flex owner-approved file (provided by user): `9550.png`, really a JPEG, byte-identical SHA256 `6fcc17c6982cf2931b846292269bd2502fcd0d24fb063ccfd0c777f8e8cd9f8d`.
- Existing HeyGen identity asset ID: `fbc0d826660d479080f2c2ac5fbf5939`.
- Seven locked scene originals: C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-PRE-BREATH-R2, C10-POST-BREATH-R1.
- Marcus voice is existing approved audio and voice ID `0fadce1e82af494a93873aa38ea8d106`.
- Owner rejected C13 cartoon; C11, C12, C16 are wrong motion and not approved. Historic noncanonical Higgsfield clips excluded.
- Original M3 FLEX app unchanged; draft PR #24 not merged/deployed.

## Evaluated OPEN model path
- `Wan-Animate-2` official: https://github.com/Wan-Video/Wan-Animate-2 (Apache 2.0 repository).
- ComfyUI local app: https://github.com/comfyanonymous/ComfyUI
- Official ComfyUI Wan Animate 2 reference-video -> character workflow: https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_wan_animate2.json
- Distilled workflow: https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_wan_animate2_distilled.json
- Optional talking-mouth lip-sync after motion approval: MuseTalk https://github.com/TMElyralab/MuseTalk (licenses of all dependencies need checking).
- No new custom 3D Flex is claimed; no exact-reference image can guarantee unchanged facial identity or cast; manual full-motion QC is essential.
- Model cache weights include an int8 Animate2 transformer ~15.51 GB + text encoder ~6.27 GB + CLIP ~1.18 GB + VAE + LoRA. Plan 40–60GB free storage buffer; GPU VRAM feasibility must be tested locally and depends on caching and offloading. Model size is NOT a guaranteed VRAM figure.
- Existing Railway services are app hosting; a suitable GPU environment has not been verified. Do NOT deploy costly video inference into Railway by assumption.

## Working starter kit (delivered to owner in conversation)
`M3_FLEX_Open_Motion_Studio_Starter.zip` (207,287 bytes)
SHA-256: `39c7d215ce14b2bd3f854a042e18e5ac262446997b4930b2c388b86b6f56ed28`.

Starter contains:
- `studio.py`: working **OFFLINE** checks on source photo, video inputs, rejected footage, silent driving-video derivative, contact sheets and JSON job manifest with owner-approval gate. Tested with an internal technical test clip; known rejected C13 SHA correctly blocked. **This script DOES NOT perform AI inference**.
- `Windows_GPU_Check.ps1`: read-only PC video adapter/NVIDIA VRAM/RAM/free disk inspection.
- `reference/Flex_APPROVED_original_9550.jpeg`: byte-identical canonical approved user source, included in private downloadable owner starter only (NOT checked into GitHub).
- README and output instructions.

## Next gates (not silently bypassed)
1. Inspect owner's Windows GPU name, dedicated VRAM, available system RAM and free disk. **Do not purchase hardware or subscriptions without review.**
2. Set up ComfyUI and official Wan Animate 2 (or Lite/distilled variant if validated as feasible); acquire licensed local model weights, verify license conditions.
3. Use a **REAL person accurately demonstrating** seated unloaded controlled arm reaches, hands open, no wrong cartoons; owner-made or rights-cleared video. Film exact two full reps in the appropriate supported injury posture; clinician clearance remains required for the training prescription.
4. Feed canonical Flex image + driving video in native workflow. Generate one local unapproved low-resolution candidate; GPU/power only, no SaaS generation call.
5. Inspect original face/tattoos/cornrows, white anatomical LEFT cast supported, RIGHT shoe grounded, true hand/arm cycles, missing/extra limbs, any generated audio. Do not ship if anything fails. Pair separately recorded approved Marcus only after movement approval.
6. Build the two continuous Workout A/B masters from the 7 locked originals plus individually owner-approved new scenes. Test the existing interactive playback app. No production merge until approval.

### Non-negotiable status truth
**The local preparation software has been built and tested, but the self-hosted model has not run, no new correct animation has been generated, and Workout A/B are unfinished.** Neither a cartoon nor a D-ID talking agent is acceptable substitute exercise footage.
