import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const review = readFileSync(new URL("../src/routes/marcus-review.tsx",import.meta.url),"utf8");
const gate = readFileSync(new URL("../src/v2/rig-release.ts",import.meta.url),"utf8");
const coaching = readFileSync(new URL("../src/v2/coach-rig.tsx",import.meta.url),"utf8");

test("review uses actual rigged model but is separated from active training scenes",()=>{
 assert.match(review, /createFileRoute\("\/marcus-review"\)/);
 assert.match(review, /rigged_character\.glb/);
 assert.match(review, /cloneSkeleton\(scene\)/);
 assert.match(review, /OrbitControls/);
 assert.match(review, /QUALITY HOLD/);
 assert.match(review, /showRejected &&/);
 assert.match(review, /Approved appearance reference/);
 assert.match(review, /Reference photo & other 3D versions/);
 assert.match(review, /marcus-review-3d/);
 assert.match(review, /<details data-testid="marcus-review-compare"/);
 assert.match(review, /Original approved photo — reference only/);
 assert.doesNotMatch(review, /Generated draft/);
 assert.doesNotMatch(review, /trainingSessionReducer|dispatch\(\{ type: "start"|<M3GymRenderer/);
});
test("review does not unlock unverified production animations or replace approved actor",()=>{
 assert.match(gate, /identityApproved: false/);
 assert.match(gate, /rigAndMobileApproved: false/);
 assert.match(gate, /reviewedMotionKeys: \[\]/);
 assert.match(coaching, /\/v2\/coach\.glb/);
 assert.doesNotMatch(review, /<CoachRigSlot|COACH_MOTION\s*=|approvedCoachMedia\s*=/);
});
