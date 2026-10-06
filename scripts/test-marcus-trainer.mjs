import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const require = (name) => load(name.startsWith('@/') ? `src/${name.slice(2)}.ts` : path.resolve(path.dirname(file), `${name}.ts`));
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(require, module, module.exports);
  return module.exports;
}
const { MARCUS_TRAINER_RECORDINGS: clips, MARCUS_GENERAL_RECORDINGS: general } = load('src/v2/marcus-trainer-recordings.ts');
const workouts = [...load('src/v2/catalog.ts').V2_WORKOUTS, ...load('src/v2/original-week-workouts.ts').ORIGINAL_WEEK_WORKOUTS];
for (const e of workouts.flatMap(w => w.exercises)) assert.ok(clips[e.motionKey], `Missing trainer: ${e.motionKey}`);
for (const clip of Object.values(clips)) {
  assert.ok(fs.statSync(`public${clip.url}`).size > 1000);
  for (const part of ['name', 'setup', 'movement', 'breathing']) assert.ok(clip[part][0] >= 0 && clip[part][1] > clip[part][0]);
  assert.ok(clip.name[1] < 8, 'Transition name must finish before work begins');
}
for (const clip of Object.values(general)) assert.ok(fs.statSync(`public${clip.url}`).size > 1000);
const audit = JSON.parse(fs.readFileSync('scripts/marcus-trainer-audit.json'));
assert.equal(audit.voiceId, '0fadce1e82af494a93873aa38ea8d106');
assert.equal(audit.recordings.length, 67);
let active = 0, maximum = 0, deviceVoiceCalls = 0;
const sources = [];
class FakeContext {
  state = 'running'; destination = {};
  async resume() {}
  async decodeAudioData() { return {}; }
  createBufferSource() {
    const source = { connect() {}, disconnect() {}, start() { active++; maximum = Math.max(maximum, active); }, stop() { active--; }, end() { active--; this.onended?.(); } };
    sources.push(source); return source;
  }
}
globalThis.window = { AudioContext: FakeContext, speechSynthesis: { cancel() {}, speak() { deviceVoiceCalls++; } } };
globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(16) });
const player = load('src/v2/recorded-coach-player.ts');
const trainer = load('src/v2/marcus-trainer-audio.ts');
const detail = load('src/v2/detailed-exercise-speech.ts');
const turn = () => new Promise(resolve => setImmediate(resolve));
const first = trainer.playMarcusTrainer('hangingKneeRaise'); await turn(); assert.equal(await first, true);
assert.equal(player.recordedCoachSpeechActive(), true);
const second = detail.speakDetailedExerciseWhenReady('Rest 60 seconds.'); await turn();
assert.equal(sources.length, 1, 'Recovery must queue behind current instruction');
sources[0].end(); await turn(); assert.equal(await second, true); assert.equal(sources.length, 2);
assert.equal(maximum, 1, 'Coach voices must never overlap');
assert.equal(detail.speakDetailedExercise('An unrecorded personal answer'), false);
detail.stopDetailedExerciseSpeech(); trainer.stopMarcusTrainer();
assert.equal(active, 0, 'Pause must stop the recorded output');
assert.equal(deviceVoiceCalls, 0, 'Never use the device voice');
assert.equal(await trainer.playMarcusTrainer('missing-key'), false);
assert.equal(player.recordedCoachSpeechActive(), true, 'Suppress delayed coach echo');
console.log('PASS: all workout movements covered; segments valid; one output; recovery queued; pause cancels; no substitute voice.');
