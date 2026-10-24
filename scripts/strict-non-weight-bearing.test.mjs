import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const html=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const chrome=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("zero-load leg restriction is explicit at app entrance and before every timed movement",()=>{
 assert.match(html,/NON-WEIGHT-BEARING RECOVERY — NO STANDING/);
 assert.match(html,/No foot pressure, standing, walking drills, squats, steps, jumping/);
 assert.match(html,/if you have newly lost the ability to stand|If you have newly lost the ability to stand/);
 assert.match(html,/My treating clinician knows I cannot bear weight on my injured leg/);
 assert.match(html,/I will stay seated for this entire session/);
 assert.match(html,/absolutely no weight or pushing through that foot/);
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
 assert.match(chrome,/Strict non-weight-bearing safety Stop silences workout/);
});
