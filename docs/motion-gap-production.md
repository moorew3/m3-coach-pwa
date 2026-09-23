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

- [x] `hammerCurl` proof attempt 1 — HeyGen video id `66c3c4a1b251bbbae713fb7d94745758`
  - Source: exact approved coach PNG
  - Required movement: standing dumbbell hammer curl, neutral palms throughout
  - Result: FAILED
  - Defect: 4.1-second static/still presentation; no visible up/down curl motion
  - Identity notes: beard, black shorts, tattoos/right-pec portrait visible; hair continuity uncertain
  - Status: NOT approved; remains quarantined

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

Total gaps: 19.
Verified motion baseline remains 29/48 until individual clips pass review.


## Generation-method finding

HeyGen `create_video_from_image` is not acceptable for workout-motion production in this project.
The Hammer Curl proof produced a mostly static talking-image style result instead of true exercise
movement. Do not use that method for the remaining gaps.
