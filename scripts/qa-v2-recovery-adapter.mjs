/**
 * Owner-review safety gates for proposed A/B workouts integrated into original /v2.
 * Checks the ACTUAL compiled adapter and sequencing function, not a handwritten reimplementation.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const read=(p)=>readFileSync(fileURLToPath(new URL("../"+p,import.meta.url)),"utf8");
const parsed=(p)=>JSON.parse(read(p));
const workoutPlan=parsed("src/data/recovery/m3-flex-workouts-ab-staging.json");
const media=parsed("src/data/recovery/m3-flex-approved-media-staging.json");
const route=read("src/routes/v2.tsx");
function load(path, importMap={}) {
 const js=ts.transpileModule(read(path),{
  fileName:path,
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},
 }).outputText;
 const module={exports:{}};
 new Function("require","module","exports",js)(
  name=>{if(name in importMap)return importMap[name];throw Error("Unexpected dependency "+name);},
  module,module.exports);
 return module.exports;
}
const adapter=load("src/v2/recovery-training-workouts.ts",{
 "@/data/recovery/m3-flex-workouts-ab-staging.json":workoutPlan,
 "@/data/recovery/m3-flex-approved-media-staging.json":media,
});
const sequencing=load("src/v2/set-sequence.ts");
const check=(name,callback)=>{callback();console.log("PASS",name);count++};
let count=0;
const [a,b]=adapter.RECOVERY_PREVIEW_WORKOUTS;
check("exactly A/B previews with independent IDs",()=>{
 assert.equal(adapter.RECOVERY_PREVIEW_WORKOUTS.length,2);
 assert.equal(a.id,"m3-recovery-a");assert.equal(b.id,"m3-recovery-b");
});
for(const [key,day,working] of [["A",a,16],["B",b,15]]) {
 check(key+" default is straight sets, no automatic supersets",()=>assert.equal(day.useSupersets,false));
 check(key+" has correct working-set counts plus breathing",()=>{
  assert.equal(day.exercises[0].id,"recovery-prep");
  assert.equal(day.exercises.at(-1).id,"recovery-cooldown");
  assert.equal(day.exercises[0].sets,1);assert.equal(day.exercises.at(-1).sets,1);
  assert.equal(day.exercises.slice(1,-1).reduce((n,x)=>n+x.sets,0),working);
  assert.equal(day.exercises.reduce((n,x)=>n+x.sets,0),working+2);
 });
 check(key+" uses only exact preview-approved source clips",()=>{
  for(const x of day.exercises){
    const preview=adapter.recoveryPreviewMediaFor(x);
    const item=media.clips.find(k=>k.videoUrl===preview?.url);
    assert.ok(item?.ownerApproved&&item?.previewAllowed&&!item?.releaseReady,x.id);
    assert.equal(preview.label,"Motion demo");
  }
 });
 check(key+" has no lower-body workout exercises",()=>{
  assert.ok(day.exercises.every(e=>e.loadClass==="upper"));
  assert.ok(day.exercises.every(e=>!/(?:treadmill|walking|squat|lunge|running|deadlift|leg press)/i.test(e.name)));
 });
 check(key+" straight-mode prescribed sets fully retained",()=>{
  const script=sequencing.buildV2SetSequence(day);
  assert.equal(script.length,working+2);
  assert.equal(script.at(-1).restAfterSeconds,0);
 });
 check(key+" first and final breathing clips remain in order",()=>{
  const order=sequencing.buildV2SetSequence(day);
  assert.equal(order[0].exerciseIndex,0);
  assert.equal(order.at(-1).exerciseIndex,day.exercises.length-1);
  assert.ok(order.at(-2).restAfterSeconds>0);
 });
}
check("Workout A hammer/triceps starts the timer after triceps",()=>{
 const enabled={...a,useSupersets:true};
 const steps=sequencing.buildV2SetSequence(enabled);
 const ix=steps.findIndex((step,i)=>dayId(enabled,step)==="recovery-hammer"&&step.setIndex===0);
 assert.ok(ix>0);
 assert.equal(dayId(enabled,steps[ix+1]),"recovery-triceps");
 assert.equal(steps[ix].restAfterSeconds,0);
 assert.equal(steps[ix+1].restAfterSeconds,75);
});
check("Workout B two superset pairs work with unequal band/triceps sets",()=>{
 const enabled={...b,useSupersets:true};
 const steps=sequencing.buildV2SetSequence(enabled);
 const bandFirst=steps.findIndex(x=>dayId(enabled,x)==="recovery-band"&&x.setIndex===0);
 assert.ok(bandFirst>0);
 assert.equal(dayId(enabled,steps[bandFirst+1]),"recovery-triceps");
 assert.equal(steps[bandFirst].restAfterSeconds,0);
 assert.equal(steps[bandFirst+1].restAfterSeconds,75);
 const tricepsThird=steps.find(x=>dayId(enabled,x)==="recovery-triceps"&&x.setIndex===2);
 assert.ok(tricepsThird);
 assert.ok(tricepsThird.restAfterSeconds>0);
 assert.equal(steps.filter(x=>dayId(enabled,x)==="recovery-triceps").length,3);
});
check("original V2 week is preserved ahead of opt-in recovery previews",()=>{
 assert.match(route,/\\.\\.\\.ORIGINAL_WEEK_WORKOUTS, \\.\\.\\.V2_WORKOUTS, \\.\\.\\.RECOVERY_PREVIEW_WORKOUTS/);
});
check("new recovery media cannot override old identity-approved V2 source",()=>{
 assert.match(route,/isRecoveryPreviewWorkout\\(session\\.workout\\.id\\) \\? undefined : approvedCoachMedia\\(exercise\\)/);
});
check("optional superset switch cannot erase logged workout sets",()=>{
 assert.match(route,/session\\.phase !== "ready" \\|\\| session\\.completedSetIds\\.length > 0/);
});
check("staging status and approval remain explicit",()=>{
 assert.equal(media.allReleaseBlocked,true);
 assert.match(workoutPlan.status,/NOT_ACTIVATED|OWNER_REVIEW/);
 assert.match(route,/NOT MEDICALLY CLEARED/);
});
function dayId(day,step){return day.exercises[step.exerciseIndex].id}
console.log("PASSED",count,"actual V2 recovery A/B adapter checks. NOT released or clinically cleared.");
