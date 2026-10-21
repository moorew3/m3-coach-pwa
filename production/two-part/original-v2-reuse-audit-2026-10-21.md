# M3 FLEX — Original V2 Library Reuse Audit (2026-10-21)

**Project:** `moorew3/m3-coach-pwa`  
**Scope:** Read-only source mapping for the existing Workout A/B development branch. No production deployment, approved-media edits, new provider generations, subscriptions, or clinical exercise clearance are implied.

## Discovery and correction

The original V2 coach project is already a working foundation. `src/data/program.ts` owns prescriptions and rest; `src/data/mirror-me.ts` owns motion phases and keyframes; `src/data/coach-identity.ts` maps allowed original moving clips; `src/lib/exercise-player.ts` unifies sets, reps, rest, coaching cues, motion and tracking. `src/components/ExerciseLibraryModal.tsx` exposes the entire catalog.

The October 5 audit (`docs/reviewed-demonstrators-2026-10-05.md`) reports **42/48 playable motion entries**: 30 original coach clips, 12 licensed/embedded real-person demonstrations, 6 honest motion gaps. This is NOT the same as 42 cast-safe Flex-avatar videos. Do not relabel real-person footage as Flex, or falsely imply all 42 were recovery-approved.

The separate recovery project has **seven owner-approved locked media IDs**: C09-PRE-BREATH-R2, C10-POST-BREATH-R1, C01-R3, C02, C03, C04-R2, C08-PRESS-R3. These are reused in masters without modifying source bytes. They remain subject to sync, app, and clinician safety testing.

## Existing motion reference map — do not generate duplicates before checking source

| Desired recovery shot / feature | Original V2 source | Reuse disposition |
|---|---|---|
| Controlled arm reaches and warm-up | `controlledShoulderWork`, `shoulderMobility`, `mirror-me.ts` phases | **Reference only**: shoulder motion may differ from requested controlled arm reaches. Model exact seated unloaded arm reach; cast still. Do not substitute shoulder rolls. |
| Seated lateral raises | `lateralRaise` / `lateralRaise.mp4` | **Movement reference available**; verify actual standing/seated stance; no unapproved motion used as new Flex footage. |
| Seated boxing | `shadowboxPunches` / `public/media/boxingCombo2.mp4`; original jab/cross sequences | **Movement reference available**; strip foot pivots, stepping, weight shifts; adapt to seated cast-safe form after clearance. |
| Seated rows | `seatedRow` / `seatedRowV3.mp4` | **Motion reference and existing workout logic**; validate leg pressure/seat and suitability separately. |
| Triceps cable or band pressdown | `tricepsPressdown` / `tricepsPressdown.mp4` | **Movement reference**, not automatically a seated recovery movement. |
| Hammer curls | `hammerCurl` original source; **C02** locked Flex | **Use C02 directly** in Flex masters; original exercise cues/rest and V2 motion can inform programming, not overwrite C02. |
| Alternating curls | Original dumbbell curl routine and cues; **C04-R2** locked Flex | **Use C04-R2 directly**; maintain right-leg placement. |
| Front raises | Original shoulder/arm cues; **C03** locked Flex | **Use C03 directly**; don't alter source audio/video. |
| Dumbbell shrugs | Existing arm/shoulder cue and **C01-R3** locked Flex | **Use C01-R3 directly**, protect original white cast. |
| Seated INNSTAR press | V2 `chestPress` illustrates a different method; **C08-PRESS-R3** locked Flex | **Use C08 directly**; do not replace with bench press. Back pad behind chair; bands below armpits; nothing around neck. |
| Preparation/cooldown breathing | **C09-PRE-BREATH-R2**, **C10-POST-BREATH-R1** locked Flex | **Reuse directly**; no new footage unless a separately identified, actually missing segment is required. |
| Wrist curls, AMYCO wrist device, seated chest fly | No exact approved original V2-to-Flex equivalent established | **Keep blocked** until exact source/biomechanics and owner approval; arm curls do not substitute for wrist curls. |

## Implementation order: same app, same two-master plan

1. **Reuse before generation:** For each chapter in `production/two-part-locked-media-manifest.json`, check the seven locked videos first, then V2 `COACH_MOTION` / approved demonstrator mapping and `MirrorMove` program definitions. Attach exact references and distinguish motion reference from permitted playback. Never convert merely similar or standing footage into an automatically approved seated chapter.
2. Retain `production/two-part/build_masters.py` and `chapter_controller.mjs`. Existing V2 workout engine can supply sets, rests, chapters and cues, but cast-safe recovery remains a separately controlled program.
3. Protect external actor/source rights and original immutable assets; original V2 third-party clips are subject to existing credit/license/embedding limitations. Don't rehost/transform third-party embedded Vimeo demonstrations or pose their actors as Flex.
4. Create new clips **only for genuine gaps** after exact footage comparison, owner review and medical clearance. Use approved Flex image `fbc0d826660d479080f2c2ac5fbf5939` and Marcus English voice `0fadce1e82af494a93873aa38ea8d106`, not a female/generated voice. Don't spend generation credits without owner approval.
5. Run Android playback, exercise mechanics, video/audio synchronization, pause/resume, chapter skip/repeat, and safety QA before declaring Workout A or Workout B complete. As of this audit, masters remain **not assembled/released**.

**Do not modify `main`, any of the seven locked source clips, or the existing production app.** This document only records verified reuse opportunities and implementation boundaries.
