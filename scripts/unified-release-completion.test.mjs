import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { stamp } from "./stamp-android-version.mjs";
import { surfaceLabel, RELEASE } from "../src/lib/build-info.ts";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("the unified build retains both video reuse and verified Android backup saves",()=>{
 assert.match(read("public/recovery-coach/programs/index.html"),/showCurrentAppVideoLibrary/);
 assert.match(read("public/backup-delivery.js"),/Saved and checked/);
 assert.match(read("src/routes/settings.tsx"),/await saveBackup/);
 assert.match(read(".github/workflows/android-apk.yml"),/install-android-backup-save/);
});
test("rejected rowing remains inspectable but outside every active exercise allowlist",()=>{
 const context={window:{}};vm.runInNewContext(read("public/recovery-coach/scene-library.js"),context);
 const row=context.window.M3_FLEX_SCENE_LIBRARY.find(s=>s.id==="ROW-R5");
 assert.equal(row.status,"qa-rejected");assert.ok(row.video);assert.ok(!row.audio);
 const page=read("public/recovery-coach/index.html");
 const active=page.slice(page.indexOf("const APPROVED_WORKOUT_CHOICES="),page.indexOf("const SCENE_OWNER_KEY="));
 assert.doesNotMatch(active,/ROW-R5/);
 assert.match(page,/scene.status!=="qa-rejected"&&OPTIONAL_SCENE_IDS/);
 assert.match(page,/REJECTED FOR WORKOUT USE/);
});
test("Settings distinguishes native Android, PWA and browser even if an optional bridge fails",()=>{
 const previous=globalThis.window;
 try {
  delete globalThis.window;assert.equal(surfaceLabel(),"server");
  globalThis.window={Capacitor:{isNativePlatform:()=>true,getPlatform:()=>"android"}};
  assert.equal(surfaceLabel(),"Android app");
  globalThis.window={navigator:{},matchMedia:()=>({matches:true})};assert.equal(surfaceLabel(),"Installed web app");
  globalThis.window={navigator:{},matchMedia:()=>({matches:false}),Capacitor:{isNativePlatform:()=>{throw Error("bridge")}}};
  assert.equal(surfaceLabel(),"Browser");assert.equal(RELEASE,"2026-11-02.1");
 } finally {if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});

test("Android package version matches Settings and stamping preserves app ID and signing config",()=>{
 const gradle='applicationId "com.m3legacy.flexrecovery"\nversionCode 1\nversionName "1.0"\nsigningConfig signingConfigs.release';
 const result=stamp(gradle,RELEASE);
 assert.match(result,/versionCode 2026110201/);assert.match(result,/versionName "2026-11-02.1"/);
 assert.match(result,/applicationId "com.m3legacy.flexrecovery"/);assert.match(result,/signingConfig signingConfigs.release/);
 assert.equal(stamp(result,RELEASE),result);
 assert.throws(()=>stamp('unknown format',RELEASE));assert.throws(()=>stamp(gradle,'bad version'));
});
