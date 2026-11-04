import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const root=new URL("../",import.meta.url);
const player=readFileSync(new URL("public/recovery-coach/index.html",root),"utf8");
const html=readFileSync(new URL("src/routes/index.tsx",root),"utf8");
const librarySource=readFileSync(new URL("public/recovery-coach/scene-library.js",root),"utf8");
const packages=readFileSync(new URL("scripts/package-static-recovery-preview.py",root),"utf8");
const match=librarySource.match(/^window\.M3_FLEX_SCENE_LIBRARY=(\[[\s\S]*?\]);/m);
assert.ok(match,"Original scene library assignment must be parseable");
const scenes=JSON.parse(match[1]);

test("one existing app provides Recovery, A, B and old weekly workout choice without another project",()=>{
  assert.match(html,/data-testid="m3-unified-workout-picker"/);
  assert.match(html,/to="\/recovery" search=\{\{ program: "recovery" \}\}/);
  assert.match(html,/to="\/recovery" search=\{\{ program: "A" \}\}/);
  assert.match(html,/to="\/recovery" search=\{\{ program: "B" \}\}/);
  assert.match(html,/onClick=\{requestLegacyCoach\}/);
  assert.match(player,/id="unifiedWorkoutChooser"/);
  assert.match(player,/data-workout="recovery"/);
  assert.match(player,/data-workout="A"/);
  assert.match(player,/data-workout="B"/);
  assert.match(player,/const APPROVED_WORKOUT_CHOICES=/);
  assert.match(player,/const queryProgram=new URLSearchParams\(location\.search\)/);
  assert.match(player,/program:activeWorkout/);
});

test("single app contains all retrieved completed HeyGen scenes and actual archived Flow approvals",()=>{
  assert.ok(scenes.length>=75,"Expected both HeyGen accounts, old archive and all C13-C23 renders");
  for(const id of ["C13","C14","C15","C16","C17","C18","C19","C20","C21","C22","C23"]){
    assert.equal(scenes.filter(x=>x.id===id).length,1,"Missing restored and uniquely named draft "+id);
  }
  assert.ok(scenes.some(x=>x.source==="HeyGen primary"&&/BIG FLEX/i.test(x.name)),"Missing original BIG FLEX workouts");
  assert.ok(scenes.some(x=>x.source==="HeyGen backup"),"Missing connected backup scenes");
  assert.ok(scenes.some(x=>x.source==="Google Flow"&&x.name.includes("lateral raises")),"Missing archive-approved Flow lateral raise");
  assert.ok(scenes.some(x=>x.source==="Google Flow"&&x.name.includes("boxing")),"Missing archive-approved Flow boxing");
  assert.ok(scenes.some(x=>x.source==="Google Drive"&&x.external.includes("1wLS6ufEZ2fe5ZiD_bloiYITPE65DoEy0")),"Missing original Drive seated curl reference");
  assert.match(player,/id="sceneGrid"/);
  assert.match(player,/id="sceneFilter"/);
  assert.match(player,/id="sceneReviewVideo"/);
  assert.match(player,/<script src="\.\/scene-library\.js"><\/script>/);
});

test("review-only completed footage cannot be silently substituted for the seven locked media or credited as athlete reps",()=>{
  assert.equal(scenes.filter(x=>x.status==="owner-review").length>0,true);
  assert.match(player,/stages\[1\]\.items=APPROVED_WORKOUT_CHOICES\[choice\]\.map\(id=>APPROVED_BY_ID\.get\(id\)\)/);
  assert.match(player,/Existing completed scene \/ review/);
  assert.match(player,/This original scene is visible, but has not automatically replaced a locked approved workout video/);
  assert.match(player,/if\(mode==="running"\|\|mode==="rest"\)pause\(\)/);
  assert.match(player,/for\(const check of document\.querySelectorAll\("#clearance \.check"\)\)check\.checked=false/);
  assert.match(player,/localStorage\.removeItem\(PROGRESS_KEY\)/);
  assert.match(packages,/"recovery-coach\/scene-library\.js"/);
});
