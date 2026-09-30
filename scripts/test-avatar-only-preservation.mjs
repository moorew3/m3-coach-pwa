/**
 * Git-blob reference baseline for the owner-requested AVATAR-ONLY correction.
 * This intentionally requires an explicit update if anyone modifies the
 * exercise catalogue, sets, order, timers, coaching-session logic or workout
 * recovery manifest. It prevents an "appearance fix" from silently changing
 * the program. No new dependencies, generated motions or paid services.
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const baselineGitBlobs = {
  "src/v2/catalog.ts": "a0a30b6902c4aeb46d4f3818b7d4d384d28d80f0",
  "src/v2/session.ts": "03029cea2be7eb34291e448a433e21eef72a234d",
  "src/lib/coach-session.ts": [
    // Original published main branch; the PR CI checks out its merge commit.
    "0a7cc1b3a029f2f2014e188f2d7ae7e323fea429",
    // Original untouched V2-branch session module.
    "7d69babc38ee63ee4da27344f30c758b7fc6eb63",
  ],
  "src/data/recovery/current-workout-integrity-manifest.ts":
    "b2ce7d8b6579a1318976443e23be8fd0831ccf8d",
};

// Git hashes the EXACT UTF-8 file bytes, including line endings, and avoids
// differences between connector previews and the actual checked-out source.
for (const [file, expectedBlobSha] of Object.entries(baselineGitBlobs)) {
  const actual = execFileSync("git", ["rev-parse", `HEAD:${file}`], {
    encoding: "utf8",
  }).trim();
  assert.ok(
    (Array.isArray(expectedBlobSha) ? expectedBlobSha : [expectedBlobSha]).includes(actual),
    `Workout-preservation gate failed for ${file}. An avatar correction must not change the workout sequence, sets, timing or session engine.`,
  );
}
assert.ok(existsSync("public/coach-source/coach-primary-standing.png"),
  "The original approved coach image was removed.");
const entrance = readFileSync("src/v2/workout-opening-scene.tsx", "utf8");
assert.ok(!/\b(?:dispatch|startCamera|stopCamera|speak|stopSpeech)\s*\(/.test(entrance),
  "The opening scene must never advance a workout, open the camera or speak.");
console.log("PASS: locked existing workouts, recovery plan, session logic and approved coach asset.");
