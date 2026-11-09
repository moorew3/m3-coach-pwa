#!/usr/bin/env node
/** Real camera landmark basketball mechanics tests, never invent made baskets. */
import assert from "node:assert/strict";
import vm from "node:vm";
import ts from "typescript";
import { readFileSync } from "node:fs";

const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const js = s => ts.transpileModule(s, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
const a = js(read("src/lib/vision/analysis.ts"));
assert.equal((a.diagnostics || []).filter(x => x.category === ts.DiagnosticCategory.Error).length, 0);
const analysis = { exports: {} };
vm.runInNewContext(a.outputText, analysis);
const p = js(read("src/lib/vision/basketball-release.ts"));
assert.equal((p.diagnostics || []).filter(x => x.category === ts.DiagnosticCategory.Error).length, 0);
const context = { exports: {}, require: name => {
  assert.equal(name, "./analysis");
  return analysis.exports;
}};
vm.runInNewContext(p.outputText, context);
const { BasketballReleaseTracker } = context.exports;
const pose = (arm, extended = false, confidence = 1) => {
  const lm = Array.from({length: 33}, () => ({x:0,y:0,visibility:0}));
  const index = arm === "right" ? {sh:12,el:14,wr:16} : {sh:11,el:13,wr:15};
  lm[index.sh] = {x:0.5,y:0.5,visibility:confidence};
  lm[index.el] = extended
    ? {x:0.5,y:0.3,visibility:confidence}
    : {x:0.6,y:0.5,visibility:confidence};
  lm[index.wr] = extended
    ? {x:0.5,y:0.1,visibility:confidence}
    : {x:0.6,y:0.4,visibility:confidence};
  return lm;
};
const tracker = new BasketballReleaseTracker("right");
let s=tracker.push(null,1000);
assert.equal(s.phase,"not-visible");
assert.equal(s.cycles,0);
assert.equal(s.elbowAngle,null);
s=tracker.push(pose("right"),2000);
assert.equal(s.phase,"set");
assert.equal(s.cycles,0);
s=tracker.push(pose("right",true),2240);
assert.equal(s.cycles,1, "one actual visible extension cycle");
assert.equal(s.phase,"extended");
assert.equal(s.wristAboveShoulder,true);
s=tracker.push(pose("right",true),2400);
assert.equal(s.cycles,1, "holding arm extended must never add reps");
tracker.push(pose("right"),3000);
s=tracker.push(pose("right",true),3300);
assert.equal(s.cycles,2);
s=tracker.push(pose("right",true,0.1),3500);
assert.equal(s.phase,"not-visible");
assert.equal(s.cycles,2,"low visibility must not invent reps");
assert.ok((s.cue||"").includes("cannot judge"));
tracker.reset();
assert.equal(tracker.push(pose("right"),4000).cycles,0);
const left = new BasketballReleaseTracker("left");
left.push(pose("left"),5000);
assert.equal(left.push(pose("left",true),5260).cycles,1,"left arm is supported");

const route=read("src/routes/basketball.tsx");
const home=read("src/routes/index.tsx");
const engine=read("src/lib/vision/camera.ts");
assert.match(route,/createFileRoute\("\/basketball"\)/);
assert.match(route,/useCamera\(\)/);
assert.match(route,/startCamera\(null\)/);
assert.match(route,/stopCamera\(\)/);
assert.match(route,/injured left leg remains unloaded/);
assert.match(home,/to="\/basketball"/);
assert.match(engine,/detectForVideo/);
assert.doesNotMatch(route,/fetch\(/,"athlete video must not be uploaded");
console.log("M3 FLEX camera basketball QA passed: real visible arm extension, bilateral tracking, no fake makes/reps, privacy.");
