import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const get=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Recovery iframe and fullscreen use packaged index, preventing SPA 404",()=>{
 const recovery=get("src/routes/recovery.tsx"); const android=get("scripts/stage-android-recovery.mjs");
 assert.equal(recovery.includes("/recovery-coach/index.html?program=${program}"),true);
 assert.equal(recovery.includes("src={`/recovery-coach/?program="),false);
 assert.equal(recovery.includes("href={`/recovery-coach/?program="),false);
 assert.equal(android.includes('"recovery-coach/index.html"'),true);
});
test("Program tab leads to unified V2, Recovery, Workouts A/B and scene review",()=>{
 const p=get("src/routes/program.tsx");
 for (const k of ["m3-primary-workout-menu","program-v2","program-recovery","program-A","program-B","program-scene-library","m3-legacy-program-archive"]) assert.ok(p.includes(k),k);
 assert.ok(p.includes("<details className="));
});
test("Existing approved recovery footage and app ID remain locked",()=>{
 const p=get("public/recovery-coach/index.html"); const cfg=JSON.parse(get("capacitor.config.json"));
 assert.equal(cfg.appId,"com.m3legacy.flexrecovery");
 for (const id of ["C01-R3","C02","C03","C04-R2","C08-PRESS-R3","C09-PRE-BREATH-R2","C10-POST-BREATH-R1"]) assert.ok(p.includes(id),id);
});
