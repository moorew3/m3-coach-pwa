import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const media=JSON.parse(readFileSync(new URL("../approved-recovery-media.json",import.meta.url),"utf8"));
const script=source.match(/<script>([\s\S]*?)<\/script>/)?.[1];

test("visual-first recovery preserves the same approved Flex videos and Marcus audio",()=>{
 assert.equal(media.items.length,16);
 assert.equal(media.items.filter(x=>x.type==="video"&&x.approvedSource).length,7);
 for(const item of media.items)assert.ok(source.includes(item.file),
   "Approved source missing: "+item.id+" "+item.file);
 assert.doesNotMatch(source,/speechSynthesis\.speak\(/);
 assert.match(source,/id="marcusTestAudio"/);
 assert.match(source,/id="coachVideo"/);
 assert.match(source,/id="coachVoice"/);
});
test("initial first screen is the real moving approved Flex video, not a placeholder",()=>{
 assert.match(source,/id="videoBox"[^>]*><button type="button" id="videoPreviewCTA"/);
 assert.match(source,/<video id="coachVideo"/);
 assert.match(source,/id="videoPreviewCTA"/);
 assert.match(source,/id="textBox" class="guidePlaceholder hidden"|class="guidePlaceholder hidden" id="textBox"/);
 const player=source.indexOf('<section class="player" aria-label="Current guided activity">');
 const tv=source.indexOf('<section class="tvLaunch"');
 assert.ok(player>0 && tv>player,"The TV setup must not bury the trainer beneath lengthy instructions");
 assert.ok(source.indexOf('id="videoBox"',player)<source.indexOf('id="marcusStage"',player));
 assert.ok(source.indexOf('id="emergencyStop"')<player,"Emergency Stop remains in front of coaching");
 assert.ok(source.indexOf('id="clearance"')>player,"Required clearance is retained");
 assert.ok(source.indexOf('id="advancedLibrary"')>player);
});
test("advanced candidate scenes are collapsed on entry but deep links re-open the same originals",()=>{
 assert.match(source,/<details id="advancedLibrary"/);
 assert.doesNotMatch(source,/<details id="advancedLibrary"[^>]*\bopen\b/);
 assert.match(source,/window\.addEventListener\("hashchange",revealLinkedReview\)/);
 assert.match(source,/if\(panel\)panel\.open=true/);
 for(const selector of ["allScenesCatalog","sceneGrid","sceneApprovalControls","rowingCardio","benchCoreProgram"])
  assert.match(source,new RegExp('id="'+selector+'"'));
 assert.match(source,/C13–C23/);
 assert.match(source,/id="inspectRowing"/);
});
test("active A and B subset labels are truthful and never claim completed coach film sequences",()=>{
 assert.match(source,/Workout A · Approved subset/);
 assert.match(source,/Workout B · Approved subset/);
 assert.match(source,/A:"Workout A is a partial preview/);
 assert.match(source,/B:"Workout B is a partial preview/);
});
test("visual CTA delegates to existing approved preview logic, not autoplay or new completion",()=>{
 assert.match(source,/videoPreviewCTA"\)\.addEventListener\("click",\(\)=>\{if\(!\$\("preview"\)\.disabled\)\$\("preview"\)\.click\(\)\}/);
 assert.match(source,/previewReturnMode=mode/);
 assert.match(source,/if\(!safetyOkay\(\)\)\{/);
 assert.match(source,/mode==="preview"\?\(previewReturnMode/);
 assert.match(source,/id="emergencyStop"/);
 assert.match(source,/#emergencyStop\{position:sticky/);
 assert.doesNotMatch(source,/<video[^>]*autoplay/);
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script));
});
