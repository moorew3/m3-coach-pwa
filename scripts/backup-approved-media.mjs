#!/usr/bin/env node
/**
 * M3 FLEX: inventory-only by default. No paid APIs, upload endpoints,
 * rewrites of approved media, or background jobs.
 *
 * node scripts/backup-approved-media.mjs --check
 * node scripts/backup-approved-media.mjs --download [output-directory]
 *
 * Export must run on an owner-controlled machine with working HTTPS internet.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createWriteStream, readFileSync } from "node:fs";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const inventory = JSON.parse(readFileSync(join(root, "approved-recovery-media.json"), "utf8"));
const player = readFileSync(join(root, "public/recovery-coach/index.html"), "utf8");
const allowed = new Set(["d2ol7oe51mr4n9.cloudfront.net", "resource2.heygen.ai"]);
const MAX_BYTES_PER_ASSET = 200 * 1024 * 1024;
const MAX_TOTAL_BYTES = 900 * 1024 * 1024;

function validate() {
  assert.equal(inventory.schema, 1);
  assert.equal(inventory.items.length, 16, "7 original videos plus 9 voice tracks");
  assert.equal(inventory.items.filter(x => x.type === "video").length, 7);
  assert.equal(inventory.items.filter(x => x.type === "audio").length, 9);
  const ids = new Set();
  const files = new Set();
  for (const x of inventory.items) {
    assert.match(x.id, /^[A-Z0-9-]+$/);
    assert.ok(!ids.has(x.id), "Duplicate ID " + x.id);
    ids.add(x.id);
    assert.ok(x.type === "video" || x.type === "audio");
    assert.equal(x.approvedSource, true);
    assert.match(x.file, /^[A-Za-z0-9=-]+\.(mp4|mp3|wav)$/);
    assert.ok(!files.has(x.file), "Duplicate asset " + x.file);
    files.add(x.file);
    assert.equal(new URL(x.url).protocol, "https:");
    assert.ok(allowed.has(new URL(x.url).hostname));
    assert.ok(x.url.endsWith(x.file));
    assert.ok(player.includes(x.file), "Current Recovery Coach no longer references " + x.id);
  }
  console.log("Validated exact inventory of 7 approved videos + 9 Marcus recordings.");
}
validate();

if (!process.argv.includes("--download")) {
  if (process.argv.slice(2).some(a => a !== "--check")) {
    console.error("Usage: node scripts/backup-approved-media.mjs [--check | --download [destination]]");
    process.exitCode = 2;
  }
} else {
  const args = process.argv.slice(2);
  if (args[0] !== "--download" || args.length > 2) {
    throw new Error("Usage: --download [destination]");
  }
  const destination = resolve(args[1] ?? join(root, "approved-media-backup"));
  await mkdir(destination, { recursive: true });
  let used = 0;
  const report = { schema: 1, createdAt: new Date().toISOString(), origin: "M3 FLEX approved media inventory", entries: [] };
  for (const media of inventory.items) {
    const fileName = media.id + "_" + media.file.replace(/[^a-zA-Z0-9.-]/g, "_");
    const target = join(destination, fileName);
    const temp = target + ".incomplete";
    try {
      const response = await fetch(media.url, { redirect: "follow", signal: AbortSignal.timeout(120000) });
      const final = new URL(response.url);
      if (final.protocol !== "https:" || !allowed.has(final.hostname)) throw new Error("Unexpected redirect origin");
      if (!response.ok || !response.body) throw new Error("Source returned HTTP " + response.status);
      const announced = Number(response.headers.get("content-length") ?? 0);
      if (announced > MAX_BYTES_PER_ASSET || used + announced > MAX_TOTAL_BYTES) throw new Error("Source exceeds size cap");
      const hash = createHash("sha256");
      let size = 0;
      const check = new Transform({
        transform(chunk, enc, callback) {
          size += chunk.length;
          if (size > MAX_BYTES_PER_ASSET || used + size > MAX_TOTAL_BYTES) {
            return callback(new Error("Downloaded asset exceeds size cap"));
          }
          hash.update(chunk);
          callback(null, chunk);
        },
      });
      await pipeline(Readable.fromWeb(response.body), check, createWriteStream(temp, { flags: "wx", mode: 0o600 }));
      if (size < 128) throw new Error("Implausibly short media file");
      // Basic media signature check catches HTML error pages masquerading as assets.
      const prefix = readFileSync(temp).subarray(0, 24);
      const formatOk = media.type === "video"
        ? prefix.subarray(4, 8).toString() === "ftyp"
        : prefix.subarray(0, 4).toString() === "RIFF" ||
          prefix.subarray(0, 3).toString() === "ID3" ||
          prefix[0] === 0xff;
      if (!formatOk) throw new Error("Downloaded body has an unexpected media signature");
      await rename(temp, target);
      used += size;
      report.entries.push({ id: media.id, file: fileName, bytes: size, sha256: hash.digest("hex"), status: "backed_up" });
      console.log("Backed up " + media.id + ": " + size + " bytes");
    } catch (error) {
      await rm(temp, { force: true }).catch(() => {});
      report.entries.push({ id: media.id, status: "FAILED", message: String(error?.message ?? error).slice(0, 180) });
      console.error("Failed " + media.id + ": " + String(error?.message ?? error).slice(0, 180));
      process.exitCode = 1;
    }
  }
  const reportPath = join(destination, "sha256-backup-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
  console.log("Saved local SHA-256 receipt:", reportPath);
  if (report.entries.some(x => x.status === "FAILED")) console.error("PARTIAL backup only; do NOT replace production media URLs.");
}
