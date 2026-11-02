import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const coach=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const home=readFileSync(new URL("../src/routes/index.tsx",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("Marcus is a first-screen guided experience with unchanged owner-approved voice testing",()=>{
 assert.match(home,/Marcus Guided Flex · 7 approved animated scenes/);
 assert.match(coach,/id="marcusStage"/);
 assert.match(coach,/id="marcusBegin"/);
 assert.match(coach,/id="marcusVoiceStatus"/);
 assert.match(coach,/id="marcusNext"/);
 assert.match(coach,/id="marcusFocus"/);
 assert.match(coach,/id="marcusAudioCheck"/);
 assert.match(coach,/id="marcusTestAudio"/);
 assert.match(coach,/9226f649-9808-4275-b269-bcc93d3b0342\.mp3/);
 assert.match(coach,/Only approved exercises have moving demonstrations/);
 assert.match(coach,/Displayed guidance is on-screen text, not newly generated Marcus speech/);
 assert.match(browser,/Marcus one-tap full guided session/);
});
test("Marcus start/pause uses the existing clinician-gated exact media workout state machine",()=>{
 assert.match(coach,/function drawMarcusStage\(\)/);
 assert.match(coach,/drawMarcusStage\(\);\s*\$\("setRounds"\)/);
 assert.match(coach,/if\(!sessionStarted&&mode==="ready"\)stopForNavigation\(0,0\)/);
 assert.match(coach,/\$\("startPause"\)\.click\(\)/);
 assert.match(coach,/if\(!safetyOkay\(\)\)/);
 assert.match(coach,/function nextMarcusCue\(\)/);
 assert.match(coach,/stages\[restNext\.phase\]\.items\[restNext\.idx\]\.name/);
 assert.match(coach,/restNext=\{phase:1,idx:leader\}/);
 assert.match(coach,/role="status"/);
 assert.match(coach,/Original Marcus audio · no moving clip/);
});
test("Galaxy focus and screen wake do not require an always-running background microphone",()=>{
 assert.match(coach,/body\.coachFocus/);
 assert.match(coach,/document\.body\.classList\.toggle\("coachFocus"\)/);
 assert.match(coach,/navigator\.wakeLock\.request\("screen"\)/);
 assert.match(coach,/releaseScreenAwake\(\)/);
 assert.match(coach,/window\.isSecureContext/);
 assert.match(coach,/document\.hidden/);
 assert.doesNotMatch(coach,/\bspeechSynthesis\.speak\b|\bSpeechRecognition\b|\bgetUserMedia\s*\(/);
 assert.match(browser,/__marcusWakeRequests/);
});
