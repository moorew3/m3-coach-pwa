import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/routes/v2.tsx", import.meta.url), "utf8");
const scenes = readFileSync(new URL("../src/v2/training-scenes.ts", import.meta.url), "utf8");
const rig = readFileSync(new URL("../src/v2/rig-release.ts", import.meta.url), "utf8");

test("Fold workout keeps one large moving stage and its primary coaching actions", () => {
  assert.match(route, /h-\[calc\(100dvh-176px\)\]/);
  assert.match(route, /aria-label="Coach controls"/);
  assert.match(route, /"Start workout"/);
  assert.match(route, /aria-label="Complete set and advance"/);
  assert.match(route, /aria-label="Ask Marcus"/);
  assert.match(route, /data-testid="v2-trainer-stage"/);
});

test("a missing demo cannot masquerade as an animated Marcus or silently advance a set", () => {
  assert.match(route, /data-testid="motion-pending-stage"/);
  assert.match(route, /aria-label="Play approved exercise"/);
  assert.match(route, /chooseWorkout\("recovery"\)/);
  assert.doesNotMatch(route, /Skip this step/);
  assert.match(route, /!stageMedia && !realTimeRigReady/);
  assert.match(scenes, /!canDemonstrate\(session\)/);
  assert.match(rig, /identityApproved: false/);
  assert.match(rig, /rigAndMobileApproved: false/);
});

test("proven workout, approved scenes and mobility clearance are not replaced", () => {
  assert.match(route, /data-testid="unified-workout-selectors"/);
  assert.match(route, /session\.workout\.requiresClearance/);
  assert.match(route, /motionFrameMayAdvance\(/);
  assert.match(route, /onPlaybackStateChange/);
  assert.match(route, /onVideoReady/);
  assert.match(route, /onPlaybackFailure/);
});
