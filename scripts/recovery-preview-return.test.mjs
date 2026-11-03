import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const player = readFileSync(new URL("../public/recovery-coach/index.html", import.meta.url), "utf8");
const browser = readFileSync(new URL("./browser-mobile-smoke.mjs", import.meta.url), "utf8");

test("recovery player inline JavaScript remains syntactically valid", () => {
  const match = player.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "Main existing recovery-player script must remain present");
  assert.doesNotThrow(() => new Function(match[1]));
});

test("demo preview cannot abandon the paused exercise or pending rest", () => {
  const start = player.indexOf('$("preview").addEventListener("click"');
  const end = player.indexOf('video.addEventListener("ended"', start);
  assert.ok(start >= 0 && end > start);
  const controls = player.slice(start, end);
  assert.match(controls, /previewReturnMode=mode/);
  assert.match(controls, /mode=prior==="paused"\|\|prior==="waiting"\?prior:"ready"/);
  assert.match(controls, /if\(restNext\)/);
  assert.doesNotMatch(controls, /restNext=null/, "Preview must not discard pending rest or superset position");
  assert.match(player, /\$\("startPause"\)\.disabled=mode==="complete"\|\|mode==="preview"\|\|safetyLock/);
  assert.match(player, /Return to paused workout/);
});

test("phone-width QA covers both preview completion and explicit return", () => {
  assert.match(browser, /Completed preview must return to paused rest/);
  assert.match(browser, /Preview must not erase the superset\/rest destination/);
  assert.match(browser, /Return control must keep a paused exercise paused/);
  assert.match(browser, /Preview cannot accidentally start timed exercise/);
});
