import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");
const xml=readFileSync(new URL("../.github/workflows/build-check.yml",import.meta.url),"utf8");

test("hands-free uses explicit Android Voice Access semantic buttons and no proprietary microphone",()=>{
 for(const id of ["handsfreeStart","handsfreePause","handsfreeResume","handsfreeNext","handsfreeExplain"])
   assert.match(page,new RegExp('id="'+id+'"'));
 for(const label of ["Start workout","Pause workout","Resume workout","Next exercise","Show exercise guidance"])
   assert.ok(page.includes('aria-label="'+label+'"'),"Missing voice button name "+label);
 assert.match(page,/Android <strong>Voice Access<\/strong>/);
 assert.match(page,/M3 FLEX does not turn on its microphone or listen to speech/);
 assert.doesNotMatch(page,/\bSpeechRecognition\b|webkitSpeechRecognition|getUserMedia\s*\(|speechSynthesis\s*\(|\/api\/public\/coach-talk/);
 assert.match(page,/Android Voice Access may process speech through Google depending on its settings/);
});

test("voice/remote buttons delegate to existing protected workout timer actions",()=>{
 assert.match(page,/handsfreeStart"\)\.addEventListener\("click",\(\)=>\{if\(mode==="ready"\)\$\("startPause"\)\.click\(\)\}/);
 assert.match(page,/handsfreePause"\)\.addEventListener\("click"/);
 assert.match(page,/handsfreeResume"\)\.addEventListener\("click"/);
 assert.match(page,/handsfreeNext"\)\.addEventListener\("click"/);
 assert.match(page,/handsfreeExplain"\)\.addEventListener\("click"/);
 assert.match(page,/handsfreeStart"\)\.disabled=safetyLock\|\|mode!=="ready"/);
 assert.match(page,/handsfreePause"\)\.disabled=mode!=="running"&&mode!=="rest"/);
 assert.match(page,/handsfreeResume"\)\.disabled=safetyLock\|\|\(mode!=="paused"&&mode!=="waiting"\)/);
 assert.match(page,/handsfreeNext"\)\.disabled=safetyLock\|\|mode==="complete"/);
 assert.match(page,/if\(mode==="ready"\)\$\("startPause"\)\.click\(\)/);
 assert.match(page,/function safetyOkay\(\)/);
});

test("remote keyboard shortcuts don't hijack forms, inputs or held-down keys",()=>{
 assert.match(page,/document\.addEventListener\("keydown",event=>/);
 assert.match(page,/event\.defaultPrevented\|\|event\.repeat/);
 assert.match(page,/event\.target\.closest\("input,select,textarea,button,summary,/);
 assert.match(page,/event\.key==="Escape"&&\(mode==="running"\|\|mode==="rest"\)/);
 assert.match(page,/event\.key==="n"\|\|event\.key==="N"/);
 assert.match(page,/event\.key==="e"\|\|event\.key==="E"/);
 assert.match(page,/Free-form spoken replies are not yet available|free-form spoken replies are not yet available/);
});

test("Chrome covers real clinician gate and hands-free pause/resume with frozen timer",()=>{
 assert.match(browser,/voiceControl\.locator\("summary"\)\.click\(\)/);
 assert.match(browser,/handsfreeStart"\)\.click\(\)/);
 assert.match(browser,/handsfreePause"\)\.click\(\)/);
 assert.match(browser,/handsfreeResume"\)\.click\(\)/);
 assert.match(browser,/voicePausedAt/);
 assert.match(xml,/node scripts\/browser-mobile-smoke\.mjs/);
});
