/**
 * M3 FLEX — 2026-11-11 controlled, owner-authorized video candidates.
 *
 * Production order: EXACTLY one 8s incline and one 8s decline demonstration,
 * up to 50 existing HeyGen Creator credits in aggregate. No new subscription.
 * Pre-submission balance 520; balance after both submissions 480
 * (20 credits per submitted job, 40 total).
 *
 * This file is DATA FOR OWNER AUDIT ONLY. Never import it into the playback
 * resolver, coach stage, hologram, set timer, scene catalog or voice timeline.
 * Both clips must be individually assessed from actual video frames.
 */
export const NOV11_MARCUS_PRESS_CANDIDATES = [
  {
    exerciseId: "inclineBenchPress",
    title: "Incline Dumbbell Bench Press",
    model: "heygen-video-1",
    providerVideoId: "f907e463dc8a4ffa83640dc60d11a17b",
    approvedIdentityAssetId: "15bac63f66db47d88da5de4639302640",
    motionReferenceAssetId: "07ab12fe06a341d89733b210e36d47f8",
    targetAngleDegrees: 30,
    headRelativeToHips: "higher",
    dumbbellStart: "beside upper chest",
    completedRepsRequired: 2,
    generatedNarrationAllowed: false,
    ownerVisualApproval: false,
    preciseBenchAngleChecked: false,
    marcusFaceTattooHairChecked: false,
    motionChecked: false,
    leftLegBootUnloadedChecked: false,
    audioConfirmedSilent: false,
    allowAutomaticRetry: false,
    allowInCoach: false,
    allowInHologram: false,
    status: "submitted-review-only",
  },
  {
    exerciseId: "declineBenchPress",
    title: "Decline Dumbbell Bench Press",
    model: "heygen-video-1",
    providerVideoId: "b407e4220ea9456993060a69e19923c0",
    approvedIdentityAssetId: "15bac63f66db47d88da5de4639302640",
    motionReferenceAssetId: "6491f24643f34e94a77d6161475fe0d3",
    targetAngleDegrees: -15,
    headRelativeToHips: "lower",
    dumbbellStart: "beside mid-to-lower chest",
    completedRepsRequired: 2,
    generatedNarrationAllowed: false,
    ownerVisualApproval: false,
    preciseBenchAngleChecked: false,
    marcusFaceTattooHairChecked: false,
    motionChecked: false,
    leftLegBootUnloadedChecked: false,
    audioConfirmedSilent: false,
    allowAutomaticRetry: false,
    allowInCoach: false,
    allowInHologram: false,
    status: "submitted-review-only",
  },
] as const;

// Each candidate uses the owner-approved Marcus portrait for identity and the
// separate 30° / -15° technical motion guide for biomechanics. Those motion
// guides are NOT approved actors and are never shown as final Marcus footage.
// Any additional generation requires separate authorization and cost check.
// Decline follow-along also needs a medically acceptable leg-free stabilization
// plan before being recommended with an immobilized left boot.
