# M3 FLEX — C12 shoulder-roll motion QA and corrected production method
Date: 2026-10-19  
Scope: draft Workout A/B production branch only, not customer release.

## Result: REJECTED, do not activate
- C12-SEATED-SHOULDER-ROLLS-R1 raw HeyGen Video 1 job `967742f823ef4407919b80a2745f0d8a` completed as an actual five-second MP4.
- Its five-frame review contact sheet shows the avatar raising/spreading arms sideways and lifting hands rather than rolling the shoulder girdle up, backward, and down with arms relaxed.
- This is **not** a seated backward shoulder roll. A render success is not a fitness-motion success.
- Exact canonical facial identity, cast continuity through all frames, repetition count, and voice-to-motion synchronization are not certified.
- No additional AI generation should attempt the same image-only technique without a bona fide motion guide.

## Separate technically complete but rejected voice-review derivative
- Unapproved C12 original video was downloaded into the GitHub Actions runner, together with existing Marcus PRE-03 English audio, using the historical source URI. Both were kept as distinct input files.
- `C12_MARCUS_REVIEW_ONLY_NOT_APPROVED.mp4` contains repeated raw C12 motion with the existing Marcus recording played once, original render audio excluded.
- Review MP4 measured 12.760 seconds and contains video + audio. This output is **rejected for movement**, not a complete exercise.
- GitHub Actions run `39302922714`, artifact ID `12212715319`: `M3-FLEX-C12-MARCUS-REVIEW-ONLY`, including original downloaded source, narration, five-frame contact sheet, new review-only MP4, and hashes.
- No original approved C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-R2 or C10-R1 media was edited, overwritten, or regenerated. The production app is unchanged.

## Correct technique references (education, not licensed redistribution)
- Memorial Sloan Kettering: https://www.mskcc.org/cancer-care/patient-education/video/arm-and-shoulder-exercises-with-and-without-theraband — arms gently resting on lap; shoulders up/back/down in a smooth roll.
- Oxford University Hospitals: https://www.ouh.nhs.uk/media/t5wlmkxo/106310outpatients.pdf — shrug shoulders towards ears, move backwards while squeezing shoulder blades, relax down.
- ColumbiaDoctors: https://www.columbiadoctors.org/health-library/multimedia/shoulder-roll-seated/ — arms relaxed; ALL motion is in shoulders.
- Prehab Guys video: https://library.theprehabguys.com/vimeo-video/shoulder-roll/ — seated demonstrated movement; suitable for technique review only, not commercial footage redistribution.

## Production recommendation
1. Do not redo C12 by prompting the same image-only motion generator: it repeatedly invented arm movements.
2. Acquire or create an authorized **driving VIDEO of actual seated shoulder rolls**, or complete a rigged avatar and its keyed shoulder movement.
3. Higgsfield Genjutsu `hf_mult_motion_control` supports transferring driving-video motion to reference-image subjects; verify output and costs before any render.
4. Connected Higgsfield workspaces reported **zero remaining free motion-control generations** on 2026-10-19. Do not spend paid credits on speculative batches.
5. The original M3 repository currently contains no `.glb`, `.gltf`, `.fbx`, `.vrm` or `.bvh` rigged model files in either main or rebuild/m3-coach-v2. The handoff document `docs/FLEX_RIG_HANDOFF.md` names the missing `public/v2/coach.glb` deliverable.
6. New motion-controlled samples must independently pass identity, equipment/cast, biomechanics, Marcus voice timing, and owner approval; injury-specific training remains dependent on clinician clearance.
7. Keep Part A and Part B as separate master video goals, with seven approved source clips immutable and all missing scenes blocked until approved.

The preceding draft C11 hand-opening output is independent and remains unapproved; do not confuse or repeatedly display it as C12 work.
