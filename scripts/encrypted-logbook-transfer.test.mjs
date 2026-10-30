import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync(new URL("../public/recovery-coach/logbook/index.html",import.meta.url),"utf8");
const browser=readFileSync(new URL("./browser-mobile-smoke.mjs",import.meta.url),"utf8");

test("owner-only workout history backup can be sealed with salted authenticated AES-GCM and 310k-round PBKDF2",()=>{
 for(const label of ['id="exportProtected"','id="backupPassword"','id="importFile"'])
  assert.ok(page.includes(label),"Missing protected backup action "+label);
 assert.match(page,/const BACKUP_PBKDF_ITERATIONS=310000/);
 assert.match(page,/BACKUP_MAGIC="m3-flex-password-protected-v1"/);
 assert.match(page,/crypto\.getRandomValues\(new Uint8Array\(16\)\)/);
 assert.match(page,/crypto\.getRandomValues\(new Uint8Array\(12\)\)/);
 assert.match(page,/name:"PBKDF2",salt,iterations:BACKUP_PBKDF_ITERATIONS,hash:"SHA-256"/);
 assert.match(page,/name:"AES-GCM",length:256/);
 assert.match(page,/crypto\.subtle\.encrypt\(\{name:"AES-GCM",iv\}/);
 assert.match(page,/crypto\.subtle\.decrypt\(\{name:"AES-GCM",iv\}/);
 assert.match(page,/downloadProtectedBackup\(\{/);
 assert.match(page,/m3-flex-password-protected-workout-log\.json/);
 assert.match(page,/if\(parsed\?\.schema===2\)/);
 assert.match(page,/Wrong password, damaged protected backup, or authentication failed/);
 assert.match(page,/\$\("backupPassword"\)\.value=""/);
 assert.doesNotMatch(page,/\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\b|\bMediaRecorder\b/);
});
test("unprotected legacy workout backup import remains supported and encryption is not falsely called automatic sync",()=>{
 assert.match(page,/new Blob\(\[JSON\.stringify\(\{schema:1,exportedAt/);
 assert.match(page,/Unencrypted JSON backup exceeds the 850 KB limit/);
 assert.match(page,/automatic cross-device synchronization is not available/);
 assert.match(page,/if\(file\.size>1900000\)/);
 assert.match(page,/parsed\.records\.some\(r=>!validRecord\(r\)\)/);
 assert.match(page,/Keep its password separately/);
});
test("Chrome proves encrypted second-device transfer without automatic cloud data or plaintext export claims",()=>{
 assert.match(browser,/protectedDownload\.suggestedFilename\(\), "m3-flex-password-protected-workout-log\.json"/);
 assert.match(browser,/protectedFile\.iterations, 310000/);
 assert.match(browser,/Wrong password, damaged protected backup/);
 assert.match(browser,/Separate device cannot magically see another device/);
 assert.match(browser,/AES-256-GCM workout log transferred to second browser/);
});
