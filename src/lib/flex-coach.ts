/** Flex is the name and identity of the owner's approved virtual coach.
 * Multi-domain evidence-informed guidance, not a claim of clinical licensure.
 * Never infer medical clearance from app usage or tell the user to load an injured leg.
 */
export const FLEX_COACH_NAME = "Flex" as const;
export const FLEX_EXCLUDED_MOVEMENTS = ["squat", "leg press"] as const;
export type FlexFocus = "strength" | "anatomy" | "recovery" | "nutrition" | "mentor";
export const FLEX_FOCUS_OPTIONS: {value: FlexFocus; label: string}[] = [
  {value:"strength",label:"Personal trainer · strength and form"},
  {value:"anatomy",label:"Anatomy · muscles and joints"},
  {value:"recovery",label:"Recovery · safe modifications"},
  {value:"nutrition",label:"Nutrition · fueling training"},
  {value:"mentor",label:"Coach and mentor · accountability"},
];
export function isFlexExcludedExercise(exercise: string): boolean {
  const normalized=exercise.toLowerCase().replace(/[-_]+/g," ").trim();
  return /\bsquats?\b|\bleg press(?:es)?\b/.test(normalized);
}
function exerciseBodyCue(exercise: string): string {
  const name=exercise.toLowerCase();
  if(/hammer|curl|bicep|wrist|amyco/.test(name))
    return "Elbow flexors and forearm muscles produce the movement. Stabilize the upper arm and wrist as appropriate; avoid swinging the torso.";
  if(/chest|bench|press|fly/.test(name))
    return "The pectorals, anterior shoulders, and triceps contribute to pressing. Keep shoulders controlled and bench/support stable; avoid leg drive when the injured leg is restricted.";
  if(/lateral|front raise|shoulder/.test(name))
    return "The deltoids lift the arm while the shoulder blade rotates and stabilizes. Use a manageable range and avoid shrugging or swinging.";
  if(/row|pulldown|back/.test(name))
    return "Back and upper-arm muscles draw the elbows toward the torso. Control the shoulder blades and keep the trunk supported; do not push through an injured foot.";
  if(/boxing|jab/.test(name))
    return "The shoulder, elbow, and trunk coordinate punches. For seated boxing keep movements controlled without transferring load through an injured leg.";
  if(/breath|stretch|mobility/.test(name))
    return "Use comfortable range and relaxed breathing, not a forceful stretch. Stop if pain, numbness, swelling, or pressure increases.";
  return "Move each joint through a controlled, pain-free range. Keep equipment stable and use the smallest effective resistance until form is reliable.";
}
export function flexCoachCue(focus: FlexFocus, exercise: string): string {
  if(isFlexExcludedExercise(exercise))
    return "Flex has excluded squats and leg presses at your request. Choose another exercise; do not start this movement.";
  switch(focus) {
    case "strength":
      return "Train the actual movement, not a placeholder animation. Secure the bench or cable setup; choose an appropriate load, control the lowering phase, and count only reps actually completed.";
    case "anatomy":
      return exerciseBodyCue(exercise);
    case "recovery":
      return "No squats or leg presses. Modify other movements to respect your current left-leg restrictions, use support as needed, and stop if symptoms increase. Flex gives recovery-informed exercise guidance, not a physical-therapy diagnosis or medical clearance.";
    case "nutrition":
      return "Hydrate, distribute protein across meals, and include carbohydrates around demanding sessions as tolerated. Match energy intake to your training and recovery goals; specific medical nutrition needs require a qualified professional.";
    case "mentor":
      return "Focus on the next quality set. Rest when prescribed, log your actual reps, and value consistent technique over chasing weight or rushing through the video.";
  }
}
