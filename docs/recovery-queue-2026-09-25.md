# Coach Motion Recovery Queue — 2026-09-25

Purpose: finish the remaining coach-motion gaps without rebuilding clips that already have usable exercise mechanics.

Current certified state:
- 30 verified motion clips
- 18 unresolved gaps
- Hammer Curl is recovered and must not be regenerated or re-quarantined.

## Recovery rule

Use existing true-motion footage first. A movement may be promoted only when both are true:
1. the movement/equipment is correct, and
2. the approved coach identity is stable through the full clip.

Do not promote a correct movement with the wrong/unclear coach. Do not generate a replacement while a reusable motion source exists unless identity correction is the only remaining step.

## Priority 1 — strong existing motion source, identity correction only

1. Chest Press — source: chestPressV3.mp4 (ae3d443d). Correct seated machine press; identity drifts.
2. Dumbbell Curl — source: coach/motion/dumbbellCurl.mp4 (0c6f7ce9). Correct curl mechanics; closest existing candidate to promotable, but identity was not a clear match.
3. Chest-Supported Row — source: chestSupportedRowV3.mp4 (242f8087). Correct incline-bench row; face drift.
4. Dumbbell Shoulder Press — source: historical shoulderPressApprovedV2.mp4 (1a0192fb). Correct seated DB press; identity drifts after the opening frame.
5. Easy Walk / Treadmill — source: easyWalkV3.mp4 (21e0072b). Correct treadmill walking; profile view prevents reliable identity verification.
6. Bulgarian Split Squat — source: bulgarianSplitSquatV3.mp4 (160c1726). Correct rear-foot-elevated movement; face drift.
7. Reverse Step + Row — source: reverseStepRow.mp4 (d700a842). Correct reverse lunge + cable row; face drift.
8. Farmer / Suitcase March — source: farmerMarch.mp4 (62335289). Correct dumbbell march; face drift.
9. Squat-to-Curl — source: squatToCurl.mp4 (801f032b). Correct motion; identity/hair drift.
10. Step + Alternating Curl — source: stepAltCurl.mp4 (0e600c10). Correct motion; identity too small/unclear.
11. Step + Shoulder Press — source: stepShoulderPress.mp4 (881b3195). Correct motion; identity too small/unclear.

## Priority 2 — usable movement source but stronger identity/equipment cleanup needed

12. Cable Punch — source: cablePunch.mp4 (52121fcd). Correct cable punch; braided hair/identity mismatch.
13. Rear-Delt Fly — source: rearDeltFly.mp4 (dda4926f). Correct bent-over fly; braided hair.
14. Trap-Bar Deadlift — source: trapBarDeadlift.mp4 (a83a7bf4). Correct real hex/trap bar; braided hair.
15. Leg Press — source: legPress.mp4 (cb6f3ffc). Correct 45-degree leg press; side view/identity unverifiable.
16. Medicine-Ball Chest Pass — source: medBallChestPass.mp4 (e7d12aaf). Real wall pass; identity too small/side-view.
17. Battle-Rope Finisher — source: battleRopeFinisher.mp4 (e87a2f34). Correct double-wave motion; wrong hair/identity.

## Priority 3 — no usable current motion source

18. Shoulder External Rotation — current later variants are the wrong movement (band pull-apart). The original 2026-09-01 motion asset 85899dac... was the correct movement but its binary is currently unrecoverable/404. This is the only gap that may truly require new exercise footage if that original binary cannot be recovered.

## Chest Press recovery attempt — blocked, no charge

On 2026-09-25 a single controlled HeyGen Cinematic Avatar attempt was prepared using:
- approved avatar: M3 Approved Coach Motion Source
- motion reference: chestPressV3.mp4
- strict prompt requiring continuous seated machine chest-press repetitions

HeyGen rejected the request before generation with `insufficient_credit`.
The account currently shows 54 add-on credits but 0 premium credits; Cinematic Avatar requires plan/generative credit, so the add-on balance cannot fund this operation.

Result:
- No video was generated.
- No HeyGen generation credits were spent.
- Do not retry Cinematic Avatar until plan/generative credit is available.
- Chest Press remains quarantined and chestPressV3 remains the preferred motion source.
