/**
 * OWNER REVIEW QUEUE — never import this registry into runtime workout media.
 *
 * M3 FLEX's approved Marcus identity, movement, boot, and workout-specific
 * release gates remain authoritative. Candidate creation is not approval.
 * This registry is intentionally a record of owned generation IDs only;
 * signed HeyGen links expire, and no candidate URL belongs in live playback.
 *
 * Created from already included HeyGen Creator-plan credits, not a new plan.
 */
export const PENDING_MARCUS_PRESS_REVIEWS = [
  {
    exercise: "declineBenchPress",
    title: "Decline dumbbell bench press — two reps",
    provider: "heygen-backup",
    videoId: "bb5e40c8f31f4c2c9a2bac097fd58bf9",
    status: "pending-owner-visual-approval",
    allowInCoach: false,
    allowInHologram: false,
    checks: [
      "Exact approved Marcus face, braids, beard, tattoos and clothing",
      "Decline bench angle rather than flat, incline or overhead press",
      "Two complete controlled reps, real dumbbells and proper range",
      "Injured LEFT booted leg securely elevated, supported and unloaded",
      "No video freezing, avatar morphing, substitutions or extra people",
    ],
  },
  {
    exercise: "inclineBenchPress",
    title: "Incline dumbbell bench press — two reps",
    provider: "heygen-backup",
    videoId: "ef5471613ed74e2baee69385156ca902",
    status: "pending-owner-visual-approval",
    allowInCoach: false,
    allowInHologram: false,
    checks: [
      "Exact approved Marcus face, braids, beard, tattoos and clothing",
      "Incline bench angled upward 30–40 degrees with head higher than hips",
      "Two full controlled upward presses over the upper chest with both dumbbells",
      "Injured LEFT booted leg securely elevated, supported and unloaded",
      "No identity drift, audio, captions, camera cuts or extra people",
    ],
  },
] as const;

/**
 * A mistakenly ordered shoulder-press generation is quarantined separately.
 * It is NOT part of the two requested incline/decline bench press clips.
 * Historical HeyGen job: 412ffc12265549a39100dcf6ce8219eb.
 * Never select it as either bench-press demonstration.
 */

/** Already identity-audited mapping: never exchange their movements. */
export const EXISTING_PRESS_ASSETS = [
  { exercise: "benchPress", source: "canonical-coach-identity" },
  { exercise: "inclineDumbbellPress", source: "canonical-coach-identity" },
  { exercise: "seatedInnstarChestPress", source: "approved-C08-PRESS-R3" },
] as const;
