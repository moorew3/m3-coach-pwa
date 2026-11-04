import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const coach=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const e2e=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("private coaching Q&A exists on the same screen and never calls paid voice, network or camera",()=>{
 for(const id of ["localCoachPanel","localCoachForm","coachQuestion","askLocalCoach","localCoachAnswer"])
  assert.ok(coach.includes('id="'+id+'"'),"Missing Q&A control "+id);
 assert.match(coach,/function localCoachReply\(raw\)/);
 assert.match(coach,/maxlength="220"/);
 assert.match(coach,/event\.preventDefault\(\)/);
 assert.match(coach,/textContent=localCoachReply\(prompt\)/);
 assert.match(coach,/Only the original approved Marcus recordings play during the workout/);
 const qa=coach.slice(coach.indexOf("function localCoachReply(raw)"),coach.indexOf('document.addEventListener("keydown",event=>'));
 assert.doesNotMatch(qa,/\bfetch\s*\(|XMLHttpRequest|WebSocket|new\s+SpeechSynthesisUtterance|getUserMedia\s*\(/);
 assert.match(qa,/contact your treating clinician|Contact your treating clinician/);
 assert.match(qa,/timer counts demonstrations, not your actual repetitions/);
 assert.match(qa,/between the chair and back, never around the neck/);
 assert.match(qa,/runCurrent\(\)/);
 assert.match(qa,/pause\(\)/);
 assert.match(qa,/resume\(\)/);
});

test("mobile browser actually asks local questions and checks exact safety answers",()=>{
 assert.match(e2e,/localCoachPanel summary/);
 assert.match(e2e,/How many reps have I done/);
 assert.match(e2e,/Where does the INNSTAR band go/);
 assert.match(e2e,/between the chair and back, never around the neck/);
 assert.match(e2e,/Same-screen free local Q&A explains cast-safe band/);
});
