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
    videoId: "dc8a74a3feda442ab467616c05c80188",
    status: "pending-owner-visual-approval",
    allowInCoach: false,
    allowInHologram: false,
    checks: [
      "Exact approved Marcus face, braids, beard, tattoos and clothing",
      "Head lower than hips, downward-sloping decline bench visible in every frame",
      "Two complete controlled reps, real dumbbells and proper range",
      "Injured LEFT booted leg securely elevated, supported and unloaded",
      "No video freezing, avatar morphing, substitutions or extra people",
    ],
  },
  {
    exercise: "inclineBenchPress",
    title: "Incline dumbbell bench press — two reps",
    provider: "heygen-backup",
    videoId: "434a4dc35d9245d18c62e4e639b3df00",
    status: "pending-owner-visual-approval",
    allowInCoach: false,
    allowInHologram: false,
    checks: [
      "Exact approved Marcus face, braids, beard, tattoos and clothing",
      "Head higher than hips, upward-sloping incline bench visible in every frame",
      "Two full controlled upward presses over the upper chest with both dumbbells",
      "Injured LEFT booted leg securely elevated, supported and unloaded",
      "No identity drift, audio, captions, camera cuts or extra people",
    ],
  },
] as const;

/**
 * Rejected/failed historical generations MUST NEVER be selected by runtime.
 * Owner rejected the former "decline" clip: its bench was flat and coaching
 * did not match the exercise. The old incline generation failed with 500.
 */
export const REJECTED_MARCUS_PRESS_GENERATIONS = [
  {
    exercise: "declineBenchPress",
    videoId: "bb5e40c8f31f4c2c9a2bac097fd58bf9",
    disposition: "rejected-wrong-flat-bench-movement-and-script",
    allowInCoach: false,
    allowInHologram: false,
  },
  {
    exercise: "inclineBenchPress",
    videoId: "ef5471613ed74e2baee69385156ca902",
    disposition: "failed-render-500",
    allowInCoach: false,
    allowInHologram: false,
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
