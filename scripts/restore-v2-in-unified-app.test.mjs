import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root=new URL("../",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
test("one M3 FLEX app retains the approved V2 source alongside original and Recovery",()=>{
  assert.ok(existsSync(new URL("src/routes/v2.tsx",root)));
  assert.ok(existsSync(new URL("src/v2/session.ts",root)));
  assert.ok(existsSync(new URL("src/v2/catalog.ts",root)));
  assert.ok(existsSync(new URL("public/recovery-coach/index.html",root)));
  assert.match(read("src/routes/v2.tsx"),/createFileRoute\("\/v2"\)/);
  assert.match(read("src/routes/index.tsx"),/data-testid="open-existing-v2"/);
  assert.match(read("src/routes/index.tsx"),/<Link to="\/v2"/);
});
test("Android staging includes real V2 HTML, not a second application ID",()=>{
  const web=read("scripts/stage-unified-static.mjs");
  const android=read("scripts/stage-android-recovery.mjs");
  const cfg=JSON.parse(read("capacitor.config.json"));
  assert.match(web,/"\/v2"/);
  assert.match(web,/"v2\/index\.html"/);
  assert.match(android,/"v2\/index\.html"/);
  assert.equal(cfg.appId,"com.m3legacy.flexrecovery");
  assert.equal(cfg.webDir,"android-recovery-web");
  assert.doesNotMatch(android,/cap add|newProjectId|createApp/);
});
test("restored V2 retains the previously approved source media without substitution",()=>{
  const media=read("src/v2/approved-coach-media.ts");
  assert.match(media,/coach|motion|media/i);
  const recovery=read("public/recovery-coach/index.html");
  for(const id of ["C01-R3","C02","C03","C04-R2","C08-PRESS-R3","C09-PRE-BREATH-R2","C10-POST-BREATH-R1"])
    assert.ok(recovery.includes(id),id+" was lost");
});
