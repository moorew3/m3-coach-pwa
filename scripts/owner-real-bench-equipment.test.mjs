import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const scope={window:{}};vm.runInNewContext(read("public/recovery-coach/scene-library.js"),scope);
const scenes=scope.window.M3_FLEX_SCENE_LIBRARY;
const get=id=>scenes.find(x=>x.id===id);

test("owner's real Weider Pro bench and AMYCO guide the next demos, not existing video replacements",()=>{
 for(const id of ["C17","C18","C23"]) {
  assert.equal(get(id).status,"owner-review");
  assert.ok(get(id).video.startsWith("https://resource2.heygen.ai/"));
  assert.match(get(id).ownerSetup,/bench|Bench/);
 }
 assert.match(get("C23").ownerSetup,/AMYCO/);
 assert.match(get("C20").ownerSetup,/not.*dumbbell bench press/i);
 assert.match(get("C19").ownerSetup,/no pushing through either foot/i);
});

test("stretch category accepted but specific C21 and C22 footage/audio cannot be implicitly approved",()=>{
 for(const id of ["C21","C22"]) {
  assert.equal(get(id).status,"owner-review");
  assert.match(get(id).ownerSetup,/gentle stretch/);
  assert.match(get(id).ownerSetup,/NOT approval|still require checking/i);
 }
 assert.equal(get("C21").audio,null);
 assert.match(read("public/recovery-coach/programs/index.html"),/this does not approve an unseen animation or unverified Marcus audio/);
});

test("bench and mobility guidance is visible within existing single app, keeping leg unloaded and approved clips locked",()=>{
 const parent=read("public/recovery-coach/programs/index.html");
 const review=read("public/recovery-coach/index.html");
 const approved=JSON.parse(read("approved-recovery-media.json")).items;
 assert.match(parent,/id="ownerEquipmentBenchPlan"/);
 assert.match(parent,/C17 wrist curls/);
 assert.match(parent,/C18 lateral raises/);
 assert.match(parent,/C23 AMYCO/);
 assert.match(parent,/leg stays fully supported on a padded rest and unloaded/);
 assert.match(parent,/It is NOT a substitute for approved C08 INNSTAR chest press/);
 assert.match(review,/OWNER EQUIPMENT DIRECTION · /);
 assert.equal(approved.filter(x=>x.approvedSource&&x.type==="video").length,7);
 for(const id of ["C01-R3","C02","C03","C04-R2","C08-PRESS-R3","C09-PRE-BREATH-R2","C10-POST-BREATH-R1"])
  assert.ok(approved.some(x=>x.id===id),id);
});
