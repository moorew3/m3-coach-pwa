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
    exercise: "shoulderPress",
    title: "Seated dumbbell shoulder press — two reps",
    provider: "heygen-backup",
    videoId: "412ffc12265549a39100dcf6ce8219eb",
    status: "pending-owner-visual-approval",
    allowInCoach: false,
    allowInHologram: false,
    checks: [
      "Exact approved Marcus face, braids, beard, tattoos and clothing",
      "Seated true vertical overhead press, not horizontal chest press",
      "Two complete controlled reps, stable weights and elbows",
      "Injured LEFT booted leg securely elevated, supported and unloaded",
      "No identity drift, audio, captions, camera cuts or extra people",
    ],
  },
] as const;

/** Already identity-audited mapping: never exchange their movements. */
export const EXISTING_PRESS_ASSETS = [
  { exercise: "benchPress", source: "canonical-coach-identity" },
  { exercise: "inclineDumbbellPress", source: "canonical-coach-identity" },
  { exercise: "seatedInnstarChestPress", source: "approved-C08-PRESS-R3" },
] as const;
