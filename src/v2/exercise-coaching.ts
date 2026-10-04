import type { V2Exercise } from "./types";

type CoachingTriple = readonly [string, string, string];

const COACHING: Record<string, CoachingTriple> = {
  easyWalk: [
    "Stand tall, relax your shoulders, and let your arms swing naturally.",
    "Walk at the prescribed pace with short, smooth steps and steady posture.",
    "Breathe rhythmically and stay at a pace you can control without straining.",
  ],
  shoulderMobility: [
    "Stand tall with your ribs stacked over your hips and your neck relaxed.",
    "Move your shoulders through a comfortable range with slow circles and controlled reaches.",
    "Breathe slowly, keep the motion pain-free, and never force the end range.",
  ],
  bandPullApart: [
    "Hold the band at chest height with straight but unlocked elbows and hands just wider than shoulder width.",
    "Pull the band apart by driving your hands outward and squeezing your shoulder blades together.",
    "Exhale as you pull, inhale as you return, and keep your shoulders down away from your ears.",
  ],
  externalRotation: [
    "Set your elbow at about ninety degrees and keep it tucked close to your side.",
    "Rotate your forearm outward without letting the elbow drift away from your body.",
    "Exhale on the rotation, return slowly, and stop before any shoulder pinching or pain.",
  ],
  shoulderPress: [
    "Sit or stand tall with the dumbbells at shoulder height and your core braced.",
    "Press the weights overhead in a smooth path without leaning back or shrugging.",
    "Exhale as you press, inhale as you lower, and keep every rep controlled and pain-free.",
  ],
  lateralRaise: [
    "Stand tall with the dumbbells by your sides, elbows softly bent, and core braced.",
    "Raise the weights out to the sides only as high as you can control without shrugging.",
    "Exhale on the lift, inhale on the lowering phase, and lead with the elbows instead of the hands.",
  ],
  rearDeltFly: [
    "Hinge slightly at the hips with a long spine and soft elbows.",
    "Open the arms out and back by squeezing through the rear shoulders and upper back.",
    "Exhale as you open, lower slowly, and keep your neck relaxed instead of shrugging.",
  ],
  dumbbellCurl: [
    "Stand tall with your elbows close to your ribs and palms facing forward or slightly inward.",
    "Curl the dumbbells without swinging your torso or letting your elbows drift forward.",
    "Exhale as you curl, inhale as you lower, and control the weight all the way down.",
  ],
  hammerCurl: [
    "Stand tall with a neutral grip, thumbs pointing up, and elbows pinned near your sides.",
    "Curl the dumbbells toward your shoulders without rocking or using momentum.",
    "Exhale on the curl, inhale on the return, and lower under control.",
  ],
  tricepsPressdown: [
    "Stand tall with your elbows tucked to your sides and the cable or band close to your body.",
    "Press down by straightening the elbows while keeping your upper arms still.",
    "Exhale as you press, inhale as you return, and avoid leaning your body into the movement.",
  ],
  battleRopeFinisher: [
    "Set an athletic stance with your knees soft, chest tall, and core braced.",
    "Drive the ropes or your boxing rhythm at the prescribed work pace while staying balanced.",
    "Breathe continuously, keep the shoulders relaxed, and reduce the pace before your form breaks.",
  ],
  controlledShoulderWork: [
    "Stand tall with your ribs down and your shoulders relaxed.",
    "Use small, smooth shoulder motions through only the range that feels comfortable.",
    "Breathe steadily and keep the movement controlled with no bouncing or forced range.",
  ],
  squatToCurl: [
    "Set your feet about shoulder width with the dumbbells controlled at your sides.",
    "Sit into a squat, stand through the whole foot, then perform the curl without rushing the transition.",
    "Inhale into the squat, exhale as you stand and curl, and keep your knees tracking over your toes.",
  ],
  stepAltCurl: [
    "Stand tall with room to step and keep the dumbbells controlled by your sides.",
    "Take a smooth step while curling the opposite or alternating arm, then reset before the next rep.",
    "Breathe continuously, stay upright, and keep the curl strict instead of swinging.",
  ],
  stepShoulderPress: [
    "Stand tall with the dumbbells at shoulder height and your core braced.",
    "Step under control and press overhead only when you are balanced.",
    "Exhale on the press, inhale as you reset, and avoid arching your lower back.",
  ],
  reverseStepRow: [
    "Set the weights or cable with your torso tall and enough room to step back safely.",
    "Step back under control, brace, then row by pulling your elbows behind you before returning.",
    "Exhale on the row, keep your spine long, and do not yank the weight with momentum.",
  ],
  lightPunches: [
    "Set your boxing stance with your hands high, chin tucked, and knees soft.",
    "Throw light, crisp punches and bring each hand straight back to guard.",
    "Exhale sharply on each punch and stay relaxed enough to keep your shoulders from tightening.",
  ],
  shadowboxPunches: [
    "Set your boxing stance with your hands high, chin tucked, and knees soft.",
    "Throw smooth shadowboxing combinations and return to guard after every punch.",
    "Breathe out with the punches and keep your feet underneath you instead of reaching.",
  ],
  farmerMarch: [
    "Stand tall with the weight secure at your side or sides and your ribs stacked over your hips.",
    "March slowly by lifting one knee at a time without leaning or letting the weight pull you sideways.",
    "Breathe behind the brace, keep your steps quiet, and stay tall through every rep.",
  ],
  benchPress: [
    "Set your feet firmly, upper back tight on the bench, and hands evenly placed on the bar.",
    "Lower the bar under control toward the mid-to-lower chest, then press it back up without bouncing.",
    "Inhale and brace on the way down, exhale through the press, and keep your shoulders packed.",
  ],
  chestSupportedRow: [
    "Set your chest firmly against the pad with a neutral spine and shoulders relaxed.",
    "Row the weights by driving your elbows back and squeezing your shoulder blades together.",
    "Exhale on the pull, inhale on the return, and avoid lifting your chest off the support.",
  ],
  inclineDumbbellPress: [
    "Set your upper back against the incline bench with the dumbbells over your chest and feet planted.",
    "Lower the weights with control, then press up without letting your shoulders roll forward.",
    "Inhale as you lower, exhale as you press, and keep the motion smooth and pain-free.",
  ],
  latPulldown: [
    "Sit tall with your thighs secured and take a comfortable grip on the bar.",
    "Pull the bar toward your upper chest by driving your elbows down instead of leaning far back.",
    "Exhale on the pull, inhale on the return, and let the shoulders rise only under control.",
  ],
  seatedRow: [
    "Sit tall with a neutral spine, chest open, and shoulders relaxed.",
    "Row the handle toward your torso by driving your elbows back without rocking your body.",
    "Exhale on the pull, inhale on the return, and keep the movement smooth from start to finish.",
  ],
  hipFlexorStretch: [
    "Set a stable split or half-kneeling stance and gently tuck your pelvis.",
    "Shift forward only until you feel a stretch across the front of the rear hip.",
    "Breathe slowly, keep your ribs down, and never force the stretch into pain.",
  ],
  chestMobility: [
    "Set a tall posture with your shoulder down and your chest relaxed.",
    "Open through the chest gradually using the prescribed arm position or reach.",
    "Take slow breaths into the stretch and keep the shoulder out of any painful position.",
  ],
  hamstringMobility: [
    "Set a stable stance with a long spine and the working leg positioned comfortably.",
    "Hinge from the hips until you feel a gentle stretch along the back of the thigh.",
    "Breathe slowly, keep the back long, and avoid bouncing deeper into the stretch.",
  ],
  lowerBodyMobility: [
    "Stand or kneel in a stable position with enough space to move comfortably.",
    "Flow slowly through the prescribed hip, knee, and ankle ranges without rushing.",
    "Breathe continuously and use only pain-free range with smooth transitions.",
  ],
  deadBug: [
    "Lie on your back with your knees over your hips, arms up, and lower back gently braced toward the floor.",
    "Extend the opposite arm and leg slowly without letting your ribs flare or back arch.",
    "Exhale through each extension, inhale as you reset, and make the range smaller if your back lifts.",
  ],
  gluteBridge: [
    "Lie on your back with your feet planted, knees bent, and ribs down.",
    "Drive through your feet and squeeze your glutes to lift your hips without over-arching your back.",
    "Exhale as you lift, inhale as you lower, and keep your knees tracking straight ahead.",
  ],
  squat: [
    "Set your feet in a comfortable squat stance, brace your core, and keep your whole foot planted.",
    "Sit down and back between your hips, then drive through the floor to stand tall.",
    "Inhale and brace before the descent, exhale through the stand, and keep your knees tracking over your toes.",
  ],
  romanianDeadlift: [
    "Stand tall with the weight close to your thighs, knees softly bent, and lats engaged.",
    "Push your hips back while keeping the weight close until your hamstrings load, then drive the hips forward.",
    "Inhale and brace on the hinge, exhale as you stand, and keep your spine long throughout.",
  ],
  trapBarDeadlift: [
    "Step into the trap bar, center your feet, brace your core, and set your shoulders over a strong grip.",
    "Push the floor away and stand tall with hips and shoulders rising together.",
    "Take a breath and brace before each rep, exhale near the top, and lower with control instead of dropping.",
  ],
  legPress: [
    "Set your feet firmly on the platform and keep your hips and back supported against the pad.",
    "Lower the platform under control to a comfortable depth, then press through your whole foot without locking the knees hard.",
    "Inhale as you lower, exhale as you press, and keep your knees tracking with your toes.",
  ],
  bulgarianSplitSquat: [
    "Set your rear foot securely and place the front foot far enough forward to stay balanced.",
    "Lower straight down under control, then drive through the front foot to stand without bouncing.",
    "Inhale on the descent, exhale on the rise, and keep the front knee tracking over the toes.",
  ],
  hamstringCurl: [
    "Set the machine so your knee lines up comfortably with the pivot and keep your hips anchored.",
    "Curl your heels toward you without lifting your hips or jerking the pad.",
    "Exhale on the curl, inhale on the return, and lower the weight slowly.",
  ],
  chestPress: [
    "Set the seat and handles so your hands start around chest level with your back supported.",
    "Press forward smoothly without shrugging or letting your shoulders roll off the pad.",
    "Exhale as you press, inhale as you return, and stop short of any painful shoulder range.",
  ],
  suitcaseCarry: [
    "Stand tall with one weight at your side, shoulders level, and core braced.",
    "Walk with controlled steps without leaning toward or away from the weight.",
    "Breathe behind the brace, keep your ribs stacked over your hips, and switch sides as prescribed.",
  ],
  boxingStance: [
    "Set one foot slightly forward, knees soft, chin tucked, and both hands high.",
    "Stay light on your feet and keep your weight balanced so you can move in any direction.",
    "Breathe steadily, keep your shoulders loose, and return to this position after every action.",
  ],
  jab: [
    "Start in your boxing stance with your lead hand high and rear hand protecting your face.",
    "Drive the lead fist straight out and snap it directly back to guard without reaching.",
    "Exhale sharply on the punch, keep the shoulder relaxed, and let the feet stay balanced underneath you.",
  ],
  cross: [
    "Start in guard with your rear heel ready to turn and your lead hand protecting your face.",
    "Drive the rear hand straight through while rotating the hip and shoulder, then return immediately to guard.",
    "Exhale on the punch, pivot smoothly, and do not over-rotate or fall forward.",
  ],
  jabCross: [
    "Set your stance and guard before the combination starts.",
    "Snap the jab out and back, then drive the cross with coordinated hip rotation and recover to guard.",
    "Exhale on each punch and keep the combination crisp without sacrificing balance.",
  ],
  defensiveReset: [
    "Begin in a balanced guard with your feet under you and your chin tucked.",
    "Use the prescribed slip, step, or reset movement, then re-establish your stance before the next action.",
    "Breathe steadily, keep your eyes forward, and never cross your feet during the reset.",
  ],
  guardReset: [
    "Bring both hands back to your cheeks with your elbows controlled and chin tucked.",
    "Reset your feet underneath you before starting the next combination.",
    "Take one steady breath, relax the shoulders, and make balance the priority.",
  ],
  cablePunch: [
    "Set a staggered stance with the cable behind the punching arm and your core braced.",
    "Punch forward by rotating through the torso while keeping the shoulder controlled, then return slowly.",
    "Exhale on the punch, resist the cable on the way back, and keep your feet planted and balanced.",
  ],
  frontKick: [
    "Set your guard, shift your weight onto the support leg, and lift the working knee first.",
    "Extend the lower leg into the front kick, then recoil the knee before placing the foot down.",
    "Exhale on the kick, keep your torso tall, and prioritize balance over height or power.",
  ],
  roundKick: [
    "Set your guard and balance on the support leg before turning the hip.",
    "Pivot the support foot, rotate the hip through the kick, then recoil and return to stance.",
    "Exhale on contact, keep the motion controlled, and reduce the range if your balance breaks.",
  ],
  kneeChamber: [
    "Start in guard with your weight balanced and your support foot stable.",
    "Drive one knee upward under control, then return the foot to stance before repeating.",
    "Exhale as the knee rises, keep your torso tall, and avoid leaning back to create height.",
  ],
  medBallChestPass: [
    "Set an athletic stance with the medicine ball at chest height and your core braced.",
    "Drive the ball straight forward from the chest using a coordinated push, then reset your stance.",
    "Exhale on the throw, keep your knees soft, and stay balanced instead of falling forward.",
  ],
};

const FALLBACK: Record<V2Exercise["category"], CoachingTriple> = {
  strength: [
    "Set your body and equipment before you start the first rep.",
    "Move through the prescribed range with smooth, controlled technique.",
    "Breathe through the effort and stop the set if your form or comfort breaks down.",
  ],
  cardio: [
    "Set a tall, balanced posture before the interval begins.",
    "Work at the prescribed pace while keeping the motion smooth and repeatable.",
    "Breathe continuously and reduce the pace before your technique breaks down.",
  ],
  mobility: [
    "Set a stable position and relax the area you are not actively moving.",
    "Move slowly through a comfortable, pain-free range.",
    "Breathe steadily and never force a stretch or joint position.",
  ],
  core: [
    "Set your ribs and pelvis in a controlled position before you move.",
    "Perform the movement slowly without losing your trunk position.",
    "Exhale through the effort and make the range smaller if your back position changes.",
  ],
  boxing: [
    "Set your stance, guard, and balance before the round starts.",
    "Perform the technique cleanly and return to guard after every action.",
    "Exhale with each strike and stay relaxed enough to move without reaching.",
  ],
  kickboxing: [
    "Set your stance and guard with your weight balanced before the round starts.",
    "Perform the technique under control and return to stance after every repetition.",
    "Exhale with the strike and prioritize balance and control over speed or height.",
  ],
};

export function coachingCuesFor(
  motionKey: string | undefined,
  category: V2Exercise["category"],
): string[] {
  const triple = (motionKey && COACHING[motionKey]) || FALLBACK[category];
  return [...triple];
}
