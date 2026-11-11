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
    "dc8a74a3feda442ab467616c05c80188",
    "434a4dc35d9245d18c62e4e639b3df00",
  ]) {
    assert.ok(queue.includes(id), `Lost video reference: ${id}`);
    assert.ok(!verified.includes(id), `Owner-unapproved video used as coach: ${id}`);
    assert.ok(!scenes.includes(id), `Owner-unapproved video used in exercise stage: ${id}`);
  }
  assert.match(queue, /exercise: "inclineBenchPress"/);
  assert.match(queue, /exercise: "declineBenchPress"/);
  assert.doesNotMatch(queue, /exercise: "shoulderPress"/);
  const pending = queue.split("export const REJECTED_MARCUS_PRESS_GENERATIONS")[0];
  assert.equal((pending.match(/allowInCoach: false/g) || []).length, 2);
  assert.equal((pending.match(/allowInHologram: false/g) || []).length, 2);
  for (const rejected of [
    "bb5e40c8f31f4c2c9a2bac097fd58bf9",
    "ef5471613ed74e2baee69385156ca902",
  ]) {
    assert.ok(queue.includes(rejected), "Rejected render must remain traceable");
    assert.ok(!verified.includes(rejected), "Rejected render must not enter live media");
    assert.ok(!scenes.includes(rejected), "Rejected render must not enter scene resolver");
  }
  assert.match(pending, /status: "owner-near-match-requires-wrong-narration-removal"/);
  assert.match(pending, /status: "owner-rejected-incorrect-incline-exercise"/);
  assert.match(pending, /ownerFeedback: "Decline close; narration incorrectly says seated chest press"/);
  assert.match(pending, /mustStripExistingAudio: true/);
  assert.match(pending, /correctedAudioRequired: "Decline dumbbell bench press"/);
  assert.match(pending, /embeddedVoiceTrackApproved: false/g);
  assert.doesNotMatch(pending, /status: "pending-owner-visual-approval"/);
  // Generated media is blocked until human frame-level, technique and voice QA.
  // A completed provider job never counts as approval.
  for (const gate of [
    "frameSamplesVerified",
    "benchAngleVerified",
    "correctRepPathVerified",
    "marcusIdentityVerified",
    "exactAudioApproved",
    "injuredLegSetupCleared",
    "allowAutomaticRegeneration",
  ]) {
    assert.equal((pending.match(new RegExp(gate + ": false", "g")) || []).length, 2, gate);
  }

  assert.ok(!verified.includes("412ffc12265549a39100dcf6ce8219eb"));
  assert.ok(!scenes.includes("412ffc12265549a39100dcf6ce8219eb"));
});

test("Previously verified incline/flat presses remain correctly distinguished", () => {
  assert.match(verified, /inclinePress: "inclineDumbbellPress"/);
  assert.match(identity, /"benchPress"/);
  assert.match(identity, /"inclineDumbbellPress"/);
  assert.match(identity, /shoulderPress: "Coach identity continuity is not verified/);
  assert.match(rig, /identityApproved: false/);
  assert.match(rig, /rigAndMobileApproved: false/);
});

test("Incline and decline coaching are different movements, not generic flat-press scripts", () => {
  const script = source("src/v2/exercise-coaching.ts");
  const detailed = source("src/data/coach-cues.ts");
  for (const file of [script, detailed]) {
    assert.match(file, /inclineDumbbellPress:/);
    assert.match(file, /declineDumbbellPress:/);
    assert.match(file, /HEAD|head/);
    assert.match(file, /hips/);
    assert.match(file, /LEFT|left/);
    assert.match(file, /unloaded/);
  }
  assert.match(script, /"inclinePress":/);
  assert.match(script, /"declineBenchPress":/);
  assert.match(detailed, /No horizontal flat bench/);
  assert.match(detailed, /Do not perform this movement on a flat bench/);
  assert.doesNotMatch(script, /feet firmly and your upper back against the incline bench/);
  assert.doesNotMatch(detailed, /Kick the dumbbells up into position/);
  assert.doesNotMatch(detailed, /shoulderPress:.*declineDumbbellPress/);
});

test("Press preflight documents correct movement, locked avatar, no generation spend, and research", () => {
  const doc = source("docs/m3-flex-incline-decline-video-preflight.md");
  for (const required of [
    "Two-Arm Incline Dumbbell Chest Press",
    "Decline Dumbbell Bench Press",
    "HEAD",
    "HIPS",
    "two full",
    "Marcus",
    "No additional video-generation jobs",
    "owner approve",
  ]) {
    assert.ok(doc.toLowerCase().includes(required.toLowerCase()), `Missing preflight requirement: ${required}`);
  }
  for (const rejected of [
    "bb5e40c8f31f4c2c9a2bac097fd58bf9",
    "ef5471613ed74e2baee69385156ca902",
  ]) {
    assert.ok(doc.includes(rejected));
  }
  assert.match(doc, /leg brace/);
  assert.match(doc, /decline.*not/i);
  assert.match(doc, /two distinct/i);
});

test("The wrong spoken seated chest press cannot pass as decline or incline bench press", () => {
  const queue = source("src/v2/pending-marcus-press-reviews.ts");
  const approved = source("src/v2/approved-coach-media.ts");
  const scenes = source("src/v2/training-scenes.ts");
  assert.match(queue, /mustStripExistingAudio: true/);
  assert.match(queue, /owner-rejected-incorrect-incline-exercise/);
  assert.ok(!approved.includes("dc8a74a3feda442ab467616c05c80188"));
  assert.ok(!approved.includes("434a4dc35d9245d18c62e4e639b3df00"));
  assert.ok(!scenes.includes("dc8a74a3feda442ab467616c05c80188"));
  assert.ok(!scenes.includes("434a4dc35d9245d18c62e4e639b3df00"));
});
