import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root = new URL("../", import.meta.url);
const data=JSON.parse(readFileSync(new URL("approved-recovery-media.json",root),"utf8"));
const player=readFileSync(new URL("public/recovery-coach/index.html",root),"utf8");
const script=readFileSync(new URL("scripts/backup-approved-media.mjs",root),"utf8");
const reachability=readFileSync(new URL("scripts/check-approved-media-availability.mjs",root),"utf8");

test("portable backup inventory is exactly original approved seven clips plus nine voice tracks",()=>{
 assert.equal(data.schema,1);
 assert.equal(data.items.length,16);
 assert.equal(data.items.filter(x=>x.type==="video").length,7);
 assert.equal(data.items.filter(x=>x.type==="audio").length,9);
 const expected=[
 "f92c84ea-a2bc-4623-966b-deb8ceff8a87.mp4",
 "9a48369a-ec51-4abc-9f50-f8966f19dc1e.mp4",
 "01a14462-bc16-778b-a773-db16e57aade7.mp4",
 "01a14462-cf4a-7daa-be5c-437eab0c9ba2.mp4",
 "31bc3ad4-fc95-409b-81f1-3490f1f8eb35.mp4",
 "b1171f4e-6526-45a7-a413-fd0ad4ffb1de.mp4",
 "d65e6c81-dae1-484f-9bb9-48f7e18d8dbc.mp4"
 ];
 for(const name of expected)assert.ok(data.items.some(x=>x.file===name),"Approved video missing: "+name);
 for(const it of data.items){
   assert.ok(player.includes(it.file),"Original file no longer active: "+it.file);
   assert.equal(new URL(it.url).protocol,"https:");
   assert.match(new URL(it.url).hostname,/^(d2ol7oe51mr4n9\.cloudfront\.net|resource2\.heygen\.ai)$/);
 }
});
test("backup tool never uploads or rewrites production videos",()=>{
 assert.match(script,/process\.argv\.includes\("--download"\)/);
 assert.match(script,/const allowed = new Set/);
 assert.match(script,/AbortSignal\.timeout\(120000\)/);
 assert.match(script,/const hash = createHash\("sha256"\)/);
 assert.match(script,/sha256-backup-report\.json/);
 assert.match(script,/Existing approved backup protected from overwrite/);
 assert.match(script,/source exceeds size cap|Source exceeds size cap/);
 assert.doesNotMatch(script,/https:\/\/api\.openai\.com|https:\/\/api\.heygen\.com|\/deploy\/production|fetch\(.+method:\s*["']POST/);
});

test("media reachability QA uses only read-only HEAD/range probes and never changes original sources",()=>{
 assert.match(reachability,/method: "HEAD"/);
 assert.match(reachability,/method: "GET"/);
 assert.match(reachability,/Range": "bytes=0-0"/);
 assert.match(reachability,/AbortSignal\.timeout\(12000\)/);
 assert.match(reachability,/await response\.body\.cancel\(\)/);
 assert.match(reachability,/const allowed = new Set/);
 assert.match(reachability,/This is NOT a backup/);
 assert.doesNotMatch(reachability,/createWriteStream|\bwriteFile\s*\(|\bunlink\s*\(|method:\s*"POST"/);
});
