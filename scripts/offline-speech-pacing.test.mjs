import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { scheduledStepSeconds } from "../src/lib/speech-pacing.ts";

test("read-along caps ONLY speech-led transition time at ten seconds", () => {
  assert.equal(scheduledStepSeconds({ seconds: 33, speechPaced: true }, false), 10);
  assert.equal(scheduledStepSeconds({ seconds: 5, speechPaced: true }, false), 5);
  assert.equal(scheduledStepSeconds({ seconds: 33, speechPaced: true }, true), 33);
});

test("rest and workout timing never shorten merely because generated speech is disabled", () => {
  assert.equal(scheduledStepSeconds({ seconds: 120, speechPaced: false }, false), 120);
  assert.equal(scheduledStepSeconds({ seconds: 180 }, false), 180);
  assert.equal(scheduledStepSeconds({ seconds: 45 }, false), 45);
  assert.equal(scheduledStepSeconds({ speechPaced: false }, false), undefined);
  assert.equal(scheduledStepSeconds({ seconds: 0, speechPaced: true }, false), 0);
});

test("premium speech disabled prevents silent network retries at every voice entry", () => {
  const voice = readFileSync(new URL("../src/lib/coach-voice.ts", import.meta.url), "utf8");
  assert.match(voice, /export function paidCoachSpeechEnabled/);
  assert.match(voice, /VITE_FLEX_PAID_AI_ENABLED/);
  assert.match(voice, /export function unlockVoice\([\s\S]*?if \(!paidCoachSpeechEnabled\(\)\)/);
  assert.match(voice, /export function speak\([\s\S]*?if \(!paidCoachSpeechEnabled\(\)\) return;/);
  assert.match(voice, /export function prefetchSpeech\([\s\S]*?if \(!paidCoachSpeechEnabled\(\)\) return;/);
  assert.match(voice, /async function fetchSpeech\([\s\S]*?if \(!paidCoachSpeechEnabled\(\)\)[\s\S]*?fetch\("\/api\/public\/coach-speech"/);
  assert.match(voice, /export async function testCoachAudio\([\s\S]*?if \(!paidCoachSpeechEnabled\(\)\)/);
});

test("session timers and phone UI honor generated-speech-off mode", () => {
  const engine = readFileSync(new URL("../src/lib/coach-session.ts", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/routes/coach.$day.tsx", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../src/components/CoachAudio.tsx", import.meta.url), "utf8");
  assert.match(engine, /const voiceOn = state\.settings\.coachVoice !== false && paidCoachSpeechEnabled\(\);/);
  assert.match(engine, /scheduledStepSeconds\(step, voiceOn\)/);
  assert.match(route, /const voiceOn = state\.settings\.coachVoice !== false && paidCoachSpeechEnabled\(\);/);
  assert.match(route, /data-testid="coach-read-along-mode"/);
  assert.match(route, /generatedEnabled=\{paidCoachSpeechEnabled\(\)\}/);
  assert.match(ui, /data-testid="coach-read-along-badge"/);
  assert.match(ui, /if \(!generatedEnabled\)/);
  assert.doesNotMatch(ui, /read-along-badge[\s\S]{0,100}onClick/);
});

test("none of the approved audio/video sources are replaced by speech-off mode", () => {
  const approved = readFileSync(new URL("../public/recovery-coach/index.html", import.meta.url), "utf8");
  for (const id of [
    "C01-R3", "C02", "C03", "C04-R2", "C08-PRESS-R3",
    "C09-PRE-BREATH-R2", "C10-POST-BREATH-R1",
  ]) {
    assert.ok(approved.includes(id), id + " approved source missing");
  }
});

test("phone, glasses and TV surfaces never demand inactive generated voice", () => {
  const phone = readFileSync(new URL("../src/routes/coach.$day.tsx", import.meta.url), "utf8");
  const glasses = readFileSync(new URL("../src/routes/glasses.tsx", import.meta.url), "utf8");
  const presentation = readFileSync(new URL("../src/routes/presentation.tsx", import.meta.url), "utf8");
  for (const route of [phone, glasses, presentation]) {
    assert.match(route, /paidCoachSpeechEnabled\(\)/);
  }
  assert.match(phone, /data-testid="coach-readable-script"/);
  assert.match(phone, /\{step\.say\}/);
  assert.match(glasses, /data-testid="glasses-readable-script"/);
  assert.match(glasses, /voiceOn=\{state\.settings\.coachVoice !== false && paidCoachSpeechEnabled\(\)\}/);
  assert.match(glasses, /generatedEnabled=\{paidCoachSpeechEnabled\(\)\}/);
  assert.match(presentation, /const voiceOn = state\.settings\.coachVoice !== false && paidCoachSpeechEnabled\(\);/);
  assert.match(presentation, /disabled=\{!paidCoachSpeechEnabled\(\)\}/);
  assert.match(presentation, /"Read-along"/);
});
