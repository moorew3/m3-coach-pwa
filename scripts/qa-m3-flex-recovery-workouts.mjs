/**
 * Staged seated-only workouts: deterministic sequence tests. Never deploys or
 * mutates approved videos. Run: npm run test:m3-flex-recovery
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const load = (name) => JSON.parse(readFileSync(fileURLToPath(new URL("../src/data/recovery/" + name, import.meta.url)), "utf8"));
const program = load("m3-flex-workouts-ab-staging.json");
const media = load("m3-flex-approved-media-staging.json");
const approved = new Map(media.clips.map(x => [x.id, x]));
const checked = [];
function verify(name, fn) { fn(); checked.push(name); console.log("PASS", name); }
function timeline(workoutKey, pairIds = []) {
  const day = program.workouts[workoutKey];
  const all = day.exercises;
  const selected = day.supersetOptions.filter(p => pairIds.includes(p.id));
  const covered = new Set();
  const blocks = [];
  for (const ex of all) {
    if (covered.has(ex.id)) continue;
    const pair = selected.find(p => p.a === ex.id || p.b === ex.id);
    if (pair) {
      const a = all.find(x => x.id === pair.a),b=all.find(x => x.id === pair.b);
      assert.ok(a && b && a.id !== b.id && !covered.has(a.id) && !covered.has(b.id));
      covered.add(a.id);covered.add(b.id);
      blocks.push({a,b,pair});
    } else {
      covered.add(ex.id);
      blocks.push({a:ex,b:null,pair:null});
    }
  }
  const steps=[{type:"preparation"}];
  for (const block of blocks) {
    const {a,b,pair}=block;
    const rounds=b?Math.max(a.sets,b.sets):a.sets;
    for (let n=1;n<=rounds;n++) {
      const active=[...(n<=a.sets?[a]:[]),...(b&&n<=b.sets?[b]:[])];
      active.forEach((ex,index)=>{
        steps.push({type:"set",ex:ex.id,set:n,group:pair?.id||null});
        if(index+1<active.length)steps.push({type:"handoff",from:ex.id,to:active[index+1].id});
      });
      // A real timer begins only after the final active exercise of the round.
      const seconds=active.length===2 ? pair.restSec : active[active.length-1].restSec;
      // Cooldown begins only after the final recovery interval as well.
      steps.push({type:"rest",seconds,after:active[active.length-1].id});
    }
  }
  steps.push({type:"cooldown"});
  return steps;
}
verify("program stays staging-only and medically blocked",()=>{
 assert.match(program.status,/NOT_ACTIVATED/);
 assert.equal(program.releaseGates.productionDeploy,false);
 assert.equal(program.safety.nonWeightBearing,true);
});
verify("all workout movement and breathing clips already owner-approved for preview",()=>{
 const ids=[...program.shared,...Object.values(program.workouts).flatMap(w=>w.exercises)].map(x=>x.mediaId);
 assert.equal(new Set(ids).size,11);
 for(const id of ids){const clip=approved.get(id);assert.ok(clip?.ownerApproved && clip?.previewAllowed && !clip?.releaseReady, id);}
});
for(const key of ["A","B"]) {
 const day=program.workouts[key];
 verify(key+" prescribed working-set total",()=>{
  assert.equal(day.exercises.reduce((sum,e)=>sum+e.sets,0),day.workingSets);
  assert.ok(day.exercises.every(x=>Number.isInteger(x.sets)&&x.sets>0&&Number.isFinite(x.restSec)&&x.restSec>=30));
 });
 const options=[[],...day.supersetOptions.map(p=>[p.id]),day.supersetOptions.map(p=>p.id)];
 for(const selected of options) {
  const name=key+" "+(selected.join("+")||"straight");
  const steps=timeline(key,selected);
  verify(name+" no prescribed set skipped",()=>{
    assert.equal(steps.filter(s=>s.type==="set").length,day.workingSets);
    assert.equal(steps[0].type,"preparation");assert.equal(steps.at(-1).type,"cooldown");assert.equal(steps.at(-2).type,"rest");
    for(const ex of day.exercises){
      assert.deepEqual(steps.filter(s=>s.type==="set"&&s.ex===ex.id).map(s=>s.set),
        Array.from({length:ex.sets},(_,i)=>i+1),ex.id);
    }
  });
  verify(name+" breaks only after completed standalone set or paired round",()=>{
    for(let i=0;i<steps.length;i++){
      const st=steps[i],next=steps[i+1];
      if(st.type==="handoff"){assert.equal(steps[i-1].type,"set");assert.equal(next?.type,"set");}
      if(st.type==="rest"){assert.equal(steps[i-1]?.type,"set");assert.ok(st.seconds>=30);assert.ok(Number.isFinite(st.seconds));}
    }
    assert.ok(!steps.some(s=>s.type==="rest"&&s.after===undefined));
  });
 }
}
verify("B unequal 2-set band plus 3-set triceps leaves third triceps set standalone",()=>{
 const steps=timeline("B",["B-pair2"]);
 const third=steps.findIndex(s=>s.type==="set"&&s.ex==="triceps"&&s.set===3);
 assert.ok(third>0);
 assert.notEqual(steps[third-1].type,"handoff");
});
console.log("PASSED",checked.length,"staged recovery-plan checks; this does not compile V2 or approve medical fitness.");
