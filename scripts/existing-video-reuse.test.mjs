import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const page=read("public/recovery-coach/programs/index.html");
const approved=JSON.parse(read("approved-recovery-media.json")).items.filter(x=>x.type==="video"&&x.approvedSource);
const start=page.indexOf("const pre=");
const end=page.indexOf("const $=id=>",start);
assert.ok(start>=0&&end>start,"Same original Workout A/B step data must supply the gallery");
const context={};
vm.runInNewContext(page.slice(start,end)+"\nthis.reusedPrograms=programs;",context);
const steps=Array.from(context.reusedPrograms.flatMap(p=>p.steps));
const unique=new Map(steps.filter(s=>s.status==="approved"&&s.video).map(s=>[s.video,s]));

test("seven approved Recovery MP4s are already reused, not duplicated as new videos",()=>{
 assert.equal(unique.size,7);
 assert.equal(approved.length,7);
 assert.deepEqual(
   [...unique.keys()].sort(),
   approved.map(x=>x.url).sort()
 );
 assert.match(page,/function showCurrentAppVideoLibrary\(\)/);
 assert.match(page,/if\(step.status==="approved"&&step.video&&!approved.has\(step.video\)\)/);
 assert.match(page,/showCurrentAppVideoLibrary\(\);\s*display\(\)/);
});
test("original app bench, incline, lateral and stretch links are owner-form references only",()=>{
 const origin=read("src/data/coach-identity.ts");
 for(const filename of ["benchPressV3.mp4","inclineDumbbellPressV3.mp4","lateralRaise.mp4","shoulderMobility.mp4","chestMobilityV2.mp4","seatedRowV3.mp4"]){
   assert.ok(page.includes(filename),"Original app archive link missing "+filename);
   assert.ok(origin.includes(filename),"Archive link not from current approved coach-identity source: "+filename);
 }
 assert.match(page,/id="existingAppVideoLibrary"/);
 assert.match(page,/NOT cleared as seated boot-recovery demos/);
 assert.match(page,/No leg-driven rowing/);
 assert.match(page,/rel="noopener noreferrer"/);
});
test("original approved Marcus clips remain unchanged and no unapproved C13-C23 are promoted",()=>{
 const review=read("public/recovery-coach/index.html");
 assert.match(page,/Original app · reference|original app · reference/i);
 assert.doesNotMatch(page,/C13.*status":"approved"|C18.*status":"approved"/);
 assert.match(review,/OPTIONAL_SCENE_IDS=new Set/);
 for(const x of approved)assert.ok(review.includes(x.url.split("/").at(-1)),x.id);
});
