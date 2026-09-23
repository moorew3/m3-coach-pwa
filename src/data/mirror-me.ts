/**
 * MIRROR ME — MOVEMENT LIBRARY
 * ------------------------------------------------------------------
 * One entry per movement. Every exercise screen in the app renders
 * from this same structure — there are no one-off demo layouts.
 *
 * `keyframes` drives the coded movement-sequence animation (see
 * src/data/poses.ts + src/components/MirrorMe.tsx). When real video
 * assets exist later, set `videoUrl` on the move and the same card
 * plays the clip instead — no workout logic changes required.
 */

import type { PoseKey } from "@/data/poses";

export type CueIcon =
  | "posture"
  | "control"
  | "breathe"
  | "range"
  | "tempo"
  | "grip"
  | "core"
  | "safety";

export interface MirrorPhase {
  /** Short phase name, e.g. "Setup". */
  label: string;
  /** One-line description of what happens in this phase. */
  detail: string;
}

export interface MirrorMove {
  id: string;
  name: string;
  equipment: string;
  /** "reps" shows a rep target, "time" shows a work countdown. */
  mode: "reps" | "time";
  /** Default work prescription shown when the workout has no override. */
  work: string;
  phases: MirrorPhase[];
  cues: { icon: CueIcon; text: string }[];
  coachCue: string;
  /** Coded animation keyframes — cycled and interpolated. */
  keyframes: PoseKey[];
  /** Full loop length in ms. */
  loopMs?: number;
  /** Load drawn in the hands. */
  load?: "dumbbell" | "barbell" | "cable" | "band" | "ball" | "none";
  /** Directional arrow drawn on the demo. */
  arrow?: "up" | "down" | "forward" | "out" | "none";
  /** Drop an MP4/WebM here later — the card plays it automatically. */
  videoUrl?: string;
}

const m = (x: MirrorMove): MirrorMove => ({ loopMs: 3200, load: "dumbbell", arrow: "up", ...x });

export const MIRROR_MOVES: Record<string, MirrorMove> = {
  /* ------------------------- shoulders & arms ------------------------- */
  shoulderPress: m({
    id: "shoulderPress",
    name: "Dumbbell Shoulder Press",
    equipment: "Dumbbells + upright bench",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["pressRack", "pressLockout", "pressRack"],
    phases: [
      { label: "Setup", detail: "Seated and supported, dumbbells at ear height, ribs down." },
      { label: "Press", detail: "Drive up and slightly in until the elbows are long." },
      { label: "Return", detail: "Lower under control back to ear height — no bouncing." },
    ],
    cues: [
      { icon: "posture", text: "Back flat on the pad" },
      { icon: "control", text: "Elbows slightly in front" },
      { icon: "range", text: "Stop where the shoulder feels strong" },
      { icon: "safety", text: "Free weights only — no machine press" },
    ],
    coachCue: "Press the ceiling away — don't shrug the weight up.",
  }),
  lateralRaise: m({
    id: "lateralRaise",
    name: "Dumbbell Lateral Raise",
    equipment: "Light dumbbells",
    mode: "reps",
    work: "3 × 12–15",
    keyframes: ["raiseDown", "raiseUp", "raiseDown"],
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Tall, soft elbows, dumbbells beside the thighs." },
      { label: "Raise", detail: "Lead with the elbows out to shoulder height." },
      { label: "Lower", detail: "Three counts down — resist the whole way." },
    ],
    cues: [
      { icon: "control", text: "Lead with the elbow" },
      { icon: "range", text: "Stop at shoulder height" },
      { icon: "tempo", text: "Slow on the way down" },
    ],
    coachCue: "Light weight, long lever — this one is never about load.",
  }),
  rearDeltFly: m({
    id: "rearDeltFly",
    name: "Rear-Delt Fly",
    equipment: "Light dumbbells or cable",
    mode: "reps",
    work: "3 × 12–15",
    keyframes: ["hingeSoft", "rearFlyOpen", "hingeSoft"],
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Chest supported or short hinge, arms hanging." },
      { label: "Open", detail: "Sweep the arms wide until they line up with the shoulders." },
      { label: "Return", detail: "Control back in without letting the shoulders round." },
    ],
    cues: [
      { icon: "posture", text: "Flat back, eyes down" },
      { icon: "control", text: "Pinkies lead, thumbs down" },
      { icon: "range", text: "Stop at shoulder line" },
    ],
    coachCue: "Think 'wide', not 'heavy'.",
  }),
  dumbbellCurl: m({
    id: "dumbbellCurl",
    name: "Dumbbell Curl",
    equipment: "Dumbbells",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["curlDown", "curlUp", "curlDown"],
    phases: [
      { label: "Setup", detail: "Tall, elbows pinned at the ribs, palms forward." },
      { label: "Curl", detail: "Bend the elbow only — the upper arm never swings." },
      { label: "Lower", detail: "Three-count negative to a full stretch." },
    ],
    cues: [
      { icon: "core", text: "Ribs down, no leaning back" },
      { icon: "control", text: "Elbows glued to the ribs" },
      { icon: "tempo", text: "Slow negative" },
      { icon: "safety", text: "No swinging or cheat curls" },
    ],
    coachCue: "If the body moves, the weight is too heavy.",
  }),
  hammerCurl: m({
    id: "hammerCurl",
    name: "Hammer Curl",
    equipment: "Dumbbells",
    mode: "reps",
    work: "3 × 10–12",
    keyframes: ["curlDown", "curlUp", "curlDown"],
    phases: [
      { label: "Setup", detail: "Neutral grip, thumbs up, elbows at the ribs." },
      { label: "Curl", detail: "Drive up keeping the wrist straight and quiet." },
      { label: "Lower", detail: "Control all the way to a long arm." },
    ],
    cues: [
      { icon: "grip", text: "Thumbs up the whole rep" },
      { icon: "control", text: "No shoulder shrug" },
      { icon: "tempo", text: "Own the last 2 reps" },
    ],
    coachCue: "Hammer grip builds the thickness on the outside of the arm.",
  }),
  tricepsPressdown: m({
    id: "tricepsPressdown",
    name: "Triceps Pressdown",
    equipment: "Cable + rope or bar",
    mode: "reps",
    work: "3 × 10–15",
    keyframes: ["pushdownTop", "pushdownBottom", "pushdownTop"],
    arrow: "down",
    load: "cable",
    phases: [
      { label: "Setup", detail: "Elbows at the ribs, small forward lean, tall chest." },
      { label: "Press", detail: "Extend to a straight arm and squeeze one count." },
      { label: "Return", detail: "Let the rope come up to about 90° — no higher." },
    ],
    cues: [
      { icon: "control", text: "Only the forearm moves" },
      { icon: "posture", text: "Elbows stay pinned" },
      { icon: "range", text: "Full lockout, short return" },
    ],
    coachCue: "Squeeze the elbow straight, then resist the rope back up.",
  }),

  /* -------------------------- chest & back ---------------------------- */
  benchPress: m({
    id: "benchPress",
    name: "Bench Press",
    equipment: "Barbell or dumbbells + bench",
    mode: "reps",
    work: "4 × 6–10",
    keyframes: ["benchDown", "benchUp", "benchDown"],
    load: "barbell",
    phases: [
      { label: "Setup", detail: "Feet planted, shoulder blades pulled back and down." },
      { label: "Lower", detail: "Bar to the lower chest, elbows about 45°." },
      { label: "Press", detail: "Drive up and slightly back to lockout." },
    ],
    cues: [
      { icon: "posture", text: "Shoulder blades tucked" },
      { icon: "control", text: "Elbows ~45°, not flared" },
      { icon: "safety", text: "Leave 1–2 reps in reserve" },
    ],
    coachCue: "Push yourself away from the bar, not the bar away from you.",
  }),
  chestSupportedRow: m({
    id: "chestSupportedRow",
    name: "Chest-Supported Row",
    equipment: "Incline bench + dumbbells",
    mode: "reps",
    work: "4 × 8–12",
    keyframes: ["rowStretch", "rowPull", "rowStretch"],
    arrow: "up",
    phases: [
      { label: "Setup", detail: "Chest on the pad, arms hanging long." },
      { label: "Pull", detail: "Elbows back to the ribs, squeeze the shoulder blades." },
      { label: "Return", detail: "Full stretch, no chest lifting off the pad." },
    ],
    cues: [
      { icon: "safety", text: "Chest stays on the pad — protects the back" },
      { icon: "control", text: "Pull with the elbows" },
      { icon: "range", text: "Full stretch each rep" },
    ],
    coachCue: "Supported rowing only — no heavy unsupported bent-over rows.",
  }),
  inclineDumbbellPress: m({
    id: "inclineDumbbellPress",
    name: "Incline Dumbbell Press",
    equipment: "Incline bench + dumbbells",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["inclineDown", "inclineUp", "inclineDown"],
    phases: [
      { label: "Setup", detail: "Bench at 30°, dumbbells at the upper chest." },
      { label: "Press", detail: "Press up and together without clanging." },
      { label: "Lower", detail: "Control down to a comfortable chest stretch." },
    ],
    cues: [
      { icon: "posture", text: "Bench at 30°, not steeper" },
      { icon: "control", text: "Wrists stacked over elbows" },
      { icon: "range", text: "Stop before shoulder pinch" },
    ],
    coachCue: "Smooth down, strong up — the shoulder decides the depth.",
  }),
  latPulldown: m({
    id: "latPulldown",
    name: "Lat Pulldown",
    equipment: "Cable pulldown station",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["pulldownTop", "pulldownBottom", "pulldownTop"],
    arrow: "down",
    load: "cable",
    phases: [
      { label: "Setup", detail: "Thighs locked under the pads, tall chest." },
      { label: "Pull", detail: "Bar to the collarbone, elbows driving down." },
      { label: "Return", detail: "Let the arms lengthen fully, ribs stay down." },
    ],
    cues: [
      { icon: "control", text: "Elbows down, not back" },
      { icon: "posture", text: "Slight lean, no swinging" },
      { icon: "range", text: "Full stretch at the top" },
    ],
    coachCue: "Pull your elbows into your back pockets.",
  }),
  seatedRow: m({
    id: "seatedRow",
    name: "Seated Row",
    equipment: "Cable row station",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["seatedStretch", "seatedPull", "seatedStretch"],
    load: "cable",
    arrow: "forward",
    phases: [
      { label: "Setup", detail: "Tall spine, soft knees, arms long." },
      { label: "Pull", detail: "Handle to the belly, shoulder blades together." },
      { label: "Return", detail: "Let the handle travel out without rounding." },
    ],
    cues: [
      { icon: "posture", text: "Torso stays still" },
      { icon: "control", text: "Squeeze one count" },
      { icon: "safety", text: "No jerking with the low back" },
    ],
    coachCue: "Chest proud the whole set.",
  }),
  chestPress: m({
    id: "chestPress",
    name: "Chest Press",
    equipment: "Machine or dumbbells",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["chestPressBack", "chestPressOut", "chestPressBack"],
    arrow: "forward",
    phases: [
      { label: "Setup", detail: "Back flat on the pad, handles at chest height." },
      { label: "Press", detail: "Push straight out to long arms." },
      { label: "Return", detail: "Control back until the chest feels a light stretch." },
    ],
    cues: [
      { icon: "posture", text: "Shoulders down and back" },
      { icon: "range", text: "Stop before the pinch" },
      { icon: "tempo", text: "2 seconds back" },
    ],
    coachCue: "Even pressure through both hands.",
  }),

  /* --------------------------- lower body ------------------------------ */
  squat: m({
    id: "squat",
    name: "Squat",
    equipment: "Barbell, dumbbells or machine",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["squatTop", "squatBottom", "squatTop"],
    arrow: "down",
    load: "barbell",
    phases: [
      { label: "Setup", detail: "Feet shoulder width, toes slightly out, chest tall." },
      { label: "Descend", detail: "Sit between the hips to a pain-free depth." },
      { label: "Stand", detail: "Drive the floor away, knees tracking over the toes." },
    ],
    cues: [
      { icon: "safety", text: "Depth is never worth pain" },
      { icon: "core", text: "Brace before every rep" },
      { icon: "control", text: "Knees track the toes" },
    ],
    coachCue: "Stop where it feels strong — that is your depth.",
  }),
  romanianDeadlift: m({
    id: "romanianDeadlift",
    name: "Romanian Deadlift",
    equipment: "Dumbbells or barbell",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["hingeTop", "hingeBottom", "hingeTop"],
    arrow: "down",
    phases: [
      { label: "Setup", detail: "Soft knees, bar/dumbbells against the thighs." },
      { label: "Hinge", detail: "Push the hips back, weights tracking the legs." },
      { label: "Stand", detail: "Squeeze the glutes to come tall — don't lean back." },
    ],
    cues: [
      { icon: "posture", text: "Flat back the whole way" },
      { icon: "range", text: "Stop where the hamstrings stretch" },
      { icon: "safety", text: "Never round to reach the floor" },
    ],
    coachCue: "Hips back, not down.",
  }),
  trapBarDeadlift: m({
    id: "trapBarDeadlift",
    name: "Trap-Bar Deadlift",
    equipment: "Trap bar",
    mode: "reps",
    work: "3 × 5–8",
    keyframes: ["squatBottom", "squatTop", "squatBottom"],
    arrow: "up",
    load: "barbell",
    phases: [
      { label: "Setup", detail: "Mid-foot under the handles, chest up, arms long." },
      { label: "Lift", detail: "Push the floor away and stand tall." },
      { label: "Lower", detail: "Hips back, controlled to the floor, reset each rep." },
    ],
    cues: [
      { icon: "core", text: "Big brace before the pull" },
      { icon: "posture", text: "Back flat, neck neutral" },
      { icon: "safety", text: "Swap for a hinge if the back is cranky" },
    ],
    coachCue: "This is optional — one heavy hinge per session is plenty.",
  }),
  legPress: m({
    id: "legPress",
    name: "Leg Press",
    equipment: "Leg press machine",
    mode: "reps",
    work: "3 × 8–12",
    keyframes: ["legPressBottom", "legPressTop", "legPressBottom"],
    arrow: "forward",
    load: "none",
    phases: [
      { label: "Setup", detail: "Feet shoulder width on the platform, back and hips flat." },
      { label: "Lower", detail: "Bend to a comfortable depth — hips must stay planted." },
      { label: "Press", detail: "Drive through the whole foot, knees soft at the top." },
    ],
    cues: [
      { icon: "safety", text: "Hips never lift off the seat" },
      { icon: "range", text: "Pain-free depth only" },
      { icon: "control", text: "Don't lock the knees hard" },
    ],
    coachCue: "Short, strong range beats deep and sloppy.",
  }),
  bulgarianSplitSquat: m({
    id: "bulgarianSplitSquat",
    name: "Bulgarian Split Squat",
    equipment: "Bench + optional dumbbells",
    mode: "reps",
    work: "3 × 8 each side",
    keyframes: ["splitTop", "splitBottom", "splitTop"],
    arrow: "down",
    phases: [
      { label: "Setup", detail: "Rear foot on the bench, front foot a long stride out." },
      { label: "Descend", detail: "Drop straight down, front shin near vertical." },
      { label: "Stand", detail: "Drive through the front heel back to tall." },
    ],
    cues: [
      { icon: "control", text: "Hold something for balance if needed" },
      { icon: "safety", text: "No jumping or bouncing out of the bottom" },
      { icon: "posture", text: "Torso slightly forward is fine" },
    ],
    coachCue: "Body weight first — add load only when balance is easy.",
  }),
  hamstringCurl: m({
    id: "hamstringCurl",
    name: "Hamstring Curl",
    equipment: "Leg curl machine",
    mode: "reps",
    work: "3 × 10–12",
    keyframes: ["hamCurlDown", "hamCurlUp", "hamCurlDown"],
    arrow: "up",
    load: "none",
    phases: [
      { label: "Setup", detail: "Pad just above the heels, hips flat." },
      { label: "Curl", detail: "Pull the heels toward the glutes and squeeze." },
      { label: "Lower", detail: "Three-count return, never let the stack slam." },
    ],
    cues: [
      { icon: "control", text: "Hips stay down" },
      { icon: "tempo", text: "Slow negative" },
      { icon: "range", text: "Full squeeze at the top" },
    ],
    coachCue: "Cramping means slow down and lighten up.",
  }),
  suitcaseCarry: m({
    id: "suitcaseCarry",
    name: "Suitcase Carry",
    equipment: "One dumbbell or kettlebell",
    mode: "time",
    work: "3 × 30 sec each side",
    keyframes: ["carryLeft", "carryRight", "carryLeft"],
    loopMs: 2400,
    arrow: "forward",
    phases: [
      { label: "Setup", detail: "One weight at one side, shoulders level." },
      { label: "Walk", detail: "Short controlled steps, resist the lean." },
      { label: "Reset", detail: "Set down under control and switch sides." },
    ],
    cues: [
      { icon: "core", text: "Stay square — don't tip" },
      { icon: "posture", text: "Tall chest, long neck" },
      { icon: "control", text: "Quiet, even steps" },
    ],
    coachCue: "Your core is the exercise, the walking is just the vehicle.",
  }),

  /* ------------------------- weighted cardio --------------------------- */
  squatToCurl: m({
    id: "squatToCurl",
    name: "Squat-to-Curl",
    equipment: "Light dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["squatTop", "squatBottom", "curlUp", "squatTop"],
    loopMs: 3600,
    arrow: "down",
    phases: [
      { label: "Setup", detail: "Feet shoulder width, light dumbbells at the sides." },
      { label: "Squat", detail: "Sit back to a comfortable depth — no jumping." },
      { label: "Curl", detail: "Stand tall, then curl both dumbbells up and lower." },
    ],
    cues: [
      { icon: "safety", text: "Low impact — feet stay on the floor" },
      { icon: "tempo", text: "Steady rhythm, keep breathing" },
      { icon: "control", text: "Light load, clean shapes" },
    ],
    coachCue: "Heart rate is the target here — not heavier dumbbells.",
  }),
  stepAltCurl: m({
    id: "stepAltCurl",
    name: "Step + Alternating Curl",
    equipment: "Light dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["stand", "stepOutCurl", "stand"],
    loopMs: 3200,
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Dumbbells at the sides, tall stance." },
      { label: "Step", detail: "Step out and plant the foot flat." },
      { label: "Curl", detail: "Curl one arm as the foot lands, lower under control." },
    ],
    cues: [
      { icon: "control", text: "Elbows stay at the ribs" },
      { icon: "safety", text: "Step — never hop" },
      { icon: "breathe", text: "Exhale on the curl" },
    ],
    coachCue: "Smooth steps, controlled arms — the curl follows the foot.",
  }),
  stepShoulderPress: m({
    id: "stepShoulderPress",
    name: "Step + Shoulder Press",
    equipment: "Light dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["pressRack", "stepOutPress", "pressRack"],
    loopMs: 3200,
    phases: [
      { label: "Setup", detail: "Dumbbells racked at ear height." },
      { label: "Step", detail: "Step out and plant, staying tall." },
      { label: "Press", detail: "Press overhead as the foot lands, lower under control." },
    ],
    cues: [
      { icon: "core", text: "Ribs down as you press" },
      { icon: "safety", text: "Light weight only" },
      { icon: "breathe", text: "Exhale on the press" },
    ],
    coachCue: "Tall spine — the press comes from a stacked body.",
  }),
  reverseStepRow: m({
    id: "reverseStepRow",
    name: "Reverse Step + Row",
    equipment: "Light dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["stand", "reverseStep", "reverseStepRow", "stand"],
    loopMs: 3600,
    arrow: "up",
    phases: [
      { label: "Setup", detail: "Tall, dumbbells hanging, soft knees." },
      { label: "Step back", detail: "Step one foot back and hinge slightly." },
      { label: "Row", detail: "Pull both elbows to the ribs, then return and stand." },
    ],
    cues: [
      { icon: "posture", text: "Flat back on the hinge" },
      { icon: "safety", text: "Small hinge, light load" },
      { icon: "control", text: "Alternate legs each rep" },
    ],
    coachCue: "Step back, hinge short, row clean.",
  }),
  lightPunches: m({
    id: "lightPunches",
    name: "Shadowbox Punches (no weights)",
    equipment: "Hands empty — no dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["boxGuard", "jab", "boxGuard", "cross"],
    loopMs: 2400,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Guard", detail: "Hands up at the cheeks, elbows in, knees soft." },
      { label: "Punch", detail: "Straight out from the chin to full extension — never locked." },
      { label: "Reset", detail: "Snap the hand straight back to the guard every rep." },
    ],
    cues: [
      { icon: "safety", text: "No weights for fast punches" },
      { icon: "safety", text: "Never snap the elbow straight" },
      { icon: "breathe", text: "Short exhale each punch" },
    ],
    coachCue: "Speed comes from the return, not the punch.",
  }),

  farmerMarch: m({
    id: "farmerMarch",
    name: "Farmer / Suitcase March",
    equipment: "Dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["carryLeft", "marchUp", "carryRight", "marchUp"],
    loopMs: 2800,
    arrow: "up",
    phases: [
      { label: "Setup", detail: "Weights at the sides, shoulders packed." },
      { label: "March", detail: "Lift one knee to hip height and hold a beat." },
      { label: "Switch", detail: "Place the foot down quietly and change legs." },
    ],
    cues: [
      { icon: "core", text: "Stay tall, don't lean" },
      { icon: "safety", text: "Marching only — no running" },
      { icon: "control", text: "Quiet feet" },
    ],
    coachCue: "Hold each knee a half-second at the top.",
  }),
  controlledShoulderWork: m({
    id: "controlledShoulderWork",
    name: "Controlled Shoulder Work",
    equipment: "Very light dumbbells",
    mode: "time",
    work: "40 sec work / 20 sec transition",
    keyframes: ["raiseDown", "raiseUp", "shoulderOverhead", "raiseDown"],
    loopMs: 4000,
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Light weights, tall posture, ribs down." },
      { label: "Raise", detail: "Out to shoulder height with slow control." },
      { label: "Finish", detail: "Sweep overhead only if it is pain-free, then lower." },
    ],
    cues: [
      { icon: "range", text: "Pain-free range only" },
      { icon: "tempo", text: "Slow and even" },
      { icon: "safety", text: "Stop if the shoulder pinches" },
    ],
    coachCue: "Quality reps — this is shoulder health, not a burnout.",
  }),

  /* ----------------------- boxing / kickboxing ------------------------- */
  boxingStance: m({
    id: "boxingStance",
    name: "Boxing Stance",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "slip", "boxGuard"],
    loopMs: 3000,
    load: "none",
    arrow: "none",
    phases: [
      { label: "Set", detail: "Lead foot forward, back heel light, knees soft." },
      { label: "Guard", detail: "Hands at the cheekbones, elbows tucked to the ribs." },
      { label: "Move", detail: "Small shuffle steps — feet never cross or leave the floor." },
    ],
    cues: [
      { icon: "safety", text: "Low impact — no bouncing" },
      { icon: "posture", text: "Chin down, eyes up" },
      { icon: "core", text: "Weight centred" },
    ],
    coachCue: "Everything in boxing starts and ends in this shape.",
  }),
  jab: m({
    id: "jab",
    name: "Jab",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "jab", "boxGuard"],
    loopMs: 1800,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Guard", detail: "Start in stance, hands high." },
      { label: "Jab", detail: "Lead hand straight out, small rotation of the fist." },
      { label: "Return", detail: "Pull the hand straight back to the cheek." },
    ],
    cues: [
      { icon: "safety", text: "Don't hyperextend the elbow" },
      { icon: "control", text: "Shoulder covers the chin" },
      { icon: "breathe", text: "Sharp exhale" },
    ],
    coachCue: "Out and back on the same line.",
  }),
  cross: m({
    id: "cross",
    name: "Cross",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "cross", "boxGuard"],
    loopMs: 2000,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Guard", detail: "Stance set, rear hand at the cheek." },
      { label: "Rotate", detail: "Turn the back foot and hip as the rear hand fires." },
      { label: "Recover", detail: "Rotate back and re-set the guard." },
    ],
    cues: [
      { icon: "control", text: "Power from the hip, not the arm" },
      { icon: "posture", text: "Lead hand stays up" },
      { icon: "safety", text: "Pivot the back foot to protect the knee" },
    ],
    coachCue: "Turn the hip, the hand just goes along for the ride.",
  }),
  jabCross: m({
    id: "jabCross",
    name: "Jab–Cross Combination",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "jab", "cross", "boxGuard"],
    loopMs: 2600,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Guard", detail: "Set the stance." },
      { label: "1 — Jab", detail: "Lead hand out and straight back." },
      { label: "2 — Cross", detail: "Rear hand with hip rotation, then reset." },
    ],
    cues: [
      { icon: "tempo", text: "Rhythm before speed" },
      { icon: "control", text: "Always return to guard" },
      { icon: "breathe", text: "Exhale on each punch" },
    ],
    coachCue: "One-two, then breathe — never rush the reset.",
  }),
  defensiveReset: m({
    id: "defensiveReset",
    name: "Defensive Reset / Movement",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "slip", "boxGuard", "slip"],
    loopMs: 2800,
    load: "none",
    arrow: "none",
    phases: [
      { label: "Guard", detail: "Tall stance, hands high." },
      { label: "Slip", detail: "Small bend at the knees and waist to one side." },
      { label: "Reset", detail: "Return to centre with the guard intact." },
    ],
    cues: [
      { icon: "safety", text: "Bend the knees, not the low back" },
      { icon: "control", text: "Small movements" },
      { icon: "posture", text: "Eyes forward" },
    ],
    coachCue: "Slip small — big movement is wasted energy.",
  }),
  cablePunch: m({
    id: "cablePunch",
    name: "Cable Punch",
    equipment: "Cable at chest height",
    mode: "reps",
    work: "3 × 10–12 each side",
    keyframes: ["cablePunchLoad", "jab", "cablePunchLoad"],
    loopMs: 2400,
    load: "cable",
    arrow: "forward",
    phases: [
      { label: "Setup", detail: "Stagger stance, handle at the chest, elbow tucked." },
      { label: "Punch", detail: "Press straight out, rotating the ribs and hip." },
      { label: "Return", detail: "Resist the cable back to the chest." },
    ],
    cues: [
      { icon: "core", text: "Rotate through the trunk" },
      { icon: "safety", text: "Soft elbow at the end" },
      { icon: "control", text: "Slow return" },
    ],
    coachCue: "Punch from the ground up.",
  }),
  frontKick: m({
    id: "frontKick",
    name: "Front Kick",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "kneeChamber", "frontKick", "boxGuard"],
    loopMs: 3000,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Guard", detail: "Stance set, weight on the back foot." },
      { label: "Chamber", detail: "Lift the knee first — always." },
      { label: "Extend", detail: "Push the foot forward at waist height, then re-chamber." },
    ],
    cues: [
      { icon: "safety", text: "Never snap the knee straight" },
      { icon: "control", text: "Knee up before the foot goes out" },
      { icon: "core", text: "Stay tall, don't fall back" },
    ],
    coachCue: "Chamber, extend, chamber, set down.",
  }),
  roundKick: m({
    id: "roundKick",
    name: "Round Kick",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "kneeChamber", "roundKick", "boxGuard"],
    loopMs: 3200,
    load: "none",
    arrow: "out",
    phases: [
      { label: "Guard", detail: "Stance set, hands high." },
      { label: "Chamber", detail: "Knee lifts across the body as the base foot pivots." },
      { label: "Whip", detail: "Turn the hip over at low/medium height, then re-set." },
    ],
    cues: [
      { icon: "safety", text: "Pivot the base foot — protects the knee" },
      { icon: "range", text: "Keep it low and controlled" },
      { icon: "posture", text: "Guard stays up" },
    ],
    coachCue: "Pivot first, kick second.",
  }),
  kneeChamber: m({
    id: "kneeChamber",
    name: "Knee Chamber",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "kneeChamber", "boxGuard"],
    loopMs: 2200,
    load: "none",
    arrow: "up",
    phases: [
      { label: "Guard", detail: "Tall stance, hands high." },
      { label: "Drive", detail: "Knee up and slightly across, hips forward." },
      { label: "Set down", detail: "Place the foot quietly — never stomp or hop." },
    ],
    cues: [
      { icon: "core", text: "Squeeze the abs on the drive" },
      { icon: "safety", text: "Both feet stay low impact" },
      { icon: "breathe", text: "Exhale each knee" },
    ],
    coachCue: "Hips forward at the top of every knee.",
  }),
  guardReset: m({
    id: "guardReset",
    name: "Guard / Reset Drill",
    equipment: "Body weight",
    mode: "time",
    work: "40 sec",
    keyframes: ["boxGuard", "jab", "slip", "boxGuard"],
    loopMs: 3000,
    load: "none",
    arrow: "none",
    phases: [
      { label: "Guard", detail: "Set the shape and breathe." },
      { label: "Work", detail: "One punch or one small movement." },
      { label: "Reset", detail: "Return to guard before the next action." },
    ],
    cues: [
      { icon: "control", text: "Reset every single rep" },
      { icon: "posture", text: "Hands never drop" },
      { icon: "breathe", text: "Steady breathing" },
    ],
    coachCue: "The reset is the drill.",
  }),
  medBallChestPass: m({
    id: "medBallChestPass",
    name: "Medicine-Ball Chest Pass",
    equipment: "Light medicine ball + wall",
    mode: "reps",
    work: "3 × 8–10",
    keyframes: ["medBallLoad", "medBallRelease", "medBallLoad"],
    loopMs: 2200,
    load: "ball",
    arrow: "forward",
    phases: [
      { label: "Setup", detail: "Athletic stance, ball at the chest, feet planted." },
      { label: "Pass", detail: "Push the ball out fast at chest height." },
      { label: "Reset", detail: "Catch or pick up and re-set — feet stay on the floor." },
    ],
    cues: [
      { icon: "safety", text: "No jumping" },
      { icon: "core", text: "Brace before the push" },
      { icon: "control", text: "Light ball, fast hands" },
    ],
    coachCue: "Power practice, not a conditioning burnout.",
  }),

  /* ---------------------------- mobility ------------------------------- */
  hipFlexorStretch: m({
    id: "hipFlexorStretch",
    name: "Hip-Flexor Stretch",
    equipment: "Mat or pad",
    mode: "time",
    work: "20–30 sec each side",
    keyframes: ["hipFlexorStretch", "hipFlexorSink", "hipFlexorStretch"],
    loopMs: 4000,
    load: "none",
    arrow: "down",
    phases: [
      { label: "Setup", detail: "Half-kneeling, back knee padded, front foot flat." },
      { label: "Tuck", detail: "Tuck the tailbone under and squeeze the back glute." },
      { label: "Hold", detail: "Sink forward a small amount and breathe for 20–30 sec." },
    ],
    cues: [
      { icon: "core", text: "Tuck the pelvis first" },
      { icon: "breathe", text: "Slow nose breathing" },
      { icon: "safety", text: "Stretch, never pain" },
    ],
    coachCue: "The glute squeeze does more than leaning forward.",
  }),
  shoulderMobility: m({
    id: "shoulderMobility",
    name: "Shoulder Mobility",
    equipment: "Body weight or band",
    mode: "time",
    work: "20–30 sec",
    keyframes: ["stand", "shoulderCircle", "shoulderOverhead", "stand"],
    loopMs: 4400,
    load: "none",
    arrow: "up",
    phases: [
      { label: "Setup", detail: "Tall stance, ribs down, arms at the sides." },
      { label: "Sweep", detail: "Sweep the arms out and up through a pain-free arc." },
      { label: "Return", detail: "Bring them back down slowly, keeping the ribs quiet." },
    ],
    cues: [
      { icon: "range", text: "Only where it is pain-free" },
      { icon: "tempo", text: "Slow, controlled arcs" },
      { icon: "posture", text: "No arching the low back" },
    ],
    coachCue: "Earn the overhead position, don't force it.",
  }),
  chestMobility: m({
    id: "chestMobility",
    name: "Chest Mobility",
    equipment: "Doorway or wall",
    mode: "time",
    work: "20–30 sec each side",
    keyframes: ["chestOpen", "chestDoorway", "chestOpen"],
    loopMs: 4000,
    load: "none",
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Forearm on the doorway at shoulder height." },
      { label: "Turn", detail: "Rotate the chest away until you feel a light stretch." },
      { label: "Hold", detail: "Breathe for 20–30 sec, then switch sides." },
    ],
    cues: [
      { icon: "safety", text: "Light stretch only — no pinching" },
      { icon: "posture", text: "Elbow at or below shoulder height" },
      { icon: "breathe", text: "Long exhales" },
    ],
    coachCue: "If the front of the shoulder pinches, lower the elbow.",
  }),
  hamstringMobility: m({
    id: "hamstringMobility",
    name: "Hamstring Mobility",
    equipment: "Body weight or low step",
    mode: "time",
    work: "20–30 sec each side",
    keyframes: ["stand", "hamstringStretch", "stand"],
    loopMs: 4200,
    load: "none",
    arrow: "down",
    phases: [
      { label: "Setup", detail: "One heel forward on the floor or a low step." },
      { label: "Hinge", detail: "Hips back with a flat back until the hamstring lengthens." },
      { label: "Hold", detail: "Breathe for 20–30 sec, then switch legs." },
    ],
    cues: [
      { icon: "posture", text: "Flat back — hinge, don't round" },
      { icon: "breathe", text: "Exhale into the stretch" },
      { icon: "safety", text: "No bouncing" },
    ],
    coachCue: "Chest toward the toes, spine long.",
  }),
  lowerBodyMobility: m({
    id: "lowerBodyMobility",
    name: "Lower-Body Mobility Flow",
    equipment: "Mat",
    mode: "time",
    work: "20–30 sec per position",
    keyframes: ["stand", "squatTop", "squatBottom", "stand"],
    loopMs: 4800,
    load: "none",
    arrow: "down",
    phases: [
      { label: "Setup", detail: "Feet shoulder width, hold support if needed." },
      { label: "Sink", detail: "Sink into a comfortable squat and rock gently side to side." },
      { label: "Stand", detail: "Come up tall and reset the breath." },
    ],
    cues: [
      { icon: "range", text: "Comfortable depth only" },
      { icon: "control", text: "Hold support if balance is off" },
      { icon: "breathe", text: "Breathe through every position" },
    ],
    coachCue: "Recovery day — nothing here should ever burn.",
  }),
  deadBug: m({
    id: "deadBug",
    name: "Dead Bug",
    equipment: "Mat",
    mode: "reps",
    work: "2 × 8 each side",
    keyframes: ["deadBugish", "stand", "deadBugish"],
    loopMs: 3600,
    load: "none",
    arrow: "none",
    phases: [
      { label: "Setup", detail: "On the back, knees and arms up, low back flat." },
      { label: "Extend", detail: "Lower one arm and the opposite leg slowly." },
      { label: "Return", detail: "Come back to the start keeping the back flat." },
    ],
    cues: [
      { icon: "core", text: "Low back stays glued down" },
      { icon: "breathe", text: "Exhale as you extend" },
      { icon: "control", text: "Short range if the back lifts" },
    ],
    coachCue: "If the low back arches, shorten the range.",
  }),
  gluteBridge: m({
    id: "gluteBridge",
    name: "Glute Bridge",
    equipment: "Mat",
    mode: "reps",
    work: "2 × 12",
    keyframes: ["deadBugish", "stand", "deadBugish"],
    loopMs: 3200,
    load: "none",
    arrow: "up",
    phases: [
      { label: "Setup", detail: "On the back, knees bent, heels a hand-length from the backside." },
      {
        label: "Drive",
        detail: "Push through the heels to a straight line from knee to shoulder.",
      },
      { label: "Lower", detail: "Control the hips down until they just touch the floor." },
    ],
    cues: [
      { icon: "core", text: "Ribs down — hips finish the rep" },
      { icon: "control", text: "Squeeze the glutes for a full beat" },
      { icon: "breathe", text: "Exhale on the way up" },
    ],
    coachCue: "Push through the heels, not the toes.",
  }),

  easyWalk: m({
    id: "easyWalk",
    name: "Easy Walk / Treadmill",
    equipment: "Treadmill or floor",
    mode: "time",
    work: "3–5 min",
    keyframes: ["stand", "marchUp", "stand"],
    loopMs: 2400,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Start", detail: "Easy conversational pace, arms relaxed." },
      { label: "Build", detail: "Let the breathing rise slightly — nose breathing pace." },
      { label: "Settle", detail: "Stay smooth for the whole block." },
    ],
    cues: [
      { icon: "breathe", text: "Conversational pace" },
      { icon: "posture", text: "Tall and relaxed" },
      { icon: "safety", text: "Zero impact" },
    ],
    coachCue: "Warm the joints before you load them.",
  }),
  bandPullApart: m({
    id: "bandPullApart",
    name: "Band Pull-Apart",
    equipment: "Light resistance band",
    mode: "reps",
    work: "2 × 15",
    keyframes: ["hingeSoft", "rearFlyOpen", "hingeSoft"],
    load: "band",
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Band at chest height, arms long." },
      { label: "Open", detail: "Pull the band apart until it touches the chest." },
      { label: "Return", detail: "Control it back without letting it snap." },
    ],
    cues: [
      { icon: "posture", text: "Ribs down" },
      { icon: "control", text: "Squeeze the shoulder blades" },
      { icon: "tempo", text: "Slow return" },
    ],
    coachCue: "Great before every pressing day.",
  }),
  externalRotation: m({
    id: "externalRotation",
    name: "Shoulder External Rotation",
    equipment: "Band or light cable",
    mode: "reps",
    work: "2 × 12 each side",
    keyframes: ["pushdownBottom", "curlUpLeft", "pushdownBottom"],
    load: "band",
    arrow: "out",
    phases: [
      { label: "Setup", detail: "Elbow pinned to the ribs, forearm across the body." },
      { label: "Rotate", detail: "Rotate the forearm out — the elbow never lifts." },
      { label: "Return", detail: "Control back across the body." },
    ],
    cues: [
      { icon: "control", text: "Rotate, don't lift" },
      { icon: "safety", text: "Very light resistance" },
      { icon: "posture", text: "Shoulder down and back" },
    ],
    coachCue: "Rotator cuff work is insurance — keep it light.",
  }),
  battleRopeFinisher: m({
    id: "battleRopeFinisher",
    name: "Boxing / Battle-Rope Finisher",
    equipment: "Battle ropes or shadow boxing",
    mode: "time",
    work: "5–8 min",
    keyframes: ["boxGuard", "jab", "cross", "boxGuard"],
    loopMs: 2400,
    load: "none",
    arrow: "forward",
    phases: [
      { label: "Setup", detail: "Athletic stance, soft knees, feet planted." },
      { label: "Work", detail: "20–30 sec of ropes or punches at a steady pace." },
      { label: "Reset", detail: "20–30 sec easy — walk it off and breathe." },
    ],
    cues: [
      { icon: "safety", text: "Optional — skip if the shoulders are cooked" },
      { icon: "breathe", text: "Nose in, mouth out" },
      { icon: "control", text: "No jumping at any point" },
    ],
    coachCue: "Finish the session tired, not wrecked.",
  }),
};

export type MirrorKey = keyof typeof MIRROR_MOVES;

export const mirrorFor = (key?: string): MirrorMove | undefined =>
  key ? MIRROR_MOVES[key] : undefined;

/** Every move, for the browsable Mirror Me library. */
export const ALL_MIRROR_MOVES: MirrorMove[] = Object.values(MIRROR_MOVES);