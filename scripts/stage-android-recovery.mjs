#!/usr/bin/env node
/**
 * Stages the approved M3 FLEX Recovery Coach as native Capacitor WebView assets.
 * All original video/audio remains streamed from approved provider URLs.
 */
import assert from "node:assert/strict";
import { cp, mkdir, rm, writeFile, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const source=join(root,"public","recovery-coach");
const dest=join(root,"android-recovery-web");
const original=JSON.parse(await readFile(join(root,"approved-recovery-media.json"),"utf8"));
assert.equal(original.items.length,16);
const html=await readFile(join(source,"index.html"),"utf8");
for(const asset of original.items) assert.ok(html.includes(asset.file),"Approved media reference missing: "+asset.id);
assert.ok((await stat(join(source,"form-check","vendor","pose_landmarker_lite.task"))).size>100000,"First-party pose model missing; run stage-pose-runtime first");
await rm(dest,{recursive:true,force:true});
await mkdir(dest,{recursive:true});
await cp(source,join(dest,"recovery-coach"),{recursive:true,force:true});
const main=[
'<!doctype html><html lang="en"><head><meta charset="utf-8">',
'<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
'<meta name="theme-color" content="#0b1521">',
'<meta http-equiv="refresh" content="0;url=./recovery-coach/">',
'<title>M3 FLEX Recovery</title>',
'<style>body{background:#0b1521;color:#edf5f9;margin:0;font:17px system-ui;',
'display:grid;place-content:center;min-height:100vh;text-align:center}',
'a{color:#c5f08c;padding:24px}</style></head><body>',
'<main><h1>M3 FLEX</h1><p>Seated Recovery Coach</p>',
'<a href="./recovery-coach/">Open your workout</a></main></body></html>',
].join("\n");
await writeFile(join(dest,"index.html"),main+"\n");
const buildCommit=(process.env.GITHUB_SHA||"").toLowerCase();
const buildInfo={platform:"android-debug",commit:/^[a-f0-9]{40}$/.test(buildCommit)?buildCommit:null,
  releaseSigned:false,stableUpgradeSignature:false,
  warning:"This temporary debug build may require uninstalling an earlier test APK. Export and verify private records first."};
await writeFile(join(dest,"build-info.json"),JSON.stringify(buildInfo,null,2)+"\n");
assert.ok((await stat(join(dest,"recovery-coach","update-safety","index.html"))).size>1000,"Upgrade-safety page missing");
console.log("Android app assets staged: native WebView opens approved recovery workflow; original 16 media URLs unchanged.");
