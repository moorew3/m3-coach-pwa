/**
 * NUTRITION COACH — turns existing nutrition logs into cautious coaching context.
 * ------------------------------------------------------------------
 * Uses only what the athlete actually logged. "Today" is always described
 * as "logged so far"; stronger patterns require multiple logged days.
 */
import { coachMemoryOverview } from "@/lib/coach-memory";
import { nutritionTotals, todayKey, type AppState, type NutritionDay } from "@/lib/store";

export interface NutritionCoachSnapshot {
  today: {
    date: string;
    trainingDay: boolean;
    calories: number;
    calorieTarget: number;
    protein: number;
    proteinTarget: number;
    carbs: number;
    carbsTarget: number;
    fat: number;
    fatTarget: number;
    water: number;
    waterTarget: number;
    bodyweight?: number;
  };
  recent: {
    loggedDays: number;
    avgCaloriePct?: number;
    avgProteinPct?: number;
    avgWaterPct?: number;
    weighIns: number;
    weightDelta?: number;
  };
  headline: string;
  detail: string;
  contextLine: string;
  concern: boolean;
}

const pct = (value: number, target: number) => (target > 0 ? value / target : 0);
const numeric = (v: string) => {
  if (!/^\s*[\d.]+\s*$/.test(v)) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const meaningful = (n: NutritionDay) =>
  n.entries.length > 0 || n.water > 0 || Boolean(n.bodyweight.trim());

export function nutritionCoachSnapshot(
  s: AppState,
  date = todayKey(),
): NutritionCoachSnapshot {
  const day = s.nutrition[date] ?? { entries: [], water: 0, bodyweight: "", trainingDay: true };
  const totals = nutritionTotals(day);
  const calorieTarget = day.trainingDay ? s.targets.trainingCal : s.targets.restCal;

  const rows = Object.entries(s.nutrition)
    .filter(([d, n]) => d <= date && meaningful(n))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7);

  const adherence = rows.map(([, n]) => {
    const t = nutritionTotals(n);
    const calTarget = n.trainingDay ? s.targets.trainingCal : s.targets.restCal;
    return {
      cal: pct(t.cal, calTarget),
      protein: pct(t.protein, s.targets.protein),
      water: pct(n.water, s.targets.water),
      weight: numeric(n.bodyweight),
    };
  });

  const avg = (key: "cal" | "protein" | "water") =>
    adherence.length
      ? adherence.reduce((sum, x) => sum + x[key], 0) / adherence.length
      : undefined;

  const weights = adherence.map((x) => x.weight).filter((x): x is number => x !== undefined);
  const weightDelta = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : undefined;
  const avgCaloriePct = avg("cal");
  const avgProteinPct = avg("protein");
  const avgWaterPct = avg("water");
  const trainingMemory = coachMemoryOverview(s);
  const fatigue = trainingMemory.signals.some((x) => x.kind === "fatigue");

  let headline = "Nutrition context is building";
  let detail =
    rows.length === 0
      ? "Nothing has been logged yet. The coach will use nutrition only after there is real data."
      : `Today logged so far: ${Math.round(totals.cal)} calories, ${Math.round(totals.protein)} g protein and ${day.water} cups of water.`;
  let concern = false;

  if (
    rows.length >= 3 &&
    fatigue &&
    ((avgProteinPct ?? 1) < 0.8 || (avgCaloriePct ?? 1) < 0.8)
  ) {
    headline = "Recovery inputs and performance both need attention";
    detail =
      "Training history shows a fatigue/regression signal, and recent logged nutrition has also been below its targets. That is a correlation, not proof of cause; the coach should avoid pushing progression until the pattern improves.";
    concern = true;
  } else if (rows.length >= 3 && (avgProteinPct ?? 1) < 0.8) {
    headline = "Protein has been under the logged target";
    detail = `Across ${rows.length} recent logged days, protein averaged about ${Math.round((avgProteinPct ?? 0) * 100)}% of target.`;
    concern = true;
  } else if (rows.length >= 3 && (avgCaloriePct ?? 1) < 0.75) {
    headline = "Energy intake has been well under the logged target";
    detail = `Across ${rows.length} recent logged days, calories averaged about ${Math.round((avgCaloriePct ?? 0) * 100)}% of the selected day targets.`;
    concern = true;
  } else if (rows.length >= 3 && (avgWaterPct ?? 1) < 0.7) {
    headline = "Hydration logging has been under target";
    detail = `Across ${rows.length} recent logged days, water averaged about ${Math.round((avgWaterPct ?? 0) * 100)}% of target.`;
    concern = true;
  } else if (rows.length >= 3) {
    headline = "Nutrition is tracking consistently";
    detail = `There are ${rows.length} recent logged days. No strong under-target pattern is large enough to flag right now.`;
  }

  if (weightDelta !== undefined) {
    detail += ` Bodyweight moved ${weightDelta >= 0 ? "+" : ""}${weightDelta.toFixed(1)} ${s.settings.units} across the available recent weigh-ins; that is reported neutrally because the app does not assume the athlete's desired rate of change.`;
  }

  return {
    today: {
      date,
      trainingDay: day.trainingDay,
      calories: totals.cal,
      calorieTarget,
      protein: totals.protein,
      proteinTarget: s.targets.protein,
      carbs: totals.carbs,
      carbsTarget: s.targets.carbs,
      fat: totals.fat,
      fatTarget: s.targets.fat,
      water: day.water,
      waterTarget: s.targets.water,
      bodyweight: numeric(day.bodyweight),
    },
    recent: {
      loggedDays: rows.length,
      avgCaloriePct,
      avgProteinPct,
      avgWaterPct,
      weighIns: weights.length,
      weightDelta,
    },
    headline,
    detail,
    contextLine: `${headline}. ${detail}`,
    concern,
  };
}
