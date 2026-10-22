/**
 * PREVIEW ONLY: draft seated Workout A/B for owner inspection.
 * This does NOT certify exercise safety, clinical clearance or final media
 * identity. Original V2's seven-day catalog and logs are left untouched.
 */
import plan from "@/data/recovery/m3-flex-workouts-ab-staging.json";
import approved from "@/data/recovery/m3-flex-approved-media-staging.json";
import type { V2Exercise, V2Workout } from "./types";

const MOTION_KEYS: Record<string, string> = {
  lateral: "lateralRaise",
  hammer: "hammerCurl",
  shrugs: "shrugs",
  triceps: "tricepsPressdown",
  boxing: "shadowboxPunches",
  chest: "chestPress",
  front: "frontRaise",
  curls: "alternatingCurl",
  band: "bandPullApart",
  prep: "breathing",
  cooldown: "cooldownBreathing",
};
const clipUrls = new Map(
  approved.clips
    .filter((clip) => clip.ownerApproved && clip.previewAllowed)
    .map((clip) => [clip.id, clip.videoUrl]),
);
const PREVIEW_WORKOUT_IDS = ["m3-recovery-a", "m3-recovery-b"] as const;

type DraftMovement = {
  id: string; name: string; mediaId: string; sets: number;
  reps?: { min: number; max: number };
  durationSec?: number; restSec: number; notes?: string;
};

function convert(ex: DraftMovement, pairMap: Map<string, { id: string; restSec: number }>): V2Exercise {
  return {
    id: "recovery-" + ex.id,
    name: ex.name,
    category: ex.id === "boxing" ? "boxing"
      : ex.id === "prep" || ex.id === "cooldown" ? "mobility" : "strength",
    sets: ex.sets,
    ...(ex.reps ? {
      reps: `${ex.reps.min}–${ex.reps.max}`,
      repRange: [ex.reps.min, ex.reps.max] as [number, number],
    } : { reps: `${ex.durationSec ?? 60} sec`, seconds: ex.durationSec ?? 60 }),
    restSeconds: ex.restSec,
    motionKey: MOTION_KEYS[ex.id] ?? "unavailable",
    ...(pairMap.has(ex.id) ? {
      supersetId: pairMap.get(ex.id)!.id,
      supersetRestSeconds: pairMap.get(ex.id)!.restSec,
    } : {}),
    cues: [
      ex.notes || "Only use a medically cleared movement.",
      "Keep your injured LEFT leg supported and unloaded.",
      "Do not use your leg to brace, stand or pivot.",
    ],
    equipment: ["supported seated position"],
    warmupStyle: "none",
    loadClass: "upper",
  };
}

function makeDraft(key: "A" | "B"): V2Workout {
  const day = plan.workouts[key];
  const paired = new Map<string, { id: string; restSec: number }>();
  for (const option of day.supersetOptions) {
    paired.set(option.a, { id: option.id, restSec: option.restSec });
    paired.set(option.b, { id: option.id, restSec: option.restSec });
  }
  const prep = plan.shared.find(x => x.id === "prep")!;
  const cool = plan.shared.find(x => x.id === "cooldown")!;
  const warmup: DraftMovement = {
    id: "prep", name: prep.name, mediaId: prep.mediaId,
    sets: 1, durationSec: prep.seconds, restSec: 15,
  };
  const cooldown: DraftMovement = {
    id: "cooldown", name: cool.name, mediaId: cool.mediaId,
    sets: 1, durationSec: cool.seconds, restSec: 0,
  };
  return {
    id: key === "A" ? PREVIEW_WORKOUT_IDS[0] : PREVIEW_WORKOUT_IDS[1],
    title: `Owner test · ${day.name}`,
    focus: `${day.workingSets} proposed working sets plus breathing; LEFT boot elevated and unloaded · CLINICAL CLEARANCE PENDING`,
    useSupersets: false,
    exercises: [warmup, ...day.exercises, cooldown].map(ex => convert(ex, paired)),
  };
}

export const RECOVERY_PREVIEW_WORKOUTS: V2Workout[] = [makeDraft("A"), makeDraft("B")];
export const isRecoveryPreviewWorkout = (id?: string) =>
  id === PREVIEW_WORKOUT_IDS[0] || id === PREVIEW_WORKOUT_IDS[1];

/** Preview-only footage. Never substitute it for original canonical coach. */
export function recoveryPreviewMediaFor(exercise?: V2Exercise) {
  if (!exercise?.id.startsWith("recovery-")) return undefined;
  const mediaId = exercise.id === "recovery-prep" ? "C09-PRE-BREATH-R2"
    : exercise.id === "recovery-cooldown" ? "C10-POST-BREATH-R1"
    : Object.entries({
      "recovery-lateral": "C12-LATERAL-R3",
      "recovery-hammer": "C02",
      "recovery-shrugs": "C01-R3",
      "recovery-triceps": "NEW_SEATED-TRICEPS-PRESSDOWN",
      "recovery-boxing": "NEW_ARM-BOXING",
      "recovery-chest": "C08-PRESS-R3",
      "recovery-front": "C03",
      "recovery-curls": "C04-R2",
      "recovery-band": "NEW_SEATED-BAND-PULL-APART",
    }).find(([key]) => key === exercise.id)?.[1];
  const url = mediaId && clipUrls.get(mediaId);
  return url ? {
    url,
    label: "Motion demo" as const,
    note: "Owner-approved preview only; final avatar identity and clinician clearance still pending.",
  } : undefined;
}
