import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const queue = source("src/v2/pending-marcus-press-reviews.ts");
const verified = source("src/v2/approved-coach-media.ts");
const scenes = source("src/v2/training-scenes.ts");
const identity = source("src/data/coach-identity.ts");
const rig = source("src/v2/rig-release.ts");

test("New Marcus video candidates are traceable but never approved by creation alone", () => {
  for (const id of [
    "bb5e40c8f31f4c2c9a2bac097fd58bf9",
    "412ffc12265549a39100dcf6ce8219eb",
  ]) {
    assert.ok(queue.includes(id), `Lost video reference: ${id}`);
    assert.ok(!verified.includes(id), `Owner-unapproved video used as coach: ${id}`);
    assert.ok(!scenes.includes(id), `Owner-unapproved video used in exercise stage: ${id}`);
  }
  assert.equal((queue.match(/allowInCoach: false/g) || []).length, 2);
  assert.equal((queue.match(/allowInHologram: false/g) || []).length, 2);
  assert.equal((queue.match(/status: "pending-owner-visual-approval"/g) || []).length, 2);
});

test("Previously verified incline/flat presses remain correctly distinguished", () => {
  assert.match(verified, /inclinePress: "inclineDumbbellPress"/);
  assert.match(identity, /"benchPress"/);
  assert.match(identity, /"inclineDumbbellPress"/);
  assert.match(identity, /shoulderPress: "Coach identity continuity is not verified/);
  assert.match(rig, /identityApproved: false/);
  assert.match(rig, /rigAndMobileApproved: false/);
});
