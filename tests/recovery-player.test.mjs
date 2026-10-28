import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(process.env.RECOVERY_PLAYER_HTML || new URL('../public/recovery-coach/index.html', import.meta.url), 'utf8');
const source = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function player() {
  let now = 1_000_000, nextTimer = 0;
  const timers = new Map(), timeouts = new Map(), nodes = new Map();
  class Node extends EventTarget {
    constructor() { super(); this.children = []; this.value = ''; this.checked = true; this.classList = { toggle() {} }; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    setAttribute(name, value) { this[name] = value; }
    removeAttribute(name) { delete this[name]; }
    scrollIntoView() {}
    load() {}
    pause() { this.paused = true; }
    play() { this.paused = false; return this.nextPlay?.() ?? Promise.resolve(); }
  }
  const node = id => { if (!nodes.has(id)) nodes.set(id, new Node()); return nodes.get(id); };
  node('workDuration').value = '30'; node('restDuration').value = '20';
  const checks = Array.from({ length: 3 }, () => new Node());
  const phases = Array.from({ length: 3 }, (_, i) => Object.assign(new Node(), { dataset: { stage: String(i) } }));
  const context = vm.createContext({
    console, Date: { now: () => now },
    setInterval: fn => { const id = ++nextTimer; timers.set(id, fn); return id; },
    clearInterval: id => timers.delete(id),
    setTimeout: (fn, delay) => { const id = ++nextTimer; timeouts.set(id, { fn, due: now + delay }); return id; },
    clearTimeout: id => timeouts.delete(id),
    document: { getElementById: node, createElement: () => new Node(), addEventListener() {},
      querySelectorAll: selector => selector === '.check' ? checks : phases },
  });
  vm.runInContext(source, context);
  return {
    run: code => vm.runInContext(code, context), node,
    state: () => vm.runInContext('({mode,phase,idx,secondsLeft,completed:completed.size,ticking:interval!==null,restNext})', context),
    advance(ms) { now += ms; for (const fn of [...timers.values()]) fn(); for (const [id, entry] of [...timeouts]) { if (entry.due <= now) { timeouts.delete(id); entry.fn(); } } },
    emit(id, event) { node(id).dispatchEvent(new Event(event)); },
  };
}

test('pending start cannot change a newly selected step', async () => {
  const p = player(), video = deferred(), audio = deferred();
  p.node('coachVideo').nextPlay = () => video.promise;
  p.node('coachVoice').nextPlay = () => audio.promise;
  const start = p.run('runCurrent()');
  p.run('stopForNavigation(2,0)');
  video.resolve(); audio.resolve(); await start;
  assert.equal(p.state().mode, 'ready');
  assert.equal(p.state().phase, 2);
  assert.equal(p.state().ticking, false);
  assert.equal(p.state().completed, 0);
});

test('pending resume cannot start a timer after navigation', async () => {
  const p = player(); await p.run('runCurrent()'); p.run('pause()');
  const video = deferred(), audio = deferred();
  p.node('coachVideo').nextPlay = () => video.promise;
  p.node('coachVoice').nextPlay = () => audio.promise;
  const resume = p.run('resume()'); p.run('stopForNavigation(1,2)');
  video.resolve(); audio.resolve(); await resume;
  assert.equal(p.state().mode, 'ready');
  assert.equal(p.state().idx, 2);
  assert.equal(p.state().ticking, false);
  p.advance(60_000);
  assert.equal(p.state().completed, 0);
});

test('load error before ticker preserves the entire step duration', async () => {
  const p = player(), video = deferred(), audio = deferred();
  p.node('coachVideo').nextPlay = () => video.promise;
  p.node('coachVoice').nextPlay = () => audio.promise;
  const start = p.run('runCurrent()'); p.emit('coachVideo', 'error');
  assert.equal(p.state().secondsLeft, 30_000);
  assert.equal(p.state().mode, 'waiting');
  video.resolve(); audio.resolve(); await start;
  p.node('coachVideo').nextPlay = undefined; p.node('coachVoice').nextPlay = undefined;
  await p.run('resume()'); p.advance(1000);
  assert.equal(p.state().secondsLeft, 29_000);
  assert.equal(p.state().completed, 0);
});

test('audio-only failure pauses and retry preserves the remaining time', async () => {
  const p = player(); p.run('stopForNavigation(0,1)'); await p.run('runCurrent()');
  p.advance(5000); p.emit('coachVoice', 'error');
  assert.equal(p.state().mode, 'waiting');
  assert.equal(p.state().secondsLeft, 25_000);
  p.advance(60_000); assert.equal(p.state().completed, 0);
  await p.run('resume()'); p.advance(1000);
  assert.equal(p.state().secondsLeft, 24_000);
});

test('video buffering in the last second cannot complete the step', async () => {
  const p = player(); await p.run('runCurrent()'); p.advance(29_000);
  p.emit('coachVideo', 'waiting'); p.advance(2500);
  assert.equal(p.state().mode, 'waiting');
  assert.equal(p.state().secondsLeft, 1000);
  assert.equal(p.state().completed, 0);
  assert.equal(p.state().idx, 0);
});

test('audio buffering pauses an audio-only step immediately', async () => {
  const p = player(); p.run('stopForNavigation(0,1)'); await p.run('runCurrent()');
  p.advance(4000); p.emit('coachVoice', 'waiting'); p.advance(30_000);
  assert.equal(p.state().mode, 'waiting');
  assert.equal(p.state().secondsLeft, 26_000);
  assert.equal(p.state().completed, 0);
});

test('step-card navigation clears a previous rest destination', () => {
  const p = player(); p.run('restNext={phase:1,idx:3};mode="rest"');
  p.node('steps').children[1].dispatchEvent(new Event('click'));
  assert.equal(p.state().idx, 1);
  assert.equal(p.state().restNext, null);
  assert.equal(p.state().mode, 'ready');
});

test('successful timer still completes and advances exactly one step', async () => {
  const p = player(); await p.run('runCurrent()'); p.advance(30_000); await flush();
  assert.equal(p.state().completed, 1);
  assert.equal(p.state().idx, 1);
  assert.equal(p.state().mode, 'running');
});


test('pause during initial media loading cannot erase the step duration', async () => {
  const p = player(), video = deferred(), audio = deferred();
  p.node('coachVideo').nextPlay = () => video.promise;
  p.node('coachVoice').nextPlay = () => audio.promise;
  const start = p.run('runCurrent()'); p.run('pause()');
  video.resolve(); audio.resolve(); await start;
  assert.equal(p.state().mode, 'paused');
  assert.equal(p.state().secondsLeft, 30_000);
  assert.equal(p.state().ticking, false);
  assert.equal(p.state().completed, 0);
});
