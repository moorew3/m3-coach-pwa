import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const chrome=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("owner-reported weight-bearing ability never overrides seated-only clinician restrictions",()=>{
 assert.match(html,/FOOT CAST · WEIGHT-BEARING ABILITY REPORTED/);
 assert.match(html,/Weight-bearing ability alone does not establish clearance for loaded squats/);
 assert.match(html,/Follow your clinician's restrictions/);
 assert.match(html,/My treating clinician knows about my foot cast/);
 assert.match(html,/I will use the seated setup for this selected session/);
 assert.match(html,/Follow your actual clinician-specified weight-bearing limits/);
 assert.match(html,/function safetyOkay\(\)\{return !safetyLock&&/);
 assert.match(html,/if\(!safetyOkay\(\)\)/);
});

test("medical stop instantly kills all media, invalidates the timer and forces fresh clearance",()=>{
 assert.match(html,/id="emergencyStop"/);
 assert.match(html,/let safetyLock=false/);
 assert.match(html,/clearTick\(\);stopMedia\(true\);restNext=null;completed\.clear\(\);finishedSets\.clear\(\)/);
 assert.match(html,/sessionStarted=false;safetyLock=true;mode="safety";secondsLeft=0/);
 assert.match(html,/for\(const input of document\.querySelectorAll\("#clearance \.check"\)\)input\.checked=false/);
 assert.match(html,/localStorage\.removeItem\(PROGRESS_KEY\)/);
 assert.match(html,/startPause"\)\.disabled=mode==="complete"\|\|safetyLock/);
 assert.match(html,/handsfreeResume"\)\.disabled=safetyLock/);
 assert.match(html,/safetyLock=false;for\(const input of document\.querySelectorAll\("#clearance \.check"\)\)input\.checked=false/);
 assert.match(chrome,/Conservative seated-cast medical Stop silences workout/);
});
