import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { localCoachAnswer } from "../src/lib/local-coach-answer.ts";

const current = {
  exercise: "Seated hammer curls",
  target: "10–12",
  setNumber: 2,
  totalSets: 3,
  next: "Seated front raises",
  weight: "15",
  phase: "work",
  camera: { active: false },
  cues: ["Keep elbows by your sides"],
};

test("local factual answers use only the actual current workout state", () => {
  assert.match(localCoachAnswer("Coach, what exercise are we doing?", current), /Seated hammer curls/);
  assert.match(localCoachAnswer("What comes next?", current), /Seated front raises/);
  assert.match(localCoachAnswer("How many sets are left?", current), /set 2 of 3/);
  assert.match(localCoachAnswer("How many reps?", current), /10–12/);
  assert.match(localCoachAnswer("Which dumbbell weight?", current), /15/);
  assert.match(localCoachAnswer("How should I do this?", current), /Keep elbows by your sides/);
});

test("rest answers respect remaining time, not assumed total rest", () => {
  assert.match(localCoachAnswer("How much longer is my rest?", { ...current, phase: "rest", restRemainingSeconds: 16.1 }), /17 seconds/);
  assert.match(localCoachAnswer("Coach, rest?", { ...current, phase: "rest" }), /visible countdown/);
  assert.match(localCoachAnswer("Why do I rest after both movements?", current), /after the last exercise in a superset pair/);
});

test("camera claims require a real measurement and sufficient confidence", () => {
  assert.match(localCoachAnswer("How is my form?", current), /don't have an active camera measurement/);
  assert.match(localCoachAnswer("Can you see me?", { ...current, camera: { active: true, confidence: 0.62, cue: "good" } }), /isn't reliable enough/);
  const strong = localCoachAnswer("Is my technique okay?", { ...current, camera: { active: true, confidence: 0.82, cue: "Slow the lowering phase" } });
  assert.match(strong, /Camera estimate: Slow the lowering phase/);
  assert.doesNotMatch(strong, /perfect|verified physical assessment/i);
  assert.match(localCoachAnswer("How is my form?", { ...current, camera: { active: true, confidence: 0.94 } }), /can't confirm/);
});

test("safety language takes precedence over other inquiries", () => {
  assert.match(localCoachAnswer("Coach I have chest pain, how many sets left?", current), /Stop exercising now/);
  assert.match(localCoachAnswer("My wrist hurts, am I doing this right?", current), /Stop this exercise/);
  assert.match(localCoachAnswer("Can I stand up with the cast?", current), /Do not bear weight/);
});

test("absent facts are not invented, unrecognized text delegates to optional AI", () => {
  assert.match(localCoachAnswer("How many sets?", {}), /isn't available/);
  assert.match(localCoachAnswer("What is the next exercise?", {}), /not recorded/);
  assert.match(localCoachAnswer("What weight?", {}), /No weight is entered/);
  assert.equal(localCoachAnswer("Explain oxidative metabolism", current), null);
  assert.equal(localCoachAnswer("", current), null);
});

test("mobile question UI and no-cost feature gate are wired without credentials", () => {
  const route = readFileSync(new URL("../src/routes/coach.$day.tsx", import.meta.url), "utf8");
  const talk = readFileSync(new URL("../src/lib/coach-talk.ts", import.meta.url), "utf8");
  assert.match(route, /data-testid="coach-question-input"/);
  assert.match(route, /data-testid="coach-local-answer"/);
  assert.match(route, /setConversationHandler\(answerQuestion\)/);
  assert.match(talk, /localCoachAnswer\(text, context\)/);
  assert.match(talk, /VITE_FLEX_PAID_AI_ENABLED/);
  const localBeforeRemote = talk.indexOf("localCoachAnswer(text, context)") < talk.indexOf('fetch("/api/public/coach-talk"');
  assert.equal(localBeforeRemote, true);
});
