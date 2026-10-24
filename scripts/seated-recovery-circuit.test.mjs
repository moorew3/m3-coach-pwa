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
  assert.match(page, /My treating clinician knows I cannot bear weight on my injured leg and specifically cleared these seated arm movements and resistance/);
  assert.match(page, /I will use the seated setup for this selected session, position the cast comfortably, and follow my actual weight-bearing restrictions/);
  assert.match(page, /My clinician cleared the intended exercise duration and effort/);
});

test("one/two optional demonstrated sets do not multiply, log, or invent athlete repetitions", () => {
  assert.match(page, /id="setRounds"/);
  assert.match(page, /1 set per exercise/);
  assert.match(page, /2 sets per exercise/);
  assert.match(page, /let workRound=1,targetRounds=1,sessionStarted=false/);
  assert.match(page, /if\(phase===1&&workRound<targetRounds\)/);
  assert.match(page, /restNext=\{phase:1,idx\}/);
  assert.match(page, /completed\.add\(phase\+":"\+idx\)/);
  assert.match(page, /sessionStarted=false;safetyLock=false;for\(const input of document.querySelectorAll\("#clearance \.check"\)\)input.checked=false;targetRounds=Number/);
  assert.match(page, /btn\.addEventListener\("click",\(\)=>stopForNavigation\(phase,i\)\)/);
  assert.match(page, /name:"Controlled arm reaches"/);
  assert.match(page, /existing Marcus recording is general shoulder-mobility audio/);
  assert.match(page, /Sets count timed demonstrations, not verified athlete repetitions/);
  assert.doesNotMatch(page, /actualReps\s*=\s*workRound|completedReps\s*\+\+/);
});

test("home offers same-origin approved player before the legacy coach and marks A/B as pending", () => {
  const approvedStart = home.indexOf('data-testid="seated-recovery-start"');
  const legacyStart = home.indexOf('data-testid="legacy-workout-start"');
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

test("locked motion and Marcus recording sources remain byte-for-byte referenced", () => {
  const sourceIds = [
    "9a48369a-ec51-4abc-9f50-f8966f19dc1e.mp4", // C01-R3
    "01a14462-bc16-778b-a773-db16e57aade7.mp4", // C02
    "01a14462-cf4a-7daa-be5c-437eab0c9ba2.mp4", // C03
    "31bc3ad4-fc95-409b-81f1-3490f1f8eb35.mp4", // C04-R2
    "b1171f4e-6526-45a7-a413-fd0ad4ffb1de.mp4", // C08-PRESS-R3
    "f92c84ea-a2bc-4623-966b-deb8ceff8a87.mp4", // C09-PRE-BREATH-R2
    "d65e6c81-dae1-484f-9bb9-48f7e18d8dbc.mp4", // C10-POST-BREATH-R1
    "9226f649-9808-4275-b269-bcc93d3b0342.mp3", // approved C09 Marcus
    "37ab7891-1c9c-4bfc-bd84-b582a76a37af.mp3", // approved C10 Marcus
  ];
  for (const sourceId of sourceIds) {
    assert.ok(page.includes(sourceId), "Original approved asset changed or missing: " + sourceId);
  }
});

test("owner-reported weight-bearing ability is reflected without unlocking loaded leg movements", () => {
  assert.match(page,/WEIGHT-BEARING ABILITY REPORTED/);
  assert.match(page,/You have said you can put weight on the injured foot/);
  assert.match(page,/does not establish clearance for loaded squats, jumping/);
  assert.doesNotMatch(page,/NON-WEIGHT-BEARING RECOVERY|despite my inability to stand|Still NO weight on the injured leg|Do not stand or bear weight/);
});

test("restore stores only same-browser playback progress and requires fresh clearance", () => {
  assert.match(page, /const PROGRESS_KEY="m3-flex-recovery-progress-v1"/);
  assert.match(page, /localStorage\.setItem\(PROGRESS_KEY/);
  assert.match(page, /function restoreProgress\(\)/);
  assert.match(page, /mode="paused";return true;/);
  assert.match(page, /if\(!safetyOkay\(\)\)\{\s*tell\("Please re-confirm all three clinician clearance checks/);
  assert.match(page, /No video or audio was auto-played/);
  assert.match(page, /const restored=restoreProgress\(\)/);
  const save = page.slice(page.indexOf("function persistProgress()"),page.indexOf("function restoreProgress()"));
  assert.doesNotMatch(save, /document\.querySelectorAll\("\.check"\)|readiness:|clearance:|userReps:|recordedReps:/);
  assert.match(save, /restNext, completed:\[\.\.\.completed\]/);
  assert.match(save, /mode==="complete"/);
  assert.match(save, /Math\.ceil\(secondsLeft\/1000\)\*1000/);
});

test("restore validates bounded phase, current movement, rest target and expiration", () => {
  const restore=page.slice(page.indexOf("function restoreProgress()"),page.indexOf("const elapsedState="));
  for (const expected of ["PROGRESS_VALID_MS","stages.length","stages[p].items.length","[1,2].includes(saved.targetRounds)","180_000","validSteps","saved.restDuration","saved.workDuration","next.phase!==1"]) {
    assert.ok(restore.includes(expected),"Missing restore guard: "+expected);
  }
});

test("browser reload test proves rest/round retention and safety check re-confirmation", () => {
  assert.match(chrome, /await recoveryPage\.reload\(\{ waitUntil: "domcontentloaded" \}\)/);
  assert.match(chrome, /#clearance \.check:checked/);
  assert.match(chrome, /re-confirm all three clinician clearance/i);
  assert.match(chrome, /Recovery phone reload restores pending rest/);
  assert.match(chrome, /Closing\/reopening recovery tab preserves approved exercise/);
});

test("rest after device restart uses approved rest Marcus recording, not stale exercise audio", () => {
  assert.match(page, /if\(restNext\)\{mode="rest";beginTicker\(\);if\(audio\.src!==REST_MARCUS\)playRestVoice\(\)/);
  assert.match(page, /const REST_MARCUS="https:\/\/d2ol7oe51mr4n9\.cloudfront\.net\/.*\/006720cc-2f40-44bd-a44f-4c4937336f8e\.mp3"/);
  assert.match(chrome, /Rest restore must play existing Marcus rest MP3/);
});

test("Android page lock pauses the timer and saving a completed session clears its cache", () => {
  assert.match(page, /document\.addEventListener\("visibilitychange"/);
  assert.match(page, /if\(!document\.hidden\)return;if\(mode==="running"\|\|mode==="rest"\)pause\(\)/);
  assert.match(page, /else if\(mode==="preview"\)\{stopMedia\(false\);mode="ready"/);
  assert.match(page, /window\.addEventListener\("pagehide",persistProgress\)/);
  assert.match(page, /if\(!sessionStarted\|\|mode==="complete"\)/);
  assert.match(page, /localStorage\.removeItem\(PROGRESS_KEY\)/);
});

test("required audio-only Marcus errors pause the timer before any fake completion", () => {
  assert.match(page, /audio\.addEventListener\("error",\(\)=>\{if\(mode==="rest"\)\{tell\("Marcus rest recording unavailable/);
  assert.match(page, /playbackError\("Approved Marcus voice track failed.","audio"\)/);
  assert.match(page, /function playbackError\(msg,source\)/);
  assert.match(page, /if\(source==="audio"&&!step\(\)\.voice\)return/);
  assert.match(page, /if\(interval!==null\)secondsLeft=Math\.max\(0,deadline-Date\.now\(\)\)/);
  assert.match(page, /mode="waiting";drawTimer\(\)/);
  assert.match(page, /Timed step NOT completed\. Tap Retry approved media/);
  assert.match(page, /mode==="waiting"\?"▶ Retry approved media"/);
});

test("Marcus audio buffering is watched independently of video without replacing sources", () => {
  assert.match(page, /audio\.addEventListener\("waiting",\(\)=>waitForBuffer\("audio"\)\)/);
  assert.match(page, /audio\.addEventListener\("stalled",\(\)=>waitForBuffer\("audio"\)\)/);
  assert.match(page, /audio\.addEventListener\("playing",/);
  assert.match(page, /clearMediaBufferChecks\(\)/);
  assert.match(page, /kind==="video"\?2300:3000/);
  assert.match(page, /Approved Marcus audio buffering stopped/);
  assert.match(page, /function stopMedia\(rewind\)\{playbackGeneration\+\+;clearMediaBufferChecks\(\)/);
});

test("Chrome verifies no phantom step completion on real audio errors and watchdog stalls", () => {
  assert.match(chrome, /dispatchEvent\("error"\)/);
  assert.match(chrome, /dispatchEvent\("waiting"\)/);
  assert.match(chrome, /Broken Marcus audio must freeze workout timer/);
  assert.match(chrome, /Timer resumes only after explicit Retry/);
  assert.match(chrome, /Stalled Marcus audio pauses timed guidance/);
  assert.match(chrome, /originalMarcus/);
});
