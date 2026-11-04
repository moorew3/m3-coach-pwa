import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {FLEX_COACH_NAME, FLEX_FOCUS_OPTIONS, flexCoachCue, isFlexExcludedExercise} from "../src/lib/flex-coach.ts";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const scope={window:{}};
vm.runInNewContext(read("public/recovery-coach/scene-library.js"),scope);
const scenes=scope.window.M3_FLEX_SCENE_LIBRARY;
const source=read("src/components/UnifiedWorkoutDashboard.tsx");
const original=JSON.parse(read("approved-recovery-media.json")).items.filter(x=>x.type==="video"&&x.approvedSource);

test("one clean dashboard exposes all original and recorded videos, including previous archived approvals",()=>{
 assert.equal(original.length,7);
 assert.equal(scenes.length,80);
 assert.ok(scenes.filter(x=>x.video).length>=76);
 assert.equal(scenes.filter(x=>x.status==="archived-approved-link").length,2);
 for(const id of ["m3-workout-select","m3-video-category","m3-video-select","m3-flex-video","m3-show-approved","m3-show-unapproved"])
   assert.ok(source.includes('data-testid="'+id+'"'),id);
 assert.match(source,/scene-library\.js/);
 assert.match(source,/archived-approved-link/);
});
test("owner can explicitly approve or undo any available review video; audio-less clips stay visual only",()=>{
 for(const needle of ['REVIEW_KEY = "m3-flex-review-approval-v1"','data-testid="m3-approve-video"','localStorage.setItem(REVIEW_KEY',
  'video: item.video, audio: item.audio','if (!item.video || !validMedia(item.video) || item.status === "held"'])
   assert.ok(source.includes(needle),needle);
 assert.match(source,/Visual approval only; not a guided session/);
 assert.match(source,/Undo my approval/);
 const backup=read("public/recovery-coach/full-backup/index.html");
 assert.match(backup,/HG-\[a-f0-9\]/);
 assert.match(backup,/entry.audio===null\|\|validReviewUrl\(entry.audio\)/);
});
test("Flex is coach, anatomy guide, recovery-aware mentor, and nutrition guide — not a claimed licensed PT",()=>{
 assert.equal(FLEX_COACH_NAME,"Flex");
 assert.deepEqual(FLEX_FOCUS_OPTIONS.map(x=>x.value),["strength","anatomy","recovery","nutrition","mentor"]);
 for(const focus of FLEX_FOCUS_OPTIONS.map(x=>x.value))
  assert.ok(flexCoachCue(focus,"Seated hammer curls").length>50,focus);
 assert.match(flexCoachCue("recovery","Seated hammer curls"),/physical-therapy diagnosis/);
 assert.match(source,/Flex combines training and recovery-informed education/);
});
test("active V2 excludes squats and leg press but retains other movements and historical catalog",()=>{
 assert.equal(isFlexExcludedExercise("Back Squat"),true);
 assert.equal(isFlexExcludedExercise("Leg Press"),true);
 assert.equal(isFlexExcludedExercise("Bench Press"),false);
 assert.equal(isFlexExcludedExercise("Lateral Raise"),false);
 assert.equal(isFlexExcludedExercise("Seated Row"),false);
 const catalog=read("src/v2/catalog.ts");
 assert.match(catalog,/V2_ARCHIVED_WORKOUTS/);
 assert.match(catalog,/exercise.id !== "back-squat" && exercise.id !== "leg-press"/);
 assert.match(catalog,/name: "Leg Extension"/);
});
