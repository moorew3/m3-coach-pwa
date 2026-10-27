import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const core=load("../public/recovery-coach/bench-core/index.html");
const recovery=load("../public/recovery-coach/index.html");
const review=load("../public/recovery-coach/programs/index.html");
const home=load("../src/routes/index.tsx");
const browser=load("./browser-mobile-smoke.mjs");
const staticPackage=load("./package-static-recovery-preview.py");
const workflow=load("../.github/workflows/build-check.yml");

test("Bench Core A/B are available in the real M3 FLEX home and protected recovery pages",()=>{
 assert.match(home,/data-testid="bench-core-workouts"/);
 assert.match(home,/href="\/recovery-coach\/bench-core\/"/);
 assert.match(recovery,/id="benchCoreLink"/);
 assert.match(recovery,/href="\.\/bench-core\/"/);
 assert.match(review,/id="programBenchCoreLink"/);
 assert.match(review,/href="\.\.\/bench-core\/"/);
 assert.match(staticPackage,/"recovery-coach\/bench-core\/index\.html"/);
 assert.match(workflow,/test -s \.output\/public\/recovery-coach\/bench-core\/index\.html/);
});

test("Two core workouts provide distinct real bench sessions, with no cast-loading drills",()=>{
 assert.match(core,/Core A · Bench foundation/);
 assert.match(core,/Core B · Anti-rotation/);
 for(const name of ["Seated 360° abdominal brace","Seated palms-together midline press",
  "Seated small-range torso turns","Bench-supported alternating forward reach",
  "Seated Pallof hold · band pulling from left",
  "Seated Pallof hold · band pulling from right",
  "Seated offset dumbbell hold · left hand",
  "Seated offset dumbbell hold · right hand"]){
  assert.ok(core.includes(name),"Core move missing "+name);
 }
 assert.match(core,/never push through the cast/);
 assert.match(core,/no band behind the neck or around the cast/);
 assert.match(core,/Do not attempt leg raises, planks, sit-ups, bench crunches or forceful twisting/);
 assert.match(core,/Do not push your foot into the floor/);
 assert.match(core,/My treating clinician has specifically cleared the selected bench-supported core movements/);
 assert.match(core,/My clinician approved the chosen effort and timed activities/);
});

test("Bench core countdown, rounds and safe progression never certify exercise reps or skipped sets",()=>{
 assert.match(core,/id="duration"/);
 assert.match(core,/id="rest"/);
 assert.match(core,/id="rounds"/);
 assert.match(core,/id="startPause"/);
 assert.match(core,/id="next"/);
 assert.match(core,/id="emergency"/);
 assert.match(core,/function startClock\(\)/);
 assert.match(core,/if\(!cleared\(\)\)/);
 assert.match(core,/function elapsed\(\)/);
 assert.match(core,/if\(credit\)completed\+\+;else skipped\+\+/);
 assert.match(core,/mode="paused"/);
 assert.match(core,/function finish\(\)/);
 assert.match(core,/The timer counts <strong>timed activities completed by the app<\/strong>, not actual repetitions/);
 assert.match(core,/Skipped activities never receive credit/);
 assert.match(core,/No medical or form certification was issued/);
 assert.match(core,/saved.*"paused"/);
});

test("Core does not start camera or third-party media, and session continuity is local/private",()=>{
 assert.doesNotMatch(core,/<(?:video|audio)\b/i);
 assert.doesNotMatch(core,/\bfetch\(|getUserMedia|SpeechRecognition|MediaRecorder|window\.open\(/);
 assert.match(core,/m3-flex-bench-core-progress-v1/);
 assert.match(core,/m3-flex-bench-core-history-v1/);
 assert.match(core,/document\.hidden&&\(mode==="running"\|\|mode==="rest"\)/);
 assert.match(core,/localStorage\.setItem\(KEY,JSON\.stringify\(snapshot\)\)/);
 assert.match(core,/const restoredSets|const validPlan=/);
 assert.match(core,/for\(const box of document\.querySelectorAll\("#clearance \.check"\)\)box\.checked=false/);
 assert.match(browser,/Bench Core A: clinician gate, timed rest, pause\/reload, fresh clearance, skip without credit/);
 assert.match(browser,/Bench Core B includes both-sided Pallof\/offset holds and immediate emergency reset/);
});
