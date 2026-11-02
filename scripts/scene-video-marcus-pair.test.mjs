import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const from=html.indexOf("function approvalMatchesScene(item){");
const to=html.indexOf("function reviewedScene(id){",from);
assert.ok(from>=0&&to>from,"Bound media approval helpers must exist");
const factory=new Function("getSceneApprovals",html.slice(from,to)+"\nreturn {approvalMatchesScene,approvalNeedsReview};");
const candidate={id:"C17",video:"https://example.org/approved-c17.mp4",audio:"https://example.org/approved-marcus-c17.mp3"};

test("exact moving scene and matching Marcus narration are both required",()=>{
 const gate=factory(()=>({C17:{video:candidate.video,audio:candidate.audio,reviewedAt:"2026-10-25T00:00:00Z"}}));
 assert.equal(gate.approvalMatchesScene(candidate),true);
 assert.equal(gate.approvalNeedsReview(candidate),false);
 assert.equal(gate.approvalMatchesScene({...candidate,audio:"https://example.org/other.mp3"}),false);
 assert.equal(gate.approvalNeedsReview({...candidate,audio:"https://example.org/other.mp3"}),true);
 assert.equal(gate.approvalMatchesScene({...candidate,video:"https://example.org/other.mp4"}),false);
});
test("historical video-only approvals are preserved but require explicit audio review",()=>{
 const gate=factory(()=>({C17:candidate.video}));
 assert.equal(gate.approvalMatchesScene(candidate),false);
 assert.equal(gate.approvalNeedsReview(candidate),true);
 assert.match(html,/Previous approval saved · Re-review exact video \+ Marcus audio/);
});
test("audio-less or unapproved scenes never become timed workouts",()=>{
 const gate=factory(()=>({C17:{video:candidate.video,audio:candidate.audio}}));
 assert.equal(gate.approvalMatchesScene({...candidate,audio:null}),false);
 assert.equal(gate.approvalMatchesScene({id:"C16",video:candidate.video,audio:candidate.audio}),false);
 assert.match(html,/else approvals\[scene.id\]=\{video:scene.video,audio:scene.audio,reviewedAt:new Date\(\).toISOString\(\)\}/);
 assert.match(html,/if\(!scene\?\.video\|\|!scene.audio\|\|!OPTIONAL_SCENE_IDS.has\(scene.id\)\)return/);
});
