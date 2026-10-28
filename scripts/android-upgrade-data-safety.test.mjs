import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const page=load("../public/recovery-coach/update-safety/index.html");
const coach=load("../public/recovery-coach/index.html");
const log=load("../public/recovery-coach/logbook/index.html");
const android=load("../scripts/stage-android-recovery.mjs");
const apkWorkflow=load("../.github/workflows/android-apk.yml");
const staticPackage=load("../scripts/package-static-recovery-preview.py");
const browser=load("./browser-mobile-smoke.mjs");

test("Android update safeguard reads current device record/snapshot without uploading, deleting or importing",()=>{
 assert.match(page,/m3-flex-real-reps-and-metrics-v1/);
 assert.match(page,/m3-flex-recovery-progress-v1/);
 assert.match(page,/localStorage\.getItem\(STORAGE_KEY\)/);
 assert.match(page,/localStorage\.getItem\(PROGRESS_KEY\)/);
 assert.match(page,/No logs leave this device/);
 assert.match(page,/Nothing has been backed up by this page/);
 assert.match(page,/did not test decryption or copy anything/);
 assert.doesNotMatch(page,/localStorage\.clear\(|localStorage\.removeItem\(|upload\(|XMLHttpRequest|sendBeacon/);
 assert.match(page,/I personally located the encrypted JSON backup file/);
 assert.match(page,/correct private backup password saved separately/);
 assert.match(page,/interrupted workout countdown, camera settings and clinician-clearance checks do not transfer/);
});

test("actual logbook encrypted backup path is easy to reach and not certified merely by tapping",()=>{
 assert.match(coach,/href="\.\/update-safety\/"/);
 assert.match(page,/href="\.\.\/logbook\/#backup"/);
 assert.match(log,/<section id="backup">/);
 assert.match(log,/Export password-protected backup/);
 assert.match(log,/310,000 rounds/);
 assert.match(log,/No password, reps, measurements or keys are uploaded/);
 assert.match(browser,/Android update preflight reads actual device log count and cannot claim or perform a backup/);
});

test("Android build metadata comes from actual CI SHA, never claims stable signing or release certification",()=>{
 assert.match(android,/const buildCommit=\(process\.env\.GITHUB_SHA\|\|""\)\.toLowerCase\(\)/);
 assert.match(android,/stableUpgradeSignature:false/);
 assert.match(android,/releaseSigned:false/);
 assert.match(android,/writeFile\(join\(dest,"build-info\.json"\)/);
 assert.match(apkWorkflow,/test -s android-recovery-web\/recovery-coach\/update-safety\/index\.html/);
 assert.match(apkWorkflow,/stableUpgradeSignature/);
 assert.match(staticPackage,/"recovery-coach\/update-safety\/index\.html"/);
 assert.match(page,/data\.commit\.slice\(0,12\)/);
});
