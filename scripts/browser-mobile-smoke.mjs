/**
 * Real Chromium mobile-width smoke test of the BUILT Node application.
 * Uses CI-only playwright-core plus Chrome; neither is a production dependency.
 * No provider secrets, paid AI, camera data, or live user accounts are used.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
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
const acknowledgeLegacyDirectRoute = async (browserPage) => {
  const gate = browserPage.getByTestId("legacy-route-gate");
  await gate.waitFor();
  const button = browserPage.getByTestId("legacy-route-continue");
  assert.equal(await button.isDisabled(), true, "Direct legacy route must default to blocked");
  await browserPage.getByTestId("legacy-route-ack").check();
  await button.click();
  await gate.waitFor({ state: "detached" });
};
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
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
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
  await page.getByTestId("seated-program-warning").waitFor();
  await page.getByTestId("legacy-workout-start").click();
  await page.getByTestId("legacy-safety-gate").waitFor();
  assert.equal(await page.getByTestId("legacy-acknowledge").isDisabled(), true);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByTestId("legacy-safety-gate").waitFor({ state: "detached" });
  assert.ok(
    (await page.getByTestId("seated-program-warning").innerText()).includes("not been fully converted"),
    "Legacy weekly plan must not appear cleared for seated-only training",
  );
  await page.getByTestId("m3-unified-workout-picker").waitFor();
  for (const name of [
    "Recovery · 5 approved moves",
    "Workout A · Dumbbells & boxing scenes",
    "Workout B · INNSTAR & arms",
  ]) {
    const link = page.getByTestId("m3-unified-workout-picker").getByRole("link", {name});
    assert.equal(await link.count(), 1, "One M3 FLEX native workout choice: " + name);
    assert.match(await link.getAttribute("href") ?? "", /^\/recovery\?program=/);
  }
  await page.getByRole("navigation", {name: "Main"}).getByRole("link", {name: "Recovery"}).click();
  await page.getByTestId("m3-native-recovery").waitFor();
  await page.getByTestId("m3-recovery-existing-player").waitFor();
  assert.equal(await page.getByTestId("m3-recovery-existing-player").getAttribute("src"),
    "/recovery-coach/?program=recovery");
  const embedded = page.frameLocator('[data-testid="m3-recovery-existing-player"]');
  await embedded.locator("#workoutChoices").waitFor();
  await embedded.locator('[data-stage="1"]').click();
  for (const box of await embedded.locator("#clearance .check").all()) await box.check();
  await embedded.locator("#workDuration").selectOption("20");
  // Do not start media; explicitly verify shared same-origin progress
  // without a fake rep log or separate M3 FLEX account.
  await embedded.locator("#setRounds").selectOption("2");
  await page.getByRole("navigation", {name: "Main"}).getByRole("link", {name: "Today"}).click();
  await page.getByTestId("m3-unified-workout-picker").waitFor();
  step("Existing M3 FLEX now includes a native Recovery tab, same-origin approved player and unchanged original Home");

  // All old and new approved/review scenes must be accessible from ONE
  // app with direct Recovery/A/B choices, not separate competing projects.
  const choiceContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  const choicePage = await choiceContext.newPage();
  choicePage.setDefaultTimeout(12000);
  try {
    const aResponse = await choicePage.goto(base + "/recovery-coach/?program=A", {waitUntil:"domcontentloaded"});
    assert.equal(aResponse?.status(),200);
    await choicePage.locator("#workoutChoices").waitFor();
    assert.equal(await choicePage.locator('[data-workout="A"]').getAttribute("aria-pressed"),"true");
    assert.equal(await choicePage.locator("#pairMode").isDisabled(),true);
    await choicePage.locator('[data-stage="1"]').click();
    assert.equal(await choicePage.locator("#steps .item").count(),2,"Workout A uses verified original approved exercises");
    assert.match((await choicePage.locator("#progressText").textContent())??"",/0 of 7 steps completed/);
    await choicePage.locator('[data-workout="B"]').click();
    assert.equal(await choicePage.locator('[data-workout="B"]').getAttribute("aria-pressed"),"true");
    await choicePage.locator('[data-stage="1"]').click();
    assert.equal(await choicePage.locator("#steps .item").count(),3,"Workout B uses approved INNSTAR/front/alternating");
    await choicePage.locator('[data-workout="recovery"]').click();
    await choicePage.locator('[data-stage="1"]').click();
    assert.equal(await choicePage.locator("#steps .item").count(),5,"Original Recovery five scenes preserved");
    assert.match((await choicePage.locator("#progressText").textContent())??"",/0 of 10 steps completed/);
    assert.ok(Number((await choicePage.locator("#sceneCount").textContent())?.split(" total ")[0]?.match(/\d+/)?.[0])>=75);
    await choicePage.locator("#sceneFilter").selectOption("archive");
    assert.equal(await choicePage.locator("#sceneGrid .item").count(),3);
    assert.equal(await choicePage.locator("#sceneGrid a").count(),3,"Original Flow/Drive approved links remain available");
    await choicePage.locator("#sceneFilter").selectOption("A");
    assert.ok((await choicePage.locator("#sceneGrid .item").count())>=5);
    await choicePage.locator("#sceneGrid button").first().click();
    assert.equal(await choicePage.locator("#sceneReviewVideo").isVisible(),true);
    assert.match((await choicePage.locator("#sceneReviewStatus").textContent())??"",/original scene is visible/i);
    // Once the OWNER explicitly reviews an existing matched visual+voice,
    // the SAME workout player can incorporate it without creating another app.
    await choicePage.locator("#sceneGrid .item").filter({hasText:"C17 · Seated wrist curls"})
      .getByRole("button",{name:"Watch"}).click();
    await choicePage.locator("#sceneApprovalControls").waitFor({state:"visible"});
    await choicePage.locator("#sceneOwnerCheck").check();
    await choicePage.locator("#approveScene").click();
    await choicePage.locator('[data-workout="A"]').click();
    await choicePage.locator('[data-stage="1"]').click();
    assert.equal(await choicePage.locator("#steps .item").count(),3,
      "Owner-review C17 becomes a third MOVING scene only after explicit owner verification");
    assert.match((await choicePage.locator("#steps").textContent())??"",/Seated wrist curls/);
    assert.equal(await choicePage.locator("#runState").textContent(),"Ready");
    assert.equal(await choicePage.locator("#startPause").isDisabled(),false);
    assert.match((await choicePage.locator("#progressText").textContent())??"",/0 of 8 steps completed/);
    // No medical clearance carries across reviewed footage activation.
    assert.equal(await choicePage.locator("#clearance .check:checked").count(),0);
    step("ONE M3 FLEX player selects Recovery/A/B, inventories previous 79 scenes and adds owner-verified C17 without extra app");
  } finally {
    await choiceContext.close();
  }

  // Directly open the session to test its own entrance independent of
  // home-page onboarding defaults. Both entry screens are genuine React UI.
  const res = await page.goto(base + "/coach/1", { waitUntil: "domcontentloaded" });
  assert.equal(res?.status(), 200, "Coach route must serve successfully");
  await acknowledgeLegacyDirectRoute(page);
  await page.getByTestId("coach-stage").waitFor({ timeout: 15000 });
  await page.getByTestId("coach-wake").waitFor();
  await page.getByTestId("coach-wake-yes").click({ timeout: 12000 });
  step("Coach entrance accepted with the no-charge voice configuration");

  // Fresh workouts demand readiness confirmation. Never bypass the injury
  // disclosure, consent state, or real on-screen control.
  const save = page.getByRole("button", { name: "Save & continue" });
  await save.waitFor({ timeout: 12000 });
  await page.getByTestId("coach-seated-review-warning").waitFor();
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
    await acknowledgeLegacyDirectRoute(pairingPage);
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

  // The first visible workout must feel like one guided Marcus experience,
  // without fabricating audio content or bypassing clinician clearance.
  const marcusContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await marcusContext.addInitScript(() => {
    window.__marcusWakeRequests = 0;
    Object.defineProperty(navigator, "wakeLock", {
      configurable: true, value: { request: async () => {
        window.__marcusWakeRequests++;
        return { released: false, addEventListener() {}, release: async function () {this.released = true;} };
      } },
    });
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  const marcusPage = await marcusContext.newPage();
  marcusPage.setDefaultTimeout(12000);
  try {
    await marcusPage.goto(base + "/recovery-coach/", { waitUntil: "domcontentloaded" });
    assert.equal(await marcusPage.locator("#marcusBegin").isVisible(), true);
    assert.match(await marcusPage.locator("#marcusTestAudio").getAttribute("src") ?? "",
      /9226f649-9808-4275-b269-bcc93d3b0342\.mp3/);
    await marcusPage.locator('[data-stage="1"]').click();
    assert.equal(await marcusPage.locator("#moveTitle").innerText(), "Seated dumbbell shrugs");
    await marcusPage.locator("#marcusBegin").click();
    assert.equal(await marcusPage.locator("#moveTitle").innerText(), "Calm seated breathing");
    assert.match((await marcusPage.locator("#note").textContent()) ?? "", /clinician-clearance/i);
    assert.equal((await marcusPage.locator("#runState").textContent())?.trim(), "Ready");
    await marcusPage.locator("#marcusAudioCheck").click();
    assert.match((await marcusPage.locator("#note").textContent()) ?? "", /original approved Marcus recording/i);
    await marcusPage.locator("#marcusFocus").click();
    assert.equal(await marcusPage.locator("body").evaluate(el => el.classList.contains("coachFocus")), true);
    await marcusPage.locator("#marcusFocus").click();
    assert.equal(await marcusPage.locator("body").evaluate(el => el.classList.contains("coachFocus")), false);
    for (const box of await marcusPage.locator("#clearance .check").all()) await box.check();
    await marcusPage.locator("#marcusBegin").click();
    assert.equal((await marcusPage.locator("#runState").textContent())?.trim(), "Workout in progress");
    assert.match((await marcusPage.locator("#marcusNext").textContent()) ?? "", /Easy hand openings/);
    assert.match((await marcusPage.locator("#marcusVoiceStatus").textContent()) ?? "", /original Marcus track/);
    assert.equal(await marcusPage.locator("#marcusAudioCheck").isDisabled(), true,
      "Audio test must not interrupt the guided workout");
    await marcusPage.waitForFunction(() => window.__marcusWakeRequests >= 1);
    await marcusPage.locator("#marcusBegin").click();
    assert.equal((await marcusPage.locator("#runState").textContent())?.trim(), "Paused");
    assert.match((await marcusPage.locator("#marcusOnScreen").textContent()) ?? "", /PAUSED/);
    step("Marcus one-tap full guided session: original voice, preview audio, focus screen, wake request and safety gate");
  } finally {
    await marcusContext.close();
  }

  // Test the actual approved Recovery Coach in full-width TV mirror mode.
  // Native full-screen can be blocked or unavailable; the stage must still
  // fill a 16:9 display without distortion or clipping the controls.
  const tvContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await tvContext.addInitScript(() => {
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
    Element.prototype.requestFullscreen = () => Promise.reject(new Error("Fullscreen unsupported on simulated screen"));
  });
  const tvPage = await tvContext.newPage();
  tvPage.setDefaultTimeout(14000);
  try {
    const response = await tvPage.goto(base + "/recovery-coach/", { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200);
    await tvPage.locator('[data-stage="1"]').click();
    const approvedSource = await tvPage.locator("#coachVideo").getAttribute("src");
    assert.match(approvedSource ?? "", /9a48369a-ec51-4abc-9f50-f8966f19dc1e\.mp4/);
    await tvPage.locator("#tvEnable").click();
    assert.equal(await tvPage.evaluate(() => document.body.classList.contains("tvMode")), true);
    for (const [width, height] of [[1280,720],[1920,1080],[3840,2160],[900,500]]) {
      await tvPage.setViewportSize({ width, height });
      const details = await tvPage.evaluate(() => {
        const rect = id => {
          const x = document.querySelector(id).getBoundingClientRect();
          return {left:x.left,right:x.right,top:x.top,bottom:x.bottom,width:x.width,height:x.height};
        };
        return {
          width:innerWidth,height:innerHeight,
          rootWidth:document.documentElement.scrollWidth,
          stage:rect(".player"),videoBox:rect("#videoBox"),video:rect("#coachVideo"),
          timer:rect(".player > .timer"),marcus:rect("#marcusStage"),
          cue:rect("#cue"),toolbar:rect("#tvToolbar"),stop:rect("#tvStop"),
          fit:getComputedStyle(document.querySelector("#coachVideo")).objectFit,
        };
      });
      assert.ok(details.rootWidth <= width + 2, "TV layout has horizontal overflow: " + JSON.stringify(details));
      assert.ok(details.stage.width >= width - 2, "TV stage should use full television width");
      assert.ok(details.stage.bottom <= height + 2, "TV stage should not run off bottom");
      for (const key of ["videoBox","video","timer","marcus","cue","stop"]) {
        const el=details[key];
        assert.ok(el.width > 24 && el.height > 15, key + " must remain visible");
        assert.ok(el.left >= -2 && el.right <= width + 2 && el.top >= -2 && el.bottom <= height + 2,
          "TV element clipped off screen: " + key + " " + JSON.stringify(details));
      }
      assert.equal(details.fit,"contain", "Approved portrait video must default to full-body uncropped view");
    }
    await tvPage.setViewportSize({width:1920,height:1080});
    await tvPage.locator("#tvFit").click();
    assert.equal(await tvPage.evaluate(() => getComputedStyle(document.querySelector("#coachVideo")).objectFit),"cover");
    assert.equal(await tvPage.locator("#tvFit").getAttribute("aria-pressed"),"true");
    await tvPage.locator("#tvFit").click();
    assert.equal(await tvPage.evaluate(() => getComputedStyle(document.querySelector("#coachVideo")).objectFit),"contain");
    assert.equal(await tvPage.locator("#coachVideo").getAttribute("src"),approvedSource,
      "Never swap or restart the approved source when switching TV fit");
    await tvPage.locator("#tvStartPause").click();
    assert.equal((await tvPage.locator("#runState").textContent())?.trim(),"Ready",
      "TV remote start never bypasses clinician clearance");
    await tvPage.locator("#tvExit").click();
    assert.equal(await tvPage.evaluate(() => document.body.classList.contains("tvMode")),false);
    step("Full TV stage fits 720p, 1080p, 4K and Fold landscape; approved full-body video stays uncropped by default");
  } finally {
    await tvContext.close();
  }

  // Entire-app encrypted recovery backup: original workout history and
  // manually entered Recovery sets must survive ONE verified file, not two
  // disconnected exports. Restoring into a nonempty or cloud-linked app is
  // explicitly forbidden, and the password is never stored.
  const backupContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    acceptDownloads: true,
  });
  const backupPage = await backupContext.newPage();
  backupPage.setDefaultTimeout(20000);
  try {
    const response = await backupPage.goto(base + "/recovery-coach/full-backup/", {
      waitUntil: "domcontentloaded",
    });
    assert.equal(response?.status(), 200);
    const recordId = "11111111-1111-4111-8111-111111111111";
    await backupPage.evaluate((id) => {
      localStorage.setItem("arm-growth-tracker:v1", JSON.stringify({
        startDate: "2026-10-29", days: { "1": { completed: false, cursor: 0, exercises: {} } },
        measurements: [{ id: "original-photo-measurement", date: "2026-10-29", waist: "38" }],
        settings: { theme: "dark" }, nutrition: {}, favorites: [], targets: {},
        savedWorkouts: [], userAvatar: { kind: "default" }
      }));
      localStorage.setItem("m3-flex-real-reps-and-metrics-v1", JSON.stringify({
        schema: 1, records: [{
          id, at: new Date().toISOString(), type: "set",
          exercise: "C02", reps: 12, lb: 15
        }]
      }));
    }, recordId);
    await backupPage.reload({ waitUntil: "domcontentloaded" });
    assert.match((await backupPage.locator("#counts").textContent()) ?? "", /1 actual sets/);
    await backupPage.locator("#password").fill("M3backup-StrongPassphrase-2026");
    const downloadWait = backupPage.waitForEvent("download");
    await backupPage.locator("#export").click();
    const archive = await downloadWait;
    const encryptedFile = await readFile(await archive.path());
    const json = JSON.parse(encryptedFile.toString());
    assert.equal(json.format, "m3-flex-full-device-encrypted-v1");
    assert.ok(!encryptedFile.toString().includes(recordId),
      "Full backup must never contain exposed plain-text actual reps");
    await backupPage.locator("#file").setInputFiles({
      name: "m3-flex-full-device.json", mimeType: "application/json", buffer: encryptedFile,
    });
    await backupPage.locator("#password").fill("wrong-password-12characters");
    await backupPage.locator("#verify").click();
    assert.match((await backupPage.locator("#status").textContent()) ?? "", /Verification failed/);
    await backupPage.locator("#password").fill("M3backup-StrongPassphrase-2026");
    await backupPage.locator("#verify").click();
    assert.match((await backupPage.locator("#preview").textContent()) ?? "", /1 actual Recovery sets/);
    await backupPage.locator("#confirmRestore").check();
    assert.equal(await backupPage.locator("#restore").isDisabled(), true,
      "Cannot overwrite original tracker or real recovery records during a restore");
    await backupPage.evaluate(() => {
      localStorage.removeItem("arm-growth-tracker:v1");
      localStorage.removeItem("m3-flex-real-reps-and-metrics-v1");
      localStorage.setItem("agt.sync.key.v1", "simulated-existing-cloud-link");
    });
    await backupPage.reload({ waitUntil: "domcontentloaded" });
    await backupPage.locator("#file").setInputFiles({
      name: "m3-flex-full-device.json", mimeType: "application/json", buffer: encryptedFile,
    });
    await backupPage.locator("#password").fill("M3backup-StrongPassphrase-2026");
    await backupPage.locator("#verify").click();
    await backupPage.locator("#confirmRestore").check();
    assert.equal(await backupPage.locator("#restore").isDisabled(), true,
      "Do not import local backup into an already linked cloud account");
    await backupPage.evaluate(() => localStorage.removeItem("agt.sync.key.v1"));
    await backupPage.reload({ waitUntil: "domcontentloaded" });
    await backupPage.locator("#file").setInputFiles({
      name: "m3-flex-full-device.json", mimeType: "application/json", buffer: encryptedFile,
    });
    await backupPage.locator("#password").fill("M3backup-StrongPassphrase-2026");
    await backupPage.locator("#verify").click();
    await backupPage.locator("#confirmRestore").check();
    assert.equal(await backupPage.locator("#restore").isDisabled(), false);
    backupPage.once("dialog", dialog => dialog.accept());
    await backupPage.locator("#restore").click();
    assert.match((await backupPage.locator("#status").textContent()) ?? "", /Restored original app \+ Recovery log locally/);
    const restored = await backupPage.evaluate(() => ({
      original: JSON.parse(localStorage.getItem("arm-growth-tracker:v1") ?? "null"),
      log: JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1") ?? "null"),
      passwordSaved: [...Object.keys(localStorage)].some(k => /password/i.test(k)),
    }));
    assert.equal(restored.original.days["1"].cursor, 0);
    assert.equal(restored.original.measurements.length, 1);
    assert.equal(restored.log.records.length, 1);
    assert.equal(restored.log.records[0].reps, 12);
    assert.equal(restored.passwordSaved, false);
    step("Encrypted whole-app backup: wrong-password rejection, no overwrite/cloud restore, clean-install verified restore");
  } finally {
    await backupContext.close();
  }

  // The standalone seated recovery sequence is the ONLY currently active
  // owner-approved Flex+Marcus circuit. Exercise time measures demonstration
  // duration, not completed reps. Media play is mocked in this timing check;
  // original remote media URLs are separately checked for integrity.
  const recoveryContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await recoveryContext.addInitScript(() => {
    // We test scheduler/state rather than claim these are real device audio
    // output or downloaded videos. Media may be hosted externally.
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  const recoveryPage = await recoveryContext.newPage();
  recoveryPage.setDefaultTimeout(12000);
  try {
    await recoveryPage.clock.install();
    const recoveryResponse = await recoveryPage.goto(base + "/recovery-coach/", {
      waitUntil: "domcontentloaded",
    });
    assert.equal(recoveryResponse?.status(), 200);
    await recoveryPage.locator("#localCoachPanel summary").click();
    await recoveryPage.locator("#coachQuestion").fill("How many reps have I done?");
    await recoveryPage.locator("#askLocalCoach").click();
    assert.match((await recoveryPage.locator("#localCoachAnswer").textContent()) ?? "", /timer counts demonstrations, not your actual repetitions/i);
    await recoveryPage.locator("#coachQuestion").fill("Where does the INNSTAR band go?");
    await recoveryPage.locator("#askLocalCoach").click();
    assert.match((await recoveryPage.locator("#localCoachAnswer").textContent()) ?? "", /between the chair and back, never around the neck/);
    await recoveryPage.locator("#coachQuestion").fill("What is next?");
    await recoveryPage.locator("#askLocalCoach").click();
    assert.match((await recoveryPage.locator("#localCoachAnswer").textContent()) ?? "", /Easy hand openings/);
    await recoveryPage.locator("#localCoachPanel summary").click();
    step("Same-screen free local Q&A explains cast-safe band, next exercise and no fabricated reps");
    // The same-screen camera pane must not load until opened; closing the
    // pane navigates away to unload getUserMedia and on-device pose code.
    assert.equal(await recoveryPage.locator("#formFrame").getAttribute("src"), "about:blank");
    await recoveryPage.locator("#formObservation summary").click();
    await recoveryPage.frameLocator("#formFrame").locator("#start").waitFor();
    assert.equal(await recoveryPage.locator("#formFrame").getAttribute("src"), "./form-check/");
    await recoveryPage.waitForFunction(
      () => document.querySelector("#formFrame")?.contentDocument?.querySelector("#status")?.textContent?.includes("No approved lifting movement is active"),
      null, { timeout: 6000 },
    );
    assert.equal(await recoveryPage.frameLocator("#formFrame").locator("#start").isDisabled(), true,
      "Warm-up without an approved lifting scene must not activate the form camera");
    await recoveryPage.locator('[data-stage="1"]').click();
    await recoveryPage.waitForFunction(
      () => document.querySelector("#formFrame")?.contentDocument?.querySelector("#exercise")?.value === "C01-R3",
      null, { timeout: 6000 },
    );
    await recoveryPage.locator("#steps .item").nth(2).click();
    await recoveryPage.waitForFunction(
      () => document.querySelector("#formFrame")?.contentDocument?.querySelector("#exercise")?.value === "C03",
      null, { timeout: 6000 },
    );
    assert.equal(await recoveryPage.frameLocator("#formFrame").locator("#exercise").isDisabled(), true,
      "When embedded, camera exercise selection must follow the coach, not stale manual entries");
    await recoveryPage.locator('[data-stage="0"]').click();
    await recoveryPage.waitForFunction(
      () => document.querySelector("#formFrame")?.contentDocument?.querySelector("#status")?.textContent?.includes("No approved lifting movement is active"),
      null, { timeout: 6000 },
    );
    assert.equal(await recoveryPage.frameLocator("#formFrame").locator("#start").isDisabled(), true,
      "Camera must switch off when the user returns to preparation");
    await recoveryPage.locator('[data-stage="1"]').click();
    await recoveryPage.locator("#steps .item").nth(0).click();
    await recoveryPage.waitForFunction(
      () => document.querySelector("#formFrame")?.contentDocument?.querySelector("#exercise")?.value === "C01-R3",
      null, { timeout: 6000 },
    );
    await recoveryPage.locator("#formObservation summary").click();
    await recoveryPage.waitForFunction(
      () => document.querySelector("#formFrame")?.getAttribute("src") === "about:blank",
      null,
      { timeout: 4000 },
    );
    assert.equal(await recoveryPage.locator("#formFrame").getAttribute("src"), "about:blank");
    await recoveryPage.locator('[data-stage="1"]').click();
    await recoveryPage.locator("#setRounds").selectOption("2");
    assert.match((await recoveryPage.locator("#position").textContent())?.trim() ?? "", /Set 1 of 2/, "Selecting 2 rounds must update the visible stage before workout");
    await recoveryPage.locator("#workDuration").selectOption("20");
    await recoveryPage.locator("#restDuration").selectOption("15");
    assert.equal(await recoveryPage.locator("#moveTitle").innerText(), "Seated dumbbell shrugs");
    // Android Voice Access operates the actual named buttons; no app-level
    // speech recognition, paid TTS, or automatic microphone activation.
    const voiceControl = recoveryPage.locator("#voiceAccessPanel");
    await voiceControl.locator("summary").click();
    assert.equal(await recoveryPage.locator("#handsfreeStart").isDisabled(), false);
    assert.equal(await recoveryPage.locator("#handsfreePause").isDisabled(), true);
    assert.equal(await recoveryPage.locator("#handsfreeResume").isDisabled(), true);
    assert.match((await voiceControl.innerText()), /Tap Start workout/);
    // Even a spoken "Tap Start workout" cannot bypass clinical clearance.
    await recoveryPage.locator("#handsfreeStart").click();
    assert.match(await recoveryPage.locator("#note").innerText(), /clearance/i);
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Ready");
    for (const box of await recoveryPage.locator("#clearance .check").all()) {
      await box.check();
    }
    await recoveryPage.locator("#handsfreeStart").click();
    assert.equal(await recoveryPage.locator("#setRounds").isDisabled(), true);
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Workout in progress");
    assert.match((await recoveryPage.locator("#position").textContent())?.trim(), /Set 1 of 2/);
    assert.equal(await recoveryPage.locator("#handsfreeStart").isDisabled(), true);
    assert.equal(await recoveryPage.locator("#handsfreePause").isDisabled(), false);
    await recoveryPage.locator("#handsfreePause").click();
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Paused");
    assert.equal(await recoveryPage.locator("#handsfreeResume").isDisabled(), false);
    const voicePausedAt = await recoveryPage.locator("#clock").textContent();
    await recoveryPage.clock.fastForward(2100);
    assert.equal(await recoveryPage.locator("#clock").textContent(), voicePausedAt);
    await recoveryPage.locator("#handsfreeResume").click();
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Workout in progress");
    step("Android Voice Access-compatible controls gate Start, Pause and Resume without false reps or mic access");
    await recoveryPage.clock.fastForward(21_000);
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.match((await recoveryPage.locator("#position").textContent())?.trim(), /Set 2 of 2/);
    assert.match(await recoveryPage.locator("#progressText").innerText(), /^0 of 10 steps completed/);
    // Rest narration is helpful, but never misclassify a silent rest as a
    // shortened workout; the rest countdown continues and warns clearly.
    await recoveryPage.locator("#coachVoice").dispatchEvent("error");
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.match((await recoveryPage.locator("#note").textContent()) ?? "", /Marcus rest recording unavailable/);
    const restBeforeErrorTick = (await recoveryPage.locator("#clock").textContent())?.trim();
    await recoveryPage.clock.fastForward(1100);
    assert.notEqual((await recoveryPage.locator("#clock").textContent())?.trim(), restBeforeErrorTick);
    // Phone tab reload/relaunch must preserve the EXACT pending rest and
    // current set; never auto-play and NEVER restore medical clearance.
    const beforeReload = (await recoveryPage.locator("#clock").textContent())?.trim();
    await recoveryPage.reload({ waitUntil: "domcontentloaded" });
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Paused");
    assert.equal((await recoveryPage.locator("#clock").textContent())?.trim(), beforeReload);
    assert.match((await recoveryPage.locator("#position").textContent())?.trim() ?? "", /Set 2 of 2/);
    assert.equal(await recoveryPage.locator("#clearance .check:checked").count(), 0);
    await recoveryPage.locator("#startPause").click();
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Paused");
    assert.match(await recoveryPage.locator("#note").innerText(), /re-confirm all three clinician clearance/i);
    for (const box of await recoveryPage.locator("#clearance .check").all()) {
      await box.check();
    }
    await recoveryPage.locator("#startPause").click();
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.match(await recoveryPage.locator("#coachVoice").getAttribute("src") ?? "", /006720cc-2f40-44bd-a44f-4c4937336f8e\.mp3/, "Rest restore must play existing Marcus rest MP3, not exercise audio");
    assert.equal((await recoveryPage.locator("#clock").textContent())?.trim(), beforeReload);
    step("Recovery phone reload restores pending rest/round paused, but requires fresh clinician clearance");
    await recoveryPage.locator("#startPause").click();
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Paused");
    const paused = await recoveryPage.locator("#clock").innerText();
    await recoveryPage.clock.fastForward(5_000);
    assert.equal(await recoveryPage.locator("#clock").innerText(), paused, "Rest must freeze on Pause");
    await recoveryPage.locator("#startPause").click();
    await recoveryPage.clock.fastForward(16_000);
    assert.equal(await recoveryPage.locator("#moveTitle").innerText(), "Seated dumbbell shrugs");
    assert.match((await recoveryPage.locator("#position").textContent())?.trim(), /Set 2 of 2/);
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Workout in progress");
    await recoveryPage.clock.fastForward(21_000);
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.equal(await recoveryPage.locator("#moveTitle").innerText(), "Seated dumbbell shrugs");
    assert.match(await recoveryPage.locator("#progressText").innerText(), /^1 of 10 steps completed/);
    await recoveryPage.clock.fastForward(16_000);
    assert.equal(await recoveryPage.locator("#moveTitle").innerText(), "Seated hammer curls");
    assert.match((await recoveryPage.locator("#position").textContent())?.trim(), /Set 1 of 2/);
    // Closing a tab and reopening the page in the same local browser
    // profile should work: unlike sessionStorage, localStorage survives.
    await recoveryPage.locator("#startPause").click();
    assert.equal((await recoveryPage.locator("#runState").textContent())?.trim(), "Paused");
    await recoveryPage.close();
    const reOpened = await recoveryContext.newPage();
    await reOpened.goto(base + "/recovery-coach/", { waitUntil: "domcontentloaded" });
    assert.equal((await reOpened.locator("#runState").textContent())?.trim(), "Paused");
    assert.equal(await reOpened.locator("#moveTitle").innerText(), "Seated hammer curls");
    assert.match((await reOpened.locator("#position").textContent())?.trim(), /Set 1 of 2/);
    assert.equal(await reOpened.locator("#clearance .check:checked").count(), 0);
    step("Approved seated circuit: clearance, 2 rounds, 15s rest, Pause, and no fabricated rep tally");
    step("Closing/reopening recovery tab preserves approved exercise/set without restoring clearance");
  } finally {
    await recoveryContext.close();
  }

  // Real Android media play() may remain pending during buffering. A stale
  // promise from a skipped clip must not restart, zero or complete a new step.
  const delayedContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await delayedContext.addInitScript(() => {
    window.__pendingMediaPlays = [];
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () {
      return new Promise((resolve) => window.__pendingMediaPlays.push(resolve));
    };
  });
  const delayedPage = await delayedContext.newPage();
  delayedPage.setDefaultTimeout(12000);
  try {
    await delayedPage.clock.install();
    await delayedPage.goto(base + "/recovery-coach/", { waitUntil: "domcontentloaded" });
    await delayedPage.locator('[data-stage="1"]').click();
    await delayedPage.locator("#workDuration").selectOption("30");
    for (const box of await delayedPage.locator("#clearance .check").all()) await box.check();
    await delayedPage.locator("#voiceAccessPanel summary").click();
    await delayedPage.locator("#handsfreeStart").click();
    await delayedPage.waitForFunction(() => window.__pendingMediaPlays.length >= 1);
    assert.equal((await delayedPage.locator("#clock").textContent())?.trim(), "00:30");
    await delayedPage.locator("#handsfreePause").click();
    assert.equal((await delayedPage.locator("#runState").textContent())?.trim(), "Paused");
    assert.equal((await delayedPage.locator("#clock").textContent())?.trim(), "00:30",
      "Pausing pending audio/video play must not zero the full unused set duration");
    await delayedPage.locator("#handsfreeNext").click();
    assert.equal((await delayedPage.locator("#runState").textContent())?.trim(), "Paused",
      "Selecting the next exercise while paused must not auto-start it");
    assert.equal(await delayedPage.locator("#moveTitle").innerText(), "Seated hammer curls");
    await delayedPage.evaluate(() => window.__pendingMediaPlays.splice(0).forEach((resolve) => resolve()));
    await delayedPage.clock.fastForward(33_000);
    assert.equal((await delayedPage.locator("#runState").textContent())?.trim(), "Paused",
      "Old asynchronous media play response must not restart a new workout");
    assert.equal((await delayedPage.locator("#clock").textContent())?.trim(), "00:30");
    assert.match((await delayedPage.locator("#progressText").textContent()) ?? "", /^0 of 10 steps completed/);
    step("Delayed original-media play cancelled on Pause/Next; no phantom timer or completed step");
  } finally {
    await delayedContext.close();
  }

  // Approved seated superset mode must rest only AFTER BOTH partner
  // demonstrations and must never fabricate user-entered repetitions.
  const pairsContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await pairsContext.addInitScript(() => {
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  const pairsPage = await pairsContext.newPage();
  pairsPage.setDefaultTimeout(12000);
  try {
    await pairsPage.clock.install();
    await pairsPage.goto(base + "/recovery-coach/", { waitUntil: "domcontentloaded" });
    await pairsPage.locator('[data-stage="1"]').click();
    await pairsPage.locator("#pairMode").selectOption("paired");
    await pairsPage.locator("#setRounds").selectOption("2");
    await pairsPage.locator("#workDuration").selectOption("20");
    await pairsPage.locator("#restDuration").selectOption("15");
    await pairsPage.locator("#voiceAccessPanel summary").click();
    await pairsPage.locator("#handsfreeStart").click();
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Ready",
      "Paired supersets must never bypass clinician clearance");
    for (const box of await pairsPage.locator("#clearance .check").all()) await box.check();
    await pairsPage.locator("#handsfreeStart").click();
    assert.equal(await pairsPage.locator("#pairMode").isDisabled(), true, "Paired mode locks after session starts");
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Seated dumbbell shrugs");
    await pairsPage.clock.fastForward(21_000);
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Seated hammer curls");
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Workout in progress",
      "No rest may be inserted between C01 and its C02 superset partner");
    await pairsPage.clock.fastForward(21_000);
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.match((await pairsPage.locator("#note").textContent()) ?? "", /Rest after BOTH exercises/);
    assert.match((await pairsPage.locator("#progressText").textContent()) ?? "", /^0 of 10 steps completed/);
    await pairsPage.clock.fastForward(16_000);
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Seated dumbbell shrugs");
    assert.match((await pairsPage.locator("#position").textContent()) ?? "", /Set 2 of 2/);
    await pairsPage.clock.fastForward(21_000);
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Seated hammer curls");
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Workout in progress");
    await pairsPage.clock.fastForward(21_000);
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.match((await pairsPage.locator("#progressText").textContent()) ?? "", /^2 of 10 steps completed/,
      "Both timed partner demonstrations finish only after both sets of each movement");
    await pairsPage.clock.fastForward(16_000);
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Seated front raises");
    assert.match((await pairsPage.locator("#position").textContent()) ?? "", /Set 1 of 2/);
    // Skipping the first C03 demo cannot earn an all-sets-completed credit
    // after its C04 partner and the next round finish.
    await pairsPage.locator("#next").click();
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Alternating seated dumbbell curls");
    await pairsPage.clock.fastForward(21_000);
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Rest interval");
    await pairsPage.clock.fastForward(16_000);
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Seated front raises");
    await pairsPage.clock.fastForward(21_000);
    assert.equal(await pairsPage.locator("#moveTitle").innerText(), "Alternating seated dumbbell curls");
    await pairsPage.clock.fastForward(21_000);
    assert.equal((await pairsPage.locator("#runState").textContent())?.trim(), "Rest interval");
    assert.match((await pairsPage.locator("#progressText").textContent()) ?? "", /^2 of 10 steps completed/,
      "C03/C04 cannot be credited if first C03 set was manually skipped");
    step("Recovery Superset C01→C02→rest→C01→C02→rest→C03, and skipped C03 is never falsely completed");
  } finally {
    await pairsContext.close();
  }

  // Seated BENCH CORE A/B are real timed circuits, not approved Marcus clips.
  // Verify fresh clinician clearance, pause/reload, rest, skipped activity,
  // both workout choices and no invented repetitions.
  const coreContext=await browser.newContext({
    viewport:{width:390,height:844},isMobile:true,hasTouch:true,
  });
  const corePage=await coreContext.newPage();
  corePage.setDefaultTimeout(12000);
  try {
    await corePage.clock.install();
    const coreRes=await corePage.goto(base+"/recovery-coach/bench-core/",{waitUntil:"domcontentloaded"});
    assert.equal(coreRes?.status(),200);
    assert.equal(await corePage.locator("#plan option").count(),2);
    assert.equal(await corePage.locator("video").count(),0,"Unapproved core demo videos must not be invented");
    assert.equal(await corePage.locator("audio").count(),0,"No invented Marcus narration");
    await corePage.locator("#rounds").selectOption("1");
    await corePage.locator("#duration").selectOption("15");
    await corePage.locator("#rest").selectOption("15");
    await corePage.locator("#startPause").click();
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Ready",
      "Bench workouts cannot start without three independent clearance checks");
    for(const check of await corePage.locator("#clearance .check").all())await check.check();
    await corePage.locator("#startPause").click();
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Core timer running");
    assert.equal(await corePage.locator("#plan").isDisabled(),true);
    await corePage.clock.fastForward(16_000);
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Rest interval");
    assert.match((await corePage.locator("#progress").textContent())??"",/^1 of 4 timed activities completed/);
    await corePage.locator("#startPause").click();
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Paused");
    const corePausedAt=await corePage.locator("#clock").textContent();
    await corePage.clock.fastForward(20000);
    assert.equal(await corePage.locator("#clock").textContent(),corePausedAt);
    await corePage.reload({waitUntil:"domcontentloaded"});
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Paused");
    assert.equal(await corePage.locator("#clearance .check:checked").count(),0);
    await corePage.locator("#startPause").click();
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Paused",
      "Restored core cannot resume with old medical clearance");
    for(const check of await corePage.locator("#clearance .check").all())await check.check();
    await corePage.locator("#startPause").click();
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Rest interval");
    await corePage.clock.fastForward(16_000);
    assert.equal(await corePage.locator("#title").innerText(),"Seated palms-together midline press");
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Core timer running");
    await corePage.locator("#next").click();
    assert.equal(await corePage.locator("#title").innerText(),"Seated small-range torso turns");
    assert.match((await corePage.locator("#progress").textContent())??"",/^1 of 4 timed activities completed/);
    assert.match((await corePage.locator("#skipCount").textContent())??"",/^1 skipped/);
    step("Bench Core A: clinician gate, timed rest, pause/reload, fresh clearance, skip without credit");
    // Core B follows a second truly separate session; selecting it cannot
    // silently replace the in-progress workout or inherit clearance.
    await corePage.locator("#reset").click();
    await corePage.locator("#plan").selectOption("resistance");
    assert.equal(await corePage.locator("#steps .step").count(),5);
    assert.match((await corePage.locator("#steps").textContent())??"",/Pallof hold/);
    assert.match((await corePage.locator("#steps").textContent())??"",/offset dumbbell hold/);
    assert.equal((await corePage.locator("#clearance .check:checked").count()),0);
    for(const check of await corePage.locator("#clearance .check").all())await check.check();
    await corePage.locator("#startPause").click();
    await corePage.clock.fastForward(16_000);
    assert.match((await corePage.locator("#progress").textContent())??"",/^1 of 5 timed activities completed/);
    await corePage.locator("#emergency").click();
    assert.equal((await corePage.locator("#runState").textContent())?.trim(),"Ready");
    assert.equal(await corePage.locator("#clearance .check:checked").count(),0);
    assert.match((await corePage.locator("#notice").textContent())??"",/Workout stopped for a safety concern/);
    step("Bench Core B includes both-sided Pallof/offset holds and immediate emergency reset");
  }finally{await coreContext.close();}

  // On-device form-check camera is strictly opt-in. A denied permission
  // must never invoke pose inference or report medically correct movement.
  const formContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await formContext.addInitScript(() => {
    window.__formRequests = [];
    if (navigator.mediaDevices) {
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        window.__formRequests.push(constraints);
        throw new DOMException("Camera access denied for QA", "NotAllowedError");
      };
    }
  });
  const formPage = await formContext.newPage();
  formPage.setDefaultTimeout(12000);
  try {
    const res = await formPage.goto(base + "/recovery-coach/form-check/", { waitUntil: "networkidle" });
    assert.equal(res?.status(), 200);
    assert.equal(await formPage.evaluate(() => window.__formRequests.length), 0,
      "No camera requested during form-check page load");
    await formPage.locator("#start").click();
    assert.match((await formPage.locator("#status").textContent()) ?? "", /Check consent first/);
    assert.equal(await formPage.evaluate(() => window.__formRequests.length), 0);
    await formPage.locator("#consent").check();
    await formPage.locator("#start").click();
    await formPage.locator("#status").getByText(/Camera\/pose model unavailable/).waitFor();
    const requests = await formPage.evaluate(() => window.__formRequests);
    assert.equal(requests.length, 1, "A single deliberate start requested only the camera");
    assert.equal(requests[0].audio, false, "The pose view must never request microphone access");
    assert.match((await formPage.locator("#status").textContent()) ?? "", /No images were uploaded/);
    step("Optional on-device pose screen requests no camera until consent+tap; handles denial and no audio access");
  } finally {
    await formContext.close();
  }

  // Exercise the real self-hosted MediaPipe model and WASM pipeline with a
  // fake CI webcam: unlike a source-only check this reaches model startup.
  // This does NOT validate exercise biomechanics, real Galaxy Fold camera or
  // athlete image privacy on external devices.
  const modelContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    permissions: ["camera"],
  });
  const modelPage = await modelContext.newPage();
  modelPage.setDefaultTimeout(55000);
  try {
    await modelPage.goto(base + "/recovery-coach/form-check/", { waitUntil: "domcontentloaded" });
    assert.equal((await modelPage.locator("#start").isDisabled()), false);
    await modelPage.locator("#consent").check();
    await modelPage.locator("#start").click();
    await modelPage.waitForFunction(() => {
      const status = document.querySelector("#status")?.textContent ?? "";
      return status.includes("Local pose view is active") ||
        status.includes("No automatic rep count") ||
        status.includes("landmarks tracked") ||
        status.includes("Standby:");
    }, null, { timeout: 50000 });
    assert.equal(await modelPage.locator("#stop").isDisabled(), false);
    await modelPage.locator("#stop").click();
    assert.equal(await modelPage.locator("#stop").isDisabled(), true);
    assert.match((await modelPage.locator("#status").textContent()) ?? "", /Camera and local pose analysis stopped/);
    step("Real first-party MediaPipe WASM/model initialized on fake local camera and shut down correctly");
  } finally {
    await modelContext.close();
  }

  // Loss of the ability to stand requires strict non-weight-bearing
  // interlock. Emergency Stop must silence sources and block resume even
  // if all safety boxes had been checked before the user became unwell.
  const noWeightContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await noWeightContext.addInitScript(() => {
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  const noWeightPage = await noWeightContext.newPage();
  noWeightPage.setDefaultTimeout(12000);
  try {
    await noWeightPage.goto(base + "/recovery-coach/", { waitUntil: "domcontentloaded" });
    assert.match((await noWeightPage.locator("#nonWeightWarning").textContent()) ?? "", /FOOT CAST · WEIGHT-BEARING ABILITY REPORTED/);
    assert.match((await noWeightPage.locator("#nonWeightWarning").textContent()) ?? "", /does not establish clearance for loaded squats/);
    await noWeightPage.locator('[data-stage="1"]').click();
    await noWeightPage.locator("#startPause").click();
    assert.match((await noWeightPage.locator("#note").textContent()) ?? "", /confirm all three clinician-clearance checks/);
    for (const input of await noWeightPage.locator("#clearance .check").all()) await input.check();
    await noWeightPage.locator("#startPause").click();
    assert.equal((await noWeightPage.locator("#runState").textContent())?.trim(), "Workout in progress");
    await noWeightPage.locator("#emergencyStop").click();
    assert.equal((await noWeightPage.locator("#runState").textContent())?.trim(), "STOPPED — MEDICAL SAFETY");
    assert.equal(await noWeightPage.locator("#startPause").isDisabled(), true);
    assert.equal(await noWeightPage.locator("#preview").isDisabled(), true);
    assert.equal(await noWeightPage.locator("#handsfreeResume").isDisabled(), true);
    assert.equal(await noWeightPage.locator("#clearance .check:checked").count(), 0);
    assert.match((await noWeightPage.locator("#note").textContent()) ?? "", /follow your clinician.s restrictions/);
    await noWeightPage.locator("#reset").click();
    assert.equal((await noWeightPage.locator("#runState").textContent())?.trim(), "Ready");
    assert.equal(await noWeightPage.locator("#clearance .check:checked").count(), 0);
    await noWeightPage.locator("#startPause").click();
    assert.match((await noWeightPage.locator("#note").textContent()) ?? "", /confirm all three clinician-clearance checks/);
    step("Conservative seated-cast medical Stop silences workout, blocks resume and requires NEW clearance after reset");
  } finally {
    await noWeightContext.close();
  }

  // Audio-only preparation is not permitted to finish silently if its
  // approved Marcus recording errors or stalls. Simulate media events in
  // Chrome without fetching/altering or replacing owner-approved assets.
  const voiceContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await voiceContext.addInitScript(() => {
    HTMLMediaElement.prototype.load = function () {};
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  });
  const voicePage = await voiceContext.newPage();
  voicePage.setDefaultTimeout(12000);
  try {
    await voicePage.clock.install();
    const voiceResponse = await voicePage.goto(base + "/recovery-coach/", {
      waitUntil: "domcontentloaded",
    });
    assert.equal(voiceResponse?.status(), 200);
    await voicePage.locator("#steps .item").nth(1).click();
    assert.equal(await voicePage.locator("#moveTitle").innerText(), "Easy hand openings");
    for (const box of await voicePage.locator("#clearance .check").all()) await box.check();
    await voicePage.locator("#startPause").click();
    assert.equal((await voicePage.locator("#runState").textContent())?.trim(), "Workout in progress");
    const originalMarcus = await voicePage.locator("#coachVoice").getAttribute("src");
    assert.match(originalMarcus ?? "", /2dcdf842-9177-4bc6-a6a4-a274fc726876\.mp3/);
    await voicePage.clock.fastForward(4100);
    await voicePage.locator("#coachVoice").dispatchEvent("error");
    assert.equal((await voicePage.locator("#runState").textContent())?.trim(), "Tap to enable sound");
    assert.match((await voicePage.locator("#note").textContent()) ?? "", /Marcus voice track failed/);
    const frozenAt = await voicePage.locator("#clock").textContent();
    await voicePage.clock.fastForward(45_000);
    assert.equal(await voicePage.locator("#clock").textContent(), frozenAt, "Broken Marcus audio must freeze workout timer");
    assert.match((await voicePage.locator("#progressText").textContent()) ?? "", /^0 of 10 steps completed/);
    assert.equal(await voicePage.locator("#moveTitle").innerText(), "Easy hand openings");
    await voicePage.locator("#startPause").click();
    assert.equal((await voicePage.locator("#runState").textContent())?.trim(), "Workout in progress");
    assert.equal(await voicePage.locator("#coachVoice").getAttribute("src"), originalMarcus);
    await voicePage.clock.fastForward(1100);
    assert.notEqual(await voicePage.locator("#clock").textContent(), frozenAt, "Timer resumes only after explicit Retry");
    step("Failed Marcus audio freezes preparation timer, preserves progress, and retries same recording");

    // A stream can stall without emitting an error. The audio watchdog
    // must suspend only the active step, not invent elapsed reps/steps.
    // Force zero playable bytes; a bare waiting event on fast CI can have
    // readyState=4 because external audio already buffered successfully.
    await voicePage.locator("#coachVoice").evaluate((element) => {
      Object.defineProperty(element, "readyState", { configurable: true, get: () => 0 });
    });
    await voicePage.locator("#coachVoice").dispatchEvent("waiting");
    await voicePage.clock.fastForward(3200);
    assert.equal((await voicePage.locator("#runState").textContent())?.trim(), "Tap to enable sound");
    const stalledAt = await voicePage.locator("#clock").textContent();
    await voicePage.clock.fastForward(32_000);
    assert.equal(await voicePage.locator("#clock").textContent(), stalledAt);
    assert.match((await voicePage.locator("#note").textContent()) ?? "", /Marcus audio buffering stopped/);
    assert.match((await voicePage.locator("#progressText").textContent()) ?? "", /^0 of 10 steps completed/);
    step("Stalled Marcus audio pauses timed guidance instead of silently completing the step");
  } finally {
    await voiceContext.close();
  }

  // Real manual athlete data must not be fabricated by workout timers or
  // exported to a cloud server. Save, reload, validate and merge a local log.
  const logContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    acceptDownloads: true,
  });
  const logPage = await logContext.newPage();
  logPage.setDefaultTimeout(12000);
  try {
    await logPage.goto(base + "/recovery-coach/logbook/", { waitUntil: "domcontentloaded" });
    assert.match((await logPage.locator("#summary").textContent()) ?? "", /0 saved personal records/);
    await logPage.locator("#exercise").selectOption("C02");
    await logPage.locator("#reps").fill("12");
    await logPage.locator("#weight").fill("15");
    await logPage.locator("#saveSet").click();
    assert.match((await logPage.locator("#history").textContent()) ?? "", /Seated hammer curls · 12 actual reps · 15 lb/);
    const storage = await logPage.evaluate(() => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")));
    assert.equal(storage.records.length, 1);
    assert.equal(storage.records[0].reps, 12);
    assert.equal(storage.records[0].lb, 15);
    await logPage.locator("#reps").fill("101");
    await logPage.locator("#saveSet").click();
    assert.equal((await logPage.evaluate(() => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")))).records.length, 1,
      "Out-of-range actual reps must not be saved");
    await logPage.reload({ waitUntil: "domcontentloaded" });
    assert.match((await logPage.locator("#history").textContent()) ?? "", /12 actual reps/);
    await logPage.locator("#bodyWeight").fill("198");
    await logPage.locator("#waist").fill("38");
    await logPage.locator("#metricForm button[type=submit]").click();
    assert.match((await logPage.locator("#summary").textContent()) ?? "", /2 saved personal records/);
    const downloadPromise = logPage.waitForEvent("download");
    await logPage.locator("#export").click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), "m3-flex-private-workout-log.json");
    const exported = await logPage.evaluate(() => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")));
    await logPage.locator("#importFile").setInputFiles({
      name: "restore.json", mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({schema:1,records:exported.records})),
    });
    await logPage.locator("#status").getByText(/Imported 0 distinct valid records/).waitFor();
    assert.equal((await logPage.evaluate(() => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")))).records.length, 2);
    await logPage.locator("#importFile").setInputFiles({
      name: "poison.json", mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({schema:1,records:[{id:"bad","type":"set",exercise:"C99",reps:500}]})),
    });
    await logPage.locator("#status").getByText(/Import rejected/).waitFor();
    assert.equal((await logPage.evaluate(() => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")))).records.length, 2);
    await logPage.locator("#exercise").selectOption("C02");
    await logPage.locator("#targetReps").selectOption("10");
    assert.match((await logPage.locator("#lastSet").textContent()) ?? "", /12 reps · 15 lb entered/);
    assert.match((await logPage.locator("#progressionCue").textContent()) ?? "", /One logged training day/);
    await logPage.locator("#useLastWeight").click();
    assert.equal(await logPage.locator("#weight").inputValue(), "15");
    assert.match((await logPage.locator("#status").textContent()) ?? "", /reference only, not approval/);
    // Import a *different real-day self-reported* set. Neither mock media nor
    // elapsed timers may create it.
    const previousDay = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await logPage.locator("#importFile").setInputFiles({
      name: "previous-day.json", mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({schema:1,records:[
        {id:"b8e737d2-0d52-4f81-a341-b0f2dd18354b",at:previousDay,type:"set",exercise:"C02",reps:14,lb:15},
        {id:"de414735-fb43-452e-9383-d27d836ade61",at:previousDay,type:"metrics",weight:200,waist:39,arm:16},
      ]})),
    });
    await logPage.locator("#status").getByText(/Imported 2 distinct valid records/).waitFor();
    assert.match((await logPage.locator("#progressionCue").textContent()) ?? "", /Across two separate days, you exceeded 10 reps/);
    assert.match((await logPage.locator("#measurementTrend").textContent()) ?? "", /Body weight: 198 lb, change -2 lb versus previous entry/);
    assert.match((await logPage.locator("#measurementTrend").textContent()) ?? "", /Waist: 38 in, change -1 in versus previous entry/);
    await logPage.locator("#targetReps").selectOption("12");
    assert.match((await logPage.locator("#progressionCue").textContent()) ?? "", /No consistent above-target result/);
    await logPage.locator("#exercise").selectOption("C08-PRESS-R3");
    assert.equal(await logPage.locator("#useLastWeight").isDisabled(), true);
    // Private two-device transfer: encrypt locally, confirm no plaintext
    // in the ZIP-less JSON envelope, deny the wrong password, and decrypt
    // on a NEW browser profile with zero preexisting workout records.
    await logPage.locator("#backupPassword").fill("correct-horse-battery-secret");
    const protectedPromise = logPage.waitForEvent("download");
    await logPage.locator("#exportProtected").click();
    const protectedDownload = await protectedPromise;
    assert.equal(protectedDownload.suggestedFilename(), "m3-flex-password-protected-workout-log.json");
    const protectedText = await readFile(await protectedDownload.path(), "utf8");
    const protectedFile = JSON.parse(protectedText);
    assert.equal(protectedFile.schema, 2);
    assert.equal(protectedFile.iterations, 310000);
    assert.ok(protectedFile.ciphertext.length > 50);
    assert.ok(!protectedText.includes("m3-flex-real-reps-and-metrics-v1"));
    assert.ok(!protectedText.includes("b8e737d2-0d52-4f81-a341-b0f2dd18354b"));
    assert.equal(await logPage.locator("#backupPassword").inputValue(), "");
    const otherDevice = await browser.newContext({
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    });
    try {
      const otherPage = await otherDevice.newPage();
      await otherPage.goto(base + "/recovery-coach/logbook/", { waitUntil: "domcontentloaded" });
      assert.match((await otherPage.locator("#summary").textContent()) ?? "", /^0 saved personal records/,
        "Separate device cannot magically see another device's private data");
      await otherPage.locator("#backupPassword").fill("wrong-but-long-enough-pass");
      await otherPage.locator("#importFile").setInputFiles({
        name: "protected.json", mimeType: "application/json", buffer: Buffer.from(protectedText),
      });
      await otherPage.locator("#status").getByText(/Import rejected: Wrong password, damaged protected backup/).waitFor();
      assert.match((await otherPage.locator("#summary").textContent()) ?? "", /^0 saved personal records/);
      assert.equal(await otherPage.locator("#backupPassword").inputValue(), "");
      await otherPage.locator("#backupPassword").fill("correct-horse-battery-secret");
      await otherPage.locator("#importFile").setInputFiles({
        name: "protected.json", mimeType: "application/json", buffer: Buffer.from(protectedText),
      });
      await otherPage.locator("#status").getByText(/Imported 4 distinct valid records/).waitFor();
      assert.match((await otherPage.locator("#history").textContent()) ?? "", /Seated hammer curls · 12 actual reps/);
      assert.equal(await otherPage.locator("#backupPassword").inputValue(), "");
      assert.equal((await otherPage.evaluate(() => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")))).records.length, 4);
      step("AES-256-GCM workout log transferred to second browser with correct password; wrong password rejected");
    } finally {
      await otherDevice.close();
    }
    // The approved moving Flex demo must display last REAL owner-entered
    // reps without claiming the video counted them or recommending weight.
    const lastSetPage = await logContext.newPage();
    try {
      await lastSetPage.goto(base + "/recovery-coach/", {waitUntil:"domcontentloaded"});
      await lastSetPage.locator('[data-stage="1"]').click();
      await lastSetPage.locator("#steps .item").nth(1).click();
      assert.equal(await lastSetPage.locator("#moveTitle").innerText(), "Seated hammer curls");
      assert.match((await lastSetPage.locator("#lastActualReference").textContent()) ?? "", /LAST ACTUAL SET · 12 reps you logged · 15 lb reported/);
      assert.match((await lastSetPage.locator("#lastActualReference").textContent()) ?? "", /not a safe-load prescription/);
      await lastSetPage.locator("#steps .item").nth(4).click();
      assert.match((await lastSetPage.locator("#lastActualReference").textContent()) ?? "", /No personal set logged/);
      await lastSetPage.locator("#repsPanel summary").click();
      const liveLog = lastSetPage.frameLocator("#logFrame");
      await liveLog.locator("#setForm").waitFor();
      await liveLog.locator("#reps").fill("8");
      await liveLog.locator("#saveSet").click();
      await lastSetPage.waitForFunction(
        () => document.querySelector("#lastActualReference")?.textContent?.includes("LAST ACTUAL SET · 8 reps you logged · Band load not verified"),
        null, {timeout:8000}
      );
      step("Current approved workout shows last ACTUAL reps and refreshes from local logbook without fictitious loads");
    } finally {
      await lastSetPage.close();
    }
    // The Android update preflight must use the *same device* data and
    // never silently erase records, export unencrypted data, or certify a
    // backup based solely on clicking a button.
    const updatePage = await logContext.newPage();
    try {
      const recordsBefore = await logPage.evaluate(
        () => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")).records.length,
      );
      await updatePage.goto(base + "/recovery-coach/update-safety/", {waitUntil:"domcontentloaded"});
      assert.match((await updatePage.locator("#summary").textContent()) ?? "",
        new RegExp("^"+recordsBefore+" locally reported workout/measurement records"));
      assert.equal(await updatePage.locator("#checkReady").isDisabled(), true);
      assert.equal(await updatePage.locator("#hasFile").isChecked(), false);
      assert.match((await updatePage.locator("#confirmStatus").textContent()) ?? "", /Nothing has been backed up by this page/);
      assert.match(await updatePage.locator("a[href='../logbook/#backup']").getAttribute("href"), /logbook\/\#backup/);
      assert.match((await updatePage.locator("#version").textContent()) ?? "", /Installed build ID not provided/);
      await updatePage.locator("#hasFile").check();
      await updatePage.locator("#hasPassword").check();
      assert.equal(await updatePage.locator("#checkReady").isDisabled(), true);
      await updatePage.locator("#knowLimits").check();
      await updatePage.locator("#checkReady").click();
      assert.match((await updatePage.locator("#confirmStatus").textContent()) ?? "", /did not test decryption or copy anything/);
      assert.equal(await updatePage.evaluate(
        () => JSON.parse(localStorage.getItem("m3-flex-real-reps-and-metrics-v1")).records.length
      ), recordsBefore);
      step("Android update preflight reads actual device log count and cannot claim or perform a backup");
    } finally {
      await updatePage.close();
    }
    step("Manual previous-session reps, last weight and measurement trend show safe nonautomatic progression guidance");
    step("Real manual reps, resistance and measurements persist, export privately and reject invalid/import duplicates");
  } finally {
    await logContext.close();
  }

  // A real phone must explicitly grant camera/mic permission. The diagnostic
  // page must NEVER request either on initial load, and must report denial
  // without uploading recordings, spawning TTS, or crashing.
  const deviceContext = await browser.newContext({
    viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  });
  await deviceContext.addInitScript(() => {
    window.__permissionRequests = [];
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        window.__permissionRequests.push(constraints);
        throw new DOMException("Permission denied for CI test", "NotAllowedError");
      };
    }
  });
  const devicePage = await deviceContext.newPage();
  try {
    const deviceResponse = await devicePage.goto(base + "/recovery-coach/device-check/", {
      waitUntil: "domcontentloaded",
    });
    assert.equal(deviceResponse?.status(), 200);
    assert.match((await devicePage.locator("#approvedMarcus").getAttribute("src")) ?? "", /9226f649-9808-4275-b269-bcc93d3b0342\.mp3/);
    assert.equal((await devicePage.locator("#speakerStatus").textContent())?.trim(), "Not tested");
    assert.equal((await devicePage.locator("#micStatus").textContent())?.trim(), "Not tested");
    assert.equal((await devicePage.locator("#cameraStatus").textContent())?.trim(), "Not tested");
    assert.equal(await devicePage.evaluate(() => window.__permissionRequests.length), 0, "No mic/camera permissions requested on page load");
    await devicePage.locator("#testMic").click();
    await devicePage.locator("#micStatus").getByText(/Microphone test failed/).waitFor();
    await devicePage.locator("#testCamera").click();
    await devicePage.locator("#cameraStatus").getByText(/Camera preview failed/).waitFor();
    assert.equal(await devicePage.evaluate(() => window.__permissionRequests.length), 2, "Both explicit test buttons must separately request permission");
    step("Galaxy Fold diagnostics require user clicks before camera/mic access and handle denied permissions");
  } finally {
    await deviceContext.close();
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
    await acknowledgeLegacyDirectRoute(mediaPage);
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
