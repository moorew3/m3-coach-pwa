import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page=readFileSync(new URL("../public/recovery-coach/full-backup/index.html",import.meta.url),"utf8");
const settings=readFileSync(new URL("../src/routes/settings.tsx",import.meta.url),"utf8");
const safety=readFileSync(new URL("../public/recovery-coach/update-safety/index.html",import.meta.url),"utf8");
const android=readFileSync(new URL("../scripts/stage-android-recovery.mjs",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("one password-protected archive covers original trainer, photos, nutrition and actual seated records",()=>{
 for(const key of ["arm-growth-tracker:v1","m3-flex-real-reps-and-metrics-v1","m3-flex-recovery-last-session-v1"])
  assert.ok(page.includes(key),"Missing known owner data source "+key);
 assert.match(page,/m3-flex-full-device-encrypted-v1/);
 assert.match(page,/PBKDF2/);
 assert.match(page,/AES-GCM/);
 assert.match(page,/ITERATIONS=310000/);
 assert.match(page,/salt=crypto\.getRandomValues\(new Uint8Array\(16\)\)/);
 assert.match(page,/iv=crypto\.getRandomValues\(new Uint8Array\(12\)\)/);
 assert.match(page,/password\.length<12\|\|password\.length>128/);
 assert.match(page,/userAvatar/);
 assert.match(page,/app\.nutrition/);
 assert.match(page,/app\.measurements/);
 assert.match(page,/logbook\.records/);
 assert.doesNotMatch(page,/MediaRecorder|getUserMedia\(|canvas\.toDataURL|fetch\(|XMLHttpRequest|\/api\/public\/coach-talk/);
});

test("file decryption/validation is a nonmutating first step and restore cannot overwrite cloud-linked or populated installations",()=>{
 assert.match(page,/verified=validate\(JSON\.parse\(decoder\.decode\(plain\)\)\)/);
 assert.match(page,/localStorage\.getItem\(K_SYNC\)/);
 assert.match(page,/function targetEmpty\(\)/);
 assert.match(page,/!app&&!log&&!localStorage\.getItem\(K_SYNC\)/);
 assert.match(page,/confirmRestore/);
 assert.match(page,/!verified\|\|!\$\("confirmRestore"\)\.checked\|\|!targetEmpty\(\)/);
 assert.match(page,/window\.confirm\("Restore the verified original tracker/);
 assert.match(page,/localStorage\.setItem\(K_APP,rawApp\)/);
 assert.match(page,/localStorage\.setItem\(K_LOG,rawLog\)/);
 assert.match(page,/localStorage\.removeItem\(K_APP\);localStorage\.removeItem\(K_LOG\)/);
 assert.match(page,/No cloud credentials or clinician clearance restored/);
 assert.match(page,/Object\.entries\(x\)/);
 assert.match(page,/"__proto__","constructor","prototype"/);
 assert.match(page,/m3-flex-recovery-progress-v1/);
});

test("Settings and Android warnings no longer misrepresent single-component backups as complete",()=>{
 assert.match(settings,/href="\/recovery-coach\/full-backup\/"/);
 assert.match(settings,/Back up entire M3 FLEX/);
 assert.match(settings,/original tracker only \(not Recovery logs\)/);
 assert.match(safety,/href="\.\.\/full-backup\/"/);
 assert.match(safety,/Back up the entire app, not just Recovery reps/);
 assert.match(android,/recovery-coach\/full-backup\/index\.html/);
 assert.match(browser,/Encrypted whole-app backup: wrong-password rejection/);
});
