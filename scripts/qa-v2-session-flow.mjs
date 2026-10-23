/**
 * Real V2 session reducer regressions — no browser, account, or live deployment.
 * Loads the repo's TypeScript source through TypeScript's transpileModule,
 * so the test executes the actual reducer and actual set scheduler.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const base = new URL("../src/v2/", import.meta.url);
const loaded = new Map();
function load(name) {
  if (loaded.has(name)) return loaded.get(name);
  const path = fileURLToPath(new URL(name + ".ts", base));
  const content = readFileSync(path, "utf8");
  const output = ts.transpileModule(content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
    reportDiagnostics: true,
  });
  const bad = (output.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(bad.length, 0, path + " has compiler errors");
  const mod = { exports: {} };
  const localRequire = (id) => {
    if (id === "./set-sequence") return load("set-sequence");
    throw Error("Unapproved test import: " + id);
  };
  new Function("require", "module", "exports", output.outputText)(localRequire, mod, mod.exports);
  loaded.set(name, mod.exports);
  return mod.exports;
}
const { v2SessionReducer, createV2Session } = load("session");
const { buildV2SetSequence } = load("set-sequence");

let tests = 0;
function check(name, fn) { fn(); tests += 1; console.log("PASS", name); }
const ex = (id, sets, restSeconds, other = {}) =>
  ({ id, name: id, category: "strength", sets, restSeconds, motionKey: id, cues: [], ...other });
const workout = (id, exercises, useSupersets = false) =>
  ({ id, title: id, focus: "test", exercises, useSupersets });
const move = (s, type) => v2SessionReducer(s, { type });
const ticks = (s, n) => { for (let i = 0; i < n; i++) s = move(s, "tick"); return s; };
const idx = s => [s.exerciseIndex, s.setIndex];

const straight = workout("straight", [ex("A",3,60),ex("B",2,90)]);
check("straight order preserves A1 A2 A3 B1 B2", () =>
  assert.deepEqual(buildV2SetSequence(straight).map(x=>[x.exerciseIndex,x.setIndex]),
   [[0,0],[0,1],[0,2],[1,0],[1,1]]));
check("every straight set has rest, including between exercises", () =>
  assert.deepEqual(buildV2SetSequence(straight).map(x=>x.restAfterSeconds),[60,60,60,90,0]));
let s = move(createV2Session(straight),"start");
check("ready -> active first set",()=>{assert.equal(s.phase,"work");assert.deepEqual(idx(s),[0,0]);});
s=move(s,"complete-set");
check("after A1 -> 60s rest targeting A2",()=>{assert.equal(s.phase,"rest");assert.equal(s.phaseSecondsLeft,60);assert.deepEqual(idx(s),[0,1]);});
check("rest cannot be accidentally logged as a completed set",()=>{
 const before=s.completedSetIds.length;
 s=move(s,"complete-set");
 assert.equal(s.completedSetIds.length,before);assert.equal(s.phase,"rest");
});
s=ticks(s,17);
check("rest timer shows correct remaining seconds",()=>assert.equal(s.phaseSecondsLeft,43));
s=move(s,"pause");s=ticks(s,6);
check("paused rest clock does not advance",()=>assert.equal(s.phaseSecondsLeft,43));
s=move(s,"start");s=ticks(s,43);
check("rest expiration starts the right next set",()=>{assert.equal(s.phase,"work");assert.deepEqual(idx(s),[0,1]);});
s=move(s,"complete-set");s=ticks(s,60);
s=move(s,"complete-set");
check("last A set rests before the first B set",()=>{assert.equal(s.phase,"rest");assert.equal(s.phaseSecondsLeft,60);assert.deepEqual(idx(s),[1,0]);});
s=ticks(s,60);s=move(s,"complete-set");
check("B set has its own 90s recovery",()=>{assert.equal(s.phase,"rest");assert.equal(s.phaseSecondsLeft,90);assert.deepEqual(idx(s),[1,1]);});
s=ticks(s,90);s=move(s,"complete-set");
check("last B set ends without false extra rest",()=>{assert.equal(s.phase,"complete");assert.equal(s.completedSetIds.length,5);});

let skipped=move(createV2Session(straight),"start");
skipped=move(skipped,"next");
check("deliberately skipped set advances into recovery but earns NO completed credit",()=>{
 assert.equal(skipped.phase,"rest");
 assert.equal(skipped.phaseSecondsLeft,60);
 assert.deepEqual(idx(skipped),[0,1]);
 assert.equal(skipped.completedSetIds.length,0);
});
const group = workout("paired",[
 ex("A",3,60,{supersetId:"S",supersetRestSeconds:75}),
 ex("gap",1,45),
 ex("B",2,60,{supersetId:"S",supersetRestSeconds:75}),
 ex("C",1,60),
],true);
const plan=buildV2SetSequence(group);
check("nonadjacent partners become A1-B1-A2-B2-A3-gap-C",()=>assert.deepEqual(plan.map(x=>[x.exerciseIndex,x.setIndex]),[[0,0],[2,0],[0,1],[2,1],[0,2],[1,0],[3,0]]));
check("rest only after the FINAL superset movement, not after A",()=>assert.deepEqual(plan.map(x=>x.restAfterSeconds),[0,75,0,75,60,45,0]));
let q=move(createV2Session(group),"start");
q=move(q,"complete-set");
check("superset A1 moves to B1 WITHOUT any rest countdown",()=>{assert.equal(q.phase,"work");assert.deepEqual(idx(q),[2,0]);assert.equal(q.completedSetIds.length,1);});
q=move(q,"complete-set");
check("superset B1 triggers 75s countdown",()=>{assert.equal(q.phase,"rest");assert.equal(q.phaseSecondsLeft,75);assert.deepEqual(idx(q),[0,1]);});
q=ticks(q,75);q=move(q,"complete-set");
check("superset A2 transitions to B2 without rest",()=>{assert.equal(q.phase,"work");assert.deepEqual(idx(q),[2,1]);});
q=move(q,"complete-set");q=ticks(q,75);
check("after 2 paired rounds, remaining A3 is preserved",()=>{assert.equal(q.phase,"work");assert.deepEqual(idx(q),[0,2]);});
q=move(q,"complete-set");
check("unequal superset extra A3 gets standalone rest",()=>{assert.equal(q.phase,"rest");assert.equal(q.phaseSecondsLeft,60);assert.deepEqual(idx(q),[1,0]);});
q=ticks(q,60);q=move(q,"complete-set");q=ticks(q,45);q=move(q,"complete-set");
check("every actual work set gets logged exactly once",()=>{assert.equal(q.phase,"complete");assert.equal(q.completedSetIds.length,7);});

const disabled={...group,useSupersets:false};
check("supersets OFF returns straight work order",()=>assert.deepEqual(buildV2SetSequence(disabled).map(x=>x.exerciseIndex),[0,0,0,1,2,2,3]));
check("zero or invalid legacy rest values use finite safe recovery",()=>{
 const legacy=workout("old",[ex("old",2,Number.NaN),ex("next",1,0)]);
 assert.deepEqual(buildV2SetSequence(legacy).map(x=>x.restAfterSeconds),[30,30,0]);
});
console.log("PASSED",tests,"actual /v2 reducer sequencing checks; not a Galaxy Fold video/audio test.");
