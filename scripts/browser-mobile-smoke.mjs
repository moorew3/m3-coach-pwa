/**
 * Real Chromium mobile-width smoke test of the BUILT Node application.
 * Uses CI-only playwright-core plus Chrome; neither is a production dependency.
 * No provider secrets, paid AI, camera data, or live user accounts are used.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";

const port = 17369;
const base = "http://127.0.0.1:" + port;
const logs = [];
const server = spawn(process.execPath, [".output/server/index.mjs"], {
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: String(port),
    OPENAI_API_KEY: "",
    FLEX_PAID_AI_ENABLED: "false",
    FLEX_AI_ALLOWED_USER_IDS: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
for (const s of [server.stdout, server.stderr]) {
  s.on("data", (chunk) => {
    logs.push(chunk.toString());
    if (logs.length > 80) logs.shift();
  });
}
let exited = false;
server.on("exit", () => { exited = true; });
let browser;
let page;
const requests = [];
const errors = [];
const step = (message) => console.log("✓ " + message);
try {
  let ready = false;
  for (let i = 0; i < 35; i++) {
    if (exited) throw new Error("Node server terminated");
    try {
      const res = await fetch(base + "/api/health", { signal: AbortSignal.timeout(1000) });
      if (res.ok) { ready = true; break; }
    } catch { /* server starting */ }
    await delay(350);
  }
  assert.ok(ready, "Compiled Node server must accept HTTP");

  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.M3_CHROME_PATH || undefined,
    channel: process.env.M3_CHROME_PATH ? undefined : "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("request", (req) => requests.push(req.url()));
  page.on("pageerror", (err) => errors.push(String(err)));

  const first = await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  assert.equal(first?.status(), 200, "Main app must serve successfully");
  await page.getByTestId("app-entry-tap").waitFor({ timeout: 15000 });
  await page.getByTestId("app-entry-tap").click();
  await page.getByTestId("app-entry-yes").click({ timeout: 12000 });
  await page.getByTestId("app-entry-gate").waitFor({ state: "detached", timeout: 10000 });
  step("Fresh-session entrance accepted on a 390px phone viewport");

  // Directly open the session to test its own entrance independent of
  // home-page onboarding defaults. Both entry screens are genuine React UI.
  const res = await page.goto(base + "/coach/1", { waitUntil: "domcontentloaded" });
  assert.equal(res?.status(), 200, "Coach route must serve successfully");
  await page.getByTestId("coach-stage").waitFor({ timeout: 15000 });
  await page.getByTestId("coach-wake").waitFor();
  await page.getByTestId("coach-wake-yes").click({ timeout: 12000 });
  step("Coach entrance accepted with the no-charge voice configuration");

  // Fresh workouts demand readiness confirmation. Never bypass the injury
  // disclosure, consent state, or real on-screen control.
  const save = page.getByRole("button", { name: "Save & continue" });
  await save.waitFor({ timeout: 12000 });
  await save.click();
  await page.getByTestId("coach-wake").waitFor({ state: "detached", timeout: 12000 });
  await page.getByTestId("coach-read-along-badge").waitFor();
  step("Readiness check completed and coach displays honest read-along status");

  const stage = page.getByTestId("coach-stage");
  await page.getByTestId("rail-pause").waitFor();
  await page.getByTestId("rail-pause").click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-running") === "false",
  );
  const pausedAt = await stage.getAttribute("data-left");
  assert.notEqual(pausedAt, "null", "Intro read-along must have an actual countdown");
  await page.waitForTimeout(1300);
  assert.equal(await stage.getAttribute("data-left"), pausedAt, "Pausing must freeze countdown");
  await page.getByTestId("rail-pause").click();
  await page.waitForFunction(
    () => document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-running") === "true",
  );
  await page.waitForFunction(
    (prior) => Number(document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-left")) < Number(prior),
    pausedAt,
    { timeout: 4500 },
  );
  step("Pause freezes the real second counter; Resume advances it again");

  await page.getByTestId("rail-more").click();
  await page.getByTestId("coach-question-input").fill("How many sets are left?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await page.getByTestId("coach-local-answer").waitFor({ timeout: 10000 });
  const localAnswer = await page.getByTestId("coach-local-answer").innerText();
  assert.ok(localAnswer.length > 25, "Coach's answer should be readable");
  step("Local coach question produces readable answer without generation");

  assert.ok(
    !requests.some((url) => url.includes("/api/public/coach-speech") || url.includes("/api/public/coach-talk")),
    "Read-along must never contact paid AI endpoints",
  );
  assert.deepEqual(errors, [], "The React page must have no uncaught script errors");
  step("No paid AI requests or uncaught browser page errors");

  // Live superset navigation in a fresh local-data browser context.
  // Configure the prescribed Monday paired mode through the REAL homepage
  // toggle; skip through the actual engine instead of assuming source order.
  const pairingContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const pairingPage = await pairingContext.newPage();
  pairingPage.setDefaultTimeout(12000);
  try {
    await pairingPage.goto(base + "/", { waitUntil: "domcontentloaded" });
    await pairingPage.getByTestId("app-entry-tap").click();
    await pairingPage.getByTestId("app-entry-yes").click();
    const toggle = pairingPage.getByRole("button", { name: /Use supersets today/i });
    await toggle.waitFor();
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-pressed"), "true", "Superset mode must be on");

    await pairingPage.goto(base + "/coach/1", { waitUntil: "domcontentloaded" });
    await pairingPage.getByTestId("coach-wake-yes").click();
    await pairingPage.getByRole("button", { name: "Save & continue" }).click();
    await pairingPage.getByTestId("coach-wake").waitFor({ state: "detached", timeout: 12000 });
    const pairStage = pairingPage.getByTestId("coach-stage");
    const pairStep = () => pairStage.getAttribute("data-step-id");
    const skip = async () => {
      const prior = await pairStep();
      await pairingPage.getByTestId("rail-skip").click();
      await pairingPage.waitForFunction(
        (previous) => document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-step-id") !== previous,
        prior,
        { timeout: 9000 },
      );
    };
    let found = false;
    for (let i = 0; i < 150; i++) {
      const current = await pairStep();
      if (current === "mon-db-curl-work-0") { found = true; break; }
      if (current === "complete") break;
      await skip();
    }
    assert.ok(found, "Monday B1 paired dumbbell curl must exist in live coached script");
    await skip();
    assert.equal(await pairStage.getAttribute("data-step-kind"), "brief", "B2 partner handoff is not rest");
    assert.equal(await pairStep(), "mon-triceps-pressdown-brief", "B2 follows B1 immediately");
    await skip();
    assert.equal(await pairStep(), "mon-triceps-pressdown-work-0", "Partner B2 starts after brief");
    await skip();
    assert.equal(await pairStage.getAttribute("data-step-kind"), "rest", "Rest only AFTER partner B2");
    const pairRest = await pairStep();
    assert.equal(pairRest, "mon-triceps-pressdown-rest-0");
    await pairingPage.waitForFunction(
      () => Number(document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-left")) >= 65,
      null,
      { timeout: 6000 },
    );
    const restLeft = Number(await pairStage.getAttribute("data-left"));
    assert.ok(restLeft <= 75 && restLeft >= 65, "Prescribed paired rest must remain 75 seconds");
    await pairingPage.getByTestId("rail-pause").click();
    await pairingPage.waitForFunction(
      () => document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-running") === "false",
    );
    const frozenRest = await pairStage.getAttribute("data-left");
    await pairingPage.waitForTimeout(1200);
    assert.equal(await pairStage.getAttribute("data-left"), frozenRest, "Paused superset rest must not tick");
    await pairingPage.getByTestId("rail-pause").click();
    await pairingPage.waitForFunction(
      (prior) => Number(document.querySelector('[data-testid="coach-stage"]')?.getAttribute("data-left")) < Number(prior),
      frozenRest,
      { timeout: 4000 },
    );
    await skip();
    assert.equal(await pairStep(), "mon-db-curl-work-1", "After paired rest, next round starts at B1");
    step("Live Monday B1→B2→75s rest→B1 superset, including paused/restored clock");
  } finally {
    await pairingContext.close();
  }

  // Simulate a failure from the approved external MP4 host in another clean
  // browser context. The app must remain usable and never display a random
  // replacement clip as though it were the actual coach.
  const mediaContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  await mediaContext.addInitScript(() => {
    window.sessionStorage.setItem("coach-intro-seen-v1", "1");
  });
  const mediaPage = await mediaContext.newPage();
  await mediaPage.route(/\.mp4(?:\?|$)/i, (route) => route.abort("failed"));
  try {
    const mediaResponse = await mediaPage.goto(base + "/coach/1", { waitUntil: "domcontentloaded" });
    assert.equal(mediaResponse?.status(), 200);
    await mediaPage.getByTestId("coach-wake").waitFor({ timeout: 15000 });
    // The retry must remain clickable ABOVE the full-screen wake button,
    // without forcing the athlete to exit the coach entrance first.
    const wakeStage = mediaPage.getByTestId("coach-wake");
    const failedVideo = wakeStage.getByTestId("coach-video-fallback").first();
    await failedVideo.waitFor({ timeout: 12000 });
    const sourceBefore = await wakeStage.getByTestId("coach-motion").first().getAttribute("data-url");
    assert.ok(sourceBefore?.endsWith(".mp4"), "Must originate from real approved MP4 path");
    await failedVideo.getByTestId("retry-coach-video").click();
    await failedVideo.waitFor({ timeout: 12000 });
    const sourceAfter = await wakeStage.getByTestId("coach-motion").first().getAttribute("data-url");
    assert.equal(sourceAfter, sourceBefore, "Video retry must never substitute another clip");
    step("Blocked video shows approved still and retries identical approved source");
  } catch (mediaError) {
    await mkdir("artifacts", { recursive: true });
    await mediaPage.screenshot({
      path: "artifacts/m3-flex-video-failure.png", fullPage: true, timeout: 4000,
    }).catch(() => {});
    throw mediaError;
  } finally {
    await mediaContext.close();
  }

  // These checks are intentionally NOT certification of Android hardware,
  // microphone/camera output, physical speaker sound, or remote media CDN.
  console.log("Chromium mobile-width interaction smoke check passed. No deployment performed.");
} catch (err) {
  console.error("Browser interaction smoke check FAILED.", err);
  console.error("Recent server log:", logs.join("").slice(-3000));
  console.error("Browser errors:", errors.slice(0, 8));
  try {
    if (page) {
      await mkdir("artifacts", { recursive: true });
      await page.screenshot({ path: "artifacts/m3-flex-browser-failure.png", fullPage: true, timeout: 4000 });
      console.error("Saved failure screenshot as CI artifact.");
    }
  } catch (screenshotError) {
    console.error("Screenshot unavailable:", String(screenshotError).slice(0, 200));
  }
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (!exited) {
    server.kill("SIGTERM");
    await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(1500)]);
    if (!exited) server.kill("SIGKILL");
  }
}
