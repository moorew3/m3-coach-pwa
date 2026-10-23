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
