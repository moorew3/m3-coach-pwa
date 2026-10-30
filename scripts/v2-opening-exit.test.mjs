import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const opening=readFileSync(new URL("../src/v2/workout-opening-scene.tsx",import.meta.url),"utf8");
test("M3 Coach V2 entrance always has a visible return to the same existing app",()=>{
 assert.match(opening,/data-testid="v2-opening-exit"/);
 assert.match(opening,/href="\/"/);
 assert.match(opening,/Back to workouts/);
 assert.match(opening,/min-h-12/);
 assert.match(opening,/aria-label="Back to M3 FLEX workouts without starting a session"/);
});
test("restored Flex identity and athlete portrait are unmodified by exit control",()=>{
 assert.match(opening,/src=\{COACH_REFERENCE\}/);
 assert.match(opening,/src=\{athletePortrait\}/);
 assert.match(opening,/data-testid="v2-approved-avatar-entrance"/);
});
