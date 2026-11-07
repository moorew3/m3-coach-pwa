#!/usr/bin/env node
/**
 * M3 FLEX visual-game regression gate.
 * No network requests, paid API calls, external browsers, or production changes.
 * Tests player controls against the real static page and scene library built into
 * the repository, preserving the original approved clips and voice references.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../public/playable/index.html", import.meta.url), "utf8");
const libraryCode = readFileSync(new URL("../public/recovery-coach/scene-library.js", import.meta.url), "utf8");
const script = html.match(/<script>\s*(\(function\(\)\{[\s\S]*?\}\)\(\);)\s*<\/script>/)?.[1];
assert.ok(script, "Playable embedded game script must exist");
new Function(script);

function domNode(id) {
  return {
    id, children: [], listeners: {}, attributes: {}, style: {},
    value: "0", src: "", textContent: "", currentTime: 0, duration: 8,
    disabled: false, checked: false, hidden: false, muted: false,
    paused: true, loop: false,
    addEventListener(type, fn) { this.listeners[type] = fn; },
    emit(type) { this.listeners[type]?.call(this); },
    click() { if (!this.disabled) this.emit("click"); },
    change(value) { this.value = value; this.emit("change"); },
    append(...children) { this.children.push(...children); },
    replaceChildren() { this.children = []; },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this[key]; },
    pause() { this.paused = true; this.emit("pause"); },
    play() { this.paused = false; this.emit("play"); return Promise.resolve(); },
    load() {},
    remove() {},
  };
}

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs must be unique");
const el = Object.fromEntries(ids.map((id) => [id, domNode(id)]));
const radios = [domNode("demo"), domNode("active")];
radios[0].value = "demo";
radios[1].value = "active";
const document = {
  body: domNode("body"), activeElement: { tagName: "BODY" },
  createElement: domNode,
  getElementById(id) { assert.ok(el[id], "Missing element: " + id); return el[id]; },
  querySelectorAll(selector) {
    assert.equal(selector, 'input[name="playMode"]');
    return radios;
  },
  addEventListener() {},
};
const localStorage = {
  values: {},
  getItem(key) { return this.values[key] || null; },
  setItem(key, value) { this.values[key] = String(value); },
};
const window = { location: { hash: "" }, addEventListener() {} };
vm.runInNewContext(libraryCode, { window }, { timeout: 1000 });
const scenes = window.M3_FLEX_SCENE_LIBRARY;
const pending = scenes.filter((x) => x.status === "owner-review" && x.video);
assert.ok(pending.length >= 75, "At least 75 pending user-review videos, including new rowing");
assert.ok(scenes.some((x) => x.id === "ROW-R5" && x.status === "qa-rejected"));
let tick = () => {};
let checks = 0;
function check(label, pass) { assert.ok(pass, label); checks++; }
const run = new Function(
  "window", "document", "localStorage", "setInterval", "clearInterval",
  "setTimeout", "confirm", "URL", "Blob", "FileReader", script,
);
run(
  window, document, localStorage,
  (fn) => { tick = fn; return 1; }, () => {}, () => {}, () => true,
  { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  Blob, class FileReader {},
);
const state = () => JSON.parse(localStorage.values["m3-flex-playable-v1"]);
const reviews = () => JSON.parse(localStorage.values["m3-flex-owner-approval-v1"] || "{}");

check("All pending videos are selectable", el.reviewPick.children[0].children.length === pending.length);
check("Approval actions precede video", html.indexOf('id="approveVideo"') < html.indexOf('id="film"'));
check("Exercise selector precedes video", html.indexOf('id="exercisePick"') < html.indexOf('id="film"'));
check("Rep and weight controls follow video", html.indexOf('id="film"') < html.indexOf('id="reps"'));

el.modeReview.click();
check("Review mode hides workout controls", !el.approvalControls.hidden && el.exerciseControls.hidden);
check("Cannot approve unwatched media", el.approveVideo.disabled);
el.film.emit("ended");
check("Completed playback unlocks approval", !el.approveVideo.disabled);
el.clipReps.value = "2";
el.approveVideo.click();
check("Approval saved with stable media key", Object.values(reviews())[0]?.mediaKey?.includes(".mp4"));

el.rejectWhy.value = "wrong-leg";
el.reviewFix.value = "LEFT boot position wrong";
el.rejectVideo.click();
check("Rejected reason persists", Object.values(reviews()).some((v) => v.reason === "wrong-leg" && v.notes === "LEFT boot position wrong"));
check("Review count advances", el.reviewCount.textContent.includes(String(pending.length - 2) + " pending"));
check("Reviewed candidates preserved in archive", scenes.length >= 84);

el.modeLoop.click();
check("Continuous mode shows compact controls", el.quickLog.hidden && el.start.hidden && el.complete.hidden);
el.exercisePick.change("owner0");
el.demo.click();
check("Approved clip loops", !el.film.paused && el.film.loop);
el.pause.click();
check("Pause stops continuous loop", el.film.paused);
el.demo.click(); el.next.click();
check("Next continues loop without credit", !el.film.paused && el.film.loop && state().log.length === 0);

el.modeCoach.click();
el.exercisePick.change("w2");
el.goalReps.change("10");
el.approvedClipReps.change("2");
el.start.click();
check("Coach stage begins and original Marcus audio is set", state().phase === "running" && el.marcusAudio.src.includes("wav"));
check("Coached video is not native-infinite while counting", !el.film.loop);
for (let i = 0; i < 5; i++) el.film.emit("ended");
check("Five 2-rep visual cycles begin rest", state().phase === "rest" && state().completed === 1);
check("Simulated movie never logs actual exercise", state().log.every((entry) => entry.kind === "simulation" && entry.reps == null));
check("Moving approved rest scene", el.film.src.includes("f92c84ea") && el.film.loop);
el.film.emit("error");
check("Media playback failure halts auto progress", state().phase === "paused" && state().completed === 1);
el.start.click();
check("Failure cannot resume until scene is changed", state().phase === "paused");
el.exercisePick.change("w3");
el.start.click();
check("New approved scene clears prior failure", state().phase === "running");

// Missing rep calibration must NOT masquerade as a completed 10-rep set.
el.pause.click();
el.exercisePick.change("w4");  // This exercise has no recorded complete reps.
el.start.click();
check("Uncalibrated movement still previews", state().phase === "running");
const started = Date.now();
const savedNow = Date.now;
Date.now = () => started + 120_000;
tick();
Date.now = savedNow;
check("Unverified exercise freezes rather than auto-crediting", state().phase === "paused");
check("No unverified set was recorded", state().log.length === 1);

console.log("M3 FLEX game QA passed: " + checks + " checks; " + pending.length + " review videos indexed.");
