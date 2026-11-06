#!/usr/bin/env node
/**
 * M3 FLEX phone-voice regression test.
 * Tests the device reader directly without any microphone, generated Marcus
 * voice, network traffic or paid calls.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/flex-answer-audio.ts", import.meta.url), "utf8");
const component = readFileSync(new URL("../src/components/FlexCoachCommand.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics || []).filter(x => x.category === ts.DiagnosticCategory.Error).length, 0);
let checks = 0;
const verify = (name, pass) => { assert.ok(pass, name); checks++; };

let utterances = [], cancels = 0, resumed = 0, watchdog, nextTimer = 1;
const fakeSpeech = {
  cancel() { cancels++; },
  resume() { resumed++; },
  speak(utterance) { utterances.push(utterance); },
};
class FakeUtterance {
  constructor(text) { this.text = text; }
}
const globals = {
  window: { speechSynthesis: fakeSpeech },
  SpeechSynthesisUtterance: FakeUtterance,
  exports: {},
  setTimeout(fn) { watchdog = fn; return nextTimer++; },
  clearTimeout() { watchdog = null; },
};
vm.runInNewContext(compiled.outputText, globals, { timeout: 1000 });
const { splitFlexSpeech, speakFlexAnswer, stopFlexSpeech, flexDeviceVoiceAvailable } = globals.exports;

verify("Device reader available", flexDeviceVoiceAvailable());
verify("No empty utterance", splitFlexSpeech(" ").length === 0);
const chunks = Array.from(splitFlexSpeech(("Protein 60 grams. " + "Food guidance. ").repeat(18)));
verify("Long response is chunked", chunks.length >= 3 && chunks.every(x => x.length <= 185));
let started = 0, finished = 0, errors = [], sequence = [];
verify("Speech accepted", speakFlexAnswer("Hello, coach. A second sentence.",
  { onStart: () => { started++; sequence.push("start"); },
    onDone: () => { finished++; sequence.push("done"); },
    onError: x => errors.push(x) }));
verify("Don't claim audio until onstart", started === 0 && !!utterances[0]);
utterances[0].onstart();
verify("Speaker begins after audible start", started === 1);
utterances[0].onend();
verify("Speech finishes", finished === 1 && errors.length === 0);
verify("Only device voice used", utterances[0].lang === "en-US" && resumed > 0);

utterances = []; errors = []; finished = 0; started = 0;
speakFlexAnswer(("A complete answer includes protein and calories. ").repeat(9), {
  onStart: () => started++, onDone: () => finished++, onError: x => errors.push(x),
});
let i = 0;
while (i < utterances.length) {
  utterances[i].onstart();
  utterances[i].onend();
  i++;
  assert.ok(i < 40, "speech should terminate");
}
verify("Chunked answer fully spoken", finished === 1 && errors.length === 0 && utterances.length >= 2);

utterances = []; let failed = "";
speakFlexAnswer("This should have a voice error.", { onError: x => failed = x });
verify("Watchdog attached", typeof watchdog === "function");
watchdog();
verify("Silent browser reports error instead of pretending", failed.includes("did not start"));
verify("No generated voice endpoint", !source.includes("/api/public/coach-speech") && !source.includes("fetch("));
verify("User can test sound in real interface", component.includes('data-testid="flex-sound-test"'));
verify("User can replay answers", component.includes('data-testid="flex-hear-answer"'));
verify("Sound preference visible", component.includes('data-testid="flex-voice-output-toggle"'));
verify("Microphone pauses while speaking", component.includes("spokenQuestion && wantMic.current") && component.includes("stopListening()"));
verify("Label says phone voice, not Marcus", component.includes("phone's voice (not Marcus)") && component.includes("not Marcus"));
stopFlexSpeech();
verify("Stop sends cancel to reader", cancels >= 2);

console.log("M3 FLEX phone voice QA passed: " + checks + " checks.");
