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
check("Source narration disabled by default in review", el.film.muted && el.reviewMute.checked && el.reviewMute.disabled);
check("Review never renders independent foreign-language audio", el.reviewAudio.hidden && el.reviewAudio.muted);
el.film.muted=false;el.film.emit("volumechange");
check("Cannot unmute a foreign voice in review", el.film.muted);

check("Review shows dedicated watch/pause buttons", html.includes('id="playReviewVideo"') && html.includes('id="pauseReviewVideo"'));
check("Review watch button available without entering workout", !el.playReviewVideo.disabled && state().phase!=="running");
el.playReviewVideo.click();
check("Review watch button plays selected candidate", !el.film.paused && state().phase!=="running");
el.pauseReviewVideo.click();
check("Review pause button pauses candidate", el.film.paused);
el.playReviewVideo.click();
check("Review video can resume to completion", !el.film.paused);
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
check("Approved Marcus recording mutes original video track", el.film.muted);
el.marcusAudio.onended?.call(el.marcusAudio);
check("Finishing Marcus recording never restores wrong-language video track", el.film.muted && el.voiceState.textContent.includes("original clip remains muted"));
el.marcusAudio.onerror?.call(el.marcusAudio);
check("Marcus playback error leaves original audio muted", el.film.muted);

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

// Visual quality can be retained WITHOUT approving incorrect source narration.
el.modeReview.click();
check("Separate keep-visuals voice-repair action appears before film", html.indexOf('id="visualApproveVideo"') < html.indexOf('id="film"'));
check("Unwatched visual-only approval blocked", el.visualApproveVideo.disabled);
el.film.emit("ended");
check("Watching full candidate unlocks visual-only approval", !el.visualApproveVideo.disabled);
el.clipReps.value = "2";
el.reviewFix.value = "Excellent motion, but a different narrator. Revoice with Marcus.";
el.visualApproveVideo.click();
const visualId = pending[2].id;
check("Visuals preserved as separate non-coached decision", reviews()[visualId]?.decision === "visual-approved" && reviews()[visualId]?.voiceStatus === "needs-marcus");
check("Original media stable key and rep count saved", reviews()[visualId]?.mediaKey?.includes(".mp4") && reviews()[visualId]?.clipReps === 2);
check("Voice replacement tracked without regenerating video", reviews()[visualId]?.reason === "wrong-voice" && reviews()[visualId]?.notes?.includes("Excellent motion"));
check("Voice fix is not fully approved", el.reviewCount.textContent.includes("1 voice fixes") && !el.reviewCount.textContent.includes("2 full"));
el.modeLoop.click();
el.exercisePick.change("silent0");
check("Preserved visual-only clip remains playable", el.film.src.includes(".mp4") && el.film.muted === true);
check("Visual-only clip is preview only, not coached workout", el.start.disabled && el.complete.disabled);
el.film.muted = false;
el.film.emit("volumechange");
check("Visual-only clip cannot unmute original wrong speaker in demo", el.film.muted);
el.demo.click();
check("Voice-fix video loops silently", el.film.loop && !el.film.paused && el.film.muted);
el.pause.click();
el.exportRepairs.click();
check("CSV repair export includes voice-only fixes and rejected footage", el.notice.textContent.includes("2 videos needing voice replacement or footage repair"));
el.modeReview.click();
el.reviewPick.change("2");
check("Owner can revisit saved visual approval", el.reviewStatus.textContent.includes("VISUALS KEPT") && !el.voiceFixStatus.hidden);
check("Audio defaults to muted on reviewing saved visual-only clips", el.reviewMute.checked && el.film.muted);
check("A visual clip can be fully approved later after fixing the voice", !el.approveVideo.disabled);
check("Original archive and existing approved scenes stay intact", scenes.some(x => x.id === visualId) && Object.values(reviews()).some(x => x.decision === "approved"));
check("Backup restores all three approval classifications", html.includes('["approved","visual-approved","disapproved"].includes(d.decision)'));

const dub = readFileSync(new URL("../public/playable/marcus-dub.js", import.meta.url), "utf8");
new Function(dub);
check("Dub script is included in existing player", html.includes('src="/playable/marcus-dub.js"'));
check("Dub controls are on same page", html.includes('id="dubPanel"') && html.includes('id="dubGenerate"') && html.includes('id="dubPlay"'));
check("Dubbing requires visual owner approval", html.includes('decision==="visual-approved"') && html.includes("visualApproved:"));
check("Narration draft persists with review", html.includes("dubScript:") && html.includes("old.dubScript"));
check("Final source MP4 remains unchanged", !dub.includes("film.src=") && !dub.includes("video.src="));
check("Marcus-only voice remains locked", dub.includes("0fadce1e82af494a93873aa38ea8d106"));
check("Only free model accepted", dub.includes("heygen-voice-1-turbo-free"));
check("Owner-paired API used", dub.includes("/api/public/marcus-speech") && dub.includes("x-m3-flex-owner"));
check("Private direct review link pairs without leaking secret into HTTP", dub.includes("claimOwnerLink()") && dub.includes("window.history.replaceState") && html.includes('get("mode")==="review"'));
check("No wrong source voice can play in preview", dub.includes("film.muted=true") && dub.includes("this.muted=true"));
check("No automatic generation on review selection", !dub.includes("void prepare()\n    var id"));
check("Audio change never upgrades coached approval", !dub.includes('decision="approved"'));
check("Editing retains source and validates audio", dub.includes("voiceURL") && dub.includes("saveDraft()"));

check("No source-unmute fallback anywhere in player code", !html.includes('muted=false') && !html.includes('muted = false'));
check("Source video initially has muted HTML attribute", html.includes('id="film" playsinline controls muted'));
check("Only English-approved Marcus narration is indicated", html.includes("Original video voices and languages are muted. Marcus is the only approved narrator."));
console.log("M3 FLEX game QA passed: " + checks + " checks; " + pending.length + " review videos indexed.");
