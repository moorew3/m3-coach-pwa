import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const workflow=readFileSync(new URL("../.github/workflows/android-owner-signed.yml",import.meta.url),"utf8");
const backup=readFileSync(new URL("../public/recovery-coach/full-backup/index.html",import.meta.url),"utf8");

test("owner-stable signing workflow is opt-in and never triggered by pushes or pull requests",()=>{
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,/OWNER_KEY_AND_BACKUP_READY/);
 assert.match(workflow,/m3-flex-android-owner-signing/);
 assert.doesNotMatch(workflow,/\n  (push|pull_request|schedule):/);
 assert.doesNotMatch(workflow,/deploy-pages|gh-pages|railway|hostinger|fastlane supply/);
});

test("release APK uses original M3 FLEX app ID, approved offline stage and owner-pinned Android certificate",()=>{
 for(const name of [
  "M3_FLEX_KEYSTORE_BASE64","M3_FLEX_KEYSTORE_PASSWORD",
  "M3_FLEX_KEY_ALIAS","M3_FLEX_KEY_PASSWORD",
  "M3_FLEX_EXPECTED_CERT_SHA256"
 ])assert.ok(workflow.includes(name),"Owner signing variable missing: "+name);
 assert.match(workflow,/node scripts\/stage-unified-static\.mjs/);
 assert.match(workflow,/node scripts\/stage-android-recovery\.mjs/);
 assert.match(workflow,/android-recovery-web\/recovery-coach\/full-backup\/index\.html/);
 assert.match(workflow,/assembleRelease/);
 assert.match(workflow,/zipalign/);
 assert.match(workflow,/apksigner" sign/);
 assert.match(workflow,/apksigner" verify --print-certs/);
 assert.match(workflow,/Owner certificate identity changed/);
 assert.match(workflow,/package: name='com\.m3legacy\.flexrecovery'/);
 assert.match(workflow,/artifacts\/M3_FLEX_Unified_Owner_Signed\.apk/);
 assert.match(workflow,/trap 'rm -f "\$STORE"' EXIT/);
 assert.match(workflow,/set \+x/);
 assert.match(backup,/m3-flex-full-device-encrypted-v1/);
});

test("stable signing never embeds owner passwords or keystore in source",()=>{
 assert.match(workflow,/secrets\.M3_FLEX_KEYSTORE_BASE64/);
 assert.match(workflow,/vars\.M3_FLEX_EXPECTED_CERT_SHA256/);
 assert.doesNotMatch(workflow,/^.*keytool -genkeypair.*$/m);
 assert.doesNotMatch(workflow,/BEGIN PRIVATE KEY|-----BEGIN CERTIFICATE-----/);
 assert.doesNotMatch(workflow,/echo "\$OWNER_KEYSTORE"/);
});
