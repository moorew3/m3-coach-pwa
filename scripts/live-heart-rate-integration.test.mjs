#!/usr/bin/env node
/** Real sensor contract regression. Mock BLE only: no hardware, calls, or billing. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = read("src/lib/health/hr-monitor.ts");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);

let now = 100_000;
let disconnected = false;
const handlers = new Map();
const characteristic = {
  value: new DataView(Uint8Array.from([0, 72]).buffer),
  async startNotifications() { return true; },
  addEventListener(name, fn) { handlers.set(name, fn); },
  removeEventListener(name) { handlers.delete(name); },
};
const device = {
  name: "Gym Test HR",
  gatt: {
    async connect() {
      return {
        async getPrimaryService() {
          return { async getCharacteristic() { return characteristic; } };
        },
      };
    },
    disconnect() { disconnected = true; },
  },
};
let chooserCalls = 0;
const bluetooth = { async requestDevice() { chooserCalls++; return device; } };
const moduleContext = { exports: {}, navigator: { bluetooth }, Date: { now: () => now } };
vm.runInNewContext(compiled.outputText, moduleContext, { timeout: 2000 });
const sensor = moduleContext.exports;
assert.equal(sensor.heartRateSupported(), true);
assert.equal(sensor.lastHeartRateReading(), null);

const connected = await sensor.connectHeartRate();
assert.equal(connected.ok, true);
assert.equal(chooserCalls, 1);
assert.equal(sensor.lastHeartRateReading(), null, "Connecting alone must not fabricate BPM");
const observed = [];
const unsub = sensor.onHeartRate(bpm => observed.push(bpm));
handlers.get("characteristicvaluechanged")({ target: characteristic });
assert.deepEqual(observed, [72]);
assert.equal(sensor.lastHeartRateReading().bpm, 72);
assert.equal(sensor.lastHeartRateReading().recordedAt, 100_000);
assert.equal(sensor.lastHeartRateReading().provider, "Gym Test HR");
now += 15_001;
assert.equal(sensor.lastHeartRateReading(), null, "Old sensor values must not be live");
assert.equal(sensor.lastHeartRate(), null);

characteristic.value = new DataView(Uint8Array.from([1, 44, 1]).buffer);
handlers.get("characteristicvaluechanged")({ target: characteristic });
assert.equal(sensor.lastHeartRateReading().bpm, 300, "Parse BLE 16-bit HR without inventing a capped estimate");
characteristic.value = new DataView(Uint8Array.from([1, 44]).buffer);
handlers.get("characteristicvaluechanged")({ target: characteristic });
assert.equal(sensor.lastHeartRateReading().bpm, 300, "Truncated BLE frame must be rejected");
sensor.disconnectHeartRate();
assert.equal(disconnected, true);
assert.equal(sensor.lastHeartRateReading(), null);
assert.equal(sensor.averageHeartRate(), null);
unsub();

const panel = read("src/components/HealthPanel.tsx");
const v2 = read("src/routes/v2.tsx");
const badge = read("src/v2/live-heart-rate.tsx");
const advice = read("src/lib/flex-local-advice.ts");
const chat = read("src/components/FlexConversation.tsx");
assert.match(panel, /setValues\(\(prev\) => \(\{ \.\.\.prev, heartRate: String\(reading\) \}\)\)/,
  "Real BPM must flow into the user-visible activity form");
assert.match(v2, /<V2LiveHeartRate\s*\/>/, "Original V2 route must display the sensor");
assert.match(badge, /lastHeartRateReading\(\)/);
assert.match(badge, /Connect HR/);
assert.match(advice, /lastHeartRateReading\(\)/);
assert.match(advice, /I will not guess/);
assert.match(chat, /heart\[ -\]\?rate\|pulse\|bpm/,
  "Conversational questions about current HR should use deterministic sensor facts");
console.log("M3 FLEX live sensor regression passed: fresh BLE data, stale/disconnect guards, UI, coaching route.");
