# Video Recovery Inventory — 2026-09-25

## Recovery-first rule

- Do not regenerate an exercise video until every existing Lovable asset variant and relevant HeyGen render has been checked.
- `Quarantined` means **not currently allowed to render**, not deleted and not useless.
- Keep wrong-avatar clips as motion/reference candidates for identity-correct regeneration where the generation method supports video references.
- Preserve already-verified clips unchanged unless a new visual audit finds a concrete defect.

## Current Lovable runtime status before recovery sync

- Verified/active coach motion keys: **29**
- Quarantined runtime motion keys: **19**
- Lovable coach-motion asset manifests still present: **57**
- Lovable legacy motion asset manifests still present: **42**
- Completed videos currently visible in connected HeyGen history: **23**

### Verified / active
- boxingStance
- cross
- defensiveReset
- gluteBridge
- guardReset
- jab
- shadowboxPunches
- bandPullApart
- benchPress
- chestMobility
- controlledShoulderWork
- deadBug
- frontKick
- hamstringCurl
- hamstringMobility
- hipFlexorStretch
- inclineDumbbellPress
- jabCross
- kneeChamber
- latPulldown
- lateralRaise
- lowerBodyMobility
- romanianDeadlift
- roundKick
- seatedRow
- shoulderMobility
- squat
- suitcaseCarry
- tricepsPressdown

### Quarantined in runtime but assets must be preserved
- battleRopeFinisher
- bulgarianSplitSquat
- cablePunch
- chestPress
- chestSupportedRow
- dumbbellCurl
- easyWalk
- externalRotation
- farmerMarch
- hammerCurl
- legPress
- medBallChestPass
- rearDeltFly
- reverseStepRow
- shoulderPress
- squatToCurl
- stepAltCurl
- stepShoulderPress
- trapBarDeadlift

## Lovable coach-motion assets still present
- `src/assets/coach/motion/bandPullApart.mp4.asset.json`
- `src/assets/coach/motion/battleRopeFinisher.mp4.asset.json`
- `src/assets/coach/motion/benchPressV3.mp4.asset.json`
- `src/assets/coach/motion/boxingStanceV2.mp4.asset.json`
- `src/assets/coach/motion/bulgarianSplitSquat.mp4.asset.json`
- `src/assets/coach/motion/bulgarianSplitSquatV3.mp4.asset.json`
- `src/assets/coach/motion/cablePunch.mp4.asset.json`
- `src/assets/coach/motion/chestMobilityV2.mp4.asset.json`
- `src/assets/coach/motion/chestPress.mp4.asset.json`
- `src/assets/coach/motion/chestPressV3.mp4.asset.json`
- `src/assets/coach/motion/chestSupportedRow.mp4.asset.json`
- `src/assets/coach/motion/chestSupportedRowV3.mp4.asset.json`
- `src/assets/coach/motion/coachWalkEntrance.mp4.asset.json`
- `src/assets/coach/motion/controlledShoulderWork.mp4.asset.json`
- `src/assets/coach/motion/crossV2.mp4.asset.json`
- `src/assets/coach/motion/deadBugV3.mp4.asset.json`
- `src/assets/coach/motion/defensiveResetV2.mp4.asset.json`
- `src/assets/coach/motion/dumbbellCurl.mp4.asset.json`
- `src/assets/coach/motion/easyWalkV3.mp4.asset.json`
- `src/assets/coach/motion/externalRotation.mp4.asset.json`
- `src/assets/coach/motion/externalRotationV2.mp4.asset.json`
- `src/assets/coach/motion/farmerMarch.mp4.asset.json`
- `src/assets/coach/motion/frontKick.mp4.asset.json`
- `src/assets/coach/motion/gluteBridgeV3.mp4.asset.json`
- `src/assets/coach/motion/guardResetV2.mp4.asset.json`
- `src/assets/coach/motion/hammerCurl.mp4.asset.json`
- `src/assets/coach/motion/hamstringCurlV2.mp4.asset.json`
- `src/assets/coach/motion/hamstringMobilityV3.mp4.asset.json`
- `src/assets/coach/motion/hipFlexorStretchV3.mp4.asset.json`
- `src/assets/coach/motion/inclineDumbbellPressV3.mp4.asset.json`
- `src/assets/coach/motion/jabCrossV2.mp4.asset.json`
- `src/assets/coach/motion/jabV2.mp4.asset.json`
- `src/assets/coach/motion/kneeChamberV2.mp4.asset.json`
- `src/assets/coach/motion/latPulldownV2.mp4.asset.json`
- `src/assets/coach/motion/lateralRaise.mp4.asset.json`
- `src/assets/coach/motion/legPress.mp4.asset.json`
- `src/assets/coach/motion/legPressV2.mp4.asset.json`
- `src/assets/coach/motion/lowerBodyMobility.mp4.asset.json`
- `src/assets/coach/motion/medBallChestPass.mp4.asset.json`
- `src/assets/coach/motion/medBallChestPassV2.mp4.asset.json`
- `src/assets/coach/motion/rearDeltFly.mp4.asset.json`
- `src/assets/coach/motion/reverseStepRow.mp4.asset.json`
- `src/assets/coach/motion/romanianDeadliftV2.mp4.asset.json`
- `src/assets/coach/motion/roundKick.mp4.asset.json`
- `src/assets/coach/motion/seatedRowV3.mp4.asset.json`
- `src/assets/coach/motion/shadowboxPunchesV2.mp4.asset.json`
- `src/assets/coach/motion/shoulderMobility.mp4.asset.json`
- `src/assets/coach/motion/shoulderPress.mp4.asset.json`
- `src/assets/coach/motion/squatToCurl.mp4.asset.json`
- `src/assets/coach/motion/squatV2.mp4.asset.json`
- `src/assets/coach/motion/stepAltCurl.mp4.asset.json`
- `src/assets/coach/motion/stepAltCurlV2.mp4.asset.json`
- `src/assets/coach/motion/stepShoulderPress.mp4.asset.json`
- `src/assets/coach/motion/stepShoulderPressV2.mp4.asset.json`
- `src/assets/coach/motion/suitcaseCarry.mp4.asset.json`
- `src/assets/coach/motion/trapBarDeadlift.mp4.asset.json`
- `src/assets/coach/motion/tricepsPressdown.mp4.asset.json`

## Lovable legacy motion assets still present
- `src/assets/motion/bandPullApart.mp4.asset.json`
- `src/assets/motion/battleRopeFinisher.mp4.asset.json`
- `src/assets/motion/benchPress.mp4.asset.json`
- `src/assets/motion/bulgarianSplitSquat.mp4.asset.json`
- `src/assets/motion/cablePunch.mp4.asset.json`
- `src/assets/motion/chestMobility.mp4.asset.json`
- `src/assets/motion/chestPress.mp4.asset.json`
- `src/assets/motion/chestSupportedRow.mp4.asset.json`
- `src/assets/motion/controlledShoulderWork.mp4.asset.json`
- `src/assets/motion/cross.mp4.asset.json`
- `src/assets/motion/deadBug.mp4.asset.json`
- `src/assets/motion/dumbbellCurl.mp4.asset.json`
- `src/assets/motion/easyWalk.mp4.asset.json`
- `src/assets/motion/externalRotation.mp4.asset.json`
- `src/assets/motion/farmerMarch.mp4.asset.json`
- `src/assets/motion/frontKick.mp4.asset.json`
- `src/assets/motion/hammerCurl.mp4.asset.json`
- `src/assets/motion/hamstringCurl.mp4.asset.json`
- `src/assets/motion/hamstringMobility.mp4.asset.json`
- `src/assets/motion/hipFlexorStretch.mp4.asset.json`
- `src/assets/motion/inclineDumbbellPress.mp4.asset.json`
- `src/assets/motion/jab.mp4.asset.json`
- `src/assets/motion/jabCross.mp4.asset.json`
- `src/assets/motion/kneeChamber.mp4.asset.json`
- `src/assets/motion/latPulldown.mp4.asset.json`
- `src/assets/motion/lateralRaise.mp4.asset.json`
- `src/assets/motion/legPress.mp4.asset.json`
- `src/assets/motion/lightPunches.mp4.asset.json`
- `src/assets/motion/lowerBodyMobility.mp4.asset.json`
- `src/assets/motion/medBallChestPass.mp4.asset.json`
- `src/assets/motion/rearDeltFly.mp4.asset.json`
- `src/assets/motion/reverseStepRow.mp4.asset.json`
- `src/assets/motion/romanianDeadlift.mp4.asset.json`
- `src/assets/motion/roundKick.mp4.asset.json`
- `src/assets/motion/seatedRow.mp4.asset.json`
- `src/assets/motion/shoulderMobility.mp4.asset.json`
- `src/assets/motion/shoulderPress.mp4.asset.json`
- `src/assets/motion/squat.mp4.asset.json`
- `src/assets/motion/squatToCurl.mp4.asset.json`
- `src/assets/motion/suitcaseCarry.mp4.asset.json`
- `src/assets/motion/trapBarDeadlift.mp4.asset.json`
- `src/assets/motion/tricepsPressdown.mp4.asset.json`

## Connected HeyGen completed-video history
- 2026-09-24 — `d759910db7ffefd9c6220c8a82b048b8` — M3 Coach Chest Press Motion Proof — 4.80653s
- 2026-09-24 — `0dc12680dff14fa38eee3ca1466db406` — M3 Coach Rear Delt Fly Identity-Locked Retry — 4s
- 2026-09-24 — `9e0324837f144bd3b8c5c09ceabfdf58` — M3 Coach Rear Delt Fly Proof — 6s
- 2026-09-24 — `bfffb4dfc816474fb8106548441eb986` — M3 Coach Chest Press Cinematic Proof — 6s
- 2026-09-24 — `a8c8e558a235451293f748195e1eef2e` — M3 Coach Dumbbell Curl Strict Retry — 6s
- 2026-09-24 — `06b722092ead445599ac46c4f53b55d9` — M3 Coach Dumbbell Curl Cinematic Proof — 6s
- 2026-09-23 — `e93ad0f98ebf4a0e953b842813df288e` — M3 Coach Hammer Curl Cinematic Proof — 6s
- 2026-09-23 — `66c3c4a1b251bbbae713fb7d94745758` — M3 Coach Hammer Curl Identity Proof — 4.12735s
- 2026-06-18 — `2abe5c67cd0641858bc5e27c98e3679a` — Quick Avatar Video — 36.1273s
- 2026-06-18 — `d4c5e6ebbb9248d8aeab4b54a1b9a4c9` — Avatar IV Video — 36.1273s
- 2026-06-17 — `6e9724f81b334bffb3ea6777b30d8872` — Silly Bear Science Fun — 10s
- 2026-06-17 — `69e589f309244e62b19ef09cb086e629` — Silly Bear's Exploding Science Fun — 10s
- 2026-06-17 — `1b4f77d83d3f4b63bccfd1d9614cbb44` — Avatar IV Video — 16.9273s
- 2026-06-15 — `b762b8c9a6e94cbbbc071b925294471b` — Avatar IV Video — 17.0841s
- 2026-06-15 — `888daecad6d140948b593f81dbec09bf` — Avatar IV Video — 16.1437s
- 2026-06-15 — `b2e4a3b8b2424b91a03599f7e8d6b978` — Avatar IV Video — 18.4686s
- 2026-05-01 — `7e39848984c64c018116ba58f599a3fc` — Avatar Video — 9.56082s
- 2026-05-01 — `552f3782c7d445df8d7c00b4d88a1544` — Avatar Video — 8.82939s
- 2026-05-01 — `eafe7c223a0e44e0be9bfcab5085aed7` — Avatar Video — 9.09061s
- 2026-05-01 — `ef91efb38fd34f60be4afe0a4925627c` — Avatar Video — 10.1094s
- 2026-03-31 — `bda7adea397249f789322b3b406f0224` — BIG FLEX DOGG: Workout B (Portrait) — 46.4196s
- 2026-03-31 — `603197047ca64cdf8cf753c9a35673b5` — BIG FLEX DOGG WORKOUT — 17.058s
- 2026-03-31 — `ae85ad75ae3d4fada5c24751fd4dd198` — BIG FLEX DOGG WORKOUT — 14.9682s

## Specific recovered findings

- `shoulderMobility` is already a verified active clip and must not be remade.
- `easyWalk` / treadmill has multiple existing Lovable candidates, including `src/assets/motion/easyWalk.mp4.asset.json` and `src/assets/coach/motion/easyWalkV3.mp4.asset.json`; it remains quarantined only until the best existing candidate passes identity/motion review.
- The September 20 controlled rollback intentionally reduced the playable allowlist, but many non-playable MP4 manifests remained in the project. Those files are recovery candidates.
- The connected HeyGen account contains older generic `Avatar Video` / `Avatar IV Video` renders plus newer named M3 Coach proof clips. Generic titles must be inspected rather than discarded because the motion may be reusable with the correct identity.

## Next review order

1. Recover/confirm already-good clips first: Shoulder Mobility and every current verified motion.
2. Compare all variants for each quarantined movement before generating anything new.
3. Prioritize treadmill/easyWalk because at least two Lovable versions already exist.
4. Review older generic HeyGen renders for useful exercise motion, even when the avatar is wrong.
5. Only generate a brand-new motion when no existing candidate can be corrected or reused.


## Detailed 60-variant frame audit

Audit only. No media generated, deleted, overwritten, or promoted. 8 evenly spaced frames per clip were
compared against `approved-original-coach` (primary standing + face/tattoo support refs: short fade,
full beard, portrait tattoo on left pec, sleeve tattoos, black shorts).

Totals: **60 variants inspected** (35 current pointers + 25 historical URLs recovered from git history).
7 historical URLs no longer resolve (noted below). **Promoted: 0.** Shoulder Mobility and all 29 verified
clips untouched.

Classification key: PASS = pass as-is · REF = good motion / wrong or unclear avatar, keep as reference
candidate · DEFECT = correct avatar / motion defect · WRONG = wrong movement/equipment, archive ·
BROKEN = phase-board slideshow, overlay graphics, or unreachable.

| Movement | Versions found (id prefix) | Best existing candidate | Class | Defect / reason | Next action |
|---|---|---|---|---|---|
| battleRopeFinisher | coach e87a2f34, motion 65901f32, hist 53f286bd | coach/motion/battleRopeFinisher.mp4 (e87a2f34) | REF | Correct double-wave motion; actor has braids/locs (non-canonical). 53f286bd: good motion, face too small to verify. 65901f32: overlay graphics + different man = BROKEN | Identity-correct transfer of e87a2f34 motion |
| bulgarianSplitSquat | coach 6c0d1d9d, V3 160c1726, motion 9b3a6a19, hist V2 bd0a1852, hist be6bb35f (404) | coach/motion/bulgarianSplitSquatV3.mp4 | REF | V3: rear foot on bench, dumbbells, correct; face drifts from ref. V2: no bench = WRONG. 6c0d1d9d: side view, face unverifiable. 9b3a6a19 = BROKEN board | Face-correct V3 |
| cablePunch | coach 52121fcd, motion 32a3d448, hist 7e09e2fb | coach/motion/cablePunch.mp4 (52121fcd) | REF | Correct cable punch; braided hair, motion blur frames 6–7. 7e09e2fb: good, face too small. 32a3d448 = BROKEN board | Identity transfer from 52121fcd or 7e09e2fb |
| chestPress | coach d704c70d, V3 ae3d443d, motion 5886b80b, hist V2 de559803, hist 71ec41bd (404) | coach/motion/chestPressV3.mp4 | REF | V3: seated machine press, correct; face differs (rounder). d704c70d: flat DB press, face hidden = WRONG equipment if machine required. V2: standing, no press = WRONG. 5886b80b = BROKEN | Face-correct V3 |
| chestSupportedRow | coach 0864f71d, V3 242f8087, motion 7a9bb223, hist V2 ad590c51, hist c4c963bf (404) | coach/motion/chestSupportedRowV3.mp4 | REF | V3: incline-bench DB row, correct; face drift. 0864f71d: correct, small/side, unverifiable. V2: standing shrug = WRONG. 7a9bb223 = BROKEN | Face-correct V3 |
| dumbbellCurl | coach 0c6f7ce9, motion 34c7590a, hist 8f9885de | coach/motion/dumbbellCurl.mp4 (0c6f7ce9) | REF | Correct curls, full body, fade + pec tattoo; face not a clear match to ref (fails 09-14 strict audit). 8f9885de: longer beard, small. 34c7590a = BROKEN | Closest to promotable — human identity sign-off, else transfer |
| easyWalk / treadmill | motion easyWalk 659ab634, coach V3 21e0072b, hist V2 4380b909, hist fd4a30b9 (404) | coach/motion/easyWalkV3.mp4 | REF | V3: real treadmill walk, full legs, steady cam; profile view, face never clearly verifiable. V2: overground walk toward camera, face drift. easyWalk.mp4: tank top, different man, graphics = BROKEN | Identity-correct treadmill from V3 motion |
| externalRotation | coach b59570b5, V2 b565013d, motion 15008c5c, hist 85899dac (404) | none usable | WRONG | b59570b5 + V2 show band pull-apart, not external rotation. 15008c5c: different face, graphics, cropped = BROKEN | Needs new footage (only after other options) |
| farmerMarch | coach 62335289, motion 1110054c, hist 19552d37 | coach/motion/farmerMarch.mp4 (62335289) | REF | Correct DB march, full body; face drift from ref. 19552d37: good, small face. 1110054c = BROKEN | Face-correct 62335289 |
| legPress | coach cb6f3ffc, V2 0b3034aa, motion 5d0bfb30, hist 296b1e5f (404) | coach/motion/legPress.mp4 (cb6f3ffc) | REF | Correct 45° leg press; side view, long beard, face unverifiable. V2: stands then sits, no press = WRONG. 5d0bfb30 = BROKEN | Identity transfer from cb6f3ffc |
| medBallChestPass | coach e7d12aaf, V2 e038259e, motion 894c7c92, hist 72c0f247 (404) | coach/motion/medBallChestPass.mp4 (e7d12aaf) | REF | Real wall pass; side view, small, unverifiable. V2: face drift, ball mostly held (weak pass). 894c7c92: board + different framing = BROKEN | Identity transfer from e7d12aaf |
| rearDeltFly | coach dda4926f, motion 3ffa1fe4, hist 2f18b33d | coach/motion/rearDeltFly.mp4 (dda4926f) | REF | Correct bent-over fly; braided hair. 2f18b33d: good, small face. 3ffa1fe4 = BROKEN | Identity transfer |
| reverseStepRow | coach d700a842, motion 5b52cd3e, hist fae632cc | coach/motion/reverseStepRow.mp4 (d700a842) | REF | Reverse lunge + cable row, correct; face drift. fae632cc: DB version, tiny figure. 5b52cd3e = BROKEN | Face-correct d700a842 |
| shoulderPress | coach 332dd309, motion b9377977, hist e3b21b8a, hist ApprovedV2 1a0192fb, hist ApprovedV3 69b2c6c5 | hist shoulderPressApprovedV2.mp4 (1a0192fb) | REF | ApprovedV2/V3: seated DB press (not machine), 10s, strong match but face drifts after frame 1. 332dd309: standing DB press, face drift. e3b21b8a: head cropped at lockout. b9377977 = BROKEN. All preserved | Re-add ApprovedV2 pointer as archive; human identity review |
| squatToCurl | coach 801f032b, motion 2d575d12, hist d4d80ace | coach/motion/squatToCurl.mp4 (801f032b) | REF | Correct squat→curl; face drift and braid-like hair mid-clip. d4d80ace: good, small face. 2d575d12 = BROKEN | Identity transfer |
| stepAltCurl | coach 0e600c10, V2 d86607bc, hist 51a007cf, hist b3d9aaa5 | coach/motion/stepAltCurl.mp4 (0e600c10) | REF | 0e600c10: step + alt curl, small/unverifiable. V2: curls with no step = WRONG. 51a007cf: step-out curl, different venue. b3d9aaa5 = BROKEN | Identity transfer from 0e600c10 |
| stepShoulderPress | coach 881b3195, V2 ed18e6d3, hist 18b43a2c, hist c1ef8fc1 | coach/motion/stepShoulderPress.mp4 (881b3195) | REF | 881b3195: step + press, small/unverifiable. V2: press with no step = WRONG. c1ef8fc1: lateral step press, different venue. 18b43a2c = BROKEN | Identity transfer from 881b3195 |
| trapBarDeadlift | coach a83a7bf4, motion aa30eb0d | coach/motion/trapBarDeadlift.mp4 (a83a7bf4) | REF | Frames show a real hex/trap bar (earlier "straight barbell" note does not apply to this file); actor has braided hair. aa30eb0d = BROKEN board | Identity transfer from a83a7bf4 |

Unreachable historical URLs (404, recorded only): bulgarianSplitSquat be6bb35f, chestPress 71ec41bd,
chestSupportedRow c4c963bf, easyWalk fd4a30b9, externalRotation 85899dac, legPress 296b1e5f,
medBallChestPass 72c0f247.


## Hammer Curl recovery correction

- The **September 19** Hammer Curl proof failed and remains rejected.
- A **different later proof**, HeyGen `e93ad0f98ebf4a0e953b842813df288e` (“M3 Coach Hammer Curl Cinematic Proof”), passed visual QA on **2026-09-24**: same approved coach, tattoos/identity preserved, real neutral-grip hammer-curl motion.
- That passed proof was exported as GitHub release asset `coach-media-v1/hammerCurl.mp4` on 2026-09-24. Release asset SHA-256: `6ac539093f7883ff2fc6d6a725471f8fbba0350477ebfb965d84a44b76deed67`.
- Recovery status: **verified and restored in GitHub source**. Lovable still has the earlier rollback state until a sync/edit is performed there.
- Do not regenerate Hammer Curl.


## Easy Walk / Treadmill recovery proof

- Recovery source motion: `easyWalkV3.mp4` (`21e0072b-b44f-4e33-b732-1fda2790cb7b`).
- Locked identity source: private HeyGen avatar `M3 Approved Coach Motion Source`.
- Recovery proof video: `841f466bf6cb4f1f8f48783fbac039af`.
- Status: **rendered, NOT promoted**. The runtime remains on the stationary approved-coach fallback for Easy Walk until the proof passes visual identity + biomechanics review.
- No other recovery render should be started from this method until this proof is accepted.


## Free HeyGen history recovery sweep

- Older generic HeyGen videos were decoded by scene metadata instead of discarded.
- `2abe5c67cd0641858bc5e27c98e3679a` and `d4c5e6ebbb9248d8aeab4b54a1b9a4c9` are talking-avatar Goblet Squat instruction videos, not true exercise-motion demos.
- `bda7adea397249f789322b3b406f0224` (“BIG FLEX DOGG: Workout B”) contains embedded workout footage for a treadmill burst, Bench Press, Cable Row, and Standing Cable Curl. Preserve those embedded clips as motion-reference candidates.
- `7e39848984c64c018116ba58f599a3fc`, `552f3782c7d445df8d7c00b4d88a1544`, `eafe7c223a0e44e0be9bfcab5085aed7`, and `ef91efb38fd34f60be4afe0a4925627c` are workout transition/voice clips, not exercise demonstrations.
- Newer prior outcomes recovered from chat history: Rear-Delt Fly `9e0324837f144bd3b8c5c09ceabfdf58` failed identity + movement QA; Rear-Delt Fly retry `0dc12680dff14fa38eee3ca1466db406` also failed; Dumbbell Curl strict retry `a8c8e558a235451293f748195e1eef2e` rendered as a hammer curl and failed; Chest Press cinematic proof `bfffb4dfc816474fb8106548441eb986` had correct mechanics but failed identity QA; Chest Press motion proof `d759910db7ffefd9c6220c8a82b048b8` was rendered with the approved private avatar and correct machine-press prompt but remained QA-pending.
