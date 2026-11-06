#!/usr/bin/env node
/**
 * Offline M3 FLEX coach + nutrition regression suite.
 * Transpiles the actual native advice module and exercises it against a
 * stand-in for the existing application store. No web, no new AI costs.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const logic = read("src/lib/flex-local-advice.ts");
const storeFile = read("src/lib/store.ts");
const home = read("src/routes/index.tsx");
const nutritionPage = read("src/routes/nutrition.tsx");
const nativeCoach = read("src/routes/coach.$day.tsx");
const command = read("src/components/FlexCoachCommand.tsx");
const transpile = ts.transpileModule(logic, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal(transpile.diagnostics?.filter(d => d.category === ts.DiagnosticCategory.Error).length || 0, 0);
const now = "2026-11-06";
const data = {
  settings: { units: "lb" },
  targets: { protein: 200, trainingCal: 2400, restCal: 2250, carbs: 250, fat: 75, water: 10 },
  flexFoodPreferences: { avoidCheese: true, preferLactoseFree: true, flavor: "chocolate" },
  nutrition: {
    [now]: {
      entries: [{ id: "1", name: "chicken rice", cal: 700, protein: 60, carbs: 65, fat: 20 }],
      water: 3, trainingDay: true, bodyweight: "199",
    },
  },
};
const totals = n => n.entries.reduce((v, x) => ({ cal: v.cal + x.cal, protein: v.protein + x.protein, carbs: v.carbs + x.carbs, fat: v.fat + x.fat }), { cal: 0, protein: 0, carbs: 0, fat: 0 });
const stub = (name) => {
  if (name === "@/lib/store") return {
    currentDayNumber: () => 1, todayKey: () => now,
    getNutrition: (s, d) => s.nutrition[d] || { entries: [], water: 0, trainingDay: true, bodyweight: "" },
    nutritionTotals: totals,
  };
  if (name === "@/lib/nutrition-coach") return {
    nutritionCoachSnapshot: s => {
      const n = s.nutrition[now] || {entries:[],water:0,trainingDay:true}, t = totals(n);
      return {
        today: { calories: t.cal, protein: t.protein, carbs: t.carbs, fat: t.fat,
          water: n.water, proteinTarget: s.targets.protein, calorieTarget: n.trainingDay ? s.targets.trainingCal : s.targets.restCal,
          carbsTarget: s.targets.carbs, fatTarget: s.targets.fat, waterTarget: s.targets.water, trainingDay: n.trainingDay },
        headline: "Based on real logs", detail: "No inferred meals.",
      };
    },
  };
  if (name === "@/data/program") return { planForDay: () => ({ title: "Upper Body Recovery", focus: "strength" }) };
  throw Error("Unexpected module: " + name);
};
const exports = {};
vm.runInNewContext(transpile.outputText, { exports, require: stub, console }, { timeout: 3000 });
const { answerFlexLocal } = exports;
assert.equal(typeof answerFlexLocal, "function");

let checks = 0;
const expect = (name, condition) => { assert.ok(condition, name); checks++; };
expect("No cheese snack", !answerFlexLocal("what should I eat", data).text.toLowerCase().includes("add cheese"));
expect("Meal suggestion explicitly avoids cheese", answerFlexLocal("what should I eat", data).text.includes("(no cheese)"));
expect("Keeps lactose-free flavor preference", answerFlexLocal("what should I eat", data).text.includes("chocolate lactose-free"));
expect("Real logged protein in answer", answerFlexLocal("how much protein", data).text.includes("60 g of 200 g"));
expect("Real logged calories", answerFlexLocal("how many calories", data).text.includes("700 of 2400"));
expect("Real logged hydration", answerFlexLocal("how's my water", data).text.includes("3 of 10"));
expect("Safety first for injured leg", answerFlexLocal("is my left leg okay to train?", data).category === "safety");
expect("Uses existing workout plan", answerFlexLocal("what is my workout", data).text.includes("Upper Body Recovery"));
expect("No auto food logging in guidance", answerFlexLocal("what should I eat", data).text.includes("nothing is automatically counted"));
data.nutrition[now].entries.push({ id: "2", name: "salmon", cal: 450, protein: 38, carbs: 5, fat: 28 });
expect("Reacts to new recorded food", answerFlexLocal("protein", data).text.includes("98 g of 200 g"));
data.flexFoodPreferences = { avoidCheese: false, preferLactoseFree: false, flavor: "strawberry" };
expect("User preference changes take effect", answerFlexLocal("what should I eat", data).text.includes("strawberry high-protein"));
data.nutrition[now].entries = [];
expect("Empty log not treated as full day", answerFlexLocal("calories", data).text.includes("not logged yet"));
expect("Single store persists preferences", storeFile.includes("flexFoodPreferences") && storeFile.includes("parsed.flexFoodPreferences"));
expect("Home embeds existing coach component", home.includes("<FlexCoachCommand />"));
expect("Nutrition embeds same component", nutritionPage.includes("<FlexCoachCommand compact />"));
expect("Native coached session can answer nutrition", nativeCoach.includes("answerFlexLocal(phrase, state)"));
expect("Native coaching route remains intact", nativeCoach.includes('createFileRoute("/coach/$day")'));
expect("Mic remains user-initiated", command.includes('data-testid="flex-voice-input"') && command.includes("onClick={() => {") && command.includes("if (!startListening())") && command.includes("stopListening()"));
expect("No paid AI API in free component", !command.includes("/api/public/coach-talk") && !logic.includes("fetch("));
console.log("M3 FLEX native coaching + nutrition QA passed: " + checks + " checks.");
