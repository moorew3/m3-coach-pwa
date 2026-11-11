import './ts-test-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {READY_VIDEO_WORKOUTS}=await import('../src/v2/ready-workout-programs.ts');
const {REST_SCENE,COOLDOWN_SCENE,sceneForSession}=await import('../src/v2/training-scenes.ts');
const {sceneContractFor}=await import('../src/v2/scene.ts');
const {createV2Session,v2SessionReducer}=await import('../src/v2/session.ts');

test('no-cast rest and completion cannot display a left-cast breathing scene',()=>{
 for(const workout of READY_VIDEO_WORKOUTS.filter(w=>w.footageLane==='no-cast')){
  const repeated=workout.exercises.findIndex(e=>e.sets>1 && e.restSeconds>0);
  assert.ok(repeated>=0,workout.id+' must contain a multi-set exercise');
  let s={...createV2Session(workout),exerciseIndex:repeated};
  s=v2SessionReducer(s,{type:'start'});
  s=v2SessionReducer(s,{type:'complete-set'});
  assert.equal(s.phase,'rest',workout.id);
  const rest=sceneForSession(s);
  assert.equal(rest.role,'rest');
  assert.equal(rest.media,undefined,workout.id);
  assert.equal(rest.missing,false,'rest is not a missing exercise demonstration');
  assert.equal(sceneContractFor(s).motionKey,'idle','rig must never exercise during rest');
  const left=s.phaseSecondsLeft;
  s=v2SessionReducer(s,{type:'tick'});
  assert.equal(s.phaseSecondsLeft,left-1,'rest must count without an unrelated video');
  const done={...s,phase:'complete',running:false};
  assert.equal(sceneForSession(done).media,undefined);
  assert.equal(sceneForSession(done).missing,false);
  assert.equal(sceneContractFor(done).motionKey,'idle');
 }
});

test('approved LEFT-CAST recovery rest and cooldown stay unchanged',()=>{
 for(const workout of READY_VIDEO_WORKOUTS.filter(w=>w.footageLane==='cast')){
  const original=createV2Session(workout);
  const rest={...original,phase:'rest',running:true,exerciseIndex:1,phaseSecondsLeft:60};
  const seen=sceneForSession(rest);
  assert.equal(seen.media?.sceneId,REST_SCENE.sceneId);
  assert.equal(seen.playing,true);
  assert.equal(sceneForSession({...rest,running:false}).playing,false);
  assert.equal(sceneForSession({...original,phase:'complete'}).media?.sceneId,COOLDOWN_SCENE.sceneId);
 }
});

test('real-time rig uses the correct exercise only during active sets',()=>{
 const workout=READY_VIDEO_WORKOUTS.find(w=>w.id==='ready-no-cast-boxing');
 let s=createV2Session(workout);
 assert.equal(sceneContractFor(s).motionKey,'idle');
 s=v2SessionReducer(s,{type:'start'});
 assert.equal(sceneContractFor(s).motionKey,workout.exercises[0].motionKey);
 assert.equal(sceneContractFor({...s,running:false}).motionKey,'idle');
 for(const phase of ['ready','warmup','rest','transition','complete'])
  assert.equal(sceneContractFor({...s,phase}).motionKey,'idle',phase);
});

test('one Coach/Hologram interface shows neutral full-body rest, never labels it missing footage',()=>{
 const player=readFileSync(new URL('../src/routes/v2.tsx',import.meta.url),'utf8');
 assert.match(player,/data-testid="noncast-rest-stage"/);
 assert.match(player,/src=\{COACH_REFERENCE\}/);
 assert.match(player,/!stageMedia && !noCastIdlePhase/);
 assert.match(player,/session\.phase === "complete" && footageLaneFor\(session\.workout\.id\)!=="no-cast"/);
 assert.match(player,/data-testid="motion-pending-stage"/,'unapproved exercise still fails closed');
});
