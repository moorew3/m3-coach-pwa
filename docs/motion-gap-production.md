# Motion Gap Production Queue

Canonical coach: `approved-original-coach`

Source image:
`public/coach-source/coach-primary-standing.png`

## Promotion gate

A generated clip stays quarantined until it passes ALL checks:

1. Same coach identity: face, close-cropped hair, beard, skin tone, body proportions.
2. Right-pec portrait tattoo remains present and recognizable.
3. Black athletic shorts and overall coach styling remain consistent.
4. Correct exercise and correct equipment.
5. Full body / required working joints remain visible.
6. No scene cuts, camera zoom tricks, or still-image animation presented as exercise motion.
7. Sample at least 8 frames across the clip.
8. Only after review may the exercise move from `INVALID_COACH_MOTION` into both
   `COACH_MOTION` and `CANONICAL_IDENTITY_MOTION`.
9. Workout structure may never change because a clip is missing.

## Active proof

- [x] `hammerCurl` proof attempt 1 — FAILED
  - HeyGen video id `66c3c4a1b251bbbae713fb7d94745758`
  - Defect: static/still presentation; no real curl motion
- [x] `hammerCurl` proof attempt 2 — APPROVED
  - HeyGen Cinematic Avatar video id `e93ad0f98ebf4a0e953b842813df288e`
  - Exact approved coach identity preserved
  - Real standing neutral-grip hammer curl motion verified
  - Exported as `coach-media-v1/hammerCurl.mp4`
  - Promoted from quarantine to verified motion

## Remaining gaps — do not batch until Hammer Curl passes

- [ ] `battleRopeFinisher`
- [ ] `bulgarianSplitSquat`
- [ ] `cablePunch`
- [ ] `chestPress`
- [ ] `chestSupportedRow`
- [ ] `dumbbellCurl`
- [ ] `easyWalk`
- [ ] `externalRotation`
- [ ] `farmerMarch`
- [ ] `legPress`
- [ ] `medBallChestPass`
- [ ] `rearDeltFly`
- [ ] `reverseStepRow`
- [ ] `shoulderPress`
- [ ] `squatToCurl`
- [ ] `stepAltCurl`
- [ ] `stepShoulderPress`
- [ ] `trapBarDeadlift`

Total gaps: 18.
Verified motion baseline is now 30/48 after Hammer Curl approval.


## Generation-method finding

HeyGen `create_video_from_image` is not acceptable for workout-motion production in this project.
The Hammer Curl proof produced a mostly static talking-image style result instead of true exercise
movement. Do not use that method for the remaining gaps.
