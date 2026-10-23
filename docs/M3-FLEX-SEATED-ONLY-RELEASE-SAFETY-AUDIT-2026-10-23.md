# M3 FLEX — Seated-only release safety audit (October 23, 2026)

**Status: BLOCKED for a full seated-only workout release.** This audit is based on the existing source program, not on an assessment of the athlete's medical clearance. The owner requires seated-only exercise, a protected foot/cast, no jumping or burpees, and no machine shoulder press.

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

## Required release implementation

1. Create a dedicated **seated-only plan** with explicit chair/back support, protected foot positioning, equipment and adjustable ranges, pre/post-workout and set/rest timing. Confirm biomechanics and limitations with the user's treating clinician when necessary.
2. Map each selected exercise to the exact user-approved demonstrations (C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-PRE-BREATH-R2, C10-POST-BREATH-R1). Other motions remain review-only until approved.
3. Replace standing-specific narration and movement cues. "Controlled arm reaches" is the required shoulder mobility label. No burpees, jumping, standing, or machine shoulder press in the seated-only plan.
4. Verify the seated plan in a **real Galaxy Fold** with hands-free controls, physical audio, scene/timer synchronization, form checking only when camera consent and confidence are adequate, and no fabricated rep counts.
5. Retain legacy plans only as clearly labeled historical programs rather than accidentally exposing them as an approved current seated session.

**Do not promote this draft as fully seated-only or rehabilitation-ready until these checks pass.**
