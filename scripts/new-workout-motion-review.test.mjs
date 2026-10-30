import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const gallery=readFileSync(new URL("../public/recovery-coach/programs/index.html",import.meta.url),"utf8");
const active=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const start="const completedRenderCandidates=",end=";\nconst gridNew=";
const dataStart=gallery.indexOf(start);
assert.ok(dataStart>=0,"Gallery must contain completed render metadata");
const dataEnd=gallery.indexOf(end,dataStart);
assert.ok(dataEnd>dataStart,"Gallery metadata terminator missing");
const candidates=JSON.parse(gallery.slice(dataStart+start.length,dataEnd));
const videoSuffixes=[
"01a16f8c-339a-7124-b525-c7f0b6a8fa54.mp4",
"01a16f8e-bfca-7555-b452-f1178329609a.mp4",
"01a16f8f-0a7c-7f41-89b2-edd855d3d934.mp4",
"01a16f8e-d354-7d92-8874-3806d97d1874.mp4",
"01a16f8d-67d1-764c-b842-cefc9ea64110.mp4",
"01a16f8d-7b6a-7e7e-853a-45f6798791fa.mp4",
"01a16f8d-8edf-7a30-8982-508aa4c6651c.mp4",
"01a16f8d-a2b3-70e0-ad12-3bc88377ae13.mp4",
"01a16f8e-e725-7da7-a8c9-9fc593a984f4.mp4",
"01a16f8e-faec-742c-af30-cd7ba68f5213.mp4",
"01a16f8f-1e09-77d8-867d-f02e2b4d3db0.mp4",
];
test("all 11 real completed HeyGen moving scene renders are isolated for owner review",()=>{
 assert.equal(candidates.length,11);
 assert.deepEqual(candidates.map(c=>c.id),["C13","C14","C15","C16","C17","C18","C19","C20","C21","C22","C23"]);
 assert.ok(candidates.every(c=>c.status==="rendered_review_only"));
 for(let i=0;i<candidates.length;i++){
  const c=candidates[i];
  assert.match(c.video,/^https:\/\/resource2\.heygen\.ai\/videos\/.+\.mp4$/);
  assert.ok(c.video.endsWith(videoSuffixes[i]),"Wrong source for "+c.id);
  assert.ok(!active.includes(c.videoId),"Unapproved render ID must not be active: "+c.id);
  assert.ok(!active.includes(videoSuffixes[i]),"Unapproved draft never added to Recovery Coach: "+c.id);
 }
 assert.match(gallery,/data-testid="m3-new-heygen-completed-candidates"/);
 assert.match(gallery,/none activated/);
 assert.match(gallery,/NOT owner-approved/);
});
test("exact Marcus Warm & Friendly English is the only voice in seven review clips",()=>{
 assert.equal(candidates.filter(c=>!!c.audio).length,7);
 assert.equal(candidates.filter(c=>!c.audio).length,4);
 for(const c of candidates.filter(c=>c.audio)){
  assert.match(c.audio,/^https:\/\/resource2\.heygen\.ai\/text_to_speech\/2f2323079d3c414087f76bbfd67fb0f5\/0fadce1e82af494a93873aa38ea8d106\/id=.*\.wav$/);
 }
 assert.match(gallery,/media\.muted=true/);
 assert.match(gallery,/media\.loop=true/);
 assert.match(gallery,/narration\.addEventListener\("ended"/);
 assert.match(gallery,/Marcus speech cue unavailable for this draft/);
 assert.doesNotMatch(gallery,/audio\.autoplay=true|voiceSettings/);
});
test("camera/video clips are review only until biomechanics, equipment, avatar face and cast get explicit approval",()=>{
 for(const c of candidates)assert.ok(c.qa.length>=20);
 assert.match(gallery,/Nothing in this review page changes the active workouts/);
 assert.match(gallery,/No substitute voice/);
 assert.match(gallery,/original face, white LEFT cast/);
 assert.match(gallery,/not proof of human exercise reps/);
});
