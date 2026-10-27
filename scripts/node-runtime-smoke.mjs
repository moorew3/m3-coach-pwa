/**
 * Test the actual compiled Node server over HTTP without deploying it.
 * No provider credentials or third-party API calls are required.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const port = 17367;
const origin = "http://127.0.0.1:" + port;
const logs = [];
const child = spawn(process.execPath, [".output/server/index.mjs"], {
  env: {
    ...process.env,
    PORT: String(port),
    HOST: "127.0.0.1",
    OPENAI_API_KEY: "",
    FLEX_PAID_AI_ENABLED: "false",
    FLEX_AI_ALLOWED_USER_IDS: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [child.stdout, child.stderr]) {
  stream.on("data", (chunk) => {
    logs.push(chunk.toString());
    if (logs.length > 120) logs.shift();
  });
}
let exited = false;
child.on("exit", () => { exited = true; });

async function get(path, options = {}) {
  return await fetch(origin + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(2500),
    ...options,
  });
}
async function assertPage(path, markers) {
  const response = await get(path);
  assert.equal(response.status, 200, path + ": status " + response.status);
  const type = response.headers.get("content-type") ?? "";
  assert.match(type, /text\/html/i, path + ": wrong content type " + type);
  const html = await response.text();
  for (const marker of markers) {
    assert.ok(html.includes(marker), path + ": missing " + marker);
  }
  console.log("✓ " + path + ": HTTP 200, " + markers.length + " verified markers");
}
async function checkNoPaidRequests(path, payload) {
  const response = await get(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  assert.equal(response.status, 503, path + ": AI must be disabled by default");
  const body = await response.text();
  assert.match(body, /disabled/i, path + ": unexpected response " + body.slice(0, 150));
  console.log("✓ " + path + ": HTTP 503 (no paid AI call)");
}
try {
  let started = false;
  for (let attempt = 0; attempt < 35; attempt++) {
    if (exited) throw new Error("Server process exited before becoming ready");
    try {
      const r = await get("/recovery-coach/");
      if (r.status > 0) { started = true; break; }
    } catch { /* The server is still starting. */ }
    await delay(400);
  }
  if (!started) throw new Error("Compiled Node server did not accept HTTP requests");
  // Streaming SPA HTML does not guarantee page-specific <title> metadata in
  // the first response; check the real document shell and HTTP route status.
  // Full client hydration, avatar motion and timers still require device QA.
  await assertPage("/", ["<html"]);
  await assertPage("/coach/1", ["<html"]);
  await assertPage("/recovery-coach/", [
    "M3 Flex Recovery Coach",
    "C09-PRE-BREATH-R2",
    "C10-POST-BREATH-R1",
    "C08-PRESS-R3",
  ]);
  await assertPage("/recovery-coach/logbook/", [
    "My actual reps",
    "m3-flex-real-reps-and-metrics-v1",
    "Export private JSON backup",
  ]);
  await assertPage("/recovery-coach/bench-core/", [
    "Bench-supported core workouts",
    "Core A",
    "Core B",
    "Seated Pallof hold",
    "m3-flex-bench-core-progress-v1",
  ]);
  await assertPage("/recovery-coach/device-check/", [
    "M3 FLEX",
    "playMarcus",
    "testMic",
    "testCamera",
    "No report saved.",
  ]);
  await assertPage("/recovery-coach/form-check/", [
    "Live camera",
    "modelAssetPath:MODEL",
    "Enable live form view",
    "No footage is saved",
  ]);
  await assertPage("/recovery-coach/programs/", [
    "Workout A",
    "Workout B",
    "C11-PRE-HANDS-R1",
    "NOT approved",
  ]);
  const health = await get("/api/health");
  assert.equal(health.status, 200, "Node liveness endpoint must work without credentials");
  assert.match(health.headers.get("content-type") ?? "", /application\/json/);
  assert.deepEqual(await health.json(), {
    service: "m3-flex",
    status: "ok",
    check: "process",
  });
  console.log("✓ /api/health: HTTP 200, public process state only");
  await checkNoPaidRequests("/api/public/coach-talk", {
    message: "What is my next set?",
    context: {},
  });
  await checkNoPaidRequests("/api/public/coach-speech", {
    text: "Coach, start",
    tone: "calm",
    format: "mp3",
  });
  console.log("Compiled Node HTTP smoke check passed. No deployment performed.");
} catch (error) {
  console.error("Compiled Node HTTP smoke check FAILED.");
  console.error(error);
  console.error("Server output (truncated):", logs.join("").slice(-5000));
  process.exitCode = 1;
} finally {
  if (!exited) {
    child.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => child.once("exit", resolve)), delay(1800)]);
    if (!exited) child.kill("SIGKILL");
  }
}
