/**
 * Executable synthetic regression tests for what the ONE phone camera claims.
 * Uses actual src/v2/boxing-form.ts bundled with the project's existing
 * esbuild dependency; no new testing framework or subscription.
 *
 * These tests validate detector state transitions. They do NOT validate
 * real-life biomechanics, camera accuracy or a professional boxing session.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import { build } from "esbuild";

const outfile = path.join(os.tmpdir(), "m3-v2-boxing-form.test.mjs");
await build({
  entryPoints: ["src/v2/boxing-form.ts"],
  outfile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
  alias: { "@": path.resolve("src") },
});
const { BoxingFormTracker } = await import(pathToFileURL(outfile).href);

const IDX = {
  nose: 0, shL: 11, shR: 12, elL: 13, elR: 14,
  wrL: 15, wrR: 16, hipL: 23, hipR: 24,
  knL: 25, knR: 26, ankL: 27, ankR: 28,
};

function atGuard() {
  const lm = Array.from({ length: 33 }, () => ({
    x: 0.5, y: 0.5, z: 0, visibility: 1,
  }));
  const put = (key, x, y) => { lm[IDX[key]] = { x, y, z: 0, visibility: 1 }; };
  put("nose", 0.5, 0.20);
  put("shL", 0.42, 0.32); put("shR", 0.58, 0.32);
  put("elL", 0.40, 0.37); put("elR", 0.60, 0.37);
  put("wrL", 0.48, 0.26); put("wrR", 0.52, 0.26);
  put("hipL", 0.44, 0.62); put("hipR", 0.56, 0.62);
  put("knL", 0.43, 0.79); put("knR", 0.57, 0.79);
  put("ankL", 0.42, 0.97); put("ankR", 0.58, 0.97);
  return lm;
}
const clone = (lm) => structuredClone(lm);
function extension(guard, right) {
  const lm = clone(guard);
  lm[IDX[right ? "elR" : "elL"]] = {
    x: right ? 0.62 : 0.38, y: 0.33, z: 0, visibility: 1,
  };
  lm[IDX[right ? "wrR" : "wrL"]] = {
    x: right ? 0.70 : 0.30, y: 0.32, z: -0.15, visibility: 1,
  };
  return lm;
}
function retracting(guard, right) {
  const lm = clone(guard);
  lm[IDX[right ? "elR" : "elL"]] = {
    x: right ? 0.59 : 0.41, y: 0.38, z: 0, visibility: 1,
  };
  lm[IDX[right ? "wrR" : "wrL"]] = {
    x: right ? 0.60 : 0.40, y: 0.28, z: 0, visibility: 1,
  };
  return lm;
}

const t = Date.now();
const guard = atGuard();
const cross = new BoxingFormTracker("jabCross", "orthodox");
cross.update(guard, t);
cross.update(extension(guard, false), t + 80);
let snap = cross.update(extension(guard, false), t + 160);
assert.equal(snap.leadPunches, 0, "extension must not be counted as a finished jab");
assert.equal(snap.phase, "extended");
cross.update(retracting(guard, false), t + 240);
snap = cross.update(guard, t + 320);
assert.equal(snap.leadPunches, 1, "guard return completes the lead jab");
assert.equal(snap.rearPunches, 0);

cross.update(extension(guard, true), t + 450);
cross.update(extension(guard, true), t + 530);
cross.update(retracting(guard, true), t + 610);
snap = cross.update(guard, t + 690);
assert.equal(snap.rearPunches, 1, "rear hand must also finish and return");
assert.equal(snap.combinations, 1, "only a completed lead-then-rear pair is a 1-2");

const interrupted = new BoxingFormTracker("jab", "orthodox");
interrupted.update(guard, t);
interrupted.update(extension(guard, false), t + 100);
snap = interrupted.update(extension(guard, false), t + 200);
assert.equal(snap.leadPunches, 0);
const obscured = clone(guard);
obscured[IDX.wrL].visibility = 0.05;
snap = interrupted.update(obscured, t + 300);
assert.equal(snap.leadPunches, 0, "missing wrist cannot complete an unseen punch");
assert.equal(snap.phase, "waiting");

const stance = new BoxingFormTracker("boxingStance", "orthodox");
const low = clone(guard);
low[IDX.wrL].y = 0.55;
low[IDX.wrR].y = 0.55;
for (let i = 0; i < 8; i++)
  snap = stance.update(low, t + i * 80);
assert.equal(snap.stance, "guard-low", "persistent visibly dropped guard is reported");
assert.equal(snap.leadPunches, 0, "stance does not manufacture punching reps");

console.log("PASS: punch requires full return, lead/rear count, combo order, occlusion gate and guard persistence (6 checks)");
