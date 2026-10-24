import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page=readFileSync(new URL("../public/recovery-coach/form-check/index.html",import.meta.url),"utf8");
const coach=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");
const staticPackage=readFileSync(new URL("./package-static-recovery-preview.py",import.meta.url),"utf8");

test("camera alignment page is opt-in, defaults off and never requests sound or uploads frames",()=>{
 assert.match(page,/id="consent"/);
 assert.match(page,/id="start"/);
 assert.match(page,/id="stop"/);
 assert.match(page,/if\(!\$\("consent"\)\.checked\)/);
 assert.match(page,/navigator\.mediaDevices\.getUserMedia\(\{audio:false,video:/);
 assert.match(page,/const MODEL="https:\/\/storage\.googleapis\.com\/mediapipe-models\/pose_landmarker/);
 assert.match(page,/const LIBRARY="https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision@1\.0\.1/);
 assert.match(page,/detectForVideo\(\$\("camera"\),now\)/);
 assert.match(page,/minPoseDetectionConfidence:0\.55/);
 assert.match(page,/numPoses:1/);
 assert.match(page,/getTracks\(\)\)track\.stop\(\)/);
 assert.match(page,/addEventListener\("pagehide",cleanup\)/);
 assert.match(page,/visibilitychange/);
 assert.match(page,/Google MediaPipe may collect runtime usage metrics/);
 assert.doesNotMatch(page,/MediaRecorder|canvas\.toBlob|canvas\.toDataURL|fetch\(|XMLHttpRequest|\/api\/public\/coach-talk/);
});

test("limited local landmark cues never claim repetitions, cast status, clinician clearance or flawless biomechanics",()=>{
 assert.match(page,/No repetitions assessed/);
 assert.match(page,/No automatic rep count or form clearance/);
 assert.match(page,/Camera CANNOT verify the band behind your chair/);
 assert.match(page,/No footage is saved by M3 FLEX/);
 assert.match(page,/No medical clearance is determined by this view/);
 assert.match(page,/if\(ids\.some\(i=>!visible\(points\[i\]\)\)/);
 assert.match(page,/Math\.abs\(left\.x-right\.x\)/);
 assert.match(page,/if\(\$\("exercise"\)\.value==="C03"/);
 assert.match(page,/if\(\$\("exercise"\)\.value==="C08-PRESS-R3"\)/);
});

test("same-screen form iframe loads only on explicit open and unloads on close",()=>{
 assert.match(coach,/id="formObservation"/);
 assert.match(coach,/id="formFrame"/);
 assert.match(coach,/allow="camera"/);
 assert.match(coach,/iframe\.src=\$\("formObservation"\)\.open\?"\.\/form-check\/":"about:blank"/);
 assert.match(browser,/frameLocator\("#formFrame"\)\.locator\("#start"\)/);
 assert.match(browser,/__formRequests\.length/);
 assert.match(browser,/requests\[0\]\.audio, false/);
 assert.match(staticPackage,/"recovery-coach\/form-check\/index\.html"/);
});

test("video/audio async completion from a skipped or paused step is permanently invalidated",()=>{
 assert.match(coach,/let playbackGeneration=0/);
 assert.match(coach,/function stopMedia\(rewind\)\{playbackGeneration\+\+/);
 assert.match(coach,/const generation=\+\+playbackGeneration/);
 assert.match(coach,/if\(generation!==playbackGeneration\)return null/);
 assert.match(coach,/if\(ok===null\)return/);
 assert.match(coach,/if\(interval!==null\)secondsLeft=Math\.max\(0,deadline-Date\.now\(\)\);clearTick\(\);stopMedia\(false\);mode="paused"/);
 assert.match(browser,/__pendingMediaPlays/);
 assert.match(browser,/Old asynchronous media play response must not restart a new workout/);
});
