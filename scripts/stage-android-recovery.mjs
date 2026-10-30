#!/usr/bin/env node
/**
 * ONE Android M3 FLEX app: original 22-day React dashboard, old workouts,
 * nutrition, progress, Settings AND same-origin approved Recovery Coach.
 *
 * Source is the verified local-client prerender of the ORIGINAL source tree.
 * We preserve the original Capacitor app ID / webDir and never duplicate the
 * backend, re-create an account, change accepted media, or enable paid AI.
 */
import assert from "node:assert/strict";
import { cp, rm, writeFile, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=join(root,"unified-static-web");
const dest=join(root,"android-recovery-web");
const files=[
 "index.html","program/index.html","nutrition/index.html",
 "progress/index.html","settings/index.html","recovery/index.html",
 "recovery-coach/index.html","recovery-coach/form-check/index.html",
 "recovery-coach/logbook/index.html","recovery-coach/full-backup/index.html",
 "recovery-coach/form-check/vendor/pose_landmarker_lite.task",
];
for(const file of files)assert.ok((await stat(join(source,file))).size>0,"Unified original app missing "+file);
const original=JSON.parse(await readFile(join(root,"approved-recovery-media.json"),"utf8"));
assert.equal(original.items.length,16);
const player=await readFile(join(source,"recovery-coach","index.html"),"utf8");
for(const asset of original.items)assert.ok(player.includes(asset.file),"Original approved media missing "+asset.id);
const index=await readFile(join(source,"index.html"),"utf8");
assert.match(index,/<html\b/);
assert.match(index,/<script/);
await rm(dest,{recursive:true,force:true});
await cp(source,dest,{recursive:true,force:true});
const buildCommit=(process.env.GITHUB_SHA||"").toLowerCase();
await writeFile(join(dest,"build-info.json"),JSON.stringify({
 platform:"android-debug",scope:"original-app-plus-integrated-recovery",
 commit:/^[a-f0-9]{40}$/.test(buildCommit)?buildCommit:null,
 releaseSigned:false,stableUpgradeSignature:false,
 warning:"Unstable debug signature. Export and verify protected local data before replacing any installed copy.",
 note:"Web client bundle is pre-rendered. SSR-only server features and external paid AI APIs are not bundled."
},null,2)+"\n");
console.log("Staged SINGLE M3 FLEX Android client: original React dashboard, nutrition, history, native Recovery, original videos and on-device form checker.");
