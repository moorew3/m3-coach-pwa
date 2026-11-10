import './ts-test-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const {ALL_WORKOUTS,RECOVERY_WORKOUTS}=await import('../src/v2/unified-workouts.ts');
const {sceneForSession,exerciseScene,REST_SCENE,COOLDOWN_SCENE,trainingSessionReducer:guardedStep}=await import('../src/v2/training-scenes.ts');
const {createV2Session,v2SessionReducer:step}=await import('../src/v2/session.ts');
const approved=JSON.parse(readFileSync(new URL('../approved-recovery-media.json',import.meta.url))).items;

test('all existing primary programs enter one catalog and expose Coach/Hologram without separate engines',()=>{
 assert.equal(ALL_WORKOUTS.length,18);
 assert.equal(new Set(ALL_WORKOUTS.map(w=>w.id)).size,ALL_WORKOUTS.length);
 for(const id of ['recovery','A','B','weekly-mon','weekly-sun','push-arms','boxing-kickboxing','core-foundation','core-resistance']) assert.ok(ALL_WORKOUTS.some(w=>w.id===id),id);
 const source=readFileSync(new URL('../src/routes/v2.tsx',import.meta.url),'utf8');
 assert.match(source,/aria-label="Workout mode"/);assert.match(source,/<option value="coach">Coach/);assert.match(source,/<option value="hologram">Hologram/);
});
test('every workout and every set uses approved breathing during rest and transition; pausing stops it',()=>{
 let rests=0;
 for(const workout of ALL_WORKOUTS){
  let s=step(createV2Session(workout),{type:'start'});
  for(let i=0;i<1000&&s.phase!=='complete';i++){
   if(s.phase==='work')s=step(s,{type:'complete-set'});
   else {
    const media=sceneForSession(s);
    assert.equal(media.role,'rest',workout.id);assert.equal(media.media.sceneId,'C09-PRE-BREATH-R2');assert.equal(media.playing,true);
    const paused=step(s,{type:'pause'});assert.equal(sceneForSession(paused).playing,false);assert.deepEqual(step(paused,{type:'tick'}),paused);
    const same=step(s,{type:'set-mode',mode:'coach'});assert.equal(same.phaseSecondsLeft,s.phaseSecondsLeft);assert.deepEqual(same.completedSetIds,s.completedSetIds);
    while(s.phase==='rest'||s.phase==='transition')s=step(s,{type:'tick'});
    rests++;
   }
  }
  assert.equal(s.phase,'complete',workout.id);
  assert.equal(sceneForSession(s).media.sceneId,'C10-POST-BREATH-R1');
  assert.equal(sceneForSession(s).playing,true);
  assert.deepEqual(s.setResults,{},'Timers never invent actual reps');
 }
 assert.ok(rests>100);
});
test('Recovery and A/B schedule only their original approved animated clips; guidance-only items remain outside timed steps',()=>{
 for(const workout of RECOVERY_WORKOUTS){
  assert.equal(workout.exercises[0].sceneId,'C09-PRE-BREATH-R2');
  assert.equal(workout.requiresClearance,true);
  assert.equal(workout.exercises.at(-1).sceneId,'C10-POST-BREATH-R1');
  const expectedCount=workout.id==='recovery'?7:workout.id==='A'?4:5;
  assert.equal(workout.exercises.length,expectedCount);
  for(const exercise of workout.exercises){
   const expected=approved.find(x=>x.type==='video'&&x.id===exercise.sceneId);
   assert.ok(expected,exercise.sceneId+' must have owner-approved moving footage');
   assert.equal(exerciseScene(exercise)?.url,expected.url);
  }
 }
 assert.equal(exerciseScene({id:'guidance-only',sceneId:'recovery-0-2',motionKey:'unavailable'}),undefined,'Unapproved C16 cannot run as a timed demo');
 assert.equal(REST_SCENE.url,approved.find(x=>x.id==='C09-PRE-BREATH-R2').url);
 assert.equal(COOLDOWN_SCENE.url,approved.find(x=>x.id==='C10-POST-BREATH-R1').url);
});
test('a missing approved trainer never silently uses a different actor; duplicate completion is ignored',()=>{
 assert.equal(exerciseScene({id:'unknown',motionKey:'not-reviewed'}),undefined);
 let s=createV2Session(ALL_WORKOUTS.find(w=>w.id==='push-arms'));
 assert.deepEqual(step(s,{type:'complete-set'}),s);
 s=step(s,{type:'start'});s=step(s,{type:'complete-set'});
 assert.equal(s.phase,'rest');assert.deepEqual(step(s,{type:'complete-set'}),s);
 const paused=step(s,{type:'pause'});assert.deepEqual(step(paused,{type:'complete-set'}),paused);
});
const {restoreSavedSession}=await import('../src/v2/saved-session.ts');
test('switching workouts or reloading preserves exact rest remaining and keeps each session paused',()=>{
 const workout=ALL_WORKOUTS.find(w=>w.id==='push-arms');
 let s=step(createV2Session(workout),{type:'start'});s=step(s,{type:'complete-set'});s=step(s,{type:'tick'});
 const data=JSON.stringify({version:2,savedOn:'2026-11-08',workoutId:workout.id,session:s});
 const restored=restoreSavedSession(data,workout,'2026-11-08');
 assert.equal(restored.phase,'rest');assert.equal(restored.phaseSecondsLeft,s.phaseSecondsLeft);assert.equal(restored.running,false);assert.deepEqual(restored.completedSetIds,s.completedSetIds);
 assert.equal(sceneForSession(restored).playing,false);
 assert.equal(sceneForSession(step(restored,{type:'start'})).playing,true);
 assert.equal(restoreSavedSession(data,workout,'2026-11-09'),null);
 assert.equal(restoreSavedSession('{bad',workout,'2026-11-08'),null);
});
const {workoutsForApp}=await import('../src/v2/unified-workouts.ts');
test('existing saved and alternate workouts preserve their movements and join the same scene resolver',()=>{
 const e={id:'my-curl',name:'My hammer curl',sets:2,reps:'8–12',rest:45,mirror:'hammerCurl',category:'curl',target:'arms',diagram:'curl'};
 const workouts=workoutsForApp({savedWorkouts:[{id:'mine',name:'My workout',exercises:[e]}],days:{3:{sessionPlan:{title:'My activity',focus:'existing plan',exercises:[e]}}}});
 for(const id of ['saved-mine','session-3']){
  const w=workouts.find(x=>x.id===id);assert.equal(w.exercises[0].motionKey,'hammerCurl');assert.equal(w.exercises[0].sets,2);assert.equal(w.exercises[0].restSeconds,45);
  const s=step(step(createV2Session(w),{type:'start'}),{type:'complete-set'});assert.equal(sceneForSession(s).media.sceneId,'C09-PRE-BREATH-R2');
 }
});
test('Workout B keeps its original press-first order and exact narration is served from the app',async()=>{
 assert.deepEqual(RECOVERY_WORKOUTS.find(w=>w.id==='B').exercises.filter(e=>e.stageRole==='exercise').map(e=>e.sceneId),['C08-PRESS-R3','C03','C04-R2']);
 const {sceneAudio}=await import('../src/v2/training-scenes.ts');
 for(const e of RECOVERY_WORKOUTS[0].exercises){const audio=sceneAudio(e);if(audio)assert.match(audio,/^\/media\/marcus-recovery\//);}
 assert.match(COOLDOWN_SCENE.audioUrl,/^\/media\/marcus-recovery\//);
});

test('missing demonstrations cannot start, tick, auto-complete or count sets in either mode',()=>{
 const original=RECOVERY_WORKOUTS[0];
 // Inject an unapproved exercise into a test-only session to prove fail-closed
 // protection remains effective without forcing it into the real workout.
 const unknown={...original.exercises[1],id:'unreviewed-scene',sceneId:'never-approved',motionKey:'no-movement'};
 const w={...original,exercises:[original.exercises[0],unknown,original.exercises[1]]};
 for(const mode of ['coach','hologram']){
  let s={...createV2Session(w),mode,exerciseIndex:1};
  assert.equal(sceneForSession(s).missing,true);
  assert.deepEqual(guardedStep(s,{type:'start'}),s);
  const stale={...s,phase:'work',running:true,phaseSecondsLeft:1};
  for(const type of ['tick','complete-set']){
   const next=guardedStep(stale,{type});
   assert.equal(next.running,false);assert.equal(next.elapsedSeconds,0);
   assert.deepEqual(next.completedSetIds,[]);assert.equal(next.phaseSecondsLeft,1);
  }
  s=guardedStep({...s,exerciseIndex:0},{type:'start'});
  for(let i=0;i<40&&s.exerciseIndex===0;i++)s=guardedStep(s,{type:'tick'});
  while(s.phase==='transition')s=guardedStep(s,{type:'tick'});
  assert.equal(s.exerciseIndex,1);assert.equal(s.running,false);assert.equal(s.phase,'ready');
  assert.equal(s.completedSetIds.length,1);
  s=guardedStep(s,{type:'next'});
  while(s.phase==='transition')s=guardedStep(s,{type:'tick'});
  assert.equal(s.exerciseIndex,2);assert.equal(s.running,true);
  assert.equal(sceneForSession(s).media.sceneId,'C01-R3');
  assert.equal(s.completedSetIds.length,1,'Skipping unapproved exercise never logs a set');
 }
});
