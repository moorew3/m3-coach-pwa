/**
 * Offline-first Flex coaching: answers from the existing workout/nutrition
 * store. No paid AI calls, guessed food logging, or medical diagnosis.
 */
import { currentDayNumber, getNutrition, nutritionTotals, todayKey, type AppState, type FlexFoodPreferences } from "@/lib/store";
import { nutritionCoachSnapshot } from "@/lib/nutrition-coach";
import { planForDay } from "@/data/program";
import { lastHeartRateReading } from "@/lib/health/hr-monitor";

export const foodPreferencesFor = (s: AppState): FlexFoodPreferences => ({
  avoidCheese: true, preferLactoseFree: true, flavor: "chocolate",
  ...s.flexFoodPreferences,
});

export type FlexLocalReply = { text: string; category: "nutrition" | "training" | "safety" | "help" };
const reply = (category: FlexLocalReply["category"], text: string): FlexLocalReply => ({ category, text });

function mealIdeas(p: FlexFoodPreferences, s: AppState): string {
  const totals = nutritionTotals(getNutrition(s, todayKey()));
  const gap = Math.max(0, Math.round(s.targets.protein - totals.protein));
  const mains = p.avoidCheese
    ? "grilled chicken with rice and vegetables; salmon with potatoes and asparagus; or turkey with pasta and tomato sauce (no cheese)"
    : "grilled chicken with rice and vegetables; salmon with potatoes; or turkey pasta";
  const snack = p.preferLactoseFree
    ? p.flavor + " lactose-free high-protein yogurt, if tolerated, or tuna and crackers"
    : p.flavor + " high-protein yogurt, if tolerated, or tuna and crackers";
  return "Meal ideas: " + mains + ". Snack: " + snack + ". " +
    (gap > 0 ? "Your log currently shows " + gap + " g protein remaining on the tracker. " : "") +
    "Portion sizes and brands determine the real macros, so nothing is automatically counted as eaten.";
}

export function answerFlexLocal(
  prompt: string,
  state: AppState,
  prefs: FlexFoodPreferences = foodPreferencesFor(state),
): FlexLocalReply {
  const q = prompt.trim().toLowerCase().replace(/[’']/g, "'");
  const snap = nutritionCoachSnapshot(state);
  const d = snap.today;
  const log = getNutrition(state, todayKey());
  const hasFood = log.entries.length > 0;
  const basis = hasFood ? "logged so far" : "not logged yet";
  const water = d.water + " of " + d.waterTarget + " eight-ounce cups";

  if (/\b(chest pain|can't breathe|cannot breathe|passing out|fainting)\b/.test(q))
    return reply("safety", "Stop exercising. Chest pain, fainting or trouble breathing may be an emergency. Seek urgent medical help.");
  if (/\b(pain|hurt|numb|tingling|dizzy|dizziness|left leg|boot|injury|injured)\b/.test(q))
    return reply("safety", "Do not load your injured LEFT leg or train through pain. Keep it supported and unloaded and follow your treating clinician's restrictions. Stop for new pain, swelling, dizziness or numbness.");
  if (/\b(heart[ -]?rate|pulse|bpm)\b/.test(q)) {
    const reading = lastHeartRateReading();
    if (!reading) return reply("training", "I do not have a fresh heart-rate reading. Connect a compatible Bluetooth heart-rate monitor from the workout screen, then ask again. I will not guess.");
    const secondsAgo = Math.max(0, Math.round((Date.now() - reading.recordedAt) / 1000));
    return reply("training", "Your connected Bluetooth sensor reports " + reading.bpm +
      " beats per minute, measured " + secondsAgo + " seconds ago. This is a device reading, not a medical diagnosis.");
  }
  if (/\b(cheese|lactose|dairy|allerg|food preference|preferences)\b/.test(q))
    return reply("nutrition", "Current preferences: " + (prefs.avoidCheese ? "no cheese" : "cheese permitted") +
      ", " + (prefs.preferLactoseFree ? "lactose-free options preferred" : "no lactose-free preference") +
      ", flavor " + prefs.flavor + ". Edit these under Food preferences. A milk allergy differs from lactose intolerance.");
  if (/\b(meal|eat|food|dinner|lunch|breakfast|snack|recipe|cook|hungry)\b/.test(q))
    return reply("nutrition", mealIdeas(prefs, state));
  if (/\b(protein|macro|carb|fat grams?|fat intake)\b/.test(q)) {
    if (/\bcarb/.test(q))
      return reply("nutrition", "Carbs " + basis + ": " + Math.round(d.carbs) + " g of " + d.carbsTarget + " g. This is an incomplete daily log.");
    if (/\b(fat grams?|fat intake)\b/.test(q))
      return reply("nutrition", "Fat " + basis + ": " + Math.round(d.fat) + " g of " + d.fatTarget + " g. These values come from entered food.");
    return reply("nutrition", "Protein " + basis + ": " + Math.round(d.protein) + " g of " + d.proteinTarget +
      " g target. " + mealIdeas(prefs, state));
  }
  if (/\b(calorie|calories|energy intake)\b/.test(q))
    return reply("nutrition", "Calories " + basis + ": " + Math.round(d.calories) + " of " + d.calorieTarget +
      " kcal on the " + (d.trainingDay ? "training" : "rest") + "-day target. " +
      Math.max(0, Math.round(d.calorieTarget - d.calories)) + " kcal remain in the tracker. Targets are editable.");
  if (/\b(water|hydration|drink|thirst)\b/.test(q))
    return reply("nutrition", "Water logged today: " + water +
      ". Tap +1 cup only when you actually drink an eight-ounce cup. This isn't a medical hydration prescription.");
  if (/\b(what(?:'s| is) my (?:current )?weight|how much do i weigh|last weigh[- ]?in|latest scale reading)\b/.test(q)) {
    const entries = Object.entries(state.nutrition)
      .filter(([, value]) => Number(value.bodyweight) > 0)
      .sort(([x], [y]) => y.localeCompare(x));
    if (!entries.length) return reply("nutrition", "I don't have a recorded body weight. Enter a real measurement or connect a supported scale on Nutrition.");
    const [loggedDate, logged] = entries[0];
    return reply("nutrition", "Your most recent recorded weight is " + logged.bodyweight + " " + state.settings.units +
      " from " + loggedDate + (logged.bodyweightSource === "bluetooth-scale" ? " (confirmed Bluetooth scale)" : " (nutrition log)") +
      ". This is a logged measurement, not an estimate.");
  }
  if (/\b(weight loss|lose weight|body fat|bodyweight|weigh|progress)\b/.test(q))
    return reply("nutrition", snap.headline + ". " + snap.detail +
      " Use trends across logged days rather than changing calories from one weigh-in.");
  if (/\b(train|workout|exercise|gym|session|coach mode|sets|reps|what's next|next workout)\b/.test(q)) {
    const plan = planForDay(currentDayNumber(state));
    return reply("training", "Your saved program is " + plan.title + " (" + plan.focus + "). Open Start Coached Workout for live sets, rest, commands and logging. If your LEFT leg remains injured, use only clinician-cleared seated Recovery movements. Camera estimates never count as confirmed reps.");
  }
  if (/\b(how am i doing|status|today|summary|check in|overview)\b/.test(q))
    return reply("nutrition", "Today's check-in: " + Math.round(d.calories) + " / " + d.calorieTarget +
      " kcal, " + Math.round(d.protein) + " / " + d.proteinTarget + " g protein, water " +
      water + ". " + snap.headline + ". All values come from logs, not guesses.");
  return reply("help", "Ask about protein, calories, meal ideas, water, your training plan, or logged progress. Start Coached Workout for complete set-by-set coaching, camera feedback, and exercise questions. Optional paid open-ended AI remains off.");
}
