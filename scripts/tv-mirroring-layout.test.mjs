import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");
const staticPackage=readFileSync(new URL("./package-static-recovery-preview.py",import.meta.url),"utf8");

test("Television stage retains original approved exercise video and Marcus rather than casting an unrelated player",()=>{
 assert.match(page,/id="tvEnable"/);
 assert.match(page,/id="tvToolbar"/);
 assert.match(page,/id="tvFit"/);
 assert.match(page,/id="tvFullscreen"/);
 assert.match(page,/id="tvStop"/);
 assert.match(page,/id="tvExit"/);
 assert.match(page,/function syncTVControls\(\)/);
 assert.match(page,/function tryTvFullscreen\(\)/);
 assert.match(page,/document\.documentElement\.requestFullscreen/);
 assert.match(page,/screen\.orientation\.lock\("landscape"\)/);
 assert.match(page,/screen\.orientation\?\.unlock/);
 assert.match(page,/body\.tvMode \.player\{display:grid;grid-template-columns:/);
 assert.match(page,/body\.tvMode \.player > #videoBox video\{[^}]*object-fit:contain/);
 assert.match(page,/body\.tvMode\.tvFill \.player > #videoBox video\{object-fit:cover\}/);
 assert.match(page,/No camera, microphone, or new casting account is needed/);
 assert.match(page,/a website cannot override the mirror receiver.s aspect ratio/i);
 assert.match(page,/Samsung Galaxy Fold/);
 assert.match(page,/Smart View/);
 assert.match(page,/main > :not\(\.tvToolbar\):not\(\.player\)/);
 assert.match(page,/\.tvToolbar #tvStop/);
 assert.match(page,/\.player > \.timer\{grid-column:2;grid-row:6/);
});

test("TV player controls delegate to protected original set/rest emergency actions",()=>{
 assert.match(page,/tvStartPause"\)\.addEventListener\("click",\(\)=>\{if\(!\$\("startPause"\)\.disabled\)\$\("startPause"\)\.click\(\)/);
 assert.match(page,/tvNext"\)\.addEventListener\("click",\(\)=>\{if\(!\$\("next"\)\.disabled\)\$\("next"\)\.click\(\)/);
 assert.match(page,/tvStop"\)\.addEventListener\("click",\(\)=>\{\$\("emergencyStop"\)\.click\(\)/);
 assert.match(page,/tvFit"\)\.addEventListener\("click"/);
 assert.match(page,/MutationObserver\(syncTVControls\)/);
 assert.match(page,/document\.addEventListener\("fullscreenchange",syncTVControls\)/);
 assert.doesNotMatch(page,/new MediaRecorder|webkitSpeechRecognition|chrome\.cast|loadCastFramework/);
});

test("Built static package and mobile Chrome QA include responsive TV without changing the approved media source",()=>{
 assert.match(staticPackage,/"recovery-coach\/index\.html"/);
 assert.match(browser,/\[\[1280,720\],\[1920,1080\],\[3840,2160\],\[900,500\]\]/);
 assert.match(browser,/TV layout has horizontal overflow/);
 assert.match(browser,/TV element clipped off screen/);
 assert.match(browser,/Approved portrait video must default to full-body uncropped view/);
 assert.match(browser,/Never swap or restart the approved source when switching TV fit/);
 assert.match(browser,/TV remote start never bypasses clinician clearance/);
});
