/**
 * MIRROR ME — AVATAR PHASE BOARDS
 * ------------------------------------------------------------------
 * One wide 3-panel board per movement, rendered with the same realistic
 * tattooed athlete. Panels are sliced by the MirrorMe viewer so mobile
 * shows one phase at a time and wide screens show the full board.
 */
import { isIdentityQuarantined } from "@/data/coach-identity";

export const MIRROR_BOARDS: Record<string, string> = {
  bandPullApart: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/98b2fb61-a077-4530-a252-f6c835ebae52/bandPullApart.jpg",
  battleRopeFinisher:
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/a1c85e3b-d2bf-4116-a75b-a1cb4036d003/battleRopeFinisher.jpg",
  benchPress: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/d724785c-bd15-4d96-af92-fbeae1d72474/benchPress.jpg",
  boxingStance: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/8c833e6d-8035-47fd-814b-cf79226e8a39/boxingStance.jpg",
  bulgarianSplitSquat:
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/03eebf15-b135-4ed7-bac4-69caf1fb928f/bulgarianSplitSquat.jpg",
  cablePunch: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/89658984-1568-41e8-aa1b-946a0de63450/cablePunch.jpg",
  chestMobility: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/40136fd2-afa3-43c0-ab9a-8967240d9e1e/chestMobility.jpg",
  chestPress: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/2679019a-9790-4ed1-be5e-b6d030ddc83e/chestPress.jpg",
  chestSupportedRow: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/c3771c29-7765-4fc3-bb93-dc0a07a88381/chestSupportedRow.jpg",
  controlledShoulderWork:
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/78a2bab7-b39a-4169-a601-35910179d3d2/controlledShoulderWork.jpg",
  cross: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/0fc3c660-4956-45a1-8bf6-f58de15cfa13/cross.jpg",
  deadBug: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/c23c7ee2-4567-403d-aee5-46eef0006739/deadBug.jpg",
  defensiveReset: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/994eb5e3-4a50-4eb0-a21d-eb49356754e3/defensiveReset.jpg",
  dumbbellCurl: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e3806308-91e9-413a-b123-288852ee5a93/dumbbellCurl.jpg",
  easyWalk: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/f1b05112-ac00-4ee7-8d7d-13a6fcc3a2b9/easyWalk.jpg",
  externalRotation: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4eec646f-3f80-412b-8676-01ac958fdf8b/externalRotation.jpg",
  farmerMarch: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/1e566bd1-4dd1-496a-a1e4-980d60c1bd22/farmerMarch.jpg",
  frontKick: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/a26ef7b0-0d29-4fc8-8f9f-42556357fb75/frontKick.jpg",
  guardReset: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/f34d8255-2b01-4dba-9895-504f4184e998/guardReset.jpg",
  hammerCurl: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/c0339d07-c8ba-4b2a-8d7d-41786fd5eede/hammerCurl.jpg",
  hamstringCurl: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4e9c6923-9920-4b40-9db7-2035e8112a26/hamstringCurl.jpg",
  hamstringMobility: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/5ffd7d78-dd9a-4471-be15-7b77c6a4e658/hamstringMobility.jpg",
  hipFlexorStretch: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/ffdc5b5f-d9d9-4e79-921d-7e94f063155f/hipFlexorStretch.jpg",
  inclineDumbbellPress:
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4f3ff8b2-2e29-47d2-9589-1448eba1ae90/inclineDumbbellPress.jpg",
  jab: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/f86e6386-a1b6-41f6-90b8-1b133fd227fb/jab.jpg",
  jabCross: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/54740817-40d2-44ec-bcdf-3e09ae6a21de/jabCross.jpg",
  kneeChamber: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/5cf9a7aa-fbc3-4713-9b2a-5821585938c1/kneeChamber.jpg",
  latPulldown: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/6a1d735e-3ce1-4f1a-b60f-027518bd56a6/latPulldown.jpg",
  lateralRaise: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/42b05747-5154-48cf-a997-08ab20eb4e7d/lateralRaise.jpg",
  legPress: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/316cf984-30e9-4ac6-9376-5b5ae5957d87/legPress.jpg",
  lightPunches: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/db3bbe68-de60-4a65-8e76-9ed6913d5055/lightPunches.jpg",
  lowerBodyMobility: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/51c59c1d-db73-42ac-80ea-0dd1a5c55023/lowerBodyMobility.jpg",
  medBallChestPass: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/9c801c43-b869-4975-8205-102511a0d719/medBallChestPass.jpg",
  rearDeltFly: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/7de17e74-2654-4172-b13d-ea40cfb8dd73/rearDeltFly.jpg",
  reverseStepRow: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/1bc4153f-484f-4fa2-85a3-37883d1f1d38/reverseStepRow.jpg",
  romanianDeadlift: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e5b3b889-136c-424c-bc65-f124edab6d06/romanianDeadlift.jpg",
  roundKick: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/b9f92ba4-09dd-431d-aded-2068d885449c/roundKick.jpg",
  seatedRow: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/a62f080d-7c0f-4849-b117-8b9f986bccfb/seatedRow.jpg",
  shoulderMobility: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/15895b9c-0b0c-42a9-9a12-ca54cfff0de7/shoulderMobility.jpg",
  shoulderPress: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/5218b9e5-760c-4624-9f2b-4352aa155c4a/shoulderPress.jpg",
  squat: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4e0a564c-57de-43ad-ace0-3c3f666da202/squat.jpg",
  squatToCurl: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/d62a2338-5482-4a4c-bc3d-06683e02a26e/squatToCurl.jpg",
  suitcaseCarry: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/723352d6-e4b6-48dd-b000-b0880409a6b6/suitcaseCarry.jpg",
  trapBarDeadlift: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/eed22289-0647-40bf-a19e-d04caa2fd9d8/trapBarDeadlift.jpg",
  tricepsPressdown: "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/4d487a6b-aceb-495e-9751-a360e45e2a25/tricepsPressdown.jpg",
};

/** Default number of avatar panels inside a generated board image. */
export const BOARD_PANELS = 3;

export type BoardMeta = {
  url: string;
  panels: number;
  labels: string[];
  /** width / height of ONE panel, used to size the mobile phase viewer */
  panelAspect: number;
};

const REF = (file: string, panels: number, labels: string[], aspect = 0.33): BoardMeta => ({
  url: file,
  panels,
  labels,
  panelAspect: aspect,
});

const BOXING = REF(
  "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/cbb887cb-6393-4424-b6b1-785faf93adae/ref-boxingBasics.jpg",
  5,
  ["Stance", "Jab", "Cross", "Defensive reset", "Move / reset"],
);

const KICKBOXING = REF(
  "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/c10b3c1f-af72-4466-b2ba-8ae2e6b3d337/ref-kickboxingBasics.jpg",
  6,
  [
    "Fighting stance",
    "Knee lift / chamber",
    "Front kick",
    "Reset to stance",
    "Round kick chamber",
    "Round kick & recoil",
  ],
  0.46,
);

/**
 * Approved photographic reference boards (client-supplied art direction).
 * These take priority over the generated boards above.
 */
export const REFERENCE_BOARDS: Record<string, BoardMeta> = {
  cablePunch: REF("https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/fdbbfb42-5a89-4992-bec3-e2a2e3e42600/ref-cablePunch.jpg", 5, [
    "Split stance setup",
    "Load",
    "Punch forward",
    "Full extension",
    "Recoil / reset",
  ]),
  seatedRow: REF("https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/f582be07-b7f3-4521-a500-d8100335b6a2/ref-seatedRow.jpg", 5, [
    "Seated setup",
    "Reach",
    "Pull to torso",
    "Squeeze",
    "Controlled return",
  ]),
  chestSupportedRow: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/f582be07-b7f3-4521-a500-d8100335b6a2/ref-seatedRow.jpg",
    5,
    ["Seated setup", "Reach", "Pull to torso", "Squeeze", "Controlled return"],
  ),
  latPulldown: REF("https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/933876cb-e2d1-4422-992c-db71a53703a1/ref-latPulldown.jpg", 5, [
    "Grip setup",
    "Pull down",
    "Elbows drive",
    "Bar to upper chest",
    "Controlled return",
  ]),
  squat: REF("https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/6c060655-13de-46f0-a5f4-eddea54e086c/ref-squat.jpg", 5, [
    "Setup",
    "Descend",
    "Bottom position",
    "Drive up",
    "Stand tall / reset",
  ]),
  legPress: REF("https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/9ce6e580-5095-4a31-816e-1eee01ed9630/ref-legPress.jpg", 5, [
    "Seat setup",
    "Unlock sled",
    "Lower with control",
    "Drive through feet",
    "Reset",
  ]),
  bulgarianSplitSquat: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/868a9148-b843-488b-afda-6474c75933e5/ref-bulgarianSplitSquat.jpg",
    5,
    ["Split setup", "Descend", "Bottom", "Drive up", "Reset"],
  ),
  hipFlexorStretch: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/be25c3b8-68a7-4c0a-a534-5517b2b58320/ref-hipFlexorStretch.jpg",
    5,
    ["Half-kneeling setup", "Tuck pelvis", "Glide forward", "Reach tall", "Relax / reset"],
  ),
  lowerBodyMobility: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/be25c3b8-68a7-4c0a-a534-5517b2b58320/ref-hipFlexorStretch.jpg",
    5,
    ["Half-kneeling setup", "Tuck pelvis", "Glide forward", "Reach tall", "Relax / reset"],
  ),
  hamstringCurl: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/6b5212d1-5803-4e2e-9d4b-63d31dce11c5/ref-hamstringCurl.jpg",
    5,
    ["Setup", "Curl in", "Squeeze", "Slow extend", "Reset"],
  ),
  suitcaseCarry: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/41aa8abf-b178-445a-83eb-083f4ed6fd4d/ref-suitcaseCarry.jpg",
    5,
    ["Pick up one weight", "Brace", "Walk tall", "Continue carry", "Set down / reset"],
  ),
  benchPress: REF(
    "https://id-preview--2226e1e4-f626-48b3-8091-e80f59ffb46c.lovable.app/__l5e/assets-v1/e7082823-c78e-4ca9-b2eb-e11dc9e8eb64/ref-benchPress.jpg",
    5,
    ["Setup on bench", "Unrack & start", "Lower to mid chest", "Press upward", "Lockout & rerack"],
    0.53,
  ),
  boxingStance: BOXING,
  jab: BOXING,
  cross: BOXING,
  jabCross: BOXING,
  lightPunches: BOXING,
  defensiveReset: BOXING,
  guardReset: BOXING,
  frontKick: KICKBOXING,
  kneeChamber: KICKBOXING,
  roundKick: KICKBOXING,
};

/**
 * 2026-09-14 identity sweep: the multi-panel phase boards below were built
 * from a separate render pass and a frame-by-frame comparison against
 * COACH_REFERENCE showed several of them depict other athletes entirely.
 * None of them is an attested likeness, so NO board may render a person.
 * Only ids listed here may ever be served again, and only after a frame
 * check against the canonical reference. The data is kept so a verified
 * board can be re-enabled by adding its id — nothing else changes.
 */
const VERIFIED_IDENTITY_BOARDS = new Set<string>();

export const boardMetaFor = (id?: string): BoardMeta | undefined => {
  if (!id) return undefined;
  // Identity gate: a quarantined movement never renders a person anywhere.
  if (isIdentityQuarantined(id)) return undefined;
  if (!VERIFIED_IDENTITY_BOARDS.has(id)) return undefined;
  const ref = REFERENCE_BOARDS[id];
  if (ref) return ref;
  const url = MIRROR_BOARDS[id];
  return url ? { url, panels: BOARD_PANELS, labels: [], panelAspect: 1 } : undefined;
};

export const boardFor = (id?: string): string | undefined => boardMetaFor(id)?.url;