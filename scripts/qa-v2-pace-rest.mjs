/**
 * V2 visible pacing / rest controls integration checks.
 * Uses the real reducer and pace guide. No rep is inferred as completed.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const moduleCache = new Map();
function load(name) {
  if (moduleCache.has(name)) return moduleCache.get(name);
  const path = fileURLToPath(new URL("../src/v2/"+name+".ts", import.meta.url));
  const compiled = ts.transpileModule(readFileSync(path,"utf8"),{
    fileName:path, compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
  }).outputText;
  const result={exports:{}};
  new Function("require","module","exports",compiled)(id=>{
    if(id==="./set-sequence")return load("set-sequence");
    throw Error("Unexpected module "+id);
  },result,result.exports);
  moduleCache.set(name,result.exports);return result.exports;
}
const { v2SessionReducer:run,createV2Session:create }=load("session");
const { recoveryRepGuide:guide }=load("recovery-rep-guide");
const ex={id:"recovery-hammer",name:"Seated hammer curls",category:"strength",sets:3,
  repRange:[8,12],restSeconds:75, supersetId:"S", supersetRestSeconds:75, motionKey:"hammerCurl",cues:[]};
const other={id:"recovery-triceps",name:"Seated triceps",category:"strength",sets:2,
  repRange:[10,12],restSeconds:75,supersetId:"S",supersetRestSeconds:75,motionKey:"tricepsPressdown",cues:[]};
const workout={id:"m3-recovery-a",title:"Owner test",focus:"",exercises:[ex,other],useSupersets:true};
const act=(session,type,extra={})=>run(session,{type,...extra});
let passed=0;
function check(name,fn){fn();passed++;console.log("PASS",name)}
let s=act(create(workout),"start");
check("work phase clock initializes at zero",()=>assert.equal(s.phaseElapsedSeconds,0));
s=act(act(act(s,"tick"),"tick"),"tick");
check("real work clock increments exactly once per valid tick",()=>assert.equal(s.phaseElapsedSeconds,3));
check("visual rep guide shows a cue but never claims a detected rep",()=>{
 const c=guide(ex,s.phaseElapsedSeconds);
 assert.equal(c.cueNumber,1); assert.equal(c.minimum,8); assert.equal(c.maximum,12);
 assert.equal(s.completedSetIds.length,0);
});
s=act(s,"pause");
s=act(s,"tick");
check("paused work preserves phase time without running ahead",()=>assert.equal(s.phaseElapsedSeconds,3));
s=act(s,"start");
s=act(s,"tick");
check("resumed same set retains pacing position",()=>assert.equal(guide(ex,s.phaseElapsedSeconds).cueNumber,2));
const afterA=act(s,"complete-set");
check("paired A1 -> B1 skips rest and resets work phase counter",()=>{
 assert.equal(afterA.phase,"work");assert.equal(afterA.exerciseIndex,1);
 assert.equal(afterA.phaseElapsedSeconds,0);assert.equal(afterA.completedSetIds.length,1);
});
check("work phase rest adjustment cannot mutate countdown",()=>{
 assert.deepEqual(act(afterA,"adjust-rest",{seconds:15}),afterA);
});
let rest=act(afterA,"complete-set");
check("rest begins only after B1 with 75 seconds",()=>{
 assert.equal(rest.phase,"rest");assert.equal(rest.phaseElapsedSeconds,0);
 assert.equal(rest.phaseSecondsLeft,75);assert.equal(rest.completedSetIds.length,2);
});
rest=act(rest,"adjust-rest",{seconds:15});
check("add rest 15 changes countdown without changing set logs",()=>{
 assert.equal(rest.phaseSecondsLeft,90);assert.equal(rest.completedSetIds.length,2);
});
rest=act(rest,"adjust-rest",{seconds:-15});
check("reduce rest 15 restores countdown",()=>assert.equal(rest.phaseSecondsLeft,75));
rest=act(rest,"adjust-rest",{seconds:-500});
check("rest reduction cannot skip recovery transition",()=>assert.equal(rest.phaseSecondsLeft,5));
rest=act(rest,"adjust-rest",{seconds:1000});
check("rest increase capped to safe 10 minutes",()=>assert.equal(rest.phaseSecondsLeft,600));
const before=rest;
rest=act(rest,"pause");rest=act(rest,"tick");
check("paused rest timer does not drift",()=>{
 assert.equal(rest.phaseSecondsLeft,before.phaseSecondsLeft);
 assert.equal(rest.phaseElapsedSeconds,before.phaseElapsedSeconds);
});
rest=act(rest,"start");
for(let i=0;i<600;i++)rest=act(rest,"tick");
check("rest completion starts new A2 and resets work pacer",()=>{
 assert.equal(rest.phase,"work");assert.equal(rest.exerciseIndex,0);
 assert.equal(rest.setIndex,1);assert.equal(rest.phaseElapsedSeconds,0);
});
check("pace guide caps at max target and never logs itself",()=>{
 const atEnd=guide(ex,1000,4);
 assert.equal(atEnd.cueNumber,12);assert.equal(atEnd.progressPercent,100);
 assert.equal(atEnd.phase,"finish when ready");
 assert.equal(rest.completedSetIds.length,2);
});
check("tempo control 3 versus 6 seconds changes cue pace, not prescribed reps",()=>{
 const a=guide(ex,12,3),b=guide(ex,12,6);
 assert.equal(a.cueNumber,5);assert.equal(b.cueNumber,3);
 assert.equal(a.maximum,b.maximum);assert.equal(a.minimum,b.minimum);
});
check("timed and unrelated movements do not display fake rep counts",()=>{
 assert.equal(guide({...ex,id:"recovery-boxing",category:"boxing",repRange:undefined},4),null);
 assert.equal(guide({...ex,id:"original-curl"},4),null);
});
const src=readFileSync(fileURLToPath(new URL("../src/routes/v2.tsx",import.meta.url)),"utf8");
check("pace UI explicitly states not actual performed repetitions",()=>{
 assert.ok(src.includes("Visual pace guide · not actual reps"));
 assert.ok(src.includes("A timed cue, not camera-verified movement"));
});
check("V2 uses real paused/video-gated time and optional recovery-only HUD",()=>{
 assert.ok(src.includes("needsVisibleWorkVideo && !actualWorkVideoPlaying"));
 assert.ok(src.includes('data-testid="v2-recovery-rep-guide"'));
 assert.ok(src.includes('data-testid="v2-rest-controls"'));
});
console.log("PASSED",passed,"V2 pacing/rest control tests — no camera-verified or medically approved repetitions.");
