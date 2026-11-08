#!/usr/bin/env node
/** Camera framing test: seated upper body can work without foot visibility.
 * Full-body leg/kick calibration is still strict. No video or medical inference.
 */
import assert from "node:assert/strict";
import vm from "node:vm";
import ts from "typescript";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const module = ts.transpileModule(read("src/lib/vision/calibration.ts"), {
  compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  reportDiagnostics:true,
});
assert.equal((module.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const sandbox={exports:{}};
vm.runInNewContext(module.outputText,sandbox);
const {calibratePose}=sandbox.exports;
const pose=()=>{
  const lm=Array.from({length:33},()=>({x:0.5,y:0.5,visibility:0}));
  lm[11]={x:0.37,y:0.43,visibility:1};
  lm[12]={x:0.63,y:0.43,visibility:1};
  lm[13]={x:0.33,y:0.57,visibility:1};
  lm[14]={x:0.67,y:0.57,visibility:1};
  lm[15]={x:0.3,y:0.71,visibility:1};
  lm[16]={x:0.7,y:0.71,visibility:1};
  lm[0]={x:0.5,y:0.2,visibility:1};
  return lm;
};
let lm=pose();
let seated=calibratePose(lm,"upper");
assert.equal(seated.ready,true,"upper-body framing must not require ankles");
assert.equal(seated.lowerVisible,false);
assert.match(seated.prompt,/lower legs may remain supported/);
assert.equal(calibratePose(lm,"full").ready,false,"leg/kick checks still need knees and ankles");
lm[16].visibility=0.1;
assert.equal(calibratePose(lm,"upper").ready,false,"poor wrist visibility should prevent form judgement");
lm=pose();
for (const i of [23,24,25,26,27,28])
  lm[i]={x:i%2?0.4:0.6,y:i>=27?0.91:i>=25?0.72:0.58,visibility:1};
assert.equal(calibratePose(lm,"full").ready,true,"full-body assessment can work when all joints visible");
const cam=read("src/lib/vision/camera.ts");
const v2=read("src/v2/training-camera.tsx");
const basketball=read("src/routes/basketball.tsx");
assert.match(cam,/calibratePose\(lm, cam\.framing\)/);
assert.match(v2,/kickKind \|\| pattern === "squat" \|\| pattern === "lunge"/);
assert.match(v2,/setCameraFraming\(framing\)/);
assert.match(basketball,/setCameraFraming\("upper"\)/);
console.log("M3 FLEX camera calibration QA passed: injury-safe upper body and strict full-body gating.");
