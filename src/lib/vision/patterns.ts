/**
 * MOVEMENT PATTERNS
 * ------------------------------------------------------------------
 * Maps the exercise ids used by the program onto a small set of
 * conservative analysers. Anything not listed here is simply not
 * analysed — the app says so rather than inventing feedback.
 */

export type PatternId = "squat" | "lunge" | "curl" | "row" | "press" | "punch" | "raise";

export const PATTERN_LABEL: Record<PatternId, string> = {
  squat: "Squat pattern",
  lunge: "Lunge / split pattern",
  curl: "Curl pattern",
  row: "Row / pull pattern",
  press: "Press pattern",
  punch: "Straight punches",
  raise: "Arm raise pattern",
};

/** Explicit ids first; a keyword fallback catches substitutions. */
const BY_ID: Record<string, PatternId> = {
  squat: "squat",
  gobletSquat: "squat",
  gobletSquatToBench: "squat",
  squatToBench: "squat",
  squatToCurl: "squat",
  legPress: "squat",
  bulgarianSplitSquat: "lunge",
  splitSquat: "lunge",
  reverseLunge: "lunge",
  stepAltCurl: "lunge",
  reverseStepRow: "row",
  dumbbellCurl: "curl",
  lateralRaise: "raise",
  rearDeltFly: "raise",
  bandPullApart: "raise",
  frontRaise: "raise",
  hammerCurl: "curl",
  inclineWaiterCurl: "curl",
  assistedEccentricCurl: "curl",
  seatedRow: "row",
  oneArmRow: "row",
  chestSupportedRow: "row",
  latPulldown: "row",
  bandPulldown: "row",
  facePull: "row",
  shoulderPress: "press",
  stepShoulderPress: "press",
  benchPress: "press",
  inclineDumbbellPress: "press",
  chestPress: "press",
  closeGripPushup: "press",
  tricepsPressdown: "press",
  tricepPushdown: "press",
  jab: "punch",
  cross: "punch",
  jabCross: "punch",
  lightPunches: "punch",
  shadowboxPunches: "punch",
  cablePunch: "punch",
  "cardio-punches": "punch",
};

const KEYWORDS: [RegExp, PatternId][] = [
  [/squat|legpress|hipthrust|glutebridge/i, "squat"],
  [/lunge|split|stepup|stepback/i, "lunge"],
  [/curl(?!.*leg)|biceps/i, "curl"],
  [/row|pulldown|pullup|facepull/i, "row"],
  [/press|pushup|pushdown|pressdown|dip/i, "press"],
  [/punch|jab|cross|boxing|shadowbox/i, "punch"],
];

export function patternFor(exerciseId?: string): PatternId | null {
  if (!exerciseId) return null;
  if (BY_ID[exerciseId]) return BY_ID[exerciseId];
  for (const [re, id] of KEYWORDS) if (re.test(exerciseId)) return id;
  return null;
}