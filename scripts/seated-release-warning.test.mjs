import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (s) => readFileSync(new URL(s, import.meta.url), "utf8");
const program = read("../src/data/program.ts");
const home = read("../src/routes/index.tsx");
const coach = read("../src/routes/coach.$day.tsx");
const audit = read("../docs/M3-FLEX-SEATED-ONLY-RELEASE-SAFETY-AUDIT-2026-10-23.md");

test("legacy weekly plan is explicitly marked unapproved for seated-only workouts", () => {
  for (const oldMove of ["cardio-squat-curl", "cardio-step-curl", "fri-squat", "fri-split-squat", "box-front-kick", "box-round-kick"]) {
    assert.ok(program.includes(oldMove), "Expected legacy movement for audit: " + oldMove);
    assert.ok(audit.includes(oldMove), "Safety audit must document risky legacy movement: " + oldMove);
  }
  assert.match(audit, /BLOCKED for a full seated-only workout release/);
  assert.match(audit, /Do not promote this draft/);
});

test("workout launch warns about seated-only programming conflict and links reviewed clips", () => {
  assert.match(home, /data-testid="seated-program-warning"/);
  assert.match(home, /not been fully converted or cleared for foot-cast seated-only training/);
  assert.match(home, /href="\/recovery-coach\/"/);
  assert.match(coach, /data-testid="coach-seated-review-warning"/);
  assert.match(coach, /readiness\s+check does not certify/i);
});

test("safety warning adds no silently substituted exercises, sets, or media", () => {
  assert.doesNotMatch(home, /removeExerciseIfStanding|forceSeatedFallback/);
  assert.doesNotMatch(coach, /approveClip\(|overrideCoachClip\(/);
});
