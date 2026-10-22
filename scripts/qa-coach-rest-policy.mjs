/**
 * Regression checks for the ACTUAL rest and superset blocks in coach-script.ts.
 * Runs without adding test libraries or touching Railway.
 *
 * Command: node scripts/qa-coach-rest-policy.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = readFileSync(fileURLToPath(new URL("../src/lib/coach-script.ts", import.meta.url)), "utf8");
const extract = (begin, end) => {
  const a = src.indexOf(begin), b = src.indexOf(end, a);
  assert.ok(a >= 0 && b > a, "Expected coach-script source anchors");
  return src.slice(a, b);
};

const sectionFor = (plan, ex) => plan.warmup.some((x) => x.id === ex.id)
  ? "Warm-up"
  : plan.finisher.some((x) => x.id === ex.id)
    ? "Finisher"
    : "Main work";

// Strip the few TypeScript annotations in the isolated pure helper.
const groupCode = extract("export function groupedCoachedExercises(", "/** Speech-led steps:")
  .replace("export function groupedCoachedExercises(plan: DayPlan, exercises: Exercise[], useSupersets: boolean): Exercise[]", "function groupedCoachedExercises(plan, exercises, useSupersets)")
  .replace("new Set<number>()", "new Set()")
  .replace("const ordered: Exercise[] = [];", "const ordered = [];");
const group = new Function("sectionFor", groupCode + "\nreturn groupedCoachedExercises;")(sectionFor);
const restSource = extract("const blockDone = lastRound", "const nextCu = nextEx")
  .replace("(seconds: number | undefined)", "(seconds)");
const restDuration = new Function(
  "lastRound", "block", "r", "setsFor", "nextEx", "c", "section", "e",
  restSource + "\nreturn rest;",
);
const e = (id, sets, superset, rest = 60, supersetRest = 75) => ({ id, sets, superset, rest, supersetRest });
let passed = 0;
function test(name, fn) { fn(); passed++; console.log("PASS", name); }

const program = { warmup: [{ id: "warm" }], finisher: [], main: [] };
const order = [e("warm", 1), e("curl", 3, "B"), e("hammer", 3), e("triceps", 3, "B"), e("press", 3)];
const paired = group(program, order, true);
const solo = group(program, order, false);
test("nonadjacent superset partners A/B become adjacent", () =>
  assert.deepEqual(paired.map(x => x.id), ["warm", "curl", "triceps", "hammer", "press"]));
test("without supersets the exercise order stays unchanged", () =>
  assert.deepEqual(solo.map(x => x.id), order.map(x => x.id)));
test("solo mode strips all superset metadata", () =>
  assert.ok(solo.every(x => x.superset == null && x.supersetRest == null)));
test("reordering does not change prescribed total sets", () =>
  assert.equal(paired.reduce((n, x) => n + x.sets, 0), order.reduce((n, x) => n + x.sets, 0)));
test("source program is not mutated", () => assert.equal(order[1].superset, "B"));
test("warmup cannot be paired with main work", () =>
  assert.deepEqual(group(program, [e("warm", 1, "A"), e("press", 3, "A")], true).map(x=>x.id), ["warm", "press"]));

test("superset A-to-B handoff uses brief, not rest timer", () =>
  assert.match(src, /\$\{e\.id\}-handoff-\$\{r\}`,\s*\/\/[^\n]+\n\s*kind: "brief"/));
test("A1 continues into A2 without rest", () => assert.match(src, /if \(partnerFollows\) return;/));
const rest = (block, round, isLast, next, section = "Main work", cooldown = [{}]) =>
  restDuration(isLast, block, round, ex => ex.sets, next, { cooldown }, section, block[block.length - 1]);
test("straight set rest is 60 seconds", () =>
  assert.equal(rest([e("curl", 3)], 0, false, e("press", 3)), 60));
test("superset countdown starts after last partner and lasts 75 seconds", () =>
  assert.equal(rest([e("curl", 3, "B"), e("triceps", 3, "B")], 0, false, e("press", 3)), 75));
test("between distinct exercises preserve 60-second rest", () =>
  assert.equal(rest([e("curl", 3)], 2, true, e("press", 3)), 60));
test("last set rests before cooldown", () =>
  assert.equal(rest([e("curl", 3)], 2, true, undefined), 60));
test("warmup zero-rest prescriptions still transition with at least 15 seconds", () =>
  assert.equal(rest([e("warm", 2, undefined, 0)], 0, false, e("curl", 3), "Warm-up"), 15));
test("solo set ignores the separate supersetRest field", () =>
  assert.equal(rest([e("curl", 3, undefined, 60, 120)], 2, true, e("press", 3)), 60));
test("legacy optional movement missing rest cannot freeze the countdown", () =>
  assert.equal(rest([{ id: "legacy", sets: 3, rest: undefined }], 0, false, e("press", 3)), 30));
test("warmup lacking a rest prescription safely defaults to 15 seconds", () =>
  assert.equal(rest([{ id: "wu", sets: 3, rest: undefined }], 0, false, e("press", 3), "Warm-up"), 15));
test("invalid NaN rest value cannot enter the coach clock", () =>
  assert.equal(rest([{ id: "legacy", sets: 3, rest: Number.NaN }], 0, false, e("press", 3)), 30));
test("superset uses longest prescribed post-pair rest", () =>
  assert.equal(rest([e("curl", 3, "B", 60, 75), e("triceps", 3, "B", 45, 120)], 0, false, e("press", 3)), 120));
test("no unnecessary rest after final block without cooldown", () =>
  assert.equal(rest([e("curl", 3)], 2, true, undefined, "Main work", []), undefined));
console.log("PASSED", passed, "rest-policy checks. This is NOT a compiled app or phone video/audio test.");
