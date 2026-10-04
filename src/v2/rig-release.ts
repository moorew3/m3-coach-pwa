/**
 * Release gate for the exact identity-approved M3 Coach 3D character.
 * The existing accepted real-person videos remain the only public fallback.
 * Do not change this to true simply because a file exists at the URL:
 * each movement requires its own visual/biomechanical sign-off.
 */
export const APPROVED_3D_COACH = {
  modelUrl: "/v2/coach.glb",
  identityApproved: false,
  rigAndMobileApproved: false,
  reviewedMotionKeys: [] as readonly string[],
  reviewedAt: null as string | null,
} as const;

export function hasApprovedRealTimeCoach(motionKey?: string): boolean {
  if (!motionKey) return false;
  return (
    APPROVED_3D_COACH.identityApproved &&
    APPROVED_3D_COACH.rigAndMobileApproved &&
    APPROVED_3D_COACH.reviewedMotionKeys.includes(motionKey)
  );
}
