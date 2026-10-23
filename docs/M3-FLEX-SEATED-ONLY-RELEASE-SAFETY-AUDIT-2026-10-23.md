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

## Required release implementation

1. Create a dedicated **seated-only plan** with explicit chair/back support, protected foot positioning, equipment and adjustable ranges, pre/post-workout and set/rest timing. Confirm biomechanics and limitations with the user's treating clinician when necessary.
2. Map each selected exercise to the exact user-approved demonstrations (C01-R3, C02, C03, C04-R2, C08-PRESS-R3, C09-PRE-BREATH-R2, C10-POST-BREATH-R1). Other motions remain review-only until approved.
3. Replace standing-specific narration and movement cues. "Controlled arm reaches" is the required shoulder mobility label. No burpees, jumping, standing, or machine shoulder press in the seated-only plan.
4. Verify the seated plan in a **real Galaxy Fold** with hands-free controls, physical audio, scene/timer synchronization, form checking only when camera consent and confidence are adequate, and no fabricated rep counts.
5. Retain legacy plans only as clearly labeled historical programs rather than accidentally exposing them as an approved current seated session.

**Do not promote this draft as fully seated-only or rehabilitation-ready until these checks pass.**
