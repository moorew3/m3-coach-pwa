# M3 FLEX — Master audit, acceptance tests and Workout A/B build sheets
Date: 2026-10-17 • Existing live app: https://m3-coach-pwa-production.up.railway.app/recovery-coach/
Scope: Recovery Coach extension in `public/recovery-coach/`, NOT an overhaul of the original M3 Coach V2 app.

## Nonnegotiable production locks
- Approved Flex identity source: HeyGen asset fbc0d826660d479080f2c2ac5fbf5939 (approved original photographic reference). Protect approved face, cornrows, beard, tattoos, body, clothing in each locked video, with original white LEFT cast.
- Only coaching voice: Marcus – Warm & Friendly, voice ID 0fadce1e82af494a93873aa38ea8d106, English. No speech from model-generated video.
- Approved C01-R3, C02, C03, C04-R2 and C08-PRESS-R3 clips, IDs, immutable media URLs and audio sources are defined in the published app. Never overwrite them.
- White cast on anatomical LEFT foot, elevated and supported. Anatomical RIGHT sneaker on floor where shown. No loading the LEFT cast. Clinician must clear intensity and equipment.
- Any new or fixed render gets its OWN file ID/URL, never overwrite approved media. Review before activation. No major paid credits or new subscription without owner approval.

## Audited source status — not a claim of full end-to-end verification
|Exercise/phase|User approved|Current app and media|Production QA|Required next action|
|---|---|---|---|---|
|C01-R3 dumbbell shrugs, white cast|YES locked|Live stage 2, media HTTP 206|NEEDS CORRECTION (lip sync/rep count/mobile endurance unverified)|No change to approved clip; verify complete 30s playback and coaching|
|C02 seated hammer curls|YES locked|Live stage 2, video accessible; separate Marcus WAV|NEEDS CORRECTION (lip sync/timed reps unverified)|Leave original muted; test voice sync and rep counts|
|C03 seated front raises|YES locked|Live stage 2, video accessible; separate Marcus WAV|NEEDS CORRECTION (lip sync/timed reps unverified)|Leave original muted; test full set|
|C04-R2 alternating curls, right shoe on floor|YES locked|Live stage 2, embedded approved Marcus|NEEDS CORRECTION (rep counts not synchronized)|Test one entire timer cycle, no identity edits|
|C08-PRESS-R3 seated INNSTAR press|YES locked|Live stage 2, original forward chest press and cast|NEEDS CORRECTION (band routing detailed frame QA/rep counts still not independently certified)|Do not regenerate; use owner-approved asset unchanged|
|Pre 1 calm breathing|VOICE made, visual not approved|Marcus MP3 with text guidance|MISSING (moving approved Flex video)|Make new seated Flex breathing/intro clip|
|Pre 2 gentle hand openings|VOICE made, visual not approved|Marcus MP3 with text guidance|MISSING (moving approved Flex video)|Make seated Flex hands movement|
|Pre 3 shoulder mobility|VOICE made, visual not approved|Marcus MP3 with text guidance|MISSING (moving approved Flex video)|Make seated Flex shoulder circles; require clinician clearance|
|Rest and transitions|NOT complete|Timer works; no separate avatar-and-voice transition scene|MISSING|Make approved Marcus rest/transition and moving Flex scene; implement careful timing|
|Post 1 breathing|VOICE made, visual not approved|Marcus MP3 with text guidance|MISSING (moving approved Flex video)|Animated cooldown breathing|
|Post 2 shoulder/hand release|VOICE made, visual not approved|Marcus MP3 with text guidance|MISSING (moving approved Flex video)|Animated gentle cooldown + cast supported|
|Final completion|UI text only|Completion text is not an approved moving talking avatar|MISSING|New Flex outro + Marcus voice|
|Workout A|NOT activated|Archived wrist-curl Drive clip was recovered on 2026-10-19: file M3_Flex_Recovery_01_Seated_Curl_Test.mp4 is a seated arm curl, NOT a wrist curl. Lateral raise and boxing remain Flow project links without verified direct exports|NEEDS CORRECTION|Locate correct wrist curl clip; export lateral-raise and boxing from Flow; verify face, cast, action and Marcus voice before activation|
|Workout B|NOT activated|INNSTAR press available; AMYCO device demonstrated incorrectly/unfinished; chest fly not approved in main program|MISSING|Verify AMYCO device technique, create approved equipment sequences and Marcus coaching|

**Meaning of status:** VERIFIED AND WORKING requires test of every applicable criterion on an actual running build. No full exercise is given that status solely because a video URL loads or the owner liked the appearance. Approved media = locked; independent QA = separate.

## Workout A — Dumbbells and seated arm conditioning (build sheet; NOT active)
Exact order, all seated with left cast supported and no leg push. Set/reps/duration are proposed production defaults, NOT medical clearance. The existing 5 approved workout program remains separate and unchanged.
1. PRE: seated breathing (30s), open/close hands (30s), small unloaded shoulder circles (30s). Each is Marcus audio-only today; Flex moving video MISSING.
2. WARMUP: seated wrist circles 20s (new Flex video), unloaded elbow flex/extension 20s (new Flex video), light shoulder movement 20s (new Flex video). No weights until cleared.
3. MAIN A1: seated wrist curl, 2 sets × 8 controlled reps (the Drive video has been retrieved and visually inspected and actually demonstrates a seated arm curl, NOT a wrist curl; correct wrist-curl export remains missing; DO NOT activate).
4. MAIN A2: seated lateral raise, 2 × 8 controlled reps (historically owner-approved visual, Flow edit link not exported/verified; DO NOT activate).
5. MAIN A3: seated hammer curls C02, 2 × 8 controlled reps (locked video available).
6. MAIN A4: seated dumbbell shrugs C01-R3, 2 × 8 controlled reps (locked video available).
7. ARM CARDIO: seated boxing, 3 × 30 seconds (historically owner-approved visual, Flow project export not accessible as an MP4; DO NOT activate).
8. POST: arms/shoulders gentle stretches, 20-second holds without pain (new moving Flex visuals required, voice needed for additional steps).
9. COOLDOWN: breathing, relax shoulders/hands (existing Marcus MP3s, avatar videos missing), final moving-avatar message MISSING.
Transitions: 30–60s rest between loaded exercises as cleared by the clinician; no audio overlaps. Do NOT imply 8-rep counting when the video loops are not synced.

## Workout B — Seated band pressing and accessory work (build sheet; NOT active)
1. PRE: breathing, hand openings, gentle shoulder mobility (same unapproved-on-video gaps).
2. WARMUP: unloaded forward presses (20s), elbow extension (20s), small shoulder mobility (20s), all new verified Flex animation.
3. MAIN B1: seated INNSTAR CHEST PRESS C08-PRESS-R3, 2 × 8 controlled repetitions proposed; actual belt pad hidden BEHIND back between back and chair; brown camo bands exit BELOW armpits, handles at chest, elbows flex/extend forward; never behind neck or crossed across chest.
4. MAIN B2: seated chest fly, 2 × 8 controlled reps PROPOSED — C07-FLY-R1 is a band-only review clip, not an approved B-program animation. Requires correct original Flex face, cast, continuous resistance path, no dumbbells, and approval.
5. MAIN B3: seated front raises C03, 2 × 8 controlled reps; reused approved media only.
6. MAIN B4: seated alternating dumbbell curls C04-R2, 2 × 8 controlled reps; reused approved media only.
7. MAIN B5: AMYCO wrist equipment demonstration — HOLD: verify actual apparatus and technique from user image/manual before prescribing sets; no substitute.
8. POST: upper-body chest/shoulder gentle stretch, separate clip and Marcus narration, no cast movement.
9. COOLDOWN: existing Marcus-guided breathing and shoulder relaxation; approved moving Flex video still MISSING.
Current duration defaults are only design parameters. Do not auto-play any proposed exercise until video, voice, avatar, form and medical gates pass.

## Rendering / voice shot contract
Every animation: source approved face still, same cornrows/tattoos; left cast and right foot visible when in wide frame. Correct equipment photographed and geometry: no neck harness, crossed cables, unexpected dumbbells, missing legs. Show at least TWO complete reps (more if specified), stable background, no morphing or voice baked in. Generate silent scene; preserve original music/AI speech off. Merge approved Marcus track only after movement/frame QA. When speech on camera, verify mouth movement and timing; otherwise mark lip sync unverified. Review video against exact exercise reference before candidate promotion.

## QC check template (per exercise)
[ ] Video is actual linked asset, downloads or streams 200/206 (HTTP)
[ ] Approved Flex face, hair, beard and tattoos remain consistent frame-by-frame
[ ] LEFT white cast shape and anatomical leg placement remain correct
[ ] Both hands, legs, equipment and connection points are anatomically correct
[ ] Correct starting and finishing form; >=2 complete reps or accurate time-held stretch
[ ] Correct resistance equipment (no object swap or strap around the neck)
[ ] Only approved Marcus English voice plays; no generated AI speech or overlapping audio
[ ] Instruction explains form as avatar demonstrates; rep count audible only when synchronized
[ ] Mouth visually synced if camera shows speaking face
[ ] Transitions, rests, pause/resume, skip/next and completion handle audio and video cleanly
[ ] Real Android device test; video loads even after backgrounding/restoring app
[ ] Playback stall/failed media does not automatically mark the exercise complete
[ ] User accepts the specific candidate version before production activation
[ ] Treating clinician clears movements, left cast support, loading and transfers

## Deployment and approvals
Original app: https://m3-coach-pwa-production.up.railway.app/
Recovery Coach: https://m3-coach-pwa-production.up.railway.app/recovery-coach/
GitHub source: moorew3/m3-coach-pwa/public/recovery-coach/index.html
Archived pre-cleanup snapshot: Google Doc 1Xe9pBlXGdC4jgKoAjMSQiPsBcd71-1MJPMAT0YJ0E0o
Clean app source backup: Google Doc 1EQfZ4cXPbzaGrWJTn4L6hxf5-JLJ7NAYxD7UwlFta3I
Next approval gates: select and verify working media exports from Google Flow and Drive; fund only one proposed warm-up visual candidate for face/cast approval; build remaining missing transitions and stretching only after first candidate meets quality.

## October 19, 2026 — Workout A/B source recovery and software development
- New independent development player in `public/recovery-coach/programs/index.html`, linked from the live Recovery Coach. Workout A/B are not active training; previews use ONLY the five previously approved clips plus the existing five Marcus before/after audio tracks.
- Recovered from connected Google Drive: `M3_Flex_Recovery_01_Seated_Curl_Test.mp4` (Drive file ID `1wLS6ufEZ2fe5ZiD_bloiYITPE65DoEy0`), 8.0 seconds, 720×1280. Frame inspection shows **SEATED DUMBBELL ARM CURLS**, not wrist curls. Prior notes identifying this file as an approved wrist curl source were inaccurate. This clip has NOT been integrated into Workout A or marked approved as wrist curls. Preserve it under its actual title for separate owner review.
- No new verified lateral-raise or seated-boxing export located by Drive name search or HeyGen title search. Google Flow URLs identify editing projects, NOT approved playable video exports; source retrieval/approval still required.
- Reused media in the new development player: Workout A C02 and C01-R3; Workout B C08-PRESS-R3, C03, C04-R2. All are isolated references to original immutable URLs, not copied or altered.
- Moving Flex warm-up/cooldown videos, fresh arm/shoulder stretch clips, separate approved band fly and actual AMYCO device demonstration remain MISSING. Marcus before/after audio exists, but does NOT satisfy visual avatar completion.
- Higgsfield primary workspace currently lists 10 credits on a free plan; this turn spent no generation credits. Do not start paid video batches based on a filename alone. Check requirements and obtain approval for substantive credit spending.
- Production QA gate: verify the new development route in a mobile-size browser, including navigation, video mute for separate voice, embedded Marcus for approved files, disabled play for missing clips, and original Recovery Coach unchanged.

## October 19, 2026 — next development review, new evidence
- Recovery Coach and its five locked user-approved videos are live under the existing Railway service. An isolated A/B development preview now exists at `/recovery-coach/programs/` with only completed media enabled and all missing exercises blocked.
- Google Drive file `M3_Flex_Recovery_01_Seated_Curl_Test.mp4`, ID `1wLS6ufEZ2fe5ZiD_bloiYITPE65DoEy0`, was retrieved and inspected. It shows a **seated dumbbell arm curl**, not a wrist curl. Do not relabel or activate as a wrist curl.
- HeyGen connected video accounts have no title matches for `wrist`, `boxing`, or `lateral` in the tested libraries. This does not prove assets do not exist under other names.
- HTTP Range checks succeeded with 206 status for locked C01-R3, C02, C03, C04-R2 and C08-PRESS-R3 videos, C02/C03 separate Marcus narration, and initial warm-up/cooldown Marcus files. Status 206 is media reachability, NOT synchronization or biomechanics approval.
- Media duration checks: **C02 video 8.083s vs Marcus 8.542s** (audio outlasts motion by ~0.46s); **C03 video 8.083s vs Marcus 9.430s** (audio outlasts motion by ~1.35s). No original user-approved files were edited. Resolve sync only in a separately approved corrected version or player-level playback correction after thorough review.
- The Workout A/B preview includes Previous/Next navigation, direct approved-media Android fallback links, and explicit media-duration synchronization warnings for C02/C03. Preview completion does not mark training completed.
- Higgsfield primary connected workspace returned 10 available credits and zero Genjutsu free generation attempts in the October 19 check. Do not spend these generating a batch without approval.
