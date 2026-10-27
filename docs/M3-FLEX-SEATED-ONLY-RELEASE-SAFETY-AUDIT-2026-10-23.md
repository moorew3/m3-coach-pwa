# M3 FLEX — Seated-only release safety audit (October 23, 2026)

**Status: BLOCKED for a full seated-only workout release.** This audit is based on the existing source program, not on an assessment of the athlete's medical clearance. The owner requires seated-only exercise, a protected foot/cast, no jumping or burpees, and no machine shoulder press.

## Clarified weight-bearing ability — October 24, 2026

The owner explicitly reports **being able to bear weight on the injured foot while wearing a cast**. Earlier statements within the Recovery Coach referring to the owner as non-weight-bearing, unable to stand, or categorically forbidden from putting any foot pressure on the floor were inaccurate and have been corrected.

The existing approved Recovery Coach exercises remain **seated because that was the selected workout design**, not because the owner has been medically established to be non-weight-bearing. No prior approval of a specific standing, loaded lower-body or impact exercise follows solely from weight-bearing ability. These movements can be evaluated for inclusion in a future plan under actual clinician-specific restrictions; do not automatically prohibit or automatically authorize them. Preserve the existing approved Flex media, white cast depiction, and Marcus audio without alteration.

## Current legacy programming conflicts

These are **confirmed examples**, not an exhaustive list of every exercise or form cue:

| Source location | Existing movement / instruction | Why it cannot be represented as seated-only |
| --- | --- | --- |
| \`src/data/program.ts\`, Tuesday Weighted Cardio | \`cardio-squat-curl\` Squat-to-Curl, \`cardio-step-curl\` Step + Alternating Curl, \`cardio-step-press\` Step + Shoulder Press, \`cardio-reverse-row\` Reverse Step + Row | Requires standing/stepping and lower-limb loading; non-jumping does not establish safe seated use |
| \`src/data/program.ts\`, Friday Strength C | \`fri-squat\` Squat, \`fri-rdl\` Romanian Deadlift, \`fri-trap-bar\` Trap-Bar Deadlift, \`fri-split-squat\` Bulgarian Split Squat | Standing/leg-loading movements not approved as seated substitutes |
| \`src/data/program.ts\`, Saturday Boxing | \`box-stance\`, \`box-front-kick\`, \`box-round-kick\`, \`box-knee\`, foot-pivot cues | Footwork, kicks and stance work conflict with the seated-only restriction |
| \`src/lib/coach-script.ts\` | "Keep walking or stepping in place... Do not sit down." | Directly contradicts seated-only training |
| \`src/lib/coach-script.ts\` | "Stand tall" and "Stay light on the feet" | These are standing cues even if the exercise title could be adapted |

## Current mitigation shipped to protected staging only

- The home workout card now explicitly warns that the legacy program is **not cleared for seated-only foot-cast training**, with a first-party link to the reviewed seated recovery clips at \`/recovery-coach/\`.
- The in-workout readiness overlay repeats the distinction **before** the user saves answers. Completing the general readiness check is not a certification that a standing exercise is safe.
- No existing programmed exercises, superset/rest prescriptions, approved Flex/Marcus videos or owner media assets have been silently substituted. No new exercises were auto-approved.
- This safety warning does not transform the old schedule. It is not a medical clearance, exercise validator or a complete substitute seated plan.

## Available approved-media seated session (protected staging)

An **approved-media recovery circuit** is now linked prominently from the app home page to the existing same-origin `/recovery-coach/` player, **before** the legacy weekly workout button.

- It reuses only the existing owner-approved scenes: C09 breathing; C01-R3 shrugs; C02 hammer curls; C03 front raises; C04-R2 alternating curls; C08-PRESS-R3 INNSTAR seated chest press; C10 cooldown breathing. Original media/Marcus sources are unchanged and protected by ID regression assertions.
- The viewer can opt into **one or two timed demonstration sets** per approved loaded movement with a selected **15/20/30/45-second rest** after a set and between different movements. The same approved scene repeats; no footage or workouts are invented.
- A counted demonstration set does **not** establish completed user reps, movement quality, approved training load, or clinical clearance. The player deliberately does not write fictitious reps into the legacy workout log.
- The player still requires three explicit clinician/restriction/effort acknowledgments before any timed active session. Previews are possible without beginning exercise. It keeps cast-support warnings.
- The exact phrase **"Controlled arm reaches"** appears for the text-only preparation step. The existing Marcus general shoulder mobility MP3 is left untouched and is **not claimed** to be an approved video demonstrating those reaches.
- Re-selecting an exercise resets the demonstration round counter. The one/two-set choice locks after the timed session starts and unlocks on Reset.
- Workout A and Workout B remain **incomplete development previews** because several necessary moving demonstrations and equipment-specific technique validations are missing. This approved-media circuit is not a replacement for finished Workout A/B.

The browser QA checks the standalone player using **simulated media playback and accelerated time** for the scheduler; therefore neither the video host nor actual Bluetooth/earbud audio is certified by that test. Physical Android and full Marcus movement/lip synchronization remain open QA gates. This is not medical prescription advice.

## Recovery Coach phone-lock, reload and same-device resume

Protected staging now saves a minimal progress snapshot to **the current browser's local storage** under `m3-flex-recovery-progress-v1`. It holds only the current before/workout/after phase, approved scene index, set number, elapsed demonstration/rest seconds, current pending rest target, user-selected duration/rest preferences and a list of *timed demonstration stages*. It stores **no medical-clearance confirmations, user rep counts, camera content, audio recordings, API secrets or account identifiers**.

- On phone/tab lock, the active workout timer and media are **paused automatically**. No timed set or rest keeps running invisibly.
- On browser refresh, tab discard, or reopening the app in the **same browser profile**, the snapshot is validated (allowed scene, index, preset choices, bounded remaining time, 24-hour expiration) and loaded in **Paused** mode. This does not mean all browsers will retain local storage indefinitely.
- The user must recheck all three medical/restriction/effort boxes and explicitly tap **Resume** before any motion/audio restarts. Playback cannot start automatically after refresh.
- Rest recovery preserves the remaining time and reselects the existing approved **Marcus rest MP3**, rather than playing the previous exercise's audio by mistake.
- Only the current set/rest time is stored: it is **not** a verified physical-rep count, synchronized cross-device record, or medical clearance.
- Completed sessions and explicit Reset delete the snapshot. Corrupt, out-of-range or expired data is rejected, rather than inventing a workout position.
- Automated Chrome QA simulates page reload during the 15-second second-set rest and checks Paused status, unchanged time, restored set index, zero selected clearance boxes, blocked Resume, re-confirmation, and approved Marcus-rest track restoration.

The original approved media IDs are unchanged. This is an interruption/recovery feature, **not full PWA offline support, physical Galaxy Fold QA, or verification of speech-to-lip synchronization**.

## Approved Marcus audio load and buffering safeguards

The seated player now treats an **active** approved Marcus track as a necessary part of a timed audio-guided step. The original missing-audio behavior was incomplete: audio-only hand/mobility/cooldown guidance could fail while the timer kept running and later marked that guided step completed.

- A genuine `audio.error` while timed guidance is active now stops both media players, freezes the exact remaining time and changes to a clear **Retry approved media** state. It does not increment the demonstrated-step count. Recovery is only by explicit user tap and uses the **same original** owner-approved Marcus source, not a replacement voice.
- `audio.waiting` / `audio.stalled` also start a limited three-second watchdog. If the audio remains without playable data, the current step freezes. A matching `playing` event cancels the watchdog. The video stream independently retains its existing stall check.
- Pause, stop, scene changes and browser reload clear pending media-stall checks so an earlier clip cannot time out a later clip.
- If a failure arrives before browser autoplay promises complete and no timer is running, the full remaining duration is preserved rather than accidentally setting it to zero from a stale deadline.
- Rest-track autoplay errors are reported separately. The rest countdown may continue quietly rather than treating the rest itself as an exercise requiring Marcus narration.
- Chrome tests generate simulated audio error and stalled/waiting events during a **text-and-Marcus-only** preparation step. The app must freeze the timer and preserve uncompleted progress, then resume only on explicit Retry. The tests mock playback and do not establish real physical speaker audibility, voice/video lip sync or availability of external media hosts.

These changes are isolated to the approved-media seated Recovery Coach and remain on the draft branch.

## Required release implementation

1. Create a dedicated **seated-only plan** with explicit chair/back support, protected foot positioning, equipment and adjustable ranges, pre/post-workout and set/rest timing. Confirm biomechanics and limitations with the user's treating clinician when necessary.
2. Map each selected exercise to the exact user-approved demonstrations (C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-PRE-BREATH-R2, C10-POST-BREATH-R1). Other motions remain review-only until approved.
3. Replace standing-specific narration and movement cues. "Controlled arm reaches" is the required shoulder mobility label. No burpees, jumping, standing, or machine shoulder press in the seated-only plan.
4. Verify the seated plan in a **real Galaxy Fold** with hands-free controls, physical audio, scene/timer synchronization, form checking only when camera consent and confidence are adequate, and no fabricated rep counts.
5. Retain legacy plans only as clearly labeled historical programs rather than accidentally exposing them as an approved current seated session.

**Do not promote this draft as fully seated-only or rehabilitation-ready until these checks pass.**

## October 24 integrated player improvements (protected branch only)

**Seated pair-and-rest options.** The existing straight-set demonstration mode remains available. A new optional paired-superset mode uses only approved C01 shrugs → C02 hammer curls and approved C03 front raises → C04 alternating curls. The next pair begins only after the full prescribed rest; C08 INNSTAR chest press remains a separate exercise. Pair members execute back-to-back with **no rest after the first partner**. The selected number of timed sets is locked once started. The player stores bounded per-movement timed-demonstration counts so a manually skipped movement or incomplete partner cannot receive a false completion check. These are **not verified athlete repetitions**, and clinician clearance still applies.

**Protected asynchronous media.** Every video/Marcus play attempt now has a generation token. Pausing, skipping, resetting, switching scenes or closing the preview invalidates unresolved playback promises. A late resolve or rejection cannot restart an old scene, advance a newer one or reset the full duration to zero before the timer has started. Browser regression tests hold playback promises open while the user pauses/navigates.

**On-device upper-body observation.** An optional collapsible camera pane on the *same screen* embeds `/recovery-coach/form-check/`. It remains `about:blank` until opened; closing the pane unloads the form page. Once the athlete explicitly confirms local-use consent and taps Enable, a MediaPipe Pose Landmarker Lite model estimates visible shoulder, elbow and wrist positions. It provides only deliberately limited cues (camera framing, possible elbow drift, front raises potentially above shoulder line). It does **not** infer the proper injury-specific load, verify cast support/band placement, certify form, validate shoulder ROM, count repetitions or diagnose injury. A model-initialization error stops the camera rather than silently substituting fake "correct" feedback. Input audio is never requested.

**Independent local model runtime.** The npm-installed `@mediapipe/tasks-vision` JavaScript/WASM and Google's public lite pose model are copied/downloaded into the static app bundle **at build time**, with per-file SHA-256 receipts. At workout time, the camera code and pose model are served from the same HTTPS host rather than a third-party CDN. User camera images stay in browser memory (MediaPipe's documented on-device inference behavior); Google states that MediaPipe may separately collect runtime usage and performance metrics. This disclosure appears before permission. Build-time downloads are independent of the user session. Both independent Node/Docker staging and the no-Node static review package include the same model assets.

**Workout A/B review correction.** The existing original approved C09-R2 breathing and C10-R1 cooldown **moving Flex + Marcus assets** now replace older obsolete audio-only pre/post entries in both program previews, without changing any approved files. The warm-up cue is explicitly **"Controlled arm reaches"**, still text with general shoulder-mobility audio until a suitable exact moving demonstration has been approved. Unverified wrist curls, lateral raises, boxing, chest fly, AMYCO exercise and stretching animations remain **blocked**, not silently activated. Workout A/B cannot truthfully be labeled complete until those specific media/form gates pass.

**Release restrictions unchanged.** No full program production deployment or rewrite of the approved cast/avatar identity is authorized by this source change. Automated Chrome simulation is not a physical Galaxy Fold, earbud/Bluetooth, true lip synchronization or live injury-specific form-certification check. Re-evaluate medical restrictions with the clinician; stop for pain, swelling or pressure.

## Bench-supported core strength circuits (October 27, 2026)

M3 FLEX now links **Core A · Bench foundation** and **Core B · Anti-rotation** from the main home, the approved seated Recovery Coach, and the Workout A/B review page. The module is an independently loadable `/recovery-coach/bench-core/` website included in both the full Node/Docker application and the portable no-Node HTTPS review ZIP.

**Core A**: seated 360° abdominal bracing, seated palms-together midline isometric press, limited-range unloaded seated torso turns, and short bench-supported forward reaches. **Core B**: seated abdominal bracing, left and right very-light-band Pallof holds with a stable **chest-height rack anchor**, and left and right clinician-cleared light dumbbell offset holds. In every movement the athlete remains supported on a locked bench; the injured cast and foot are NEVER used as a brace, band anchor, weight, or leverage point. No standing, planks, floor sit-ups, bench crunches, leg raises, forced twisting, or heavy-loaded leg activity is included.

The player has **actual 15/20/30-second activity timers, one to three selected circuit rounds, 15/30/45-second rests, pause/resume, and manual skip without fake completion**. It counts *timed demo activity*, not actual user repetitions or proof of technique. A local record captures only plan, completed timed stages, skipped stages, and date. A partial session can be recovered from browser storage but defaults to **paused** and requires **all three clinical clearance checkboxes again**, which are intentionally never persisted. The emergency stop cancels the timer and resets clearance and session state. The page never opens a camera/microphone or invokes a paid AI provider.

**Media approval**: New bench/core exercises have **not** received owner-approved matching Flex demonstration videos or Marcus audio. They remain explicitly text-and-timer guidance with no audio substitute. Do not represent them as approved-by-the-owner clips, clinically validated technique, actual live Q&A or verified form. Any later exercise video must preserve the existing approved person and cast, show the exact safe movement and be separately owner-approved; no new AI generation or credits were ordered.

**Medical clearance remains the gate.** Ability to bear weight on an injured foot does not automatically permit a particular abdominal hold, Pallof press, dumbbell hold or trunk twist while in a cast. The treating clinician must authorize each selected movement, cast setup, load, duration and exertion. Any injury-related discomfort, pressure, dizziness, swelling or worsening symptoms means stop and seek appropriate guidance.

The mobile browser integration suite explicitly verifies Core A timer/rest/pause/restore/clearance, skipped movement not receiving credit, Core B including each sided exercise, and emergency stop. Full bench-specific camera biomechanics and a physical Galaxy Fold test remain unverified release gates.
