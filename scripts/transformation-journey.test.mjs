import assert from "node:assert/strict";
import { summarizeJourney, shareJourney } from "../src/lib/transformation-journey.ts";

const input = [
  { id: "older", date: "2026-10-01", bodyweight: "205", waist: "41" },
  { id: "recent", date: "2026-11-01", bodyweight: "198", waist: "39" },
];
const computed = summarizeJourney(input, 9);
assert.equal(computed.weightChange, -7);
assert.equal(computed.waistChange, -2);
assert.equal(computed.completedWorkouts, 9);
const privateSummary = shareJourney(computed, { includeWeight: false, includeWaist: false });
assert.equal(privateSummary.includes("-7"), false, "Measurements must not leak by default");
assert.equal(privateSummary.includes("-2"), false, "Waist must not leak by default");
assert.equal(privateSummary.includes("certified personal trainer"), false, "Do not claim a credential");
const optedIn = shareJourney(computed, { includeWeight: true, includeWaist: true });
assert.equal(optedIn.includes("-7"), true);
assert.equal(optedIn.includes("-2"), true);
assert.equal(summarizeJourney([{ id: "invalid", date: "2026-11-02", bodyweight: "bad", waist: "" }], 1).latestWeight, null);
assert.equal(summarizeJourney([], 0).weightChange, null);
console.log("Transformation journey: 8 checks passed");
