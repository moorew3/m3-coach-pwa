import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../public/recovery-coach/logbook/index.html",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("Progression reads manually validated private exercise records only and never video-derived reps",()=>{
 for(const marker of ['id="targetReps"','id="useLastWeight"','id="lastSet"','id="progressionCue"','id="measurementTrend"'])
   assert.ok(page.includes(marker),"Missing last-performance tracking "+marker);
 assert.match(page,/const sorted=records\.filter\(r=>r\.type==="set"&&r\.exercise===exercise\)/);
 assert.match(page,/function recentSetsByDay\(exercise\)/);
 assert.match(page,/const found=new Set\(\),sessions=\[\]/);
 assert.match(page,/days\[1\]\.lb===latest\.lb&&latest\.reps>target&&days\[1\]\.reps>target/);
 assert.match(page,/Only if separately cleared for progression/);
 assert.match(page,/No automatic change was made/);
 assert.match(page,/Clinician-cleared resistance only/);
 assert.match(page,/INNSTAR band load has no verified pound conversion/);
 assert.match(page,/exercise==="C08-PRESS-R3"/);
 assert.doesNotMatch(page,/window\.fetch\(|XMLHttpRequest|speechSynthesis|localStorage\.setItem\("m3-flex-clinician/);
});
test("Last logged weight is copied only by deliberate button and is not medical approval",()=>{
 assert.match(page,/\$\("useLastWeight"\)\.addEventListener\("click"/);
 assert.match(page,/\$\("weight"\)\.value=String\(latest\.lb\)/);
 assert.match(page,/This is a reference only, not approval to use that load today/);
 assert.match(page,/renderProgression\(\);renderMeasurementTrend\(\)/);
 assert.match(page,/function renderMeasurementTrend\(\)/);
 assert.match(page,/These are self-reported measurements, not automatic assessments/);
});
test("Regression Chrome checks exercise selection, separate-day progression and real measurement differences",()=>{
 assert.match(browser,/targetReps"\)\.selectOption\("10"\)/);
 assert.match(browser,/useLastWeight"\)\.click\(\)/);
 assert.match(browser,/Across two separate days, you exceeded 10 reps/);
 assert.match(browser,/change -2 lb versus previous entry/);
});
