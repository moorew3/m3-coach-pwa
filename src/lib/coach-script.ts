/**
 * COACH SCRIPT — premium trainer-led session
 * ------------------------------------------------------------------
 * Turns a day's plan into a single ordered list of coached steps and,
 * crucially, into REAL COACHING LANGUAGE: an emotional tone per phase,
 * exercise-specific setup and form cues, spaced live cues inside every
 * set, rising intensity on the last reps and a calm settled cooldown.
 *
 * Three ideas do the work:
 *   1. `tone` — every step carries the delivery style the coach should
 *      use ("calm" intro, "assertive" work, "urgent" final seconds,
 *      "settle" cooldown). The TTS layer style-prompts on it.
 *   2. `liveCues` — timed cues fired at meaningful moments INSIDE a
 *      set (setup, tempo, halfway, final ten seconds) instead of one
 *      line followed by silence. Deliberately spaced so the coach is
 *      never chattering over the work.
 *   3. Category cue libraries — pressing, pulling, curls, triceps,
 *      squats, hinges, carries, boxing, kicks, core, mobility and
 *      cardio each get their own technically sensible cues.
 *
 * The coach is also the on-screen demonstrator, so the language is
 * "match my movement" / "follow me", never "watch the avatar".
 */
import { orderedExercises, planForDay, type DayPlan, type Exercise } from "@/data/program";
import { coachingForExercise, coachingForMovement, type MovementCoaching } from "@/data/coach-cues";
import { kindOf } from "@/lib/exercise-kind";
import { estimateSpeechSeconds, type CoachTone } from "@/lib/coach-voice";
import * as N from "@/lib/coach-narration";
import type { Chapter, RecapFacts } from "@/lib/coach-narration";
import * as P from "@/lib/performance";
import type { AppState } from "@/lib/store";

export type StepKind = "intro" | "brief" | "work" | "rest" | "prompt" | "cooldown" | "complete";

/** A spoken cue fired part-way through a step, `at` seconds after it opens. */
export interface LiveCue {
  at: number;
  say: string;
  tone: CoachTone;
}

export interface CoachStep {
  id: string;
  kind: StepKind;
  /** "Warm-up" / "Main work" / "Cooldown" — shown as the section chip. */
  section: string;
  title: string;
  detail?: string;
  cues: string[];
  /** Spoken line when the step opens. */
  say: string;
  /** Delivery style for `say` — drives the TTS voice instructions. */
  tone: CoachTone;
  /** Spaced coaching inside the step so the coach stays with the user. */
  liveCues?: LiveCue[];
  /** Countdown length in seconds. When it hits zero the coach advances. */
  seconds?: number;
  /** Play "3 · 2 · 1 · GO" before a timed effort starts. */
  countdownIn?: boolean;
  exerciseId?: string;
  mirror?: string;
  setIndex?: number;
  totalSets?: number;
  reps?: string;
  /** Rep-based strength set — offer optional weight/rep logging. */
  logging?: boolean;
  /** What is coming after this step. */
  next?: string;
  /** Which chapter of the episode this step belongs to. */
  chapter?: Chapter;
  /**
   * Speech-led step: it ends the moment the coach finishes the line
   * (`seconds` is only the silent/muted fallback). No tap required.
   */
  speechPaced?: boolean;
}

interface DayCoaching {
  goal: string;
  equipment: string;
  duration: string;
  safety: string;
  restCue: string;
  cooldown: { name: string; seconds: number; cue: string; mirror?: string }[];
}

const COOL_WALK = {
  name: "Easy Walk — cool down",
  seconds: 180,
  cue: "Nose breathing. Let the heart rate settle.",
  mirror: "easyWalk",
};
const COOL_SHOULDER = {
  name: "Shoulder Mobility",
  seconds: 40,
  cue: "Slow arcs, pain-free range only.",
  mirror: "shoulderMobility",
};
const COOL_CHEST = {
  name: "Chest Mobility",
  seconds: 40,
  cue: "Open the chest, breathe out into the stretch.",
  mirror: "chestMobility",
};
const COOL_HIPS = {
  name: "Hip-Flexor Stretch",
  seconds: 60,
  cue: "30 seconds each side. Ribs down, glute on.",
  mirror: "hipFlexorStretch",
};
const COOL_HAM = {
  name: "Hamstring Mobility",
  seconds: 60,
  cue: "30 seconds each side. Soft knee, flat back.",
  mirror: "hamstringMobility",
};

export const DAY_COACHING: Record<string, DayCoaching> = {
  mon: {
    goal: "Build the shoulders and arms with clean, controlled pressing and direct arm work.",
    equipment: "Dumbbells, a bench, a light band and a cable or pressdown station.",
    duration: "About 50 minutes.",
    safety:
      "Free-weight pressing only — no machine shoulder press, no bench dips. Stop any set that pinches.",
    restCue: "Breathe through the nose, shake the arms out, stay near the weights.",
    cooldown: [COOL_SHOULDER, COOL_CHEST, COOL_WALK],
  },
  tue: {
    goal: "Low-impact weighted conditioning — burn fat while the arms and shoulders keep working.",
    equipment:
      "Light dumbbells, one to ten pounds, and empty hands for the punching intervals. Water within reach.",
    duration: "About 40 minutes.",
    safety: "Zero jumping. Feet stay on the floor all session. Never snap the elbow straight.",
    restCue: "Keep walking or stepping in place. Sip water. Do not sit down.",
    cooldown: [COOL_WALK, COOL_HIPS],
  },
  wed: {
    goal: "Press and pull for chest and back, then finish with direct arm work.",
    equipment: "Barbell or dumbbells, a bench, a chest-supported row and a pulldown station.",
    duration: "About 55 minutes.",
    safety: "Leave one or two reps in reserve on every pressing set. No heavy unsupported rows.",
    restCue: "Stand tall, breathe, set the next weight up before the clock ends.",
    cooldown: [COOL_CHEST, COOL_SHOULDER, COOL_WALK],
  },
  thu: {
    goal: "Restore. Move the joints, unload the tissue and leave feeling better than you arrived.",
    equipment: "A mat and a wall. That is it.",
    duration: "About 25 minutes.",
    safety: "Nothing here should burn or pinch. Stretch to mild tension only, never pain.",
    restCue: "Keep breathing slowly. Long exhale.",
    cooldown: [COOL_HIPS, COOL_HAM],
  },
  fri: {
    goal: "Full-body strength with a heavy dose of arms to close the training week.",
    equipment: "Dumbbells, a trap bar or leg press, a bench and a cable station.",
    duration: "About 55 minutes.",
    safety: "Depth is never the goal — stop where the position feels strong. No jumping.",
    restCue: "Reset your setup now so the next set starts on time.",
    cooldown: [COOL_HIPS, COOL_SHOULDER, COOL_WALK],
  },
  sat: {
    goal: "Boxing and kickboxing conditioning — work capacity, shoulders and core, all low impact.",
    equipment: "Space to move, water, and empty hands — no weights for punching.",
    duration: "About 35 minutes.",
    safety: "Never fully lock out a punch. Feet stay grounded — no jumping or hopping.",
    restCue: "Stay light on the feet, hands up, breathe out sharply.",
    cooldown: [COOL_WALK, COOL_SHOULDER, COOL_HIPS],
  },
  sun: {
    goal: "Rest day. Walk, hydrate, sleep — this is when the arms actually grow.",
    equipment: "Nothing.",
    duration: "10 to 20 easy minutes.",
    safety: "If anything is still sore tomorrow, keep it easy again.",
    restCue: "Easy breathing.",
    cooldown: [COOL_WALK, COOL_HAM],
  },
};

export const coachingFor = (plan: DayPlan): DayCoaching =>
  DAY_COACHING[plan.key] ?? DAY_COACHING.mon;

/** Seconds inside a prescription like "40 sec work" or "2 min". */
export function parseSeconds(reps: string): number | null {
  const s = /(\d+)\s*(?:sec|s\b)/i.exec(reps);
  if (s) return Number(s[1]);
  const m = /(\d+)(?:\s*[–-]\s*\d+)?\s*min/i.exec(reps);
  if (m) return Number(m[1]) * 60;
  return null;
}

const sectionFor = (plan: DayPlan, e: Exercise): string => {
  if (plan.warmup.some((w) => w.id === e.id)) return "Warm-up";
  if (plan.finisher.some((f) => f.id === e.id)) return "Finisher";
  return "Main work";
};

/* ------------------------ exercise cue libraries ----------------------- */

type Category =
  | "press"
  | "pull"
  | "curl"
  | "triceps"
  | "delts"
  | "squat"
  | "hinge"
  | "carry"
  | "boxing"
  | "kick"
  | "core"
  | "mobility"
  | "cardio";

interface CueSet {
  /** Spoken while setting up, before the first rep. */
  setup: string;
  /** Technique reminders — rotated so nothing repeats back to back. */
  form: string[];
  /** Breathing / tempo line. */
  tempo: string;
  /** Said as the set closes out. */
  finish: string;
}

const CUES: Record<Category, CueSet> = {
  press: {
    setup:
      "Shoulder blades set back and down, ribs stacked over the hips, wrists straight over the elbows.",
    form: [
      "Elbows about forty-five degrees from the body — not flared wide.",
      "Press through the whole hand, not just the fingers.",
      "Stop just short of locking the elbow. Keep the tension on the muscle.",
      "Same path every rep. If a shoulder pinches, shorten the range.",
    ],
    tempo: "Two seconds lowering, then drive. Breathe out as you press.",
    finish: "Last reps — smooth path, full lockout control, no bouncing off the chest.",
  },
  pull: {
    setup:
      "Chest tall, shoulders down away from the ears, take the slack out before the first rep.",
    form: [
      "Lead with the elbows, not the hands.",
      "Pull the shoulder blades together, then squeeze for a beat.",
      "Control the way back out — that half is where the back grows.",
      "No shrugging. Keep the traps quiet and the lats working.",
    ],
    tempo: "Pull for one, squeeze for one, lower for two.",
    finish: "Finish strong — full squeeze on every one of these last reps.",
  },
  curl: {
    setup: "Elbows pinned by the ribs, shoulders back, soft knees, no rocking.",
    form: [
      "Elbows stay still — only the forearm moves.",
      "Squeeze hard at the top before you lower.",
      "Lower slower than you lift. That is where the arm size comes from.",
      "No swinging from the hips. If it swings, the weight is too heavy.",
    ],
    tempo: "One up, hold the squeeze, three seconds down.",
    finish: "This is the growth zone — burn is fine, keep the form clean.",
  },
  triceps: {
    setup: "Upper arms locked to the sides, slight forward lean, core braced.",
    form: [
      "Only the elbow opens and closes.",
      "Extend to nearly straight — never snap the elbow.",
      "Keep the shoulders down and out of it.",
      "Squeeze the back of the arm for a beat at the bottom.",
    ],
    tempo: "Push for one, squeeze, then two seconds back.",
    finish: "Last few — full extension, controlled return, own the burn.",
  },
  delts: {
    setup: "Small bend in the elbows, thumbs level with the knuckles, chest proud.",
    form: [
      "Lead with the elbows and stop at shoulder height.",
      "No shrugging — keep the traps out of it.",
      "Lower slow. Do not drop the weight back down.",
      "Lighter is better here. This is precision, not power.",
    ],
    tempo: "Up for one, down for three.",
    finish: "Final reps — keep the height honest even as it burns.",
  },
  squat: {
    setup: "Feet planted, whole foot on the floor, brace the core like you are about to be nudged.",
    form: [
      "Knees track over the toes — do not let them collapse in.",
      "Chest stays up as you sit down between the hips.",
      "Drive the floor away through mid-foot.",
      "Depth is never the goal. Stop where the position stays strong.",
    ],
    tempo: "Three seconds down, drive up with control.",
    finish: "Last reps — brace, stay tall, finish every one all the way up.",
  },
  hinge: {
    setup: "Soft knees, long spine, weight close to the legs, hips loaded back.",
    form: [
      "Push the hips back — this is a hinge, not a squat.",
      "Keep the bar or dumbbells brushing the thighs.",
      "Feel the hamstrings load. Stop before the back rounds.",
      "Finish by squeezing the glutes, not by leaning back.",
    ],
    tempo: "Slow down, powerful up, no jerking off the floor.",
    finish: "Final reps — flat back, strong glute finish, keep it clean.",
  },
  carry: {
    setup: "Stand tall, shoulders packed, grip hard, brace the midsection.",
    form: [
      "Ribs down, walk tall — do not lean away from the weight.",
      "Short controlled steps, quiet feet.",
      "Breathe. Do not hold your breath through the whole carry.",
      "Keep the shoulders level side to side.",
    ],
    tempo: "Steady pace the whole way. No rushing.",
    finish: "Nearly there — hold that posture right to the end.",
  },
  boxing: {
    setup: "Hands up by the cheeks, chin tucked, elbows in, feet grounded and shoulder width.",
    form: [
      "Rotate the hips and shoulders into every shot.",
      "Snap it out, snap it back — never lock the elbow.",
      "Hands come straight back to the guard.",
      "Breathe out sharply on each punch.",
    ],
    tempo: "Sharp and rhythmic. Quality over speed.",
    finish: "Last ten — hands high, sharp shots, finish this round strong.",
  },
  kick: {
    setup: "Guard up, weight into the standing leg, knee soft, eyes forward.",
    form: [
      "Chamber the knee first, then extend.",
      "Recoil under control — never let the leg fall.",
      "Stay tall through the standing hip.",
      "Feet stay grounded between reps. No hopping.",
    ],
    tempo: "Controlled and deliberate, both sides even.",
    finish: "Final seconds — keep the height and keep the guard up.",
  },
  core: {
    setup: "Low back gently flat, ribs down, breathe into the belly before you start.",
    form: [
      "Move slow. The slower this is, the harder it works.",
      "Keep the low back quiet against the floor.",
      "Exhale on the effort, do not hold your breath.",
      "If the back arches, shorten the range.",
    ],
    tempo: "Slow and controlled — no momentum.",
    finish: "Last few — stay braced, keep it smooth.",
  },
  mobility: {
    setup: "Easy range to start. This should feel like it is opening you up, not testing you.",
    form: [
      "Mild tension only — never pain.",
      "Breathe into the position and relax on the exhale.",
      "Move smoothly through the range, no bouncing.",
      "Even time both sides.",
    ],
    tempo: "Slow, easy, controlled.",
    finish: "Ease out of it. Nice work.",
  },
  cardio: {
    setup: "Tall posture, relaxed shoulders, easy steady rhythm.",
    form: [
      "Nose breathing if you can hold it.",
      "Relax the hands and the jaw.",
      "Steady pace — you should be able to talk in short sentences.",
      "Stay light on the feet, no pounding.",
    ],
    tempo: "Find your rhythm and hold it.",
    finish: "Bring it home. Steady to the end.",
  },
};

const CATEGORY_TESTS: [Category, RegExp][] = [
  ["kick", /kick|knee ?chamber/i],
  ["boxing", /jab|cross|punch|boxing|guard|hook|rope/i],
  ["curl", /curl/i],
  ["triceps", /tricep|pressdown|pushdown|overhead extension|pullover|close.?grip/i],
  ["delts", /lateral raise|rear delt|external rotation|band pull|face pull|shoulder mobility/i],
  ["press", /press|push.?up|chest|fly|bench/i],
  ["pull", /row|pulldown|pull.?up|lat /i],
  ["hinge", /deadlift|hip thrust|glute bridge|romanian|hamstring curl|leg curl/i],
  ["squat", /squat|leg press|lunge|split|step.?up|calf/i],
  ["carry", /carry|farmer|march|suitcase/i],
  ["core", /dead ?bug|plank|crunch|pallof|core|ab /i],
  ["mobility", /mobility|stretch|flexor|warm|controlled shoulder/i],
  ["cardio", /walk|treadmill|bike|row erg|cardio|incline/i],
];

export function categoryOf(e: Exercise): Category {
  if (e.category) return e.category;
  const hay = `${e.name} ${e.id} ${e.target}`;
  for (const [cat, re] of CATEGORY_TESTS) if (re.test(hay)) return cat;
  return "press";
}

/** Deterministic rotation so cues vary between sets but never repeat twice running. */
const rotate = (list: string[], n: number) => list[((n % list.length) + list.length) % list.length];

/* ---------------------- motivation across the session ------------------ */

/** 0 = start of session, 1 = final work. Drives how hard the coach pushes. */
const EARLY = [
  "Good start. Set the standard here.",
  "Nice and controlled — this is the quality we keep all session.",
  "That is the pace. Measured, strong, repeatable.",
];
const MID = [
  "You are through the hard middle. That is consistency showing up.",
  "Halfway through the session and the form is holding. That is the win.",
  "This is where the work banks. Keep it exactly here.",
];
const LATE = [
  "Last stretch of the session — this is the part that changes you.",
  "End of the workout. Give me your best sets of the day.",
  "Final movements. Everything you have left, right here.",
];

const progressLine = (ratio: number, n: number) =>
  ratio < 0.34 ? rotate(EARLY, n) : ratio < 0.72 ? rotate(MID, n) : rotate(LATE, n);

/* ---------------------------- cue composition -------------------------- */

/**
 * Movement-specific coaching, with the old category library kept ONLY as
 * a last-resort fallback. `specific` tells the caller whether the coach
 * is talking about this exact movement or a category.
 */
export type ResolvedCues = MovementCoaching & { specific: boolean };

export function movementCues(e: Exercise): ResolvedCues {
  const m = coachingForExercise(e);
  if (m) return { ...m, specific: true };
  const c = CUES[categoryOf(e)];
  return {
    specific: false,
    label: `the ${e.name.toLowerCase()}`,
    muscles: e.target.toLowerCase(),
    setup: e.notes ?? c.setup,
    start: "Set your position first, then start the first rep.",
    path: "Full range in both directions, under control.",
    form: c.form,
    breathing: "Breathe out on the effort.",
    tempo: c.tempo,
    errors: [],
    finalReps: c.finish,
    finalSeconds: c.finish,
    prep: `Set yourself up for ${e.name}.`,
  };
}

/** Cooldown movements resolve straight off the movement key. */
export function cooldownCues(key?: string): MovementCoaching | undefined {
  return key ? coachingForMovement(key) : undefined;
}

/** Exercises in the whole program with no movement-specific definition. */
export function missingMovementCoaching(): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (let d = 1; d <= 7; d++) {
    for (const e of orderedExercises(d, false)) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      if (!coachingForExercise(e)) out.push({ id: e.id, name: e.name });
    }
  }
  return out;
}

/**
 * Spaced live coaching inside a TIMED effort. Cues land at meaningful
 * moments and leave long silences in between so the user can train.
 */
function timedCues(seconds: number, cu: ResolvedCues, n: number, isFinisher: boolean): LiveCue[] {
  const out: LiveCue[] = [];
  if (seconds >= 20)
    out.push({ at: Math.round(seconds * 0.2), say: rotate(cu.form, n), tone: "assertive" });
  if (seconds >= 45)
    out.push({
      at: Math.round(seconds * 0.5),
      say: `Halfway. ${cu.breathing}`,
      tone: isFinisher ? "hype" : "assertive",
    });
  if (seconds >= 75)
    out.push({
      at: Math.round(seconds * 0.72),
      say: cu.errors.length ? rotate(cu.errors, n) : rotate(cu.form, n + 1),
      tone: "assertive",
    });
  if (seconds >= 25)
    out.push({
      at: Math.max(4, seconds - 10),
      say: cu.finalSeconds ?? cu.finalReps,
      tone: "urgent",
    });
  return out;
}

/**
 * Live coaching inside a REP set. There is no clock on the screen, so
 * these fire on elapsed time and stay sparse — one technical cue early,
 * one correction mid-set, one stronger cue on the final reps.
 */
function repCues(cu: ResolvedCues, n: number, last: boolean): LiveCue[] {
  const out: LiveCue[] = [{ at: 12, say: rotate(cu.form, n), tone: "assertive" }];
  out.push({
    at: 30,
    say: cu.errors.length ? rotate(cu.errors, n) : cu.breathing,
    tone: "assertive",
  });
  out.push({
    at: 48,
    say: last ? `Last set of ${cu.label}. ${cu.finalReps}` : cu.finalReps,
    tone: last ? "urgent" : "assertive",
  });
  return out;
}

/* ------------------------------ the script ----------------------------- */

/** Speech-led steps: the fallback clock is the estimated line length + a beat. */
const paced = (say: string, pad = 2) => Math.max(4, Math.ceil(estimateSpeechSeconds(say)) + pad);

export interface BuildOptions {
  /** Real facts for the recap (logged sets, elapsed minutes, names). */
  recap?: RecapFacts;
  /**
   * Performance memory. When present the coach references what the user
   * actually did — last session at setup, the sets just logged at each
   * set opener, and real numbers in the recap.
   */
  perf?: { state: AppState; day: number };
  /** Selected user session. Omitted for the scheduled program. */
  plan?: DayPlan;
  exercises?: Exercise[];
  /** The athlete's own name, so the coach greets a person, not a screen. */
  athlete?: string;
}

/**
 * Build the full coached session for a day as ONE continuous episode:
 * opening → equipment → warm-up → main blocks → check-in → last block →
 * cooldown → recap. Only rep-based strength sets wait for the user
 * ("Done set"); everything else is speech- or clock-paced.
 *
 * `setsFor` lets the caller respect logged/edited set counts.
 */
export function buildCoachScript(
  day: number,
  useSupersets: boolean,
  setsFor: (e: Exercise) => number = (e) => e.sets,
  options: BuildOptions = {},
): CoachStep[] {
  const plan = options.plan ?? planForDay(day);
  const c = options.plan
    ? {
        goal: plan.summary,
        equipment: "Bring what you need for the activity, plus water.",
        duration: "Your selected duration and sequence.",
        safety:
          "Work at a controlled effort. Stop for sharp pain, dizziness, numbness or unusual shortness of breath.",
        restCue: "Breathe, check your pace, and get ready for the next effort.",
        cooldown: plan.type === "boxing" ? [COOL_WALK, COOL_SHOULDER] : [COOL_WALK],
      }
    : coachingFor(plan);
  const list = options.exercises ?? orderedExercises(day, useSupersets);
  const perf = options.perf;
  const steps: CoachStep[] = [];
  const first = list[0];

  const mains = list.filter((e) => sectionFor(plan, e) === "Main work");
  const warmups = list.filter((e) => sectionFor(plan, e) === "Warm-up");
  const mainNames = mains.map((e) => e.name);
  const halfwayAt = mains.length >= 4 ? Math.floor(mains.length / 2) : -1;

  /* 1 · opening */
  const openSay = N.opening(plan, c, mainNames, options.athlete);
  steps.push({
    id: "intro",
    kind: "intro",
    chapter: "opening",
    section: plan.title,
    title: `${plan.title} — ${plan.focus}`,
    detail: c.goal,
    cues: [
      `Duration: ${c.duration}`,
      `Focus: ${plan.focus}`,
      mainNames.length ? `Main block: ${mainNames.join(" · ")}` : "",
    ],
    say: openSay,
    tone: "calm",
    speechPaced: true,
    seconds: paced(openSay, 3),
    next: "Equipment check",
  });

  /* 2 · equipment check */
  const eqSay = N.equipmentCheck(c, first);
  steps.push({
    id: "equipment",
    kind: "intro",
    chapter: "equipment",
    section: "Equipment",
    title: "Equipment check",
    detail: c.equipment,
    cues: [`Safety: ${c.safety}`, first ? `First up: ${first.name}` : ""],
    say: eqSay,
    tone: "instructional",
    speechPaced: true,
    seconds: paced(eqSay, 4),
    next: first?.name,
  });

  /* Group consecutive superset partners into one block so the coach runs
     them the way a trainer actually does: A1 → straight into A2 → rest →
     back to A1. Everything else is a block of one. */
  type Block = Exercise[];
  const blocks: Block[] = [];
  list.forEach((e) => {
    const prev = blocks[blocks.length - 1];
    if (e.superset && prev && prev[0].superset === e.superset && prev.length < 3) prev.push(e);
    else blocks.push([e]);
  });

  let mainIdx = -1;
  let warmIdx = -1;
  const mainIndexOf = new Map<string, number>();
  const warmIndexOf = new Map<string, number>();
  list.forEach((e) => {
    const sec = sectionFor(plan, e);
    if (sec === "Main work") mainIndexOf.set(e.id, ++mainIdx);
    if (sec === "Warm-up") warmIndexOf.set(e.id, ++warmIdx);
  });

  const posOf = (e: Exercise): N.BlockPosition => {
    const section = sectionFor(plan, e);
    const mi = mainIndexOf.get(e.id) ?? -1;
    return {
      index: mi,
      total: mains.length,
      isFirstMain: section === "Main work" && mi === 0,
      isLastMain: section === "Main work" && mi === mains.length - 1 && !plan.finisher.length,
      isHalfway: section === "Main work" && mains.length === 3 && mi === 1,
      isWarmup: section === "Warm-up",
      isFinisher: section === "Finisher",
      warmupIndex: warmIndexOf.get(e.id) ?? -1,
      warmupTotal: warmups.length,
      mode: plan.type,
    };
  };

  const pushBrief = (e: Exercise, cu: ResolvedCues, total: number, straightIn: boolean) => {
    const section = sectionFor(plan, e);
    const pos = posOf(e);
    const chapter: Chapter = pos.isWarmup ? "warmup" : pos.isFinisher ? "finisher" : "main";
    const work = parseSeconds(e.reps);
    const briefTone: CoachTone = pos.isWarmup
      ? "instructional"
      : pos.isFinisher
        ? "hype"
        : "assertive";
    const intro = straightIn
      ? `No rest — straight into the partner movement, ${e.name}.`
      : N.introduce(e, pos, cu);
    const history = perf && !pos.isWarmup ? P.setupLine(perf.state, e, perf.day) : "";
    const briefSay = `${intro} ${N.briefBody(e, cu, total, e.superset && !straightIn ? (e.supersetSlot ?? e.superset) : undefined, work !== null)}${cu.safety ? ` ${cu.safety}` : ""}${history ? ` ${history}` : ""}`;
    steps.push({
      id: `${e.id}-brief`,
      kind: "brief",
      chapter,
      section,
      title: e.name,
      detail: `${e.target} · ${total} × ${e.reps}`,
      cues: [
        cu.setup,
        cu.path,
        e.substitutions?.length
          ? `Swap option if it doesn't feel right: ${e.substitutions[0]}`
          : "Match my movement — same tempo, same range.",
      ],
      say: briefSay,
      tone: briefTone,
      speechPaced: true,
      seconds: paced(briefSay, 3),
      exerciseId: e.id,
      mirror: e.mirror,
      totalSets: total,
      reps: e.reps,
      next: work !== null ? (pos.isWarmup ? e.reps : `Round 1 · ${e.reps}`) : `Set 1 · ${e.reps}`,
    });
  };

  blocks.forEach((block, bi) => {
    const nextBlock = blocks[bi + 1];
    const nextEx = nextBlock?.[0];
    const rounds = Math.max(...block.map((e) => Math.max(1, setsFor(e))));
    const lastEx = block[block.length - 1];
    const blockSection = sectionFor(plan, block[0]);
    const isMainBlock = blockSection === "Main work";

    for (let r = 0; r < rounds; r++) {
      const lastRound = r === rounds - 1;
      block.forEach((e, k) => {
        const total = Math.max(1, setsFor(e));
        if (r >= total) return;
        const section = sectionFor(plan, e);
        const pos = posOf(e);
        const cu = movementCues(e);
        const kind = kindOf(e);
        const work = parseSeconds(e.reps);
        const chapter: Chapter = pos.isWarmup ? "warmup" : pos.isFinisher ? "finisher" : "main";
        const ratio =
          mains.length > 1 && isMainBlock ? pos.index / (mains.length - 1) : pos.isFinisher ? 1 : 0;
        const last = r === total - 1;
        const weighted = kind === "weighted" || kind === "assisted" || kind === "band";
        const roundWord =
          work !== null && !pos.isWarmup
            ? /each side|per side/i.test(e.reps)
              ? "Side"
              : plan.type === "recovery"
                ? "Set"
                : "Round"
            : "Set";
        const reps = spokenReps(e.reps);
        const se = { ...e, reps };

        /* 6a · setup + demonstration (round 1) or the short hand-off (later rounds) */
        if (r === 0) pushBrief(se, cu, total, k > 0);
        else if (k > 0) {
          const handoff = `Straight over to ${cu.label} — set ${r + 1} of ${total}, ${reps}. ${rotate(cu.form, r + 1)}`;
          steps.push({
            id: `${e.id}-handoff-${r}`,
            kind: "rest",
            chapter,
            section,
            title: `Straight into ${e.name}`,
            detail: `${e.name} · set ${r + 1} of ${total} · no rest`,
            cues: [cu.setup, cu.prep],
            say: handoff,
            tone: "assertive",
            speechPaced: true,
            seconds: paced(handoff, 2),
            exerciseId: e.id,
            mirror: e.mirror,
            next: `Set ${r + 1}`,
          });
        }

        /* 6b · the set — short opener, then spaced live cues */
        const heavyPhase = ratio > 0.72 || pos.isFinisher;
        const workTone: CoachTone = pos.isWarmup
          ? "instructional"
          : heavyPhase && last
            ? "urgent"
            : pos.isFinisher
              ? "hype"
              : "assertive";
        const openWork =
          work !== null
            ? pos.isWarmup
              ? `${reps}, easy start and build into it. ${cu.start}`
              : `${roundWord} ${r + 1} of ${total}. ${work >= 60 ? `${Math.round(work / 60)} ${work >= 120 ? "minutes" : "minute"}` : `${work} seconds`} on the clock. ${rotate(cu.form, r)}`
            : `Set ${r + 1} of ${total}, ${reps}${/[a-z]/i.test(reps) ? "" : " reps"}. ${r === 0 ? cu.start : rotate(cu.form, r)} ${cu.breathing}${last ? " Best set of the group — make it count." : ""}`;
        // The coach knows what was just logged: "You got 10 on set one and
        // 9 on set two. Stay at 45 for set three — eight clean minimum."
        const sessionLine =
          perf && !pos.isWarmup && work === null
            ? P.setOpenerLine(perf.state, e, perf.day, r, total)
            : "";
        const openSay = sessionLine
          ? `${sessionLine} ${rotate(cu.form, r)} ${cu.breathing}`
          : openWork;

        steps.push({
          id: `${e.id}-work-${r}`,
          kind: "work",
          chapter,
          section,
          title: e.name,
          detail: `${roundWord} ${r + 1} of ${total} · ${e.reps}`,
          cues: [
            rotate(cu.form, r),
            cu.breathing,
            cu.errors.length ? rotate(cu.errors, r) : cu.path,
          ],
          say: openSay,
          tone: workTone,
          liveCues:
            work !== null
              ? timedCues(work, cu, r, pos.isFinisher)
              : pos.isWarmup
                ? [{ at: 15, say: rotate(cu.form, r + 1), tone: "instructional" }]
                : repCues(cu, r, last),
          seconds: work ?? undefined,
          /* every set — timed or rep-based — opens with a 3·2·1·GO after the
             coach's short brief, so the session plays itself between taps. */
          countdownIn: true,
          exerciseId: e.id,
          mirror: e.mirror,
          setIndex: r,
          totalSets: total,
          reps: e.reps,
          logging: weighted,
          next:
            k < block.length - 1 && r < Math.max(1, setsFor(block[k + 1]))
              ? block[k + 1].name
              : last
                ? (nextEx?.name ?? "Cooldown")
                : `${roundWord} ${r + 2} of ${total}`,
        });

        /* inside a pair: no rest — the partner movement follows immediately */
        const partnerFollows = k < block.length - 1 && r < Math.max(1, setsFor(block[k + 1]));
        if (partnerFollows) return;

        /* 7 · rest / 8 · exact next-movement transition */
        const blockDone = lastRound || block.every((x) => r >= Math.max(1, setsFor(x)) - 1);
        const rest =
          blockDone && !nextEx
            ? 0
            : blockDone
              ? (lastEx.supersetRest ?? lastEx.rest)
              : (e.supersetRest ?? e.rest);
        if (rest <= 0) return;

        const nextCu = nextEx ? movementCues(nextEx) : null;
        const nextIsLastMain =
          !!nextEx &&
          sectionFor(plan, nextEx) === "Main work" &&
          mains[mains.length - 1]?.id === nextEx.id &&
          mains.length > 2;
        const progress = nextIsLastMain
          ? N.lastBlockCue(nextEx!)
          : isMainBlock && sectionFor(plan, nextEx ?? e) === "Main work"
            ? progressLine(ratio, pos.index)
            : "";
        const pairLabel =
          block.length > 1
            ? `the ${block.map((x) => movementCues(x).label.replace(/^the /, "")).join(" and ")} pair`
            : cu.label;

        const restSay = blockDone
          ? nextEx && nextCu
            ? N.restToNext(
                block.length > 1 ? { ...cu, label: pairLabel } : cu,
                { ...nextEx, reps: spokenReps(nextEx.reps) },
                nextCu,
                setsFor(nextEx),
                rest,
                work !== null || block.length > 1,
                reps,
                block.length > 1 ? rounds : total,
                progress,
              )
            : `That's the last of the work. ${rest} seconds — breathe. Cooldown is next.`
          : block.length > 1
            ? `Round ${r + 1} of ${rounds} on ${pairLabel} — done. ${rest} seconds. ${c.restCue} Then back to ${movementCues(block[0]).label} for round ${r + 2}.`
            : N.restBetweenSets(
                cu,
                r + 1,
                total,
                rest,
                c.restCue,
                work !== null,
                reps,
                weighted && !pos.isWarmup,
                roundWord.toLowerCase(),
              );

        const reaction = perf && !pos.isWarmup ? P.afterSetLine(perf.state, e, perf.day, r) : "";
        const restWithReaction = reaction
          ? restSay
              .replace(/ Same weight next set unless that moved too easily\./, "")
              .replace(/^([^.]*\.)/, `$1 ${reaction}`)
          : restSay;
        const backTo = block.length > 1 && !blockDone ? block[0] : e;
        steps.push({
          id: `${e.id}-rest-${r}`,
          kind: "rest",
          chapter,
          section,
          title: blockDone
            ? `Rest — then ${nextEx?.name ?? "cooldown"}`
            : block.length > 1
              ? `Rest — round ${r + 2} of ${rounds}`
              : `Rest — ${roundWord.toLowerCase()} ${r + 2} of ${total}`,
          detail: blockDone
            ? nextEx
              ? `Coming up: ${nextEx.name} · ${nextEx.target} · ${setsFor(nextEx)} × ${nextEx.reps}`
              : "Cooldown next."
            : `${backTo.name} · ${block.length > 1 ? "round" : roundWord.toLowerCase()} ${r + 2}`,
          cues: [
            c.restCue,
            blockDone && nextCu
              ? nextCu.prep
              : `Next: ${backTo.name}, ${block.length > 1 ? "round" : roundWord.toLowerCase()} ${r + 2}.`,
          ],
          say: restWithReaction,
          tone: "reassuring",
          liveCues:
            rest >= 45
              ? [
                  {
                    at: Math.round(rest * 0.55),
                    say:
                      blockDone && nextCu
                        ? `Setup for ${nextCu.label}: ${nextCu.setup}`
                        : `Long exhale. ${movementCues(backTo).setup}`,
                    tone: "reassuring",
                  },
                ]
              : undefined,
          seconds: rest,
          exerciseId: blockDone ? nextEx?.id : backTo.id,
          mirror: blockDone ? nextEx?.mirror : backTo.mirror,
          next: blockDone ? (nextEx?.name ?? "Cooldown") : `${backTo.name} · ${r + 2}`,
        });
      });
    }

    /* 9 · one halfway check-in — not every third exercise */
    const crossesHalfway = block.some((e) => mainIndexOf.get(e.id) === halfwayAt - 1);
    if (
      isMainBlock &&
      crossesHalfway &&
      nextEx &&
      halfwayAt > 0 &&
      plan.type !== "recovery" &&
      mainIndexOf.get(lastEx.id)! < halfwayAt
    ) {
      const remaining = mains.length - halfwayAt;
      steps.push({
        id: `${lastEx.id}-checkin`,
        kind: "prompt",
        chapter: "checkin",
        section: blockSection,
        title: "Halfway — water + check-in",
        detail: `${remaining} movements left. How are the joints feeling?`,
        cues: [
          "Sharp pain, numbness or dizziness — stop the movement and switch to the substitution.",
          "Sore and working is fine.",
        ],
        say: N.halfwayCheckin(plan, nextEx, remaining),
        tone: "attentive",
        seconds: 30,
        next: nextEx.name,
      });
    }
  });

  /* 11 · cooldown intro + 12 · cooldown, coached continuously */
  c.cooldown.forEach((cd, i) => {
    const nxt = c.cooldown[i + 1];
    const cc = coachingForMovement(cd.mirror ?? "");
    const label = cc?.label ?? cd.name;
    const prepSay =
      i === 0
        ? `${N.cooldownIntro(plan, label, mains.length)} ${cc?.setup ?? cd.cue} ${cc?.path ?? ""}`
        : i === c.cooldown.length - 1
          ? `Last one, and it's the easiest — ${label}. ${cc?.setup ?? cd.cue} ${cc?.path ?? ""}`
          : `Staying easy — ${label} now. ${cc?.setup ?? cd.cue} ${cc?.path ?? ""}`;
    steps.push({
      id: `cooldown-${i}-prep`,
      kind: "brief",
      chapter: "cooldown",
      section: "Cooldown",
      title: `Set up — ${cd.name}`,
      detail: `${cd.seconds >= 60 ? `${Math.round(cd.seconds / 60)} min` : `${cd.seconds} sec`} · easy effort`,
      cues: [cc?.setup ?? cd.cue, cc?.path ?? cd.cue],
      say: prepSay,
      tone: "settle",
      speechPaced: true,
      seconds: paced(prepSay, 2),
      mirror: cd.mirror,
      next: cd.name,
    });
    steps.push({
      id: `cooldown-${i}`,
      kind: "cooldown",
      chapter: "cooldown",
      section: "Cooldown",
      title: cd.name,
      detail: `${cd.seconds >= 60 ? `${Math.round(cd.seconds / 60)} min` : `${cd.seconds} sec`} · easy effort`,
      cues: [cc?.setup ?? cd.cue, cc?.path ?? cd.cue, cc?.breathing ?? "Long, slow exhale."],
      say: "Follow me, nice and easy.",
      tone: "settle",
      liveCues:
        cd.seconds >= 60
          ? [
              {
                at: Math.round(cd.seconds * 0.5),
                say: `Halfway. ${cc?.breathing ?? "Keep the breathing long and slow."}`,
                tone: "settle",
              },
              {
                at: Math.max(10, cd.seconds - 15),
                say: cc?.finalSeconds ?? "Almost done. Let everything unwind.",
                tone: "settle",
              },
            ]
          : [
              {
                at: Math.round(cd.seconds * 0.6),
                say: cc?.safety ?? cc?.breathing ?? "Mild tension only. Breathe into it.",
                tone: "settle",
              },
            ],
      seconds: cd.seconds,
      mirror: cd.mirror,
      next: nxt ? nxt.name : "Session recap",
    });
  });

  /* 13 · recap with the actual work performed */
  const totalSets = list.reduce((n, e) => n + Math.max(1, setsFor(e)), 0);
  const facts = options.recap ?? {};
  const perfLines = perf ? P.recapLines(perf.state, perf.day, mains) : [];
  steps.push({
    id: "complete",
    kind: "complete",
    chapter: "recap",
    section: "Done",
    title: "Session complete",
    detail: `${facts.doneSets ?? totalSets} sets across ${list.length} movements. Protein and water within the next two hours.`,
    cues: [
      `You worked: ${mainNames.join(", ")}.`,
      "That's a full session banked — recovery starts now.",
    ],
    say: N.recap(plan, mainNames, totalSets, facts, perfLines),
    tone: "proud",
  });

  /* Everything the coach says goes through one normaliser so names like
     "Easy Walk / Treadmill" or "3 min @ pace" are spoken like a person. */
  for (const st of steps) {
    st.say = spokenText(st.say);
    st.liveCues = st.liveCues?.map((cu) => ({ ...cu, say: spokenText(cu.say) }));
  }
  return steps;
}

/** "40 sec work / 20 sec transition" → "40 seconds": the rest step covers the rest. */
export function spokenReps(reps: string): string {
  const m = /^(\d+)\s*sec\s*work/i.exec(reps);
  if (m) return `${m[1]} seconds`;
  const range = /^(\d+)\s*[–-]\s*(\d+)\s*sec\b(.*)$/i.exec(reps);
  if (range) return `${range[2]} seconds${range[3]}`;
  const mm = /^(\d+)\s*min\b(?!.*@)/i.exec(reps);
  if (mm && !/\//.test(reps)) return `${mm[1]} minutes`;
  return reps.split(" / ")[0];
}

export function spokenText(t: string): string {
  return t
    .replace(/\s*\/\s*/g, " or ")
    .replace(/\s*@\s*/g, " at ")
    .replace(/\s*·\s*/g, ", ")
    .replace(/\s\+\s/g, " and ")
    .replace(/(\d)\s*[–-]\s*(\d)/g, "$1 to $2")
    .replace(/\bDB\b/g, "dumbbell")
    .replace(/\bsec\b/g, "seconds")
    .replace(/\bmin\b/g, "minutes")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/* ----------------------------- live helpers ---------------------------- */

/**
 * The one line the coach most recently said inside a timed step, derived
 * from the clock so follower screens (glasses, presentation) show the
 * same cue as the speaking leader without any extra sync traffic.
 */
export function currentCue(step: CoachStep, left: number | null): string {
  if (!step.liveCues?.length || step.seconds === undefined || left === null)
    return step.cues[0] ?? step.detail ?? "";
  const elapsed = Math.max(0, step.seconds - left);
  let hit: LiveCue | undefined;
  for (const cue of step.liveCues) if (cue.at <= elapsed) hit = cue;
  return hit?.say ?? step.cues[0] ?? step.detail ?? "";
}

/** Human summary of which steps auto-run and which wait for the user. */
export function stepWaitsForUser(step: CoachStep): boolean {
  return step.kind === "complete" || (step.kind === "work" && step.seconds === undefined);
}