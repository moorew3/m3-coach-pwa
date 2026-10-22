/**
 * Owner-required Marcus identity / playback safeguards in original V2.
 * Static guardrail; this does not verify actual device output or lip-sync.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const load = (p) => readFileSync(fileURLToPath(new URL("../" + p, import.meta.url)), "utf8");
const route = load("src/routes/v2.tsx");
const cue = load("src/v2/marcus-trainer-audio.ts");
const speech = load("src/v2/detailed-exercise-speech.ts");
const motion = load("src/components/CoachMotion.tsx");
let count=0;
const check=(name,run)=>{run();count++;console.log("PASS",name)};
check("live coach answers never invoke unapproved device TTS",()=>{
  assert.doesNotMatch(route, /speakCoachReply\s*\(/);
  assert.doesNotMatch(route, /speakThroughLiveFlex\s*\(/);
});
check("no temporary-device-voice playback control",()=>{
  assert.doesNotMatch(route,/Replay answer aloud|temporary device voice/i);
});
check("owner explicitly sees text-only response before real-time Marcus",()=>
  assert.match(route,/Live spoken replies require the approved Marcus voice connection/));
check("recorded trainer route maps only preapproved Marcus recordings",()=>
  assert.match(cue,/MARCUS_TRAINER_RECORDINGS/));
check("arbitrary work speech cannot use browser synthesizer",()=>
  assert.doesNotMatch(speech,/\.speechSynthesis\.speak\(/));
check("recorded coach instructions require actual video playback",()=>
  assert.match(route,/session\.phase === "work" && actualWorkVideoPlaying/));
check("video stall and pause send playback false",()=>{
  assert.match(motion,/onWaiting=\{\(\) => \{ setIsPlaying\(false\); onPlaybackChange\?\.\(false\)/);
  assert.match(motion,/onPause=\{\(\) => \{ setIsPlaying\(false\); onPlaybackChange\?\.\(false\)/);
});
check("V2's core exercise clock requires actual video",()=>
  assert.match(route,/needsVisibleWorkVideo && !actualWorkVideoPlaying/));
console.log("PASSED",count,"Marcus-only source safeguards. Physical phone playback remains unverified.");
