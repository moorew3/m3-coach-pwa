import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route = readFileSync(new URL("../src/routes/coach.$day.tsx", import.meta.url), "utf8");
const session = readFileSync(new URL("../src/lib/coach-session.ts", import.meta.url), "utf8");
const browser = readFileSync(new URL("./browser-mobile-smoke.mjs", import.meta.url), "utf8");

test("coach motion cadence completion never fabricates athlete repetitions", () => {
  const begin = route.indexOf("    onDone: (_total: number) => {");
  const end = route.indexOf("  /* pre-fill the log fields", begin);
  assert.ok(begin > 0 && end > begin, "cadence callback must exist");
  const code = route.slice(begin, end);
  assert.match(code, /setCadencePrompt\(true\)/);
  assert.doesNotMatch(code, /engine\.finishWork\(/);
  assert.doesNotMatch(code, /confirmReps\.current\s*=/);
  assert.doesNotMatch(code, /setReps\(String\(total\)\)/);
  assert.match(route, /data-testid="confirm-actual-reps"/);
  assert.match(route, /verify your own rep count/i);
});

test("only the user's confirmed completion action logs rep-based sets", () => {
  assert.match(route, /const primaryAction = \(\) => \{[\s\S]*?engine\.finishWork\(\)/);
  assert.match(route, /data-testid="primary-action"/);
  assert.match(session, /const finishWork = useCallback\(\(\) => \{[\s\S]*?finishRef\.current\(step, finishInfo/);
});

test("browser integration covers clock freeze and true superset transition", () => {
  assert.match(route, /data-left=\{left === null \? "null" : left\}/);
  assert.match(browser, /Pausing must freeze countdown/);
  assert.match(browser, /Paused superset rest must not tick/);
  assert.match(browser, /mon-db-curl-work-0/);
  assert.match(browser, /mon-triceps-pressdown-brief/);
  assert.match(browser, /mon-triceps-pressdown-work-0/);
  assert.match(browser, /mon-triceps-pressdown-rest-0/);
  assert.match(browser, /mon-db-curl-work-1/);
});
