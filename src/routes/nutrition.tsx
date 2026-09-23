import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Droplets, Plus, Star, Trash2 } from "lucide-react";
import {
  getNutrition,
  nutritionTotals,
  removeFavorite,
  saveFavorite,
  setState,
  todayKey,
  updateNutrition,
  useApp,
  type FoodEntry,
} from "@/lib/store";

export const Route = createFileRoute("/nutrition")({
  head: () => ({
    meta: [
      { title: "Nutrition — 22-Day Arm Growth Tracker" },
      {
        name: "description",
        content:
          "Lightweight calorie, protein, carb, fat, water and bodyweight tracking with training and rest day targets.",
      },
      { property: "og:title", content: "Nutrition — 22-Day Arm Growth Tracker" },
      { property: "og:description", content: "Simple daily macro and water tracking." },
    ],
  }),
  component: Nutrition,
});

const num = (v: string) => Number(v) || 0;

const emptyForm = { name: "", cal: "", protein: "", carbs: "", fat: "" };

function Bar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {Math.round(value)} / {target} · {Math.max(0, Math.round(target - value))} left
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Nutrition() {
  const state = useApp();
  const date = todayKey();
  const day = getNutrition(state, date);
  const totals = nutritionTotals(day);
  const t = state.targets;
  const calTarget = day.trainingDay ? t.trainingCal : t.restCal;
  const [form, setForm] = useState(emptyForm);
  const [showTargets, setShowTargets] = useState(false);

  const addEntry = (entry: FoodEntry, alsoFavorite = false) => {
    updateNutrition(date, (n) => ({
      ...n,
      entries: [...n.entries, { ...entry, id: crypto.randomUUID() }],
    }));
    if (alsoFavorite) saveFavorite(entry);
  };

  const submit = (alsoFavorite: boolean) => {
    if (!form.name.trim()) return;
    addEntry(
      {
        id: "",
        name: form.name.trim(),
        cal: num(form.cal),
        protein: num(form.protein),
        carbs: num(form.carbs),
        fat: num(form.fat),
      },
      alsoFavorite,
    );
    setForm(emptyForm);
  };

  const setTarget = (patch: Partial<typeof t>) =>
    setState((s) => ({ ...s, targets: { ...s.targets, ...patch } }));

  return (
    <main className="px-4 pt-6">
      <h1 className="text-3xl font-bold">Nutrition</h1>
      <p className="mt-1 text-sm text-muted-foreground">Today · {date}</p>

      <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
        <button
          type="button"
          aria-pressed={day.trainingDay}
          onClick={() => updateNutrition(date, (n) => ({ ...n, trainingDay: !n.trainingDay }))}
          className="tap-target flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-sm font-semibold"
        >
          Training day target
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
              day.trainingDay
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {day.trainingDay ? "Training" : "Rest"}
          </span>
        </button>
        <Bar label="Calories" value={totals.cal} target={calTarget} />
        <Bar label="Protein (g)" value={totals.protein} target={t.protein} />
        <Bar label="Carbs (g)" value={totals.carbs} target={t.carbs} />
        <Bar label="Fat (g)" value={totals.fat} target={t.fat} />
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold uppercase">
          <Droplets className="size-5 text-accent" aria-hidden /> Water
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {day.water} of {t.water} cups (8 oz each)
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() =>
              updateNutrition(date, (n) => ({ ...n, water: Math.max(0, n.water - 1) }))
            }
            className="tap-target rounded-xl bg-elevated text-base font-bold"
          >
            −1
          </button>
          <button
            type="button"
            onClick={() => updateNutrition(date, (n) => ({ ...n, water: n.water + 1 }))}
            className="tap-target rounded-xl bg-primary text-base font-bold uppercase text-primary-foreground"
          >
            +1 cup
          </button>
          <button
            type="button"
            onClick={() => updateNutrition(date, (n) => ({ ...n, water: 0 }))}
            className="tap-target rounded-xl bg-elevated text-sm font-bold uppercase"
          >
            Reset
          </button>
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-muted-foreground">Bodyweight ({state.settings.units})</span>
          <input
            inputMode="decimal"
            value={day.bodyweight}
            onChange={(e) => updateNutrition(date, (n) => ({ ...n, bodyweight: e.target.value }))}
            className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-lg"
          />
        </label>
      </section>

      {state.favorites.length > 0 && (
        <section className="surface-card mt-5 rounded-2xl p-4">
          <h2 className="text-lg font-bold uppercase">Quick add favourites</h2>
          <ul className="mt-3 space-y-2">
            {state.favorites.map((f) => (
              <li key={f.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addEntry(f)}
                  className="tap-target flex flex-1 items-center justify-between rounded-xl bg-elevated px-3 text-left text-sm font-semibold"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    {f.cal} kcal · {f.protein}p
                  </span>
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${f.name} from favourites`}
                  onClick={() => removeFavorite(f.id)}
                  className="tap-target grid w-12 place-items-center rounded-xl bg-elevated text-muted-foreground"
                >
                  <Trash2 className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Add food</h2>
        <input
          placeholder="Food name"
          aria-label="Food name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="tap-target mt-3 w-full rounded-xl border border-input bg-elevated px-3 text-base"
        />
        <div className="mt-2 grid grid-cols-4 gap-2">
          {(["cal", "protein", "carbs", "fat"] as const).map((k) => (
            <input
              key={k}
              inputMode="decimal"
              placeholder={k === "cal" ? "kcal" : k.slice(0, 4)}
              aria-label={k}
              value={form[k]}
              onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
              className="tap-target w-full rounded-xl border border-input bg-elevated px-2 text-center text-base"
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => submit(false)}
            className="tap-target flex items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
          >
            <Plus className="size-5" /> Add
          </button>
          <button
            type="button"
            onClick={() => submit(true)}
            className="tap-target flex items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
          >
            <Star className="size-5" /> Add & save
          </button>
        </div>
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="text-lg font-bold uppercase">Today's food</h2>
        {day.entries.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Nothing logged yet.</p>
        )}
        <ul className="mt-3 space-y-2">
          {day.entries.map((e) => (
            <li key={e.id} className="flex items-center gap-2 rounded-xl bg-elevated p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{e.name}</p>
                <p className="text-xs text-muted-foreground">
                  {e.cal} kcal · {e.protein}p / {e.carbs}c / {e.fat}f
                </p>
              </div>
              <button
                type="button"
                aria-label={`Remove ${e.name}`}
                onClick={() =>
                  updateNutrition(date, (n) => ({
                    ...n,
                    entries: n.entries.filter((x) => x.id !== e.id),
                  }))
                }
                className="grid size-10 place-items-center rounded-lg bg-card text-muted-foreground"
              >
                <Trash2 className="size-5" />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <button
          type="button"
          onClick={() => setShowTargets((v) => !v)}
          className="tap-target flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-sm font-bold uppercase"
        >
          Daily targets
          <span className="text-xs text-muted-foreground">{showTargets ? "Hide" : "Edit"}</span>
        </button>
        {showTargets && (
          <div className="mt-3 space-y-3">
            {(
              [
                ["trainingCal", "Training day calories"],
                ["restCal", "Rest day calories"],
                ["protein", "Protein (g)"],
                ["carbs", "Carbs (g)"],
                ["fat", "Fat (g)"],
                ["water", "Water (cups)"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="block">
                <span className="text-sm text-muted-foreground">{label}</span>
                <input
                  inputMode="numeric"
                  value={String(t[k])}
                  onChange={(e) => setTarget({ [k]: num(e.target.value) })}
                  className="tap-target mt-1 w-full rounded-xl border border-input bg-elevated px-3 text-lg"
                />
              </label>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}