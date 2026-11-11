import './ts-test-loader.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const {READY_VIDEO_WORKOUTS,footageLaneFor}=await import('../src/v2/ready-workout-programs.ts');
const {workoutsForApp}=await import('../src/v2/unified-workouts.ts');
const {exerciseScene}=await import('../src/v2/training-scenes.ts');
const {castCoachScript}=await import('../src/v2/cast-coach-voice.ts');
const canon=await import('../src/data/coach-identity.ts');
const read=p=>readFileSync(new URL(p,root),'utf8');

test('six complete video-backed workout programs are separated by cast outfit',()=>{
 assert.equal(READY_VIDEO_WORKOUTS.length,6);
 assert.equal(READY_VIDEO_WORKOUTS.filter(x=>x.footageLane==='cast').length,3);
 assert.equal(READY_VIDEO_WORKOUTS.filter(x=>x.footageLane==='no-cast').length,3);
 assert.equal(new Set(READY_VIDEO_WORKOUTS.map(x=>x.id)).size,6);
 for(const w of READY_VIDEO_WORKOUTS){
   assert.equal(w.requiresClearance,true,w.id);
   assert.ok(w.exercises.length>=4,w.id);
   for(const e of w.exercises){
     const media=exerciseScene(e);
     assert.ok(media?.url,w.id+'/'+e.id+' requires exact video');
     assert.ok(e.cues.length>=3,e.name);
     assert.ok(e.sets>=1,e.name);
     assert.ok(e.restSeconds>=0,e.name);
     if(w.footageLane==='cast'){
       assert.ok(e.sceneId?.startsWith('C'),e.name);
       assert.ok(e.motionKey.startsWith('cast-'),e.name);
       assert.ok(!media.url.includes('lovable.app'),e.name);
       assert.ok(/cast/i.test(e.name),e.name);
       assert.ok(/left/i.test(e.cues.join(' ')),e.name);
       assert.ok(castCoachScript(e)?.toLowerCase().includes('cast'),e.id);
       assert.ok(castCoachScript(e)?.length<=350,e.id);
     }else{
       assert.equal(e.sceneId,undefined,e.id);
       assert.ok(!e.motionKey.startsWith('cast-'),e.id);
       assert.ok(canon.coachMotionFor(e.motionKey)?.url,e.name);
       assert.ok(!e.name.toLowerCase().includes('cast'),e.id);
       assert.ok(e.cues.some(x=>x.toLowerCase().includes('exhale')||x.toLowerCase().includes('breathe')),e.id);
     }
   }
 }
});
test('no blank or unidentified footage is allowed in live workout selector',()=>{
 const live=workoutsForApp({savedWorkouts:[],days:{}});
 for(const w of READY_VIDEO_WORKOUTS)assert.ok(live.some(x=>x.id===w.id),w.id);
 for(const w of live){
  assert.ok(w.exercises.length>0,w.id);
  for(const e of w.exercises)assert.ok(exerciseScene(e)?.url,w.id+' '+e.name);
 }
 assert.equal(footageLaneFor('ready-cast-a'),'cast');
 assert.equal(footageLaneFor('ready-no-cast-push'),'no-cast');
 assert.equal(footageLaneFor('recovery'),undefined);
});
test('one native Coach/Hologram player enforces English Marcus and excludes empty stages',()=>{
 const player=read('src/routes/v2.tsx');
 const voice=read('src/v2/cast-coach-voice.ts');
 const source=read('src/v2/unified-workouts.ts');
 assert.ok(player.includes('READY_VIDEO_WORKOUTS[0].id'),'default to footage rather than blank');
 assert.ok(player.includes('muted={true}'),'video must not leak wrong original narrator');
 assert.ok(player.includes('speakCastCoach(exercise,controller.signal)'),'cast script tied to current exercise');
 assert.ok(voice.includes('requestMarcusLiveSpeech(text,signal)'),'saved Marcus voice ID contract');
 assert.ok(!voice.includes('speechSynthesis'),'never substitute a phone voice');
 assert.ok(player.includes('Non-cast workout clearance'),'no cast cannot be prescribed during non-weight-bearing');
 assert.ok(player.includes('failedVideoUrls.current.add(failed)'),'broken clips tracked');
 assert.ok(player.includes('dispatch({type:"pause"})'),'no false completed reps on failure');
 assert.ok(source.includes('exercises:w.exercises.filter(ex=>Boolean(exerciseScene(ex)?.url))'),'empty clips omitted without deleting original');
});
