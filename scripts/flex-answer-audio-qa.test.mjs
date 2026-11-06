#!/usr/bin/env node
/**
 * M3 FLEX VOICE IDENTITY / APPROVED-ONLY PLAYBACK GATE
 * No paid synthesis, browser speech, or network calls.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const file = read("src/lib/flex-marcus-audio.ts");
const retired = read("src/lib/flex-answer-audio.ts");
const comp = read("src/components/FlexCoachCommand.tsx");
const manifest = JSON.parse(read("approved-recovery-media.json"));
const compile = ts.transpileModule(file, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }, reportDiagnostics: true });
assert.equal((compile.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
let n = 0;
const check = (label, passes) => { assert.ok(passes, label); n++; };
let created = [], timeouts = new Map(), next = 0;
class FakeAudio {
  constructor(url) { this.src=url; this.paused=true; created.push(this); }
  play() { this.paused=false; return Promise.resolve(); }
  pause() { this.paused=true; }
}
const runtime = {
  exports: {}, window: { Audio: FakeAudio },
  setTimeout(fn) { let key=++next; timeouts.set(key,fn); return key; },
  clearTimeout(id) { timeouts.delete(id); },
};
vm.runInNewContext(compile.outputText, runtime, { timeout: 1500 });
const {MARCUS_VOICE_ID,MARCUS_APPROVED_TEST_URL,playApprovedMarcusTest,stopApprovedMarcus,marcusRecordedAudioAvailable}=runtime.exports;
check("Exactly selected Marcus voice ID", MARCUS_VOICE_ID === "0fadce1e82af494a93873aa38ea8d106");
check("Original audio is approved in media manifest", manifest.items.some(x => x.id==="C09-MARCUS" && x.approvedSource === true && x.url === MARCUS_APPROVED_TEST_URL));
check("Audio supported", marcusRecordedAudioAvailable());
let playing=0,ended=0,errors=[];
check("User-gesture request starts approved audio", playApprovedMarcusTest({onPlaying:()=>playing++,onDone:()=>ended++,onError:e=>errors.push(e)}));
check("Source is original recorded Marcus", created[0].src===MARCUS_APPROVED_TEST_URL);
check("Do not claim sound before playing event", playing===0);
created[0].onplaying();
check("Sound status starts only on verified playing event", playing===1);
created[0].onended();
check("Completion reports finished and releases audio", ended===1 && created[0].paused && errors.length===0);
playing=0;ended=0;errors=[];
playApprovedMarcusTest({onPlaying:()=>playing++,onDone:()=>ended++,onError:e=>errors.push(e)});
created.at(-1).onerror();
check("Broken approved recording shows error, not fallback", errors.length===1 && errors[0].includes("No substitute voice"));
check("Error stops player", created.at(-1).paused);
playApprovedMarcusTest();
const track=created.at(-1);stopApprovedMarcus();
check("Stop works", track.paused);
check("Audio logic contains no TTS synthesizer", !file.includes("speechSynthesis.speak(") && !file.includes("new SpeechSynthesisUtterance") && !file.includes("fetch("));
check("Legacy wrong voice disabled", !retired.includes("speechSynthesis.speak(") && !retired.includes("synth.speak("));
check("No generic text speech is called by the coach UI", !comp.includes("speakFlexAnswer(") && !comp.includes("readAnswer("));
check("Marcus test and stop are on screen", comp.includes('data-testid="flex-sound-test"') && comp.includes('data-testid="flex-stop-marcus"'));
check("Dynamic food replies are clearly not claimed to be spoken", comp.includes("Marcus has not recorded this changing answer"));
check("Approved Marcus remains the only offered voice", comp.includes("Marcus – Warm & Friendly") && !comp.includes("Speaking with your phone's voice"));
console.log("M3 FLEX approved-Marcus-only voice QA passed: " + n + " checks.");
