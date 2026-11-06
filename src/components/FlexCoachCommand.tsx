/**
 * FLEX COMMAND — integrated native coaching entry point.
 * Uses the same app state, workouts, progress and nutrition data as all
 * existing M3 FLEX screens. Never starts a second tracker or paid provider.
 */
import { Link } from "@tanstack/react-router";
import { Apple, ArrowRight, Check, Dumbbell, ShieldCheck, TrendingUp, Waves } from "lucide-react";
import { foodPreferencesFor } from "@/lib/flex-local-advice";
import { FlexConversation } from "@/components/FlexConversation";
import { nutritionCoachSnapshot } from "@/lib/nutrition-coach";
import {
  currentDayNumber, getNutrition, setState, todayKey, updateNutrition, useApp,
  type FlexFoodPreferences,
} from "@/lib/store";

export function FlexCoachCommand({ compact = false }: { compact?: boolean }) {
  const state = useApp();
  const day = currentDayNumber(state);
  const nutrition = nutritionCoachSnapshot(state);
  const prefs = foodPreferencesFor(state);
  const setPreference = (changes: Partial<FlexFoodPreferences>) =>
    setState((s) => ({
      ...s,
      flexFoodPreferences: { ...foodPreferencesFor(s), ...changes },
    }));

  const water = getNutrition(state, todayKey()).water;
  return (
    <section data-testid="flex-coach-command" className="surface-card mt-4 overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-card via-card to-cyan-950/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">M3 FLEX · Personal coach</p>
          <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl">Train. Talk. Eat. Improve.</h2>
          <a href="#flex-conversation-panel" data-testid="flex-jump-to-chat" className="mt-2 inline-flex min-h-10 items-center rounded-lg border border-accent/40 bg-accent/15 px-3 text-sm font-black text-accent">Talk to Flex now →</a>
        </div>
        <span className="rounded-full border border-green-500/50 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-green-200">
          No paid AI calls
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Your existing live workout engine, coaching, nutrition and progress share one log. Flex answers common questions from real entries, never invented results.
      </p>

      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link data-testid="flex-start-coach" to="/coach/$day" params={{ day: String(day) }}
            className="tap-target flex min-h-16 flex-col justify-center rounded-xl bg-primary px-3 text-primary-foreground">
            <Dumbbell className="size-5" aria-hidden />
            <span className="mt-1 text-sm font-black leading-tight">Start Coached Workout</span>
            <span className="text-[10px] opacity-80">Live sets, voice and camera</span>
          </Link>
          <Link to="/recovery" search={{ program: "recovery" }}
            className="tap-target flex min-h-16 flex-col justify-center rounded-xl border border-border bg-elevated px-3">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold leading-tight">Seated Recovery</span>
            <span className="text-[10px] text-muted-foreground">Only clinician-cleared moves</span>
          </Link>
          <Link to="/nutrition" className="tap-target flex min-h-16 flex-col justify-center rounded-xl border border-border bg-elevated px-3">
            <Apple className="size-5 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold leading-tight">Nutrition & meals</span>
            <span className="text-[10px] text-muted-foreground">Food log and daily targets</span>
          </Link>
          <Link to="/progress" className="tap-target flex min-h-16 flex-col justify-center rounded-xl border border-border bg-elevated px-3">
            <TrendingUp className="size-5 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold leading-tight">My progress</span>
            <span className="text-[10px] text-muted-foreground">Workout history and trends</span>
          </Link>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2" data-testid="flex-live-nutrition">
        <div className="rounded-lg border border-border/50 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Calories</p>
          <p className="text-lg font-black tabular-nums">{Math.round(nutrition.today.calories)}</p>
          <p className="text-[10px] text-muted-foreground">of {nutrition.today.calorieTarget} kcal</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Protein</p>
          <p className="text-lg font-black tabular-nums">{Math.round(nutrition.today.protein)} g</p>
          <p className="text-[10px] text-muted-foreground">of {nutrition.today.proteinTarget} g</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Water</p>
          <p className="text-lg font-black tabular-nums">{water} cups</p>
          <button data-testid="flex-water" type="button"
            onClick={() => updateNutrition(todayKey(), (n) => ({ ...n, water: n.water + 1 }))}
            className="mt-0.5 inline-flex min-h-7 items-center gap-1 rounded-md bg-accent/20 px-2 text-[11px] font-bold text-accent">
            <Waves className="size-3" aria-hidden /> +1 drank
          </button>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Daily totals reflect only food and water you have recorded.</p>

      <FlexConversation />
      <details className="mt-2 rounded-xl border border-border bg-elevated/40 p-2.5">
        <summary className="cursor-pointer text-xs font-bold">Food preferences (used for meal ideas)</summary>
        <div className="mt-2 space-y-2">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={prefs.avoidCheese} onChange={(e) => setPreference({ avoidCheese: e.target.checked })}
              className="size-5 accent-primary" /> Avoid all cheese
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={prefs.preferLactoseFree} onChange={(e) => setPreference({ preferLactoseFree: e.target.checked })}
              className="size-5 accent-primary" /> Prefer lactose-free dairy options
          </label>
          <label className="flex items-center justify-between gap-2 text-sm">
            Preferred snack flavor
            <select aria-label="Preferred snack flavor" value={prefs.flavor}
              onChange={(e) => setPreference({ flavor: e.target.value as FlexFoodPreferences["flavor"] })}
              className="min-h-10 rounded-lg border border-border bg-background px-3">
              <option value="chocolate">Chocolate</option>
              <option value="strawberry">Strawberry</option>
              <option value="plain">Plain</option>
            </select>
          </label>
          <p className="text-[11px] text-muted-foreground">Preferences are saved in your existing M3 FLEX workout data and included in its backup/sync.</p>
        </div>
      </details>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="text-[11px] text-muted-foreground">Marcus remains the approved voice. Conversation works in text; optional local AI supports broader follow-ups without paid API calls.</span>
        {!compact && <a href="/playable/#review" className="shrink-0 font-bold text-accent">Review videos <ArrowRight className="inline size-3" /></a>}
      </div>
    </section>
  );
}
