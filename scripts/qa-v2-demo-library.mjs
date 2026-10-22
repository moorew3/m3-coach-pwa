/**
 * Source/manifest integrity gate for original /v2's recovery demonstration mode.
 * This is not an Android playback test. No accounts, uploads or deployments.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const read = (path) => readFileSync(fileURLToPath(new URL("../" + path, import.meta.url)), "utf8");
const manifest = JSON.parse(read("src/data/recovery/m3-flex-approved-media-staging.json"));
const component = read("src/components/RecoveryExerciseDemonstrations.tsx");
const route = read("src/routes/v2.tsx");
const ids = new Set();
let checks = 0;
const check = (name, callback) => { callback(); checks++; console.log("PASS", name); };
check("11 owned and previously accepted preview clips", () => {
  assert.equal(manifest.clips.length, 11);
  for (const clip of manifest.clips) {
    assert.equal(clip.ownerApproved, true, clip.id);
    assert.equal(clip.previewAllowed, true, clip.id);
    assert.equal(clip.releaseReady, false, clip.id);
    assert.equal(clip.originalProtected, true, clip.id);
    assert.equal(typeof clip.videoUrl, "string");
    assert.match(clip.videoUrl, /^https:\/\//);
    assert.match(clip.videoUrl, /\.mp4$/);
    assert.equal(ids.has(clip.id), false);
    ids.add(clip.id);
  }
});
check("manifest explicitly forbids production promotion", () => {
  assert.equal(manifest.allReleaseBlocked, true);
  assert.match(manifest.integrationState, /STAGING_NOT_DEPLOYED/);
});
check("approved preview-only video is imported in isolated component", () =>
  assert.match(component, /import approvedManifest from "@\/data\/recovery\/m3-flex-approved-media-staging\.json"/));
check("component excludes non-approved footage", () =>
  assert.match(component, /clip\.ownerApproved === true && clip\.previewAllowed === true/));
check("video starts only after user gesture and remains muted", () => {
  assert.match(component, /autoPlay=\{false\}/);
  assert.match(component, /\n\s+muted\n/);
  assert.match(component, /\n\s+controls\n/);
});
check("each demo has independent source selection", () => {
  assert.match(component, /key=\{selected\.id\}/);
  assert.match(component, /setSelectedId\(clip\.id\)/);
});
check("demo library cannot issue workout reducer actions", () => {
  assert.doesNotMatch(component, /dispatch\(|complete-set|set-reps|set-target-weight/);
});
check("original V2 imports dedicated approved demonstration library", () =>
  assert.match(route, /import \{ RecoveryExerciseDemonstrations \} from "@\/components\/RecoveryExerciseDemonstrations"/));
check("original /v2 displays library ONLY in demonstrations mode", () =>
  assert.match(route, /experience === "demonstrations" && <RecoveryExerciseDemonstrations/));
check("old coach stage is hidden during demo browsing", () =>
  assert.match(route, /experience === "demonstrations"\s*\? "hidden"/));
check("old coach stage cannot simultaneously play in demo mode", () =>
  assert.match(route, /const videoPlaying = session\.running &&/));
check("experience mode switch protects user's session checkpoint", () => {
  assert.match(route, /coachCheckpoint\.current = \{ \.\.\.session, running: false \}/);
  assert.match(route, /dispatch\(\{ type: "restore", session: coachCheckpoint\.current \}\)/);
});
console.log("PASSED", checks, "M3 FLEX V2 preview-only demonstration checks.");
