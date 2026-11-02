import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const start=html.indexOf("function handleUnexpectedMediaPause(kind){");
const end=html.indexOf('video.addEventListener("pause"',start);
assert.ok(start>=0&&end>start,"Unexpected media-pause guard must remain in the original recovery player");
const snippet=html.slice(start,end);
const exercise=new Function("state",[
  "let mode=state.mode,interval=state.interval,video=state.video,audio=state.audio;",
  "const step=()=>state.step;",
  "const playbackError=(msg,source)=>{state.errors.push({msg,source})};",
  snippet,
  "handleUnexpectedMediaPause(state.kind);"
].join("\n"));
function check({kind="video",mode="running",clock=true,withVideo=true,withVoice=true,paused=true,ended=false}={}){
  const state={
    kind,mode,interval:clock?17:null,
    step:{video:withVideo?"immutable-approved-video.mp4":null,voice:withVoice?"approved-marcus.mp3":null},
    video:{paused:kind==="video"?paused:false,ended:kind==="video"?ended:false},
    audio:{paused:kind==="audio"?paused:false,ended:kind==="audio"?ended:false},
    errors:[]
  };
  exercise(state);
  return state.errors;
}

test("unexpected pause during a timed approved Flex video prevents silent completion",()=>{
  const errors=check();
  assert.equal(errors.length,1);
  assert.equal(errors[0].source,"video");
  assert.match(errors[0].msg,/unexpectedly paused/i);
});
test("unexpected pause during required Marcus narration prevents silent completion",()=>{
  const errors=check({kind:"audio"});
  assert.equal(errors.length,1);
  assert.equal(errors[0].source,"audio");
  assert.match(errors[0].msg,/Marcus/i);
});
test("do not mistake application stop, navigation, preview, or safe rest for media failure",()=>{
  assert.equal(check({clock:false}).length,0);
  assert.equal(check({mode:"paused"}).length,0);
  assert.equal(check({mode:"preview"}).length,0);
  assert.equal(check({mode:"rest"}).length,0);
  assert.equal(check({paused:false}).length,0);
});
test("legitimate end of a one-shot Marcus instruction never fails a workout",()=>{
  assert.equal(check({kind:"audio",ended:true}).length,0);
  assert.equal(check({kind:"video",ended:true}).length,0);
  assert.equal(check({kind:"audio",withVoice:false}).length,0);
  assert.equal(check({kind:"video",withVideo:false}).length,0);
});
test("the existing recovery player parses and keeps all approved scene sources untouched",()=>{
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
  for(const source of scripts)assert.doesNotThrow(()=>new Function(source));
  for(const approved of ["C01-R3","C02","C03","C04-R2","C08-PRESS-R3","C09-PRE-BREATH-R2","C10-POST-BREATH-R1"])assert.ok(html.includes(approved));
  assert.ok(html.includes('video.addEventListener("pause"'));
  assert.ok(html.includes('audio.addEventListener("pause"'));
});
