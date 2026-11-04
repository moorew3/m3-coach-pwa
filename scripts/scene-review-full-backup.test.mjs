import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page=readFileSync(new URL("../public/recovery-coach/full-backup/index.html",import.meta.url),"utf8");
const start=page.indexOf("function validReviewUrl(s){");
const end=page.indexOf("function validRecord(x){",start);
assert.ok(start>=0&&end>start,"Scene-review backup validation is required");
const reviewIds=new Set(["C14","C15","C17","C18","C19","C22","C23"]);
const validate=new Function("isObject","REVIEW_IDS",page.slice(start,end)+"return validSceneApprovals;")(
  v=>!!v&&typeof v==="object"&&!Array.isArray(v),reviewIds
);
const pair={video:"https://resource2.heygen.ai/videos/example.mp4",audio:"https://resource2.heygen.ai/text_to_speech/example.mp3",reviewedAt:"2026-10-25T00:00:00.000Z"};

test("a new encrypted backup includes scene-review records and restores them only to an empty app",()=>{
 for(const token of [
  'K_REVIEW="m3-flex-review-approval-v1"',
  'if(payload.sceneApprovals!==undefined&&!validSceneApprovals(payload.sceneApprovals))',
  "lastSession:last??null,sceneApprovals",
  '!localStorage.getItem(K_REVIEW)',
  "localStorage.setItem(K_REVIEW,rawReviews)",
  "localStorage.removeItem(K_REVIEW)"
 ])assert.ok(page.includes(token),token);
 assert.equal(validate({C17:pair}),true);
});
test("prior version encrypted backups remain compatible without saved scene approvals",()=>{
 assert.match(page,/payload.sceneApprovals!==undefined/);
 assert.match(page,/backup.sceneApprovals===undefined\?null/);
 assert.equal(validate({}),true);
});
test("historical video-only decisions remain stored for explicit reapproval",()=>{
 assert.equal(validate({C17:pair.video}),true);
 assert.equal(validate({C17:{...pair,audio:undefined}}),false);
});
test("reject malformed, extraneous, or off-policy approvals",()=>{
 assert.equal(validate({C13:pair}),false);
 assert.equal(validate({C16:pair}),false);
 assert.equal(validate({C17:{...pair,video:"javascript:alert(1)"}}),false);
 assert.equal(validate({C17:{...pair,unexpected:3}}),false);
 assert.equal(validate(Object.fromEntries([...reviewIds,"C24"].map(id=>[id,pair]))),false);
});
