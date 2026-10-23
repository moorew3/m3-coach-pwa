import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../public/recovery-coach/index.html", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/routes/index.tsx", import.meta.url), "utf8");
const chrome = readFileSync(new URL("./browser-mobile-smoke.mjs", import.meta.url), "utf8");

const approved = [
  "C09-PRE-BREATH-R2", "C01-R3", "C02", "C03", "C04-R2",
  "C08-PRESS-R3", "C10-POST-BREATH-R1",
];

test("only owner-approved seven motion scene IDs are used in active seated program", () => {
  for (const id of approved) assert.ok(page.includes('id:"' + id + '"'), id + " must remain present");
  assert.ok(!page.includes('id:"C11-PRE-HANDS-R1"'), "Unapproved C11 must not activate");
  assert.equal(approved.length, 7);
  assert.match(page, /Original Flex/);
  assert.match(page, /Marcus English/);
});

test("seated session requires clinician signoff before the timer and set loop can begin", () => {
  assert.match(page, /function safetyOkay\(\)/);
  assert.match(page, /if\(!safetyOkay\(\)\)/);
  assert.match(page, /My treating clinician cleared these particular seated movements and resistance/);
  assert.match(page, /My cast support, non-weight-bearing restrictions and transfers are cleared/);
  assert.match(page, /My exercise duration and effort are cleared/);
});

test("one/two optional demonstrated sets do not multiply, log, or invent athlete repetitions", () => {
  assert.match(page, /id="setRounds"/);
  assert.match(page, /1 set per exercise/);
  assert.match(page, /2 sets per exercise/);
  assert.match(page, /let workRound=1,targetRounds=1,sessionStarted=false/);
  assert.match(page, /if\(phase===1&&workRound<targetRounds\)/);
  assert.match(page, /restNext=\{phase:1,idx\}/);
  assert.match(page, /completed\.add\(phase\+":"\+idx\)/);
  assert.match(page, /sessionStarted=false;targetRounds=Number/);
  assert.match(page, /btn\.addEventListener\("click",\(\)=>stopForNavigation\(phase,i\)\)/);
  assert.match(page, /name:"Controlled arm reaches"/);
  assert.match(page, /existing Marcus recording is general shoulder-mobility audio/);
  assert.match(page, /Sets count timed demonstrations, not verified athlete repetitions/);
  assert.doesNotMatch(page, /actualReps\s*=\s*workRound|completedReps\s*\+\+/);
});

test("home offers same-origin approved player before the legacy coach and marks A/B as pending", () => {
  const approvedStart = home.indexOf('data-testid="seated-recovery-start"');
  const legacyStart = home.indexOf('if (log.completed) return openCoach();');
  assert.ok(approvedStart > 0 && legacyStart > approvedStart);
  assert.match(home, /href="\/recovery-coach\/"/);
  assert.match(home, /Workout A\/B are still in development/);
});

test("browser scheduler verifies actual second set and rest instead of source-only assertions", () => {
  assert.match(chrome, /#setRounds/);
  assert.match(chrome, /clock\.fastForward\(21_000\)/);
  assert.match(chrome, /Rest must freeze on Pause/);
  assert.match(chrome, /Set 2 of 2/);
  assert.match(chrome, /Seated hammer curls/);
});
