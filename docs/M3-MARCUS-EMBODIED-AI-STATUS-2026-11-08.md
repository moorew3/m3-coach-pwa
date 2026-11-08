# M3 FLEX COACH — Embodied MARCUS implementation ledger

Date: 2026-11-08
Owner: M3
Workstream: Existing `moorew3/m3-coach-pwa` (no replacement application)
Protected base: `feature/visual-first-recovery-20261103`
Proposed changes: `work/marcus-live-health-feedback-20261108`, draft PR #35
Production: DO NOT REPLACE OR AUTO-DEPLOY

## Principle

MARCUS is intended to be a *multimodal, conversational, camera-aware, sensor-aware, embodied AI coach*, not a video playlist. Existing recorded media may be reused only as approved fallback demonstrations; it is not the cognitive engine. SARAH remains the distinct ecosystem controller. Do not substitute generic voices, alter approved faces/tattoos, add paid AI, or pretend to have sensor values or medical clearance.

## Verified pre-existing foundations

- A React / TanStack Start application backed by the original repo and Railway source branches, with portable Node/Docker build and regression checks.
- Private on-device MediaPipe pose-tracking and movement analysis including strength and existing boxing/kick analyses.
- Opt-in browser voice commands; separate local WebGPU natural-conversation option (model download is substantial and device-specific).
- Approved Marcus recordings and existing owner-approved recovery scenes remain untouched.
- Workout sets/rest/supersets and explicit exercise logging; nutrition log and food preferences.
- Existing, distinct cross-device/display/SARAH integration interfaces, but full end-to-end operation and hardware behavior not proven.

## Implemented as protected candidate in PR #35

| Area | Change | Boundaries |
|---|---|---|
| Live Bluetooth heart rate | Standard 0x180D BLE sensor, displayed in V2 with opt-in pairing, available to general chat and workout conversation | Reading must arrive within 15 seconds, otherwise unavailable; device required; no diagnosis |
| Activity record | Live BPM can populate existing HealthPanel; stale auto-filled BPM is cleared without deleting values the user typed | No fabricated sensor values or silent health data upload |
| Smart scale | Standard 0x181D/0x2A9D BLE weight indication, SI/Imperial conversion, explicit save button into existing Nutrition bodyweight log | Does not support proprietary scale protocols by magic; no automatic save |
| Weight provenance | Optional source and timestamp on NutritionDay, with manual entry still supported | Backward compatible with older logs |
| Nutrition query | Answers most recent recorded weight from nutrition log with source, units and date | No guessing unlogged results |
| Basketball lab | New `/basketball` route on existing website, upper-body MediaPipe pose estimation and counted visible arm extensions for seated shooting drill | Cannot detect ball, made baskets, trajectory or medical-safe mechanics; no fake coach voice |
| QA | Automated BLE packet, freshness, permissions/UI source, image landmark, confidence, bilateral, stale-state and route tests | Mock sensors and synthetic landmarks do not prove phone hardware |

No new hosting service, paid provider, recurring subscription, developer asset, or voice model has been added. No changes have been deployed to production.

## Not done — do not mark these as delivered

1. **Approved real-time 3D MARCUS:** `src/v2/rig-release.ts` intentionally has `identityApproved:false`, `rigAndMobileApproved:false`, no accepted motion keys. There is no verified owner-approved rigged `/v2/coach.glb`. Do NOT flip flags or replace the face with generic geometry. Need exact approved model, animation rig, mobile/biomechanics QA and owner approval.
2. **Continuous hands-free two-way speech:** Existing Web Speech mic and optional on-device conversation are partial. Exact approved live Marcus voice generation is gated, owner-paired and restricted to previously approved free period; never silently switch to unapproved voices or paid API.
3. **Health Connect and full vitals:** Native Android bridge is a seam, not a complete installed production integration. BP, oxygen saturation, temperature require actual compatible devices and supported standards; camera alone cannot measure them reliably.
4. **Full MMA/basketball:** Existing boxing and basic basketball arm mechanic are only portions. Do not claim refereeing, contact safety, footwork form (with injured left leg), impacts or made shots without evidence.
5. **Three-room independent projection:** Current `/display` offers a paired workout snapshot and `cast-link` depends on a configured Cast receiver. Separate bedroom/gym/kitchen projector endpoints, voice wake, permissions and handoff have NOT been physically tested or accepted.
6. **Account-backed sync and SARAH:** Existing sync and window-origin bridge components require controlled device/authentication tests, secure schema and owner permission. Do not post health data into unauthenticated projector channels.
7. **Wearable/scale compatibility:** Standard BLE support only; a particular existing device needs physical acceptance. Proprietary hardware might require vendor-specific adapters and consent.

## Device acceptance protocol (not yet passed)

- On Samsung Fold and actual browser, verify camera permission, video overlay, MediaPipe landmarks, upper-body form interpretation and performance.
- Pair an owned standard BLE 0x180D chest strap; confirm freshly reported BPM, lapse beyond 15 seconds, unplug and reconnect, question-answer consistency.
- Pair an owned standard 0x181D scale, record a measurement; check kilograms/pounds, explicit confirmation, source label, refusal of invalid/expired measurement, and that manual entries are never overwritten silently.
- In `/basketball`, start/stop camera and verify that visible right/left elbow extension cycles update; obscure an arm and verify count does not increase; observe no ball detection or make/miss promises.
- Open MARCUS in existing session with original approved voice and visuals, verify lip-sync/headphones/3D motion *only once the real rig is approved*. Do not accept a still photo.
- Verify SARAH-to-FLEX controls with the real published SARAH site, then multi-display sessions from each intended room without cross-device leaking of camera/health data.
- Confirm emergency stop/pain reporting and existing injured LEFT-leg support restrictions, approved safe recovery motion, originals unchanged and rollback.

## Cost and release gate

- No new paid AI speech/API calls, subscriptions, device purchases or new Railway services without explicit approval and a verified cost boundary.
- Preserve backup and rollback artifacts, user data and original signing identity; never replace the installed Android app with a debug-signed APK.
- A green CI run is code-level evidence only; it is not a real-device, clinical, media-identity or project-completion certificate.
- Keep PR #35 in draft until any remaining source tests pass and owner-approved preview/hardware tests are completed.

## Current next work in dependency order

1. Merge sensor and sport changes only after passing every build/regression test and user device review.
2. Acquire or restore the exact rigged MARCUS asset and approved animation/voice pipeline; run side-by-side identity, movement, screen/mobile QA.
3. Turn local on-device conversational model + camera measurement + workout memory into one coherent coaching interaction; verify real speech, mic interruption and no unapproved voice.
4. Implement confirmed hardware adapters and user-owned cross-device health/nutrition storage, not guessed readings.
5. Test three independent low-cost projector browser displays with authenticated command routing, including when a display is offline.
6. Complete remaining strength, MMA and basketball drill systems with explicit technique confidence gates; obtain user approval for new motions.

**Delivery definition:** Only label the whole platform “Ready for review” when the running, authorized system meets all original acceptance tests on actual hardware. Individual code increments may be ready for code review earlier.
