#!/usr/bin/env node
/**
 * Build-time only. Vendor the already-installed official MediaPipe library +
 * lite pose model into same-origin public static files. No user data, paid API
 * or owner-original training video involved. Models are loaded on the handset
 * only after the athlete explicitly approves and starts the camera.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, readFileSync, readdirSync } from "node:fs";
import { copyFile, mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "node_modules", "@mediapipe", "tasks-vision");
const TARGET = join(ROOT, "public", "recovery-coach", "form-check", "vendor");
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const MODEL = join(TARGET, "pose_landmarker_lite.task");
const LIMIT = 20 * 1024 * 1024;
if (!existsSync(join(SOURCE, "vision_bundle.mjs"))) throw Error("MediaPipe library is not installed. Run npm install before building.");
const installed = JSON.parse(readFileSync(join(SOURCE, "package.json"), "utf8"));
assert.match(installed.version, /^1\./, "Only audited MediaPipe 1.x builds are supported");
await mkdir(join(TARGET, "wasm"), { recursive: true });
const files = ["vision_bundle.mjs"];
await copyFile(join(SOURCE, "vision_bundle.mjs"), join(TARGET, "vision_bundle.mjs"));
const wasm = readdirSync(join(SOURCE, "wasm")).filter(name =>
  /^vision_wasm_[a-z_]+\.(js|wasm)$/.test(name));
assert.ok(wasm.includes("vision_wasm_internal.js") && wasm.includes("vision_wasm_internal.wasm"), "MediaPipe optimized WASM loader files missing");
assert.ok(wasm.some(name => name.includes("nosimd")), "MediaPipe no-SIMD fallback files missing");
for (const name of wasm) {
  await copyFile(join(SOURCE, "wasm", name), join(TARGET, "wasm", name));
  files.push("wasm/" + name);
}
if (!existsSync(MODEL)) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  const temp = MODEL + ".partial";
  try {
    const response = await fetch(MODEL_URL, { signal: controller.signal });
    if (!response.ok || !response.body || new URL(response.url).hostname !== "storage.googleapis.com")
      throw Error("Official model source not available: " + response.status);
    const expected = Number(response.headers.get("content-length") || 0);
    if (expected > LIMIT) throw Error("Official MediaPipe lite model exceeds size budget");
    let bytes = 0;
    const sizeCheck = new Transform({
      transform(chunk, encoding, callback) {
        bytes += chunk.length;
        callback(bytes > LIMIT ? new Error("Model exceeds byte limit") : null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(response.body), sizeCheck,
      createWriteStream(temp, { flags: "wx", mode: 0o644 }));
    if (bytes < 100_000) throw Error("Model was unexpectedly small");
    await rename(temp, MODEL);
  } catch (error) {
    await rm(temp, { force: true });
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
assert.ok(readFileSync(MODEL).length > 100_000, "Pose model is truncated");
files.push("pose_landmarker_lite.task");
const hashes = {};
for (const name of files) {
  const bytes = readFileSync(join(TARGET, name));
  hashes[name] = { bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") };
}
const manifest = {
  schema: 1, package: "@mediapipe/tasks-vision", version: installed.version,
  runtime_license: "Apache-2.0",
  model_source: MODEL_URL,
  model_purpose: "On-device, local 33-landmark pose detection; no images uploaded",
  files: hashes,
};
await writeFile(join(TARGET, "sha256-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
const notice = [
  "M3 FLEX third-party pose assets",
  "MediaPipe Tasks Vision " + installed.version + ": Apache-2.0, https://github.com/google-ai-edge/mediapipe",
  "Lite pose model source: " + MODEL_URL,
  "See official BlazePose GHUM model card and its distribution terms.",
  "Model and WASM are hosted with the M3 FLEX app. Inference is local.",
  "Google MediaPipe may collect performance/usage metrics; camera consent is required.",
].join("\n");
await writeFile(join(TARGET, "THIRD_PARTY_NOTICE.txt"), notice + "\n");
console.log("Staged same-origin MediaPipe runtime, " + files.length + " verified files, model " + hashes["pose_landmarker_lite.task"].bytes + " bytes.");
