/**
 * Frozen reference baseline for the owner-requested AVATAR-ONLY correction.
 * This intentionally requires an explicit update if anyone modifies the
 * exercise catalogue, sets, order, timers, coaching-session logic or workout
 * recovery manifest. It prevents an "appearance fix" from silently changing
 * the program. No new dependencies, generated motions or paid services.
 */
import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const baseline = {
  "src/v2/catalog.ts": "4caaec02",
  "src/v2/session.ts": "0d92f1ea",
  "src/lib/coach-session.ts": "b9459500",
  "src/data/recovery/current-workout-integrity-manifest.ts": "aa59ec46",
};

function fnv32(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16).padStart(8, "0");
}

for (const [file, expected] of Object.entries(baseline)) {
  const actual = fnv32(readFileSync(file, "utf8"));
  assert.equal(
    actual, expected,
    `Workout-preservation gate failed for ${file}. An avatar or entrance change must not alter workout order, exercises, sets, timing or session logic.`,
  );
}
assert.ok(existsSync("public/coach-source/coach-primary-standing.png"),
  "The original approved coach image was removed.");
const entrance = readFileSync("src/v2/workout-opening-scene.tsx", "utf8");
assert.ok(!/\b(?:dispatch|startCamera|stopCamera|speak|stopSpeech)\s*\(/.test(entrance),
  "The opening scene must never advance a workout, open the camera or speak.");
console.log("PASS: locked existing workouts, recovery plan, session logic and approved coach asset.");
