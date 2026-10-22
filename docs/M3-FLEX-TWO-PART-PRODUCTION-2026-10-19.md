# M3 FLEX — two-part video production handoff (2026-10-19)

**Purpose:** Complete Part 1 Workout A and Part 2 Workout B as independent, continuously playable master MP4s, later controlled by the existing M3 FLEX app.

**Non-negotiable:** Never overwrite, modify, replace, crop, change speed, or regenerate approved **original files**. New scene media must have distinct IDs and owner approval. Any composite video is a separately reviewed new file, not a change to an approved source.

## Verified locked source clips (7)
- C09-PRE-BREATH-R2 — approved pre-workout breathing (both)
- C10-POST-BREATH-R1 — approved cooldown breathing (both)
- C02 — approved seated hammer curls (A; separate Marcus voice)
- C01-R3 — approved seated dumbbell shrugs (A)
- C08-PRESS-R3 — approved seated INNSTAR chest press (B)
- C03 — approved seated front raises (B; separate Marcus voice)
- C04-R2 — approved alternating dumbbell curls (B)

Original media URLs and acceptance information are preserved in `docs/M3-FLEX-MASTER-QA-2026-10-17.md` and `public/recovery-coach/`. Reuse them by reference; do not reupload/replace approved original sources. Approved Flex identity asset: `fbc0d826660d479080f2c2ac5fbf5939`. Marcus – Warm & Friendly English voice ID: `0fadce1e82af494a93873aa38ea8d106`.

## Workout A assembly order
1. New intro; 2. C09 approved; 3. New hand openings; 4. New shoulder mobility; 5. New wrist circles; 6. New elbow bends; 7. New wrist curls (**recovered Drive test was arm curl, not wrist curl**); 8. New lateral raises (Flow edit link isn't a verified MP4 export); 9. C02 approved; 10. C01-R3 approved; 11. New seated boxing (Flow export needed); 12. New upper-body stretch; 13. C10 approved; 14. New shoulder/hand release; 15. New outro.

## Workout B assembly order
1. New intro; 2. C09 approved; 3. New hand openings; 4. New shoulder mobility; 5. New unloaded forward-press warmup; 6. New elbow extension; 7. C08-PRESS-R3 approved; 8. New INNSTAR chest fly (C07 review not approved); 9. C03 approved; 10. C04-R2 approved; 11. AMYCO wrist device scene (**correct device technique not verified**); 12. New chest/shoulder stretch; 13. C10 approved; 14. New shoulder/hand release; 15. New outro.

## Production gates
- New C11 hand-opening scene is in generation/review as of latest QA; do not mark approved unless new evidence confirms.
- Missing scene animations require actual Flex action + approved Marcus voice and owner acceptance.
- C02 and C03 have known voice-video duration differences; handle within newly approved composite assembly, **never silently trim original material**.
- Research motion references for correct form; reference videos are not commercial footage.
- A/B workouts are not active customer programs until the entire video, timing and audio path passes QA and applicable clinician clearance.
- Produce **two distinct continuous MP4s**, plus chapter timestamps for seek/repeat inside the existing app.
- Verify originals' hashes remain unchanged; do not modify the live app until accepted.
- No additional subscriptions or substantive paid render batches without the owner's approval.

## Present implementation status
The approved footage exists at documented CDN URLs, but direct download into this ChatGPT editing container was unavailable on this turn. Therefore **no final two-part MP4s have been rendered**, and no changes to the live app or original video files were made. A local production kit with JSON manifest, CSV shot list, and guarded FFmpeg assembler was delivered separately. The assembler refuses incomplete release by design.

## Rest and chapter timing addendum
Both Part A and Part B must include a **reusable new Flex/Marcus rest-and-transition scene** between loaded exercises (production scene ID `NEW_REST-CUE`). This is not an approved asset yet. In Part A schedule it after lateral raises, C02 and C01-R3; in Part B after C08-PRESS-R3, new INNSTAR fly, C03, and C04-R2, with final rest placement determined by verified set timing and clinician clearance. Retain chapters and timestamp boundaries for pause/repeat/skip. Updated production kit now contains **18 A positions and 19 B positions**, including repeated rest cues. These are shot positions, not final approved repetitions or prescriptions.
