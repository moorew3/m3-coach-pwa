/** Regression for audio-video coupled *accepted Marcus segment* behavior.
 * Uses fake HTMLAudioElement so no credits, provider requests or speaker substitute.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const path = fileURLToPath(new URL("../src/lib/marcus-approved-cues.ts",import.meta.url));
const source = readFileSync(path,"utf8");
const output = ts.transpileModule(source,{
  fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const module = {exports:{}};
class FakeAudio {
  static instances=[];
  constructor(){
    this.src=""; this.paused=true; this.readyState=0;
    this.duration=70; this.position=0; this.playCount=0; this.pauseCount=0;
    FakeAudio.instances.push(this);
  }
  get currentTime(){return this.position}
  set currentTime(n){
    this.position=n;
    queueMicrotask(()=>this.onseeked?.());
  }
  load(){
    if(!this.src)return;
    queueMicrotask(()=>{
      this.readyState=1;
      this.onloadedmetadata?.();
      this.oncanplay?.();
    });
  }
  play(){this.paused=false;this.playCount++;return Promise.resolve()}
  pause(){this.paused=true;this.pauseCount++}
  removeAttribute(k){if(k==="src")this.src=""}
}
const actualAudio=globalThis.Audio;
globalThis.Audio=FakeAudio;
new Function("module","exports",output)(module,module.exports);
const api=module.exports;
const sleep=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
let n=0;
async function check(name,fn){await fn();n++;console.log("PASS",name)}
try{
 await check("approved technique is available for all 11 recovery movement IDs",()=>{
  for(const k of ["lateralRaise","hammerCurl","shrugs","tricepsPressdown","shadowboxPunches","chestPress",
    "frontRaise","alternatingCurl","bandPullApart","breathing","cooldownBreathing"]){
    const clip=api.getMarcusCue("test:"+k,k,0);
    assert.ok(clip,k);assert.ok(clip.end>clip.start,k);
  }
 });
 await check("no generic fallback voice for unapproved exercise",()=>{
  assert.equal(api.getMarcusCue("x","unapprovedSquat",0),null);
 });
 await check("first set starts only after metadata with correct technique start",async()=>{
  assert.equal(api.playMarcusWorkCue("A:0","hammerCurl",0),true);
  const a=FakeAudio.instances.at(-1);
  assert.equal(a.playCount,0);
  await sleep();
  assert.equal(a.currentTime,8.42);
  assert.equal(a.playCount,1);
 });
 await check("video pause immediately pauses Marcus preserving same time",()=>{
  const a=FakeAudio.instances.at(-1);
  a.currentTime=10.15;
  api.pauseMarcusWorkCue();
  assert.equal(a.paused,true);
  assert.equal(a.currentTime,10.15);
 });
 await check("resume uses SAME recording and cursor; no overlapping copy",async()=>{
  const a=FakeAudio.instances.at(-1),count=FakeAudio.instances.length;
  assert.equal(api.playMarcusWorkCue("A:0","hammerCurl",0),true);
  await sleep();
  assert.equal(FakeAudio.instances.length,count);
  assert.equal(a.currentTime,10.15);
  assert.equal(a.paused,false);
 });
 await check("new set cancels first technique and waits for later-set seek",async()=>{
  const old=FakeAudio.instances.at(-1);
  assert.equal(api.playMarcusWorkCue("A:1","hammerCurl",1),true);
  const next=FakeAudio.instances.at(-1);
  assert.notEqual(next,old);
  assert.equal(old.paused,true);
  assert.equal(next.playCount,0);
  await sleep();
  assert.equal(next.currentTime,0.28);
  assert.equal(next.playCount,1);
 });
 await check("second/third/fourth rounds use distinct approved short segments",()=>{
  assert.deepEqual([1,2,3].map(i=>api.getMarcusCue("A:"+i,"hammerCurl",i).start),[0.28,5.66,8.57]);
 });
 await check("finished clip cannot replay just because video loops",async()=>{
  const a=FakeAudio.instances.at(-1);
  a.currentTime=5.36;a.ontimeupdate?.();
  assert.equal(a.paused,true);
  const count=a.playCount;
  api.playMarcusWorkCue("A:1","hammerCurl",1);
  await sleep();
  assert.equal(a.playCount,count);
 });
 await check("rest stops the recording and clears the source",()=>{
  const a=FakeAudio.instances.at(-1);
  api.stopMarcusWorkCue();
  assert.equal(a.paused,true);
  assert.equal(a.src,"");
 });
 await check("video stops during slow metadata load: cue never leaks",async()=>{
  api.playMarcusWorkCue("B:1","chestPress",2);
  const a=FakeAudio.instances.at(-1);
  api.pauseMarcusWorkCue();
  await sleep();
  assert.equal(a.playCount,0);
  api.stopMarcusWorkCue();
 });
 await check("voice ID stays the exact approved Marcus choice",()=>{
  assert.equal(api.MARCUS_VOICE_ID,"0fadce1e82af494a93873aa38ea8d106");
 });
 console.log("PASSED",n,"video-locked Marcus phrase checks. Fake audio, not real Samsung speakers.");
}finally{api.stopMarcusWorkCue();globalThis.Audio=actualAudio}
