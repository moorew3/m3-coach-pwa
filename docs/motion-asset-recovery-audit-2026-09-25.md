# Motion Asset Recovery Audit

Date: 2026-09-25

Purpose: recover and reuse every previously-created exercise motion asset before generating anything new. Wrong-avatar clips are not discarded if their movement is useful; they become motion-transfer candidates.

## Confirmed production-ready motion already present

These are wired in `src/data/coach-identity.ts` and backed by the `coach-media-v1` GitHub release:

bandPullApart
benchPress
boxingStance
chestMobility
controlledShoulderWork
cross
deadBug
defensiveReset
frontKick
gluteBridge
guardReset
hammerCurl
hamstringCurl
hamstringMobility
hipFlexorStretch
inclineDumbbellPress
jab
jabCross
kneeChamber
latPulldown
lateralRaise
lowerBodyMobility
romanianDeadlift
roundKick
seatedRow
shadowboxPunches
shoulderMobility
squat
suitcaseCarry
tricepsPressdown

### Important confirmed recovery
- Shoulder Mobility is already complete and should NOT be regenerated.
- Current production URL:
  https://github.com/moorew3/m3-coach-pwa/releases/download/coach-media-v1/shoulderMobility.mp4
- Repo roadmap says this asset was frame-extracted and confirmed to show the approved coach doing shoulder work.

## Current quarantine list: reuse motion before regenerating

The current runtime blocks these because identity and/or movement verification failed. Their old motion should be recovered first and used as motion-transfer input where mechanics are good:

- battleRopeFinisher
- bulgarianSplitSquat
- cablePunch
- chestPress
- chestSupportedRow
- dumbbellCurl
- easyWalk / treadmill
- externalRotation
- farmerMarch
- legPress
- medBallChestPass
- rearDeltFly
- reverseStepRow
- shoulderPress
- squatToCurl
- stepAltCurl
- stepShoulderPress
- trapBarDeadlift

Notes:
- easyWalk/treadmill was specifically quarantined because coach identity could not be verified clearly throughout the clip, not because the app never had treadmill motion.
- shoulderPress was previously present as a clip and was exercised in the Samsung regression plan as `shoulderPress.mp4`; it was later quarantined during identity review.
- trapBarDeadlift old motion is mechanically wrong for the target because it showed a straight barbell, so that clip is not an exact-motion candidate.

## Older asset inventories recovered from project history

Earlier Replit/app inventories recorded:
- wa-treadmill-burst.mp4
- wb-treadmill-burst.mp4
- wb-bench-press.mp4
- wb-jump-rope.mp4
- seated shoulder press
- treadmill run
- rear-delt fly / rear-delt alternate
- seated cable row
- Bulgarian split squat
- leg press
- seated leg curl
- battle ropes
- face pull
- front raise
- hanging knee raise
- heavy-bag boxing
- plank
- calf raise

These assets should be treated as recovery leads even when the old avatar is wrong.

## HeyGen reels / composites recovered

Current HeyGen workspace contains prior workout video sources that should be preserved as motion-source candidates:

### BIG FLEX DOGG: Workout B (Portrait)
Video id: bda7adea397249f789322b3b406f0224

Embedded exercise/video scenes recovered:
- treadmill burst / workout opening context
- bench press motion source
- cable row motion source
- standing cable curl context
- jump-rope context

The source scene URLs are still present in the HeyGen editor document and can be harvested for reference-motion work.

### BIG FLEX DOGG WORKOUT
Video id: 603197047ca64cdf8cf753c9a35673b5

Contains at least two embedded generated exercise video elements plus workout/rest/coach scenes. Preserve before any cleanup.

### Earlier BIG FLEX DOGG WORKOUT
Video id: ae85ad75ae3d4fada5c24751fd4dd198

Contains embedded exercise video for:
- jumping jacks
- push-ups

### Transition/coach reels
- ef91efb38fd34f60be4afe0a4925627c — warmup-start.mp4
- eafe7c223a0e44e0be9bfcab5085aed7 — warmup-to-workout.mp4
- 552f3782c7d445df8d7c00b4d88a1544 — cooldown-start.mp4
- 7e39848984c64c018116ba58f599a3fc — workout-complete.mp4

### Recent failed generations still worth preserving as motion evidence
- 06b722092ead445599ac46c4f53b55d9 — Dumbbell Curl Cinematic Proof
- a8c8e558a235451293f748195e1eef2e — Dumbbell Curl Strict Retry
- bfffb4dfc816474fb8106548441eb986 — Chest Press Cinematic Proof
- 9e0324837f144bd3b8c5c09ceabfdf58 — Rear Delt Fly Proof
- 0dc12680dff14fa38eee3ca1466db406 — Rear Delt Fly Identity-Locked Retry
- d759910db7ffefd9c6220c8a82b048b8 — Chest Press Motion Proof

These failed final QA, but must NOT be deleted until we decide whether any contain usable movement segments for avatar replacement.

## Historical contradiction that caused rework

The roadmap contains an earlier state claiming 48/48 canonical motion complete, followed by a later identity audit and controlled rollback that restored the safer 29/19 split. Therefore "not currently playable" does not mean "never existed."

Recovery rule:
1. Search old app/CDN/HeyGen/Replit assets first.
2. If mechanics are correct but avatar is wrong, send through motion transfer.
3. If identity is correct and mechanics are correct, restore directly.
4. Only generate a new movement when no usable prior motion exists.
5. Never spend credits regenerating Shoulder Mobility or any other already verified clip.

## Next recovery priorities

1. easyWalk / treadmill
2. shoulderPress
3. Bulgarian split squat
4. leg press
5. rear-delt fly
6. dumbbell curl
7. chest-supported row
8. battle ropes
9. external rotation
10. chest press

