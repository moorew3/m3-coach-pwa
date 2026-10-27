import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const log=readFileSync(new URL("../public/recovery-coach/logbook/index.html",import.meta.url),"utf8");
const coach=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const bundle=readFileSync(new URL("./package-static-recovery-preview.py",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/build-check.yml",import.meta.url),"utf8");

test("actual logs contain only owner-entered reps, approved five movement names, weights and bounded measurements",()=>{
 assert.match(log,/m3-flex-real-reps-and-metrics-v1/);
 for(const id of ["C01-R3","C02","C03","C04-R2","C08-PRESS-R3"])assert.ok(log.includes(id));
 assert.match(log,/type:"set",exercise:\$\("exercise"\)\.value,reps,lb/);
 assert.match(log,/validNum\(r\.reps,0,100,true\)/);
 assert.match(log,/validNum\(r\.lb,0,300\)/);
 assert.match(log,/validNum\(r\.weight,40,600\)/);
 assert.match(log,/validNum\(r\.waist,10,90\)/);
 assert.match(log,/validNum\(r\.arm,5,40\)/);
 assert.match(log,/MAX_RECORDS=1500/);
 assert.match(log,/Records stay|this browser or installed app only/i);
 assert.doesNotMatch(log,/\bfetch\s*\(|\bXMLHttpRequest\b|sendBeacon|navigator\.mediaDevices|SpeechRecognition|MediaRecorder|speechSynthesis/);
});

test("local-only JSON export and strict import avoid silent cross-device sync or forged rep counts",()=>{
 assert.match(log,/m3-flex-private-workout-log\.json/);
 assert.match(log,/new Blob\(\[JSON\.stringify\(\{schema:1,exportedAt/);
 assert.match(log,/file\.size>850000/);
 assert.match(log,/parsed\.records\.some\(r=>!validRecord\(r\)\)/);
 assert.match(log,/const ids=new Set\(records\.map\(r=>r\.id\)\)/);
 assert.match(log,/localStorage\.removeItem\(KEY\)/);
 assert.match(log,/window\.confirm\("Delete all locally saved real reps/);
 assert.match(log,/r\.reps+" actual reps"/);
});

test("same-screen coach sends only currently approved exercise ID when panel open",()=>{
 assert.match(coach,/id="repsPanel"/);
 assert.match(coach,/id="logFrame"/);
 assert.match(coach,/iframe id="logFrame"[^>]+src="about:blank"/);
 assert.match(coach,/LOCAL_POSE_SCENES\.has\(step\(\)\.id\)/);
 assert.match(coach,/m3-flex-exercise-selection/);
 assert.match(coach,/logFrame"\)\.addEventListener\("load",syncActualRepExercise\)/);
 assert.match(log,/event\.origin!==window\.location\.origin/);
 assert.match(log,/Object\.hasOwn\(EXERCISES,event\.data\.id\)/);
 assert.match(coach,/The timer counts demonstrations, not your actual repetitions/);
 assert.match(bundle,/"recovery-coach\/logbook\/index\.html"/);
 assert.match(workflow,/test -s \.output\/public\/recovery-coach\/logbook\/index\.html/);
 assert.match(browser,/Real manual reps, resistance and measurements persist/);
});
