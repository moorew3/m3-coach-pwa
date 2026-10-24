import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../public/recovery-coach/device-check/index.html",import.meta.url),"utf8");
const player=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const nodeSmoke=readFileSync(new URL("./node-runtime-smoke.mjs",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/build-check.yml",import.meta.url),"utf8");

test("Device check always uses exact owner-approved Marcus track and never an alternate voice",()=>{
 assert.match(html,/9226f649-9808-4275-b269-bcc93d3b0342\.mp3/);
 assert.match(html,/Original Marcus audio source unavailable/);
 assert.doesNotMatch(html,/speechSynthesis\.speak|SpeechSynthesisUtterance|openai\.com|heygen\.com\/api/);
 assert.match(player,/href="\.\/device-check\/"/);
});

test("Microphone and camera only open after explicit user-initiated Test buttons",()=>{
 assert.match(html,/id="testMic"/);
 assert.match(html,/id="testCamera"/);
 assert.match(html,/testMic"\)\.addEventListener\("click",async\(\)=>/);
 assert.match(html,/testCamera"\)\.addEventListener\("click",async\(\)=>/);
 assert.match(html,/navigator\.mediaDevices\.getUserMedia\(\{audio:/);
 assert.match(html,/navigator\.mediaDevices\.getUserMedia\(\{audio:false,video:/);
 assert.match(html,/audioContext\.createMediaStreamSource\(stream\)/);
 assert.match(html,/getByteTimeDomainData\(array\)/);
 assert.match(html,/window\.addEventListener\("pagehide"/);
 assert.match(html,/if\(document\.hidden\)\{stopMicrophone\(\);stopCamera\(\);media\.pause\(\)/);
 assert.match(html,/if\(run!==cameraRun\)\{stopMediaTracks\(stream\);return;\}/);
 assert.doesNotMatch(html,/\bMediaRecorder\b|\bcanvas\.toDataURL\b|\bsendBeacon\b|\bXMLHttpRequest\b|\bfetch\(/);
});

test("Physical QA creates private downloadable JSON; never claims speech recognition or form verification",()=>{
 assert.match(html,/id="saveReport"/);
 assert.match(html,/new Blob\(\[JSON\.stringify\(report,null,2\)\]/);
 assert.match(html,/a\.download="m3-flex-device-qa\.json"/);
 assert.match(html,/Speech understanding is NOT tested/);
 assert.match(html,/not automated form assessment or live coach lipsync certification/);
 assert.match(html,/Nothing is captured or sent to a server/);
 assert.match(nodeSmoke,/recovery-coach\/device-check\//);
 assert.match(workflow,/test -f \.output\/public\/recovery-coach\/device-check\/index\.html/);
});
