import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  RECOVERY_PROGRESS_KEY, RECOVERY_LAST_SESSION_KEY,
  readRecoveryProgress, readLastRecoverySession, recoveryTitle,
} from "../src/lib/recovery-progress.ts";
const original = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const native = readFileSync(new URL("../src/routes/recovery.tsx", import.meta.url), "utf8");
const nav = readFileSync(new URL("../src/components/BottomNav.tsx", import.meta.url), "utf8");
const player = readFileSync(new URL("../public/recovery-coach/index.html", import.meta.url), "utf8");

function storage(contents) {
  return {getItem(key) { return Object.prototype.hasOwnProperty.call(contents, key) ? contents[key] : null; }};
}
function sample(overrides={}) {
  return JSON.stringify({v:1,program:"recovery",savedAt:Date.now(),phase:1,idx:0,
    workRound:1,targetRounds:2,completed:["0:0","0:1"],mode:"paused",...overrides});
}

test("original M3 FLEX tabs preserved; native Recovery and Workout A/B are same-application routes",()=>{
  assert.match(nav,/to: "\/recovery", label: "Recovery"/);
  for (const route of ["/program","/nutrition","/progress","/settings"])
    assert.ok(nav.includes('to: "'+route+'"'),"Original tab changed: "+route);
  assert.match(original,/data-testid="m3-unified-workout-picker"/);
  assert.match(original,/to="\/recovery" search=\{\{ program: "recovery" \}\}/);
  assert.match(original,/to="\/recovery" search=\{\{ program: "A" \}\}/);
  assert.match(original,/to="\/recovery" search=\{\{ program: "B" \}\}/);
  assert.match(original,/data-testid="m3-recovery-saved-progress"/);
  assert.match(native,/createFileRoute\("\/recovery"\)/);
  assert.match(native,/data-testid="m3-native-recovery"/);
  assert.match(native,/data-testid="m3-recovery-existing-player"/);
  assert.match(native,/src=\{\`\/recovery-coach\/index\.html\?program=\$\{program\}\`\}/);
  assert.match(native,/allow="camera; fullscreen"/);
  assert.match(native,/window\.addEventListener\("message", onMessage\)/);
  assert.match(native,/event\.origin !== window\.location\.origin/);
  assert.match(native,/event\.source !== iframe\.current\?\.contentWindow/);
  assert.doesNotMatch(native,/supabase|useCreateAccount|new.*database/i);
});

test("existing guided player reports only same-origin timing state to the existing M3 FLEX shell",()=>{
  assert.match(player,/function notifyOriginalApp\(\)/);
  assert.match(player,/window\.parent\.postMessage\(\{type:"m3-flex-recovery-progress-updated"\},location\.origin\)/);
  assert.match(player,/lastProgressText=signature;notifyOriginalApp\(\)/);
  assert.match(player,/LAST_SESSION_KEY="m3-flex-recovery-last-session-v1"/);
  assert.match(player,/disclaimer:"Timed demonstrations only; actual reps not verified\."/);
});

test("valid paused guided demonstration data is visible on existing Home without fake athlete rep counts",()=>{
  const value=readRecoveryProgress(storage({[RECOVERY_PROGRESS_KEY]:sample()}));
  assert.deepEqual(value, {
    program:"recovery",savedAt:value?.savedAt,phase:1,idx:0,
    workRound:1,targetRounds:2,mode:"paused",completedSteps:2,
  });
  assert.match(recoveryTitle("A"),/Workout A/);
  assert.match(recoveryTitle("B"),/Workout B/);
  assert.match(recoveryTitle("recovery"),/Recovery Coach/);
});

test("invalid, stale and forged local progress is safely ignored",()=>{
  const invalid=[
    "not json", "null", JSON.stringify({v:99}),
    sample({program:"malicious"}),
    sample({savedAt:Date.now()-25*3600*1000}),
    sample({savedAt:Date.now()+7200000}),
    sample({phase:9}),sample({idx:-1}),sample({targetRounds:900}),
    sample({mode:"complete"}),sample({completed:[] ,workRound:0}),
    sample({completed:Array.from({length:200},(_,i)=>String(i))}),
  ];
  for(const raw of invalid)
    assert.equal(readRecoveryProgress(storage({[RECOVERY_PROGRESS_KEY]:raw})),null,raw.slice(0,95));
  assert.equal(readRecoveryProgress(null),null);
  assert.equal(readRecoveryProgress(storage({})),null);
});

test("completion receipt is only a timed-demonstration receipt, not exercise reps or medical clearance",()=>{
  const complete={program:"A",finishedAt:Date.now(),demonstratedSteps:8,
    disclaimer:"Timed demonstrations only; actual reps not verified."};
  assert.deepEqual(readLastRecoverySession(storage({[RECOVERY_LAST_SESSION_KEY]:JSON.stringify(complete)})),complete);
  assert.equal(readLastRecoverySession(storage({[RECOVERY_LAST_SESSION_KEY]:JSON.stringify({...complete,disclaimer:"I did 30 reps"})})),null);
  assert.equal(readLastRecoverySession(storage({[RECOVERY_LAST_SESSION_KEY]:JSON.stringify({...complete,demonstratedSteps:300})})),null);
});
