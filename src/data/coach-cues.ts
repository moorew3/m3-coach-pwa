/**
 * PER-MOVEMENT COACHING DEFINITIONS
 * ------------------------------------------------------------------
 * The coach is a 47-year-old Black male trainer: experienced, direct,
 * calm, technical. He never says "work now" or "good job" — he coaches
 * the EXACT movement on screen.
 *
 * Every entry here is keyed by the movement key (the same key used for
 * the Mirror Me / coach motion clip) so the spoken cue and the visible
 * demonstration can never drift apart. Exercises whose `mirror` key is
 * ambiguous are re-pointed through `EXERCISE_MOVEMENT`.
 *
 * Category fallbacks in `coach-script.ts` are only used when a movement
 * has no definition here, and those gaps are reported by
 * `missingMovementCoaching()`.
 */

export interface MovementCoaching {
  /** Spoken name — always the exact movement. */
  label: string;
  /** Main muscles that should be doing the work. */
  muscles: string;
  /** Body position and equipment before the first rep. */
  setup: string;
  /** How the very first rep begins. */
  start: string;
  /** The exact movement path / range of motion. */
  path: string;
  /** Extra technical cues, rotated across sets. */
  form: string[];
  /** Breathing pattern for this movement. */
  breathing: string;
  /** Tempo, when tempo actually matters. */
  tempo?: string;
  /** Common mistakes for THIS movement. */
  errors: string[];
  /** Closing coaching on a rep set. */
  finalReps: string;
  /** Closing coaching on a timed effort. */
  finalSeconds?: string;
  /** What to prepare when this movement is coming up next. */
  prep: string;
  /** When to stop the set. */
  stop?: string;
  /** Only when genuinely relevant. */
  safety?: string;
}

/* Movement keys mirror the coach demonstration clip keys. */
export const MOVEMENT_COACHING: Record<string, MovementCoaching> = {
  /* ------------------------------ warm-up / cardio ------------------------------ */
  easyWalk: {
    label: "the easy walk",
    muscles: "nothing hard — this is circulation and joint temperature",
    setup:
      "Treadmill at a flat, conversational pace, or walk the floor. Tall through the spine, shoulders relaxed, hands loose.",
    start: "Start slow and let the pace build over the first thirty seconds.",
    path: "Heel down, roll through to the toe, natural arm swing. No pounding.",
    form: [
      "Eyes forward, chin level — no staring at your feet.",
      "Let the arms swing from the shoulder, not the elbow.",
      "Shoulders down and back. Walk tall.",
    ],
    breathing:
      "In through the nose, out through the nose. If you can't nose-breathe, the pace is too high.",
    errors: [
      "Don't grip the treadmill rails — that shuts the core off.",
      "Don't push into a jog. This is a warm-up, not the workout.",
    ],
    finalReps: "Last stretch of the walk — keep that posture tall.",
    finalSeconds: "Final seconds. Stay tall, keep the breathing easy.",
    prep: "Just space to walk or a treadmill at a flat setting.",
  },
  shoulderMobility: {
    label: "shoulder mobility",
    muscles: "the shoulder capsule and upper back — this is range, not strength",
    setup: "Stand tall, feet hip width, arms hanging loose, ribs stacked over the hips.",
    start: "Begin with small circles and open them up as the joint warms.",
    path: "Arms sweep forward, up overhead, then back and down in a full slow circle. Stay inside a pain-free range.",
    form: [
      "Small circles first, bigger only when it feels clean.",
      "Keep the ribs down — don't arch the low back to get overhead.",
      "Reverse the direction halfway through.",
    ],
    breathing: "Breathe slowly and continuously. Nothing held.",
    errors: [
      "Don't force overhead if the shoulder pinches — shorten the arc.",
      "No fast swinging. This is smooth, not ballistic.",
    ],
    finalReps: "Last few circles — full, smooth, easy.",
    finalSeconds: "Final seconds of the mobility. Slow it down and finish easy.",
    prep: "Nothing needed — just clear space either side of you.",
    safety: "Mild stretch only. Pinching means shorten the range.",
  },
  bandPullApart: {
    label: "the band pull-apart",
    muscles: "rear delts and mid-traps",
    setup:
      "Light band at chest height, hands about shoulder width, arms straight out in front, elbows soft.",
    start:
      "Take the slack out of the band before the first rep so it's under tension the whole way.",
    path: "Pull the band apart out to the sides until it touches the chest, then return under control until the arms are back in front.",
    form: [
      "Lead with the little fingers — think wide, not back.",
      "Squeeze the shoulder blades together for a beat at the end range.",
      "Keep the arms level with the chest, not creeping up to the throat.",
    ],
    breathing: "Exhale as you pull the band apart, inhale as it returns.",
    tempo: "One second out, hold the squeeze, two seconds back.",
    errors: [
      "Don't shrug — keep the traps down and quiet.",
      "Don't let the band snap back. You control it, not the other way round.",
    ],
    finalReps: "Last reps — hold that squeeze an extra beat each one.",
    prep: "Grab the light band and give yourself arm-span of clear space.",
  },
  externalRotation: {
    label: "shoulder external rotation",
    muscles: "the rotator cuff — small muscles, small weight",
    setup:
      "Elbow pinned to your side and bent at ninety degrees, forearm across the body, light band or the lightest dumbbell.",
    start: "Set the elbow against the ribs first, then rotate.",
    path: "Rotate the forearm out away from the body while the elbow stays glued to your side. Come back slowly to the start.",
    form: [
      "Only the forearm moves — the upper arm stays still.",
      "Keep a fist-width gap feel: elbow tight to the ribs, wrist straight.",
      "Even reps both sides.",
    ],
    breathing: "Exhale as you rotate out, inhale on the return.",
    tempo: "Slow both directions. Two out, two back.",
    errors: [
      "Don't let the elbow drift away from the body.",
      "Don't twist the whole torso to fake the range — this is a small movement.",
    ],
    finalReps: "Last few each side — slow and honest, no help from the body.",
    prep: "Light band or the lightest dumbbell in the rack. Nothing heavy here.",
    safety: "This is cuff prep. If it pinches, reduce the range before the load.",
  },
  controlledShoulderWork: {
    label: "controlled shoulder work",
    muscles: "delts and rotator cuff, warming the whole shoulder girdle",
    setup: "Stand tall, no weight or one to five pounds maximum, elbows soft, ribs down.",
    start: "Begin with slow arcs at shoulder height and stay smooth.",
    path: "Raise out to the sides to about shoulder height, lower slowly, then a slow front raise, then back. Full control the whole time.",
    form: [
      "Nothing above shoulder height unless it feels completely clean.",
      "Traps stay down — the shoulder does the work, not the neck.",
      "Change the direction of the arc every few reps.",
    ],
    breathing: "Steady breathing, nothing held.",
    tempo: "Two up, two down. Never fast.",
    errors: [
      "Don't reach for heavier weight here — this is joint prep.",
      "Don't swing from the hips.",
    ],
    finalReps: "Last reps — keep the height honest.",
    finalSeconds: "Ten seconds. Keep it slow all the way to the buzzer.",
    prep: "Empty hands or the lightest pair of dumbbells you own.",
  },
  lowerBodyMobility: {
    label: "the lower-body mobility flow",
    muscles: "hips, knees and ankles — opening range, not building strength",
    setup: "Standing, feet hip width, something to hold for balance if you want it.",
    start: "Start with slow leg swings and easy hip circles.",
    path: "Move through hip circles, then a gentle deep-squat sit, then ankle rocks forward over the toes. Smooth, no bouncing.",
    form: [
      "Take each joint to a comfortable end range and pause a beat.",
      "Keep the heel down as you rock the knee forward over the toes.",
      "Even time on both sides.",
    ],
    breathing: "Long, slow breaths. Exhale as you move deeper.",
    errors: ["Don't bounce at the end range.", "Don't chase depth — chase smoothness."],
    finalReps: "Last passes through the flow — nice and easy.",
    finalSeconds: "Final seconds. Slow it down and breathe.",
    prep: "Just floor space. No equipment.",
    safety: "Mild tension only. Nothing here should pinch or burn.",
  },
  hipFlexorStretch: {
    label: "the hip-flexor stretch",
    muscles: "the front of the hip on the back leg",
    setup:
      "Half-kneeling: one knee down on a mat, the other foot planted in front, both hips square to the front.",
    start:
      "Tuck the tailbone under and squeeze the glute on the down-leg side before you move at all.",
    path: "Shift the hips forward an inch or two, no more. You should feel the stretch at the front of the back hip.",
    form: [
      "Ribs down, glute on. That's what makes the stretch work.",
      "Stay tall — don't lean over the front leg.",
      "Even time each side.",
    ],
    breathing: "Long exhale in the position. Let the hip release on the out-breath.",
    errors: [
      "Don't arch the low back to get further forward — that's the back stretching, not the hip.",
      "Don't bounce.",
    ],
    finalReps: "Ease out of it and switch sides.",
    finalSeconds: "Last seconds this side. Breathe out and let it soften.",
    prep: "Get a mat down and something soft under the knee.",
    safety: "Mild tension only. Never pain in the knee on the floor.",
  },
  chestMobility: {
    label: "chest mobility",
    muscles: "pecs and the front of the shoulder",
    setup: "Forearm on a doorway or rack upright, elbow at about shoulder height, feet staggered.",
    start: "Set the forearm, then rotate the chest away from the arm slowly.",
    path: "Turn the ribcage away until you feel a stretch across the chest. Hold, then ease back.",
    form: [
      "Rotate from the chest, not from the shoulder joint.",
      "Keep the shoulder blade pulled down and back.",
      "Even time each side.",
    ],
    breathing: "Breathe out into the stretch and let the chest open a little more.",
    errors: [
      "Don't shove into a pinch at the front of the shoulder — back off two inches.",
      "Don't shrug the arm up.",
    ],
    finalReps: "Ease out and change sides.",
    finalSeconds: "Last seconds. Long exhale, then come out of it slowly.",
    prep: "Find a doorway or a rack upright at shoulder height.",
    safety: "A stretch across the chest is right. A pinch in the front of the shoulder is not.",
  },
  hamstringMobility: {
    label: "hamstring mobility",
    muscles: "the hamstrings, back of the thigh",
    setup: "One heel out in front on the floor, toes up, hands on the front thigh, back leg soft.",
    start: "Hinge from the hips with a flat back — don't round to reach.",
    path: "Push the hips back until you feel the hamstring load on the front leg, hold, then stand back up.",
    form: [
      "Soft knee on the front leg — never locked out.",
      "Chest stays open, back stays long.",
      "Even time each side.",
    ],
    breathing: "Exhale as you sink into it, breathe normally in the hold.",
    errors: ["Don't round the low back to get lower.", "Don't lock the front knee."],
    finalReps: "Ease out and switch legs.",
    finalSeconds: "Final seconds this side. Flat back, breathe.",
    prep: "Just floor space. Mat if you want it.",
    safety: "Stretch in the muscle belly is fine. Sharp behind the knee is not.",
  },
  deadBug: {
    label: "the dead bug",
    muscles: "the deep core — the low back stays quiet the whole time",
    setup:
      "On your back, knees over hips at ninety degrees, arms straight up over the shoulders, low back gently flat to the floor.",
    start: "Press the low back into the floor first, then move one limb.",
    path: "Lower the opposite arm and leg toward the floor, stop before the back lifts, return to the start, then switch sides.",
    form: [
      "Opposite arm, opposite leg — always crossed.",
      "The low back stays flat. That's the whole exercise.",
      "Move slow. Slower is harder here.",
    ],
    breathing: "Exhale as the limbs reach away, inhale as they come back.",
    tempo: "Three seconds out, three seconds back.",
    errors: [
      "If the low back arches off the floor, you went too far — shorten the reach.",
      "Don't rush and turn it into a flail.",
    ],
    finalReps: "Last reps each side — slow, braced, back flat.",
    prep: "Get a mat down and lie on your back.",
  },
  gluteBridge: {
    label: "the glute bridge",
    muscles: "glutes — hamstrings help, but the glutes drive it",
    setup:
      "On your back, knees bent, heels about a hand-length from your backside, arms flat at your sides.",
    start: "Tuck the tailbone slightly, then push through the heels.",
    path: "Drive the hips up until the body is a straight line from knee to shoulder, squeeze, then lower under control until the hips just touch.",
    form: [
      "Push through the heels, not the toes.",
      "Squeeze the glutes hard at the top for a full beat.",
      "Ribs down — the hips finish the rep, not the low back.",
    ],
    breathing: "Exhale on the way up, inhale on the way down.",
    tempo: "One up, squeeze for one, two seconds down.",
    errors: [
      "Don't hyperextend the low back at the top — stop at the straight line.",
      "Don't let the knees fall in.",
    ],
    finalReps: "Last reps — hold the top squeeze two full seconds.",
    prep: "Mat down, on your back, knees bent.",
  },

  /* ------------------------------ shoulders ------------------------------ */
  shoulderPress: {
    label: "the dumbbell shoulder press",
    muscles: "front and side delts, with triceps helping at the top",
    setup:
      "Seated or standing tall, dumbbells at shoulder height, palms facing forward, wrists stacked straight over the elbows, ribs down.",
    start: "Brace the midsection first, then press — nothing moves at the hips.",
    path: "Press up and slightly in until the dumbbells are over the shoulders, stopping just short of locking the elbows. Lower under control until the elbows are level with the shoulders.",
    form: [
      "Wrists stay straight over the elbows the whole path.",
      "Stop just short of lockout so the delts keep the tension.",
      "Elbows about forty-five degrees forward, not flared straight out to the sides.",
    ],
    breathing: "Breathe out as you press up, in on the way down.",
    tempo: "Two seconds lowering, then drive up.",
    errors: [
      "Don't lean back and turn this into an incline press.",
      "Don't clang the dumbbells together at the top.",
    ],
    finalReps: "Two or three more clean reps — same path, no leaning back.",
    prep: "Set your dumbbells and a bench with an upright back pad.",
    stop: "Stop the set when the path starts to change, not when you fail.",
  },
  lateralRaise: {
    label: "the dumbbell lateral raise",
    muscles: "side delts — the width of the shoulder",
    setup:
      "Stand tall, light dumbbells at your thighs, soft bend in the elbows, chest proud, traps relaxed.",
    start: "Start from the thighs with no swing — the first inch should be pure shoulder.",
    path: "Raise the dumbbells out to the sides until your hands are about shoulder height, then control them all the way back down to your thighs.",
    form: [
      "Elbows lead the hands the whole way up.",
      "Keep the traps down — no shrugging into the neck.",
      "Little finger slightly higher than the thumb at the top.",
    ],
    breathing: "Exhale as they go up, inhale as they come down.",
    tempo: "One second up, three seconds down.",
    errors: [
      "Don't swing them up with the hips — if it swings, go lighter.",
      "Don't go above shoulder height, that's the traps taking over.",
    ],
    finalReps: "Keep those elbows leading. Two more clean reps.",
    prep: "Light dumbbells — lighter than you think. This is precision, not power.",
  },
  rearDeltFly: {
    label: "the rear-delt fly",
    muscles: "rear delts and upper back",
    setup:
      "Hinge forward at the hips to about forty-five degrees, chest supported or back flat, light dumbbells hanging under the shoulders, elbows soft.",
    start: "Set the shoulder blades before the first rep — no shrug.",
    path: "Sweep the dumbbells out to the sides in a wide arc up to shoulder level, then lower them back under the chest slowly.",
    form: [
      "Think wide, not up. Pinkies lead.",
      "Squeeze the shoulder blades at the top for a beat.",
      "Keep the neck long — don't crane the head up.",
    ],
    breathing: "Exhale as the arms sweep out, inhale coming back.",
    tempo: "One out, hold, two back.",
    errors: [
      "Don't bend the elbows and turn it into a row.",
      "Don't use the low back to heave the weight up.",
    ],
    finalReps: "Last reps — small weight, big squeeze.",
    prep: "Very light dumbbells and a bench to lean into if you have one.",
  },

  /* ------------------------------ arms ------------------------------ */
  dumbbellCurl: {
    label: "the dumbbell curl",
    muscles: "biceps — front of the upper arm",
    setup:
      "Stand tall, dumbbells at your sides, palms forward, elbows pinned against the ribs, knees soft.",
    start: "Nothing moves but the forearm. Start the curl without rocking.",
    path: "Curl up until the dumbbell is just short of the shoulder, squeeze, then lower all the way until the arm is nearly straight.",
    form: [
      "Elbows stay glued to your sides — they don't drift forward.",
      "Squeeze hard at the top before you lower.",
      "Full extension at the bottom. Half reps build half arms.",
    ],
    breathing: "Exhale curling up, inhale lowering.",
    tempo: "One up, squeeze, three seconds down.",
    errors: [
      "No rocking from the hips — if it rocks, drop the weight.",
      "Don't let the elbows swing forward at the top.",
    ],
    finalReps: "Last reps — slow the lowering right down and own the burn.",
    prep: "Grab your curl dumbbells and stand somewhere with clear space.",
  },
  hammerCurl: {
    label: "the hammer curl",
    muscles: "brachialis and the forearm — this is what pushes the bicep up",
    setup:
      "Stand tall, dumbbells at your sides, palms facing in toward your legs like you're holding two hammers, elbows tight to the ribs.",
    start: "Neutral grip the entire time — no twisting on the way up.",
    path: "Curl straight up keeping the thumbs pointing at the ceiling, stop just short of the shoulder, then lower all the way down.",
    form: [
      "Palms stay facing each other from start to finish.",
      "Elbows pinned. Only the forearm travels.",
      "Full lockout at the bottom of every rep.",
    ],
    breathing: "Exhale up, inhale down.",
    tempo: "One up, three down.",
    errors: [
      "Don't rotate to a normal curl halfway up.",
      "Don't shrug the shoulders to help the last few.",
    ],
    finalReps: "Two more — neutral grip, no rocking.",
    prep: "Same dumbbells as the curls, maybe a touch heavier.",
  },
  tricepsPressdown: {
    label: "the triceps pressdown",
    muscles: "triceps — the back of the upper arm",
    setup:
      "Cable set high, rope or bar in hand, small forward lean, upper arms locked to your sides, core braced.",
    start: "Elbows set at your ribs before the first rep and they don't move again.",
    path: "Open the elbow down until the arm is nearly straight, squeeze the back of the arm, then let it come up only until the forearm is parallel — don't lose tension.",
    form: [
      "Only the elbow opens and closes. Shoulders stay out of it.",
      "Extend to nearly straight — never snap the elbow.",
      "Squeeze the triceps for a beat at the bottom.",
    ],
    breathing: "Exhale as you press down, inhale on the return.",
    tempo: "One down, squeeze, two back up.",
    errors: [
      "Don't lean your bodyweight onto the bar to force reps.",
      "Don't let the elbows flare out and travel forward.",
    ],
    finalReps: "Last few — full extension, slow return, own the burn.",
    prep: "Get to a cable station and set the pulley high with a rope or straight bar.",
    safety: "Never snap the elbow straight at the bottom.",
  },

  /* ------------------------------ chest / pressing ------------------------------ */
  benchPress: {
    label: "the bench press",
    muscles: "chest, with front delts and triceps assisting",
    setup:
      "Flat on the bench, feet planted flat on the floor, shoulder blades pulled back and down into the pad, small natural arch, grip just outside shoulder width.",
    start:
      "Unrack, let the bar settle over the shoulders, then take a breath and start the descent.",
    path: "Lower the bar under control to mid-chest, touch lightly, then press up and slightly back toward the shoulders.",
    form: [
      "Shoulder blades stay pinned back and down — that's what protects the shoulder.",
      "Elbows around forty-five degrees, not flared out to ninety.",
      "Feet stay planted, drive them into the floor.",
    ],
    breathing:
      "Big breath in at the top, hold it through the descent, breathe out as the bar passes the sticking point.",
    tempo: "Two to three seconds down, then press.",
    errors: ["No bouncing the bar off the chest.", "Don't let the hips lift off the bench."],
    finalReps:
      "Last reps — controlled lowering, bar to mid-chest, press it back over the shoulders. Leave one in the tank.",
    prep: "Set the bench, load the bar and check the safety pins are at chest height.",
    stop: "Stop when bar speed drops or the path drifts. One or two in reserve, always.",
    safety: "Use safeties or a spotter. Never train this one to failure alone.",
  },
  inclineDumbbellPress: {
    label: "the incline dumbbell press",
    muscles: "upper chest and front delts",
    setup:
      "Bench at about thirty degrees, dumbbells at the outside of the chest, shoulder blades pinned into the pad, feet flat.",
    start:
      "Kick the dumbbells up into position first, then set the shoulders back before the first rep.",
    path: "Press up and slightly together until the dumbbells are over the upper chest, stopping just short of lockout, then lower until the elbows are just below the shoulders.",
    form: [
      "Wrists stacked over the elbows the whole way.",
      "Shoulder blades stay set — the chest works, not the front delt alone.",
      "Same path every rep.",
    ],
    breathing: "Inhale lowering, exhale pressing.",
    tempo: "Two seconds down, drive up.",
    errors: [
      "Don't set the incline too steep — that turns it into a shoulder press.",
      "Don't clash the dumbbells at the top.",
    ],
    finalReps: "Two more with the same path. Control the lowering.",
    prep: "Set the bench to about thirty degrees and pick your dumbbells.",
  },
  chestPress: {
    label: "the chest press",
    muscles: "chest, front delts and triceps",
    setup:
      "Seat height so the handles are level with mid-chest, back flat against the pad, feet planted, shoulder blades pulled down.",
    start: "Set the handles, take a breath, then press.",
    path: "Press straight out until the elbows are nearly straight, then return until the hands are level with the chest and you feel the stretch.",
    form: [
      "Elbows stay under the hands — no flaring wide.",
      "Keep the shoulder blades pinned to the pad.",
      "Stop just short of lockout to keep the chest loaded.",
    ],
    breathing: "Exhale pressing out, inhale on the return.",
    tempo: "Two seconds back, press with intent.",
    errors: [
      "Don't let the shoulders roll forward at the end of the press.",
      "Don't slam the stack on the return.",
    ],
    finalReps: "Last reps — full range, controlled return, chest doing the work.",
    prep: "Set the seat height so the handles line up with your mid-chest.",
  },
  medBallChestPass: {
    label: "the medicine-ball chest pass",
    muscles: "chest and triceps, trained fast for power",
    setup:
      "Feet shoulder width and grounded, ball at the chest, elbows in, facing a solid wall or a partner a few feet away.",
    start: "Brace, then throw — intent is the whole point of this one.",
    path: "Push the ball explosively straight out from the chest, catch it on the return and absorb it back to the chest before the next rep.",
    form: [
      "Feet stay planted — power comes from the torso, not a jump.",
      "Catch soft, absorb into the chest, then throw again.",
      "Every rep fast. If it slows down, the set's done.",
    ],
    breathing: "Sharp exhale on every throw.",
    errors: [
      "Don't lock the elbows out hard on the throw.",
      "Don't turn it into a slow press — speed is the exercise.",
    ],
    finalReps: "Last throws — fastest of the set. Nothing slow.",
    prep: "Grab the medicine ball and find a solid wall with clear space.",
    safety: "Keep the feet grounded. No jumping.",
  },

  /* ------------------------------ back ------------------------------ */
  chestSupportedRow: {
    label: "the chest-supported row",
    muscles: "mid-back, lats and rear delts — with the low back completely out of it",
    setup:
      "Chest into the pad, feet planted, dumbbells or handles hanging straight down, shoulders relaxed at the bottom.",
    start:
      "Let the shoulder blades stretch forward at the bottom, then pull them back to start the rep.",
    path: "Pull the elbows back past the ribs until the hands reach the torso, squeeze the blades together, then lower all the way to a full stretch.",
    form: [
      "Lead with the elbows, not the hands.",
      "Squeeze the shoulder blades together for a beat at the top.",
      "Full stretch at the bottom every rep.",
    ],
    breathing: "Exhale pulling, inhale lowering.",
    tempo: "Pull for one, squeeze for one, lower for two.",
    errors: [
      "Don't peel the chest off the pad to heave the weight.",
      "Don't shrug — keep the traps quiet.",
    ],
    finalReps: "Last reps — full squeeze, chest stays on the pad.",
    prep: "Set the chest-supported row bench and pick your dumbbells.",
  },
  seatedRow: {
    label: "the seated row",
    muscles: "mid-back and lats",
    setup:
      "Feet braced, knees slightly bent, chest tall, arms extended with a slight forward reach at the start.",
    start: "Take the slack out, then pull with the back — not by leaning away.",
    path: "Pull the handle to the belly button, elbows brushing past the ribs, squeeze the blades, then let the arms extend all the way forward again.",
    form: [
      "Torso stays upright — no rocking back and forward.",
      "Elbows tight to the body.",
      "Let the shoulder blades travel forward at the end of each rep for a real stretch.",
    ],
    breathing: "Exhale pulling in, inhale extending out.",
    tempo: "Pull for one, squeeze, lower for two.",
    errors: ["Don't row with the low back by swinging.", "Don't shrug the handle up to the chest."],
    finalReps: "Last reps — pull to the belly, squeeze, control it out.",
    prep: "Get on the row station and set the foot plate.",
  },
  latPulldown: {
    label: "the lat pulldown",
    muscles: "lats — the width of the back",
    setup:
      "Thighs locked under the pads, grip just outside shoulder width, chest up, small lean back of about ten degrees.",
    start: "Pull the shoulder blades down first, then bend the elbows.",
    path: "Pull the bar down to the top of the chest, squeeze, then let it rise all the way until the arms are straight and the lats stretch.",
    form: [
      "Elbows drive down toward the floor, not back behind you.",
      "Chest up to meet the bar.",
      "Full stretch at the top of every rep.",
    ],
    breathing: "Exhale pulling down, inhale on the way up.",
    tempo: "Pull for one, squeeze, three seconds back up.",
    errors: [
      "Never behind the neck — bar comes to the chest.",
      "Don't lean way back and turn it into a row.",
    ],
    finalReps: "Last reps — chest to the bar, elbows down, full stretch at the top.",
    prep: "Set the thigh pads and pick your bar attachment.",
  },
  reverseStepRow: {
    label: "the reverse step and row",
    muscles: "legs and back together — this is the conditioning driver",
    setup: "Light dumbbells at your sides, tall posture, feet under the hips.",
    start: "Step back first, then row — one rhythm, not two separate movements.",
    path: "Step one foot back into a shallow reverse lunge, row both dumbbells to the ribs at the bottom, then step back to standing and lower the weights.",
    form: [
      "Shallow step back — no deep lunge needed.",
      "Row the elbows past the ribs, squeeze the back.",
      "Alternate legs every rep.",
    ],
    breathing: "Exhale on the row, inhale as you step back to standing.",
    errors: ["Don't crash the back knee down.", "Don't round the back to reach the row."],
    finalReps: "Last reps — alternate legs, keep the row clean.",
    finalSeconds: "Ten seconds. Keep the steps controlled and the rows sharp.",
    prep: "Light dumbbells and a few feet of space behind you.",
  },

  /* ------------------------------ legs ------------------------------ */
  squat: {
    label: "the squat",
    muscles: "quads and glutes, with the core holding you upright",
    setup:
      "Feet shoulder width, toes turned out slightly, whole foot planted, brace the core like you're about to be nudged.",
    start:
      "Break at the hips and knees at the same time — sit down between the hips, don't tip forward.",
    path: "Descend to a depth where your back stays flat and the heels stay down, then drive the floor away and stand all the way up.",
    form: [
      "Knees track out over the toes — don't let them collapse in.",
      "Chest stays up the whole descent.",
      "Push through mid-foot, heels glued down.",
    ],
    breathing: "Breath in at the top, hold the brace on the way down, exhale as you drive up.",
    tempo: "Three seconds down, drive up with control.",
    errors: [
      "Don't chase depth — stop where the position stays strong.",
      "Don't let the heels lift.",
    ],
    finalReps: "Last reps — brace, chest up, finish every one all the way to the top.",
    prep: "Clear the rack or grab your dumbbells, and check the floor space behind you.",
    stop: "Stop the set the moment the back starts to round.",
  },
  legPress: {
    label: "the leg press",
    muscles: "quads and glutes",
    setup:
      "Back and hips flat into the seat, feet shoulder width on the middle of the platform, toes slightly out.",
    start: "Release the safeties, then lower under control — don't drop into it.",
    path: "Lower until the knees reach about ninety degrees or wherever your low back stays flat on the pad, then press through the whole foot back up, stopping just short of locking the knees.",
    form: [
      "Push through the whole foot, heels included.",
      "Knees track in line with the toes.",
      "Never let the hips curl up off the seat at the bottom.",
    ],
    breathing: "Inhale lowering, exhale pressing.",
    tempo: "Three seconds down, drive up.",
    errors: [
      "Don't lock the knees out hard at the top.",
      "Don't go so deep the tailbone rounds off the pad.",
    ],
    finalReps: "Last reps — controlled down, strong press, no lockout slam.",
    prep: "Set the seat, load the plates and check the safety catches.",
    safety: "Never lock the knees at the top.",
  },
  bulgarianSplitSquat: {
    label: "the Bulgarian split squat",
    muscles: "one leg at a time — quad and glute of the front leg",
    setup:
      "Rear foot up on the bench, front foot far enough forward that the knee stays behind the toes at the bottom, torso tall.",
    start: "Find your balance first, then lower straight down.",
    path: "Drop straight down until the back knee is just above the floor, then drive up through the front heel. All the weight in the front leg.",
    form: [
      "Straight up and down — you're not lunging forward.",
      "Front heel stays down, drive through it.",
      "Torso tall, small forward lean is fine.",
    ],
    breathing: "Inhale down, exhale driving up.",
    tempo: "Two down, strong up.",
    errors: [
      "Don't push off the back foot — it's for balance only.",
      "Don't let the front knee cave inward.",
    ],
    finalReps: "Last reps this side — full depth, drive through the front heel.",
    prep: "Set a bench behind you and grab light dumbbells if you're loading it.",
    safety: "Hold something for balance if you need it. No shame in it.",
  },
  romanianDeadlift: {
    label: "the Romanian deadlift",
    muscles: "hamstrings and glutes",
    setup:
      "Feet hip width, soft knees, weight in front of the thighs, shoulders back, long flat spine.",
    start: "Push the hips straight back — this is a hinge, not a squat.",
    path: "Slide the weight down the thighs as the hips travel back, stop when the hamstrings are fully loaded and the back is still flat, then squeeze the glutes to stand tall.",
    form: [
      "The bar or dumbbells brush the legs the whole way.",
      "Knees stay soft and roughly fixed — they don't bend more as you go down.",
      "Finish by squeezing the glutes, not by leaning back.",
    ],
    breathing: "Big breath in at the top, hold on the way down, exhale as you stand.",
    tempo: "Three seconds down, powerful up.",
    errors: [
      "Don't round the back to get lower — range comes from the hamstrings.",
      "Don't hyperextend at the top.",
    ],
    finalReps: "Last reps — flat back, hips back, strong glute finish.",
    prep: "Load the bar or grab dumbbells and stand with clear space in front.",
    stop: "The set ends the second the back rounds.",
  },
  trapBarDeadlift: {
    label: "the trap-bar deadlift",
    muscles: "the whole posterior chain — glutes, hamstrings, back and grip",
    setup:
      "Stand inside the trap bar, feet hip width, handles beside the mid-foot, hips down, chest up, arms straight.",
    start: "Take the slack out of the bar, brace hard, then push the floor away.",
    path: "Drive through the whole foot, stand up tall, lock the hips under you, then hinge the bar back down to the floor under control.",
    form: [
      "Arms are hooks — they don't pull.",
      "Hips and shoulders rise together. No hips shooting up first.",
      "Reset your brace between every rep.",
    ],
    breathing: "Breath in and brace before each rep, exhale at the top.",
    errors: ["Don't jerk the bar off the floor.", "Don't lean back at the top."],
    finalReps: "Last reps — reset every one, flat back, drive through the floor.",
    prep: "Load the trap bar and make sure the plates are even both sides.",
    stop: "Stop the set the moment the back position changes.",
  },
  hamstringCurl: {
    label: "the hamstring curl",
    muscles: "hamstrings, back of the thigh",
    setup:
      "Pad just above the heels, knees lined up with the machine's pivot, hips flat on the pad, grip the handles.",
    start: "Squeeze the hamstring to start the rep — no kicking.",
    path: "Curl the heels toward your backside as far as the range allows, hold the squeeze for a beat, then lower slowly until the legs are nearly straight.",
    form: [
      "Hips stay down on the pad — no lifting to help.",
      "Toes relaxed, don't push through them.",
      "Slow on the way back, that's where hamstrings grow.",
    ],
    breathing: "Exhale curling in, inhale lowering.",
    tempo: "One in, squeeze, three seconds out.",
    errors: [
      "Don't slam the weight stack down.",
      "Don't let the hips pop up on the last few reps.",
    ],
    finalReps: "Last reps — squeeze at the top, control all the way back.",
    prep: "Set the machine pad above your heels and line the knees up with the pivot.",
  },
  suitcaseCarry: {
    label: "the suitcase carry",
    muscles: "the side of the core and the grip — one side loaded at a time",
    setup: "One heavy dumbbell in one hand, stand tall, shoulders level, ribs down, grip hard.",
    start: "Brace the midsection before the first step.",
    path: "Walk in a straight line with short controlled steps, staying perfectly upright, then switch hands and repeat.",
    form: [
      "Do not lean away from the weight — stay square.",
      "Shoulders level side to side.",
      "Short quiet steps, no rushing.",
    ],
    breathing: "Keep breathing through the carry. Don't hold your breath.",
    errors: ["Don't shrug the loaded shoulder.", "Don't let the weight swing you side to side."],
    finalReps: "Nearly there — hold that posture right to the end, then switch sides.",
    finalSeconds: "Ten seconds. Tall, level, keep walking.",
    prep: "Pick one heavy dumbbell and find a clear lane to walk.",
  },
  farmerMarch: {
    label: "the farmer march",
    muscles: "core and grip, with the hip flexors working the march",
    setup:
      "A dumbbell in each hand, standing tall, shoulders packed down, ribs stacked over the hips.",
    start: "Brace first, then lift one knee.",
    path: "March in place lifting each knee to about hip height, one at a time, staying tall with no side-to-side sway.",
    form: [
      "Knee to hip height, no higher.",
      "Torso stays completely still — the legs move, you don't rock.",
      "Grip hard the whole time.",
    ],
    breathing: "Steady breathing throughout. Don't hold your breath.",
    errors: ["Don't lean back as the knee comes up.", "Don't rush — controlled beats fast here."],
    finalReps: "Last marches — tall and steady.",
    finalSeconds: "Ten seconds. Knees up, chest tall, don't lose the posture.",
    prep: "Grab a pair of dumbbells you can hold for a full minute.",
  },

  /* ------------------------------ weighted cardio ------------------------------ */
  squatToCurl: {
    label: "the squat-to-curl",
    muscles: "legs on the squat, biceps on the curl — continuous work",
    setup: "Light dumbbells at your sides, feet shoulder width, chest up.",
    start: "Squat first, stand fully, then curl. One rep is both halves.",
    path: "Sit down into a comfortable squat with the arms straight, stand all the way tall, then curl the dumbbells to the shoulders and lower them.",
    form: [
      "Full stand before the curl starts — don't blend them together.",
      "Heels down through the squat.",
      "Elbows tight to the ribs on the curl.",
    ],
    breathing: "Exhale as you stand, exhale again on the curl. Never hold your breath.",
    errors: [
      "Don't rush the squat and lose depth control.",
      "Don't swing the dumbbells up with the stand.",
    ],
    finalReps: "Last reps — full squat, full curl, no cutting corners.",
    finalSeconds: "Ten seconds left. Full squat, full curl, keep the rhythm.",
    prep: "Light dumbbells, one to ten pounds. Nothing heavy for this one.",
  },
  stepAltCurl: {
    label: "the step and alternating curl",
    muscles: "legs keeping the heart rate up while the biceps work",
    setup: "Light dumbbells, tall posture, feet under the hips, room to step side to side.",
    start: "Step out first, then curl the opposite arm.",
    path: "Step one foot out to the side, curl one dumbbell to the shoulder and lower it, step back to centre, then repeat on the other side alternating arms.",
    form: [
      "Feet stay on the floor — step, never hop.",
      "Elbows pinned to the ribs on every curl.",
      "Alternate arms so each side gets even work.",
    ],
    breathing: "Exhale on each curl, steady rhythm.",
    errors: [
      "Don't swing the dumbbells up with the step.",
      "Don't let the steps get sloppy as you tire.",
    ],
    finalReps: "Last reps — clean curls, controlled steps.",
    finalSeconds: "Ten seconds. Keep the steps grounded and the curls clean.",
    prep: "Light dumbbells and a couple of feet of space either side of you.",
    safety: "Zero jumping. Feet stay on the floor.",
  },
  stepShoulderPress: {
    label: "the step and shoulder press",
    muscles: "shoulders pressing while the legs keep the pace up",
    setup: "Light dumbbells at shoulder height, palms forward, ribs down, feet under the hips.",
    start: "Step out, then press — the press happens as the foot lands.",
    path: "Step to the side, press both dumbbells overhead stopping short of lockout, lower them back to the shoulders, then step back to centre.",
    form: [
      "Ribs down — don't arch the low back to press overhead.",
      "Stop just short of locking the elbows.",
      "Steps stay grounded, no hopping.",
    ],
    breathing: "Exhale on each press.",
    errors: [
      "Don't press with a leaning-back torso.",
      "Don't let the dumbbells drift forward of the shoulders.",
    ],
    finalReps: "Last reps — full press, controlled step.",
    finalSeconds: "Ten seconds. Presses stay clean right to the end.",
    prep: "Light dumbbells only — one to ten pounds for this one.",
  },
  shadowboxPunches: {
    label: "fast shadowbox punches",
    muscles: "shoulders, arms and core, and the conditioning engine",
    setup:
      "Hands empty — no weights for fast punches. Boxing stance, hands up by the cheeks, chin tucked, feet grounded shoulder width.",
    start: "Start at a rhythm you can hold for the full interval.",
    path: "Punch straight out from the chin to full extension without locking the elbow, then snap the hand straight back to the guard. Alternate hands.",
    form: [
      "Every hand comes straight back to the cheek.",
      "Rotate the hip and shoulder into each punch.",
      "Chin down, eyes up.",
    ],
    breathing: "Sharp exhale on every punch. Short and quick.",
    errors: [
      "Never snap the elbow fully straight — that's how elbows get hurt.",
      "Don't drop the non-punching hand.",
    ],
    finalReps: "Last punches — fastest and sharpest of the set.",
    finalSeconds: "Ten seconds. Hands high, sharp shots, finish the round.",
    prep: "Put the dumbbells down. Fast punches are unweighted — hands empty.",
    safety: "No weights in the hands for speed punching, and never lock the elbow out.",
  },
  battleRopeFinisher: {
    label: "the battle-rope and boxing finisher",
    muscles: "shoulders, arms and the conditioning engine",
    setup:
      "Rope ends in each hand, athletic stance, knees soft, hips back slightly, chest up. No rope? Shadowbox instead, hands empty.",
    start: "Start the waves immediately and keep them continuous for the interval.",
    path: "Drive alternating waves down the rope from the shoulders, arms moving fast, hips staying quiet and knees soft the whole round.",
    form: [
      "Waves come from the shoulders, not from bouncing at the knees.",
      "Feet stay grounded.",
      "Keep the chest up even as it burns.",
    ],
    breathing: "Fast rhythmic breathing. Don't hold your breath.",
    errors: [
      "Don't stand bolt upright and let the low back take it.",
      "Don't stop dead — slow the waves instead.",
    ],
    finalReps: "Bring it home.",
    finalSeconds: "Ten seconds — everything you've got left, then we go easy.",
    prep: "Get to the ropes, or clear space for unweighted shadowboxing.",
    safety: "Optional finisher. Skip it if the shoulders are already cooked.",
  },

  /* ------------------------------ boxing / kickboxing ------------------------------ */
  boxingStance: {
    label: "the boxing stance",
    muscles: "legs and core — this is the foundation everything else is built on",
    setup:
      "Lead foot forward, rear foot at about forty-five degrees, feet just wider than the hips, knees soft, weight even.",
    start: "Set the feet first, then bring the hands up.",
    path: "Small steps forward, back, and side to side — the lead foot moves first going forward, the rear foot first going back. Feet never cross.",
    form: [
      "Hands up by the cheeks, elbows tucked to the ribs.",
      "Chin down, eyes up over the gloves.",
      "Feet slide on the floor — no hopping, no crossing.",
    ],
    breathing: "Easy, rhythmic breathing. Stay relaxed.",
    errors: ["Don't stand square on — stay bladed.", "Don't let the hands drift down as you move."],
    finalReps: "Last movements — stance stays tight.",
    finalSeconds: "Ten seconds. Hands high, feet grounded, keep moving.",
    prep: "Clear a few feet of floor in every direction. No equipment.",
    safety: "Feet stay on the floor. No jumping or hopping.",
  },
  jab: {
    label: "the jab",
    muscles: "lead shoulder and core, with the legs turning it over",
    setup: "Boxing stance, hands up at the cheeks, chin tucked, weight even, elbows in.",
    start: "The jab starts from the chin — not from the hip, not wound back.",
    path: "Fire the lead hand straight out along the centre line to full extension, rotate the fist over at the end, then snap it straight back to the guard.",
    form: [
      "Rotate the lead shoulder up to protect the chin as the punch lands.",
      "The rear hand never leaves the cheek.",
      "Straight out, straight back — same line both directions.",
    ],
    breathing: "Sharp exhale on every jab.",
    errors: [
      "Don't drop the hand before you punch — that's telegraphing.",
      "Never fully lock the elbow at the end of the punch.",
    ],
    finalReps: "Last jabs — sharpest of the round.",
    finalSeconds: "Ten seconds. Snap the jab, get the hand back home.",
    prep: "Get into your stance with clear space in front of you.",
    safety: "Unweighted. No dumbbells in the hands for speed punching.",
  },
  cross: {
    label: "the cross",
    muscles: "rear shoulder, chest and core — the power comes from the back hip",
    setup: "Boxing stance, hands at the cheeks, rear heel ready to pivot, chin tucked.",
    start: "The cross starts at the back foot. Pivot the heel, then the punch follows.",
    path: "Pivot the rear foot and hip, drive the rear hand straight down the centre line to full extension, then bring it straight back to the guard.",
    form: [
      "Rear heel turns out — that's where the power lives.",
      "Lead hand stays glued to the cheek while the cross is out.",
      "Rotate the hip and shoulder together, not the arm alone.",
    ],
    breathing: "Sharp exhale as the cross lands.",
    errors: [
      "Don't lunge the whole body forward with it.",
      "Never snap the elbow straight — stop just short.",
    ],
    finalReps: "Last crosses — full hip rotation, hand straight back.",
    finalSeconds: "Ten seconds. Turn the hip, recoil the hand, chin down.",
    prep: "Stance set, clear space in front. Hands empty.",
    safety: "Unweighted punches only, and never lock the elbow.",
  },
  jabCross: {
    label: "the jab-cross combination",
    muscles: "shoulders, core and legs — the whole chain working together",
    setup: "Boxing stance, hands up at the cheeks, chin tucked, feet grounded.",
    start: "Jab first, and the cross starts the instant the jab is coming back.",
    path: "Jab straight out and recoil, then pivot the rear heel and fire the cross down the same line, and bring both hands home to the guard.",
    form: [
      "One-two rhythm: sharp, sharp, then reset.",
      "Both hands return to the cheeks before the next combination.",
      "Rotate the hips into the cross, feet stay grounded.",
    ],
    breathing: "Two sharp exhales — one on each punch.",
    errors: [
      "Don't let the guard drop between punches.",
      "Don't over-reach the cross and lose your balance.",
    ],
    finalReps: "Last combinations — sharpest one-twos of the round.",
    finalSeconds: "Ten seconds. One-two, hands home, chin down. Finish this round.",
    prep: "Stance set, hands empty, space in front of you.",
    safety: "Unweighted only. Never lock the elbow at the end of a punch.",
  },
  defensiveReset: {
    label: "the defensive reset and movement drill",
    muscles: "legs and core, with the shoulders holding the guard",
    setup: "Boxing stance, tight guard, elbows in to the ribs, chin tucked, knees soft.",
    start: "Start with a small slip and immediately reset to the guard.",
    path: "Slip the head slightly off the centre line, roll under, then step back to the centre and reset the guard. Small movements — inches, not feet.",
    form: [
      "The head moves off the centre line, the feet stay grounded.",
      "Elbows stay in — don't open up the body while you slip.",
      "Always come back to a square, tight guard.",
    ],
    breathing: "Exhale on each slip, stay relaxed.",
    errors: [
      "Don't duck by bending at the waist — bend the knees.",
      "Don't over-slip and lose your base.",
    ],
    finalReps: "Last resets — small, sharp, guard tight.",
    finalSeconds: "Ten seconds. Small slips, tight guard, feet grounded.",
    prep: "Just space. Hands empty.",
  },
  guardReset: {
    label: "the guard and reset drill",
    muscles: "shoulders holding position, core holding the stance",
    setup:
      "High tight guard — hands at the cheekbones, elbows against the ribs, chin down behind the gloves.",
    start: "Hold the guard, then break it and rebuild it fast.",
    path: "From the tight guard, extend and recoil, then re-set the hands and elbows exactly back where they started. Reset after every action.",
    form: [
      "Elbows touch the ribs when the guard is home.",
      "Chin stays down behind the hands.",
      "Reset all the way — no lazy half-guard.",
    ],
    breathing: "Steady, relaxed breathing behind the guard.",
    errors: [
      "Don't let the hands creep away from the face as you fatigue.",
      "Don't hold the shoulders shrugged up to the ears.",
    ],
    finalReps: "Last resets — guard exactly where it belongs.",
    finalSeconds: "Ten seconds. Hands high, elbows in, chin down.",
    prep: "Just space to stand and move.",
  },
  cablePunch: {
    label: "the cable punch",
    muscles: "chest, shoulder and rotational core",
    setup:
      "Cable at chest height, handle in the rear hand, staggered stance facing away from the stack, tension on before you start.",
    start: "Turn the rear hip first, then drive the punch out.",
    path: "Punch straight out to full extension as the hip and shoulder rotate, then return the handle slowly to the chest under control.",
    form: [
      "Rotate the rear foot and hip with every punch.",
      "Return slowly — the cable doesn't get to pull you back.",
      "Even work both sides.",
    ],
    breathing: "Sharp exhale on the punch, inhale on the return.",
    errors: [
      "Don't snap the elbow at full extension.",
      "Don't let the cable yank the shoulder back into the stretch.",
    ],
    finalReps: "Last punches this side — rotate the hip, control the return.",
    finalSeconds: "Ten seconds. Hip rotation on every rep, then we switch sides.",
    prep: "Set the cable to chest height and pick a light weight.",
    safety: "Never lock the elbow out against cable tension.",
  },
  frontKick: {
    label: "the front kick",
    muscles: "hip flexors, quads and core, with the standing leg working hard",
    setup: "Boxing stance, guard up, weight settling into the standing leg, standing knee soft.",
    start: "Chamber the knee up first. Always the knee before the foot.",
    path: "Lift the knee to hip height, extend the foot straight forward pushing through the ball of the foot, then re-chamber the knee and place the foot back down under control.",
    form: [
      "Knee up first, extend second, re-chamber third.",
      "Stay tall through the standing hip — no falling back.",
      "Guard stays up the whole time.",
    ],
    breathing: "Exhale as the kick extends.",
    errors: [
      "Don't swing the leg straight from the floor — that's a swing, not a kick.",
      "Don't let the leg drop; bring it back under control.",
    ],
    finalReps: "Last kicks this side — knee high, controlled return.",
    finalSeconds: "Ten seconds. Chamber, extend, re-chamber. Guard up.",
    prep: "Clear space in front of you and something to touch for balance if needed.",
    safety: "Feet stay grounded between reps. No hopping or jumping.",
  },
  roundKick: {
    label: "the round kick",
    muscles: "hips, obliques and the standing leg",
    setup: "Boxing stance, guard up, weight on the standing leg, standing knee soft.",
    start: "Pivot the standing foot before the leg travels — the pivot creates the arc.",
    path: "Pivot the standing foot, turn the hip over and swing the shin through a horizontal arc to about waist height, then recoil the leg back to the stance.",
    form: [
      "The standing foot pivots so the heel points at the target.",
      "Turn the hip over — the power is in the hip, not the knee.",
      "Recoil under control. Never let the leg crash down.",
    ],
    breathing: "Sharp exhale as the kick turns over.",
    errors: [
      "Don't kick without pivoting — that's how knees get hurt.",
      "Don't drop the guard when the hip turns.",
    ],
    finalReps: "Last kicks this side — pivot, turn the hip, recoil.",
    finalSeconds: "Ten seconds. Pivot every kick, guard stays high.",
    prep: "Clear space to your side. Balance support nearby if you want it.",
    safety: "Waist height is plenty. Always pivot the standing foot.",
  },
  kneeChamber: {
    label: "the knee chamber",
    muscles: "core and hip flexors, with the standing leg stabilising",
    setup: "Stance set, guard up in a tight clinch position, standing knee soft.",
    start: "Brace the core before you drive the knee.",
    path: "Drive the knee up and slightly in toward the centre line to hip height or higher, pull the hands down as it comes up, then place the foot back down under control.",
    form: [
      "Pull the hands down as the knee drives up.",
      "Squeeze the core at the top of every knee.",
      "Foot back down under control — no stomping.",
    ],
    breathing: "Sharp exhale on every knee.",
    errors: [
      "Don't lean back to get the knee higher — that's the low back working.",
      "Don't hop off the standing leg.",
    ],
    finalReps: "Last knees this side — drive up, squeeze, control down.",
    finalSeconds: "Ten seconds. Knee to the centre line, core tight.",
    prep: "Space to stand. Nothing needed in the hands.",
    safety: "Both feet stay grounded between reps.",
  },
};

/**
 * Exercise IDs whose movement key is not simply their `mirror` key —
 * either because the clip is shared or because the coaching differs.
 */
export const EXERCISE_MOVEMENT: Record<string, string> = {
  "wu-glute-bridge": "gluteBridge",
  "cardio-punches": "shadowboxPunches",
};

/** Movement key used for coaching a given exercise. */
export function movementKeyFor(e: { id: string; mirror?: string }): string {
  return EXERCISE_MOVEMENT[e.id] ?? e.mirror ?? e.id;
}

/** Movement-specific coaching for an exercise, when one is defined. */
export function coachingForExercise(e: {
  id: string;
  mirror?: string;
}): MovementCoaching | undefined {
  return MOVEMENT_COACHING[movementKeyFor(e)];
}

/** Movement-specific coaching for a cooldown/mobility movement key. */
export const coachingForMovement = (key: string): MovementCoaching | undefined =>
  MOVEMENT_COACHING[key];