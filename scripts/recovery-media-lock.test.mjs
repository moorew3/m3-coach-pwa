import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const production = readFileSync(new URL("../public/recovery-coach/index.html", import.meta.url), "utf8");
const previews = readFileSync(new URL("../public/recovery-coach/programs/index.html", import.meta.url), "utf8");

/*
 * These are the seven owner-approved immutable exercise video IDs/asset hashes
 * recorded in docs/M3-FLEX-MASTER-QA-2026-10-17.md. Do not change the
 * source video without creating a NEW candidate and obtaining owner approval.
 */
const approved = [
  ["C01-R3", "9a48369a-ec51-4abc-9f50-f8966f19dc1e.mp4"],
  ["C02", "01a14462-bc16-778b-a773-db16e57aade7.mp4"],
  ["C03", "01a14462-cf4a-7daa-be5c-437eab0c9ba2.mp4"],
  ["C04-R2", "31bc3ad4-fc95-409b-81f1-3490f1f8eb35.mp4"],
  ["C08-PRESS-R3", "b1171f4e-6526-45a7-a413-fd0ad4ffb1de.mp4"],
  ["C09-PRE-BREATH-R2", "f92c84ea-a2bc-4623-966b-deb8ceff8a87.mp4"],
  ["C10-POST-BREATH-R1", "d65e6c81-dae1-484f-9bb9-48f7e18d8dbc.mp4"],
];

function sceneFor(id) {
  const needle = `{id:"${id}",`;
  const start = production.indexOf(needle);
  assert.ok(start >= 0, `${id} must remain part of the active Recovery Coach`);
  const end = production.indexOf("},", start);
  assert.ok(end > start);
  return production.slice(start, end + 2);
}

test("seven approved Recovery Coach scenes retain their immutable video asset IDs", () => {
  for (const [sceneId, assetId] of approved) {
    assert.ok(sceneFor(sceneId).includes(assetId), `${sceneId} video must not be silently replaced`);
  }
});

test("approved speech remains attached and does not repeat every breathing-loop iteration", () => {
  for (const id of ["C09-PRE-BREATH-R2", "C10-POST-BREATH-R1"]) {
    const scene = sceneFor(id);
    assert.match(scene, /voiceOnce:true/);
    assert.match(scene, /approved:true/);
    assert.match(scene, /\.mp3/);
  }
  assert.match(sceneFor("C02"), /id=6b027ae2-4ffa-47c0-82a4-ef187fcd7945\.wav/);
  assert.match(sceneFor("C03"), /id=dedc79bf-53bd-4766-a7dd-95e43c3c10af\.wav/);
});

test("cast safety affirmation remains required and media failure does not count a set", () => {
  assert.match(production, /function safetyOkay\(\)/);
  assert.match(production, /if\(!safetyOkay\(\)\)/);
  assert.match(production, /function playbackError\(msg\)/);
  assert.match(production, /Set NOT completed/);
});

test("unapproved Workout A/B demonstration candidates are still blocked", () => {
  assert.match(previews, /"name":"INNSTAR chest fly","status":"pending"/);
  assert.match(previews, /"name":"AMYCO wrist system","status":"missing"/);
  assert.match(previews, /"name":"Seated wrist curls","status":"source"/);
  assert.match(previews, /"name":"Seated lateral raises","status":"source"/);
  assert.match(previews, /"name":"Arm-only seated boxing","status":"source"/);
});

test("C09 and C10 are correctly labeled as approved, while C11 stays preview-only", () => {
  assert.match(previews, /C09 · Owner-approved and active/);
  assert.match(previews, /C10 · Owner-approved and active/);
  assert.match(previews, /id="C11-PRE-HANDS-R1"/);
  assert.match(previews, /C11 · Render completed · NOT approved/);
  assert.match(previews, /01a154f3-ef54-7546-8740-1c488df4c772\.mp4/);
  assert.doesNotMatch(production, /C11-PRE-HANDS-R1/);
});
