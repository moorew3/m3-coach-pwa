import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const coach=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const logbook=readFileSync(new URL("../public/recovery-coach/logbook/index.html",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("current moving Flex shows only real manual prior sets from same-origin locally stored logbook",()=>{
 assert.match(coach,/id="lastActualReference"/);
 assert.match(coach,/const REAL_LOG_KEY="m3-flex-real-reps-and-metrics-v1"/);
 assert.match(logbook,/const KEY="m3-flex-real-reps-and-metrics-v1"/);
 assert.match(coach,/x\.type==="set"&&x\.exercise===approved&&Number\.isInteger\(x\.reps\)/);
 assert.match(coach,/x\.reps>=0&&x\.reps<=100/);
 assert.match(coach,/Date\.parse\(b\.at\)-Date\.parse\(a\.at\)/);
 assert.match(coach,/window\.addEventListener\("storage",event=>\{if\(event\.key===REAL_LOG_KEY/);
 assert.match(coach,/window\.addEventListener\("focus",renderLastActualSet\)/);
 assert.match(coach,/setMedia\(\);cards\(\);drawTimer\(\);renderLastActualSet\(\)/);
 assert.match(browser,/LAST ACTUAL SET · 12 reps you logged · 15 lb reported/);
 assert.match(browser,/No personal set logged/);
});
test("historical resistance is not a new load prescription or imaginary INNSTAR band pound amount",()=>{
 assert.match(coach,/approved==="C08-PRESS-R3"\?" · Band load not verified"/);
 assert.match(coach,/not a safe-load prescription; use only clinician-cleared resistance/);
 assert.match(coach,/Timed videos do not measure actual reps/);
 assert.match(browser,/LAST ACTUAL SET · 8 reps you logged · Band load not verified/);
 assert.doesNotMatch(coach,/fetch\(\s*["']\/api\/private-log/);
});
