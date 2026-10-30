import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../src/components/", import.meta.url);
const coachMotion = readFileSync(new URL("CoachMotion.tsx", root), "utf8");
const vimeoMotion = readFileSync(new URL("EmbeddedMotion.tsx", root), "utf8");
const stage = readFileSync(new URL("TrainerStageMedia.tsx", root), "utf8");

test("direct video failures show original approved still and clear explanation", () => {
  assert.match(coachMotion, /const still = poster \|\| COACH_REFERENCE/);
  assert.match(coachMotion, /data-failed=\{failure \? "true" : "false"\}/);
  assert.match(coachMotion, /data-testid="coach-video-fallback"/);
  assert.match(coachMotion, /setFailure\("source"\)/);
  assert.match(coachMotion, /No other exercise will be substituted/);
  assert.match(coachMotion, /workout timer is unchanged/i);
  assert.doesNotMatch(coachMotion, /engine\.advance\(|finishWork\(|upsertSetValues\(/);
});

test("video stall and autoplay blocked states offer SAME-source retry", () => {
  assert.match(coachMotion, /onWaiting=\{watchStall\}/);
  assert.match(coachMotion, /onStalled=\{watchStall\}/);
  assert.match(coachMotion, /setTimeout\(\(\) => setFailure\("stalled"\), 12_000\)/);
  assert.match(coachMotion, /error\.name === "NotAllowedError"/);
  assert.match(coachMotion, /data-testid="retry-coach-video"/);
  assert.match(coachMotion, /setAttempt\(\(value\) => value \+ 1\)/);
  assert.match(coachMotion, /attempt/);
  assert.match(coachMotion, /clearStalledTimer\(\)/);
});

test("embedded-video failure retains exact provider ID and approved static fallback", () => {
  assert.match(vimeoMotion, /data-testid="embedded-video-fallback"/);
  assert.match(vimeoMotion, /src=\{poster \|\| COACH_REFERENCE\}/);
  assert.match(vimeoMotion, /data-testid="retry-embedded-video"/);
  assert.match(vimeoMotion, /setRetryNonce\(\(value\) => value \+ 1\)/);
  assert.match(vimeoMotion, /\[id, retryNonce\]/);
  assert.match(vimeoMotion, /Retry same approved embed/);
  assert.doesNotMatch(vimeoMotion, /Math\.random\(|anotherExercise|alternateUrl/);
});

test("stage still uses exact approved resolver and never substitutes upcoming video", () => {
  assert.match(stage, /const motion = decision\.mode === "motion" \? decision\.motion : undefined/);
  assert.match(stage, /data-visible-motion=\{motion\?\.url \?\? ""\}/);
  assert.match(stage, /<CoachMotion/);
  assert.match(stage, /<CoachFace/);
});

test("audio diagnostics play only approved recorded Marcus while premium speech is off", () => {
  const panel = readFileSync(new URL("CoachAudioPanel.tsx", root), "utf8");
  assert.match(panel, /data-testid="test-approved-marcus-recording"/);
  assert.match(panel, /9226f649-9808-4275-b269-bcc93d3b0342\.mp3/);
  assert.match(panel, /preload="none"/);
  assert.match(panel, /disabled=\{busy \|\| !premiumSpeechEnabled\}/);
  assert.match(panel, /VITE_FLEX_PAID_AI_ENABLED/);
  assert.match(panel, /stopSpeech\(\)/);
  assert.match(panel, /onError=\{\(\) => setRecordedStatus/);
  assert.doesNotMatch(panel, /api\.openai\.com|newSpeechCredit/);
});

test("wake-screen video failure retry stays above full-screen entrance tap layer", () => {
  const wake = readFileSync(new URL("CoachWake.tsx", root), "utf8");
  assert.equal((wake.match(/fallbackAtTop/g) ?? []).length, 2);
  assert.match(wake, /pointer-events-none absolute inset-0 z-20/);
  assert.match(coachMotion, /fallbackAtTop \? "top-4 z-\[70\] pointer-events-auto" : "bottom-5"/);
});
