# Controlled rollback plan — written 2026-09-20 (snapshot only, nothing restored yet)

## Target base commit
`a516c62b586bf9a052be9ba1d72e8223c86abce4` — "Fixed coach identity & audio" (2026-09-15).
The goal is the simpler September 15 architecture, NOT a destructive reset.

## Hard rules
1. **Do NOT restore old wrong-avatar clips just because they existed at the old
   commit.** A clip is playable only if it appears in
   `current-verified-motion-manifest.ts`. Everything else stays quarantined.
2. The locked actor stays `approved-original-coach`, primary reference
   `src/assets/coach/identity/coach-primary-standing.png.asset.json`, support
   reference `src/assets/coach/identity/coach-face-tattoo-support.jpg.asset.json`.
   The YES/NO walking poster is never an identity source.
3. Media availability must never alter workout structure. No filtering,
   substitution, auto-skip, or dropped cooldowns.
4. Manual phase images are instruction assets, never presented as motion.
5. No video generation, no publish, no Max mode during the rollback.

## Order of operations (next turns, not this one)
1. Snapshot manifests committed (this turn).
2. Restore the Sept-15 tree.
3. Transplant the 29 verified motion URLs + posters from the motion manifest into
   `COACH_MOTION`, `COACH_FRAMES`, and `CANONICAL_IDENTITY_MOTION`.
4. Re-point the identity source to the new primary/support references.
5. Reconcile the program against `current-workout-integrity-manifest.ts`:
   same day order, same exercise ids, mirrors, sets/reps/time/rest.
6. Reapply the still-wanted features from `current-feature-preservation.md`
   in priority order (prescription parity → gate → audio → TV/glasses → extras).
7. Re-run `scripts/audit-coach-motion.ts` and a 412x915 QA pass.

## The 29 verified motions to transplant
lateralRaise, tricepsPressdown, benchPress, inclineDumbbellPress, latPulldown,
seatedRow, romanianDeadlift, squat, hamstringCurl, gluteBridge, deadBug,
suitcaseCarry, bandPullApart, chestMobility, shoulderMobility, lowerBodyMobility,
hamstringMobility, hipFlexorStretch, controlledShoulderWork, boxingStance, jab,
cross, jabCross, shadowboxPunches, guardReset, defensiveReset, frontKick,
roundKick, kneeChamber.
Exact URLs and posters: `current-verified-motion-manifest.ts` (count must stay 29).

## The 19 gaps that must remain gaps
shoulderPress, rearDeltFly, dumbbellCurl, hammerCurl, chestSupportedRow,
chestPress, trapBarDeadlift, legPress, bulgarianSplitSquat, squatToCurl,
stepAltCurl, stepShoulderPress, reverseStepRow, farmerMarch, cablePunch,
medBallChestPass, easyWalk, externalRotation, battleRopeFinisher.
Each stays in its exact workout position with the stationary approved coach and
"FULL MOTION DEMO IN PRODUCTION" until it individually passes the identity +
biomechanics gate (8+ sampled frames).

## Known blocker carried forward
The available generator accepts a prompt plus one starting image only — it does
not accept a motion/reference video, so true motion transfer is unavailable.
Hammer Curl remains the required proof scene before any batch work.