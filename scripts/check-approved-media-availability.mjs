#!/usr/bin/env node
/**
 * Advisory release QA: check that the exact owner-approved media URLs still
 * resolve. No paid generation calls, full media downloads or uploads.
 * Results may vary by geography, CDN and temporary outages.
 * This is NOT a backup or Galaxy Fold playback certification.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const items = JSON.parse(readFileSync(new URL("../approved-recovery-media.json", import.meta.url), "utf8")).items;
assert.equal(items.length, 16);
const allowed = new Set(["d2ol7oe51mr4n9.cloudfront.net", "resource2.heygen.ai"]);
const results = [];
let index = 0;

async function checkAsset(item) {
  const url = new URL(item.url);
  if (!allowed.has(url.hostname) || url.protocol !== "https:") throw Error("Source origin changed");
  let response;
  let sourceMethod = "HEAD";
  try {
    response = await fetch(url, {
      method: "HEAD", redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: { "Accept": "*/*" },
    });
    if (!response.ok || response.status === 405) {
      throw Error("HEAD did not establish availability");
    }
  } catch {
    sourceMethod = "RANGE";
    response = await fetch(url, {
      method: "GET", redirect: "follow",
      signal: AbortSignal.timeout(12000),
      headers: { "Range": "bytes=0-0" },
    });
  }
  const landed = new URL(response.url);
  const status = response.status;
  const kind = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  const validKind = kind.startsWith("audio/") || kind.startsWith("video/") || kind === "application/octet-stream";
  const valid = response.ok && allowed.has(landed.hostname) && landed.protocol === "https:" && validKind;
  if (response.body) await response.body.cancel().catch(() => {});
  if (!valid) throw Error("HTTP " + status + " or invalid media Content-Type (" + (kind || "none") + ")");
  return { id: item.id, status: "reachable", request: sourceMethod, http: status, kind };
}
async function worker() {
  while (index < items.length) {
    const item = items[index++];
    try {
      const result = await checkAsset(item);
      results.push(result);
      console.log("✓", item.id, result.request + " HTTP " + result.http, result.kind);
    } catch (error) {
      results.push({id:item.id,status:"unreachable_or_unverified"});
      console.warn("!", item.id, String(error?.message ?? error).slice(0,135));
    }
  }
}
await Promise.all(Array.from({length:4},()=>worker()));
const reachable=results.filter(x=>x.status==="reachable").length;
console.log("Read-only CDN reachability checked: "+reachable+"/16 responded as media. Nothing downloaded or replaced.");
if (reachable !== items.length) {
  console.warn("Media connectivity is NOT release-certified; verify sources and re-export originals to owner-controlled private storage.");
  process.exitCode=1;
}
