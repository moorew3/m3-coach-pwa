#!/usr/bin/env node
/** Real Bluetooth Weight Scale Service tests; simulated packets, zero device/purchase costs. */
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const source = read("src/lib/health/smart-scale.ts");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
assert.equal((compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);

let now = 100_000;
let disconnected = false;
let chooserCalls = 0;
const handlers = new Map();
const characteristic = {
  value: null,
  async startNotifications() { return true; },
  addEventListener(n, f) { handlers.set(n, f); },
  removeEventListener(n) { handlers.delete(n); },
};
const device = {
  name: "Gym Scale",
  gatt: {
    async connect() {
      return {
        async getPrimaryService(s) {
          assert.equal(s, 0x181d);
          return {
            async getCharacteristic(c) {
              assert.equal(c, 0x2a9d);
              return characteristic;
            },
          };
        },
      };
    },
    disconnect() { disconnected = true; },
  },
};
const nav = { bluetooth: { async requestDevice(o) {
  chooserCalls++;
  assert.equal(o.filters[0].services[0], 0x181d);
  return device;
}}};
const ctx = { exports: {}, navigator: nav, Date: { now: () => now }, Number, Math };
vm.runInNewContext(compiled.outputText, ctx, { timeout: 2000 });
const scale = ctx.exports;
const dv = bytes => new DataView(Uint8Array.from(bytes).buffer);

// Wire-format guarantees (no invented body fat, BMI, user identity or stale sensor values).
assert.equal(scale.parseWeightMeasurement(dv([0, 0xff, 0xff])), null);
assert.equal(scale.parseWeightMeasurement(dv([0, 1])), null);
assert.equal(scale.parseWeightMeasurement(dv([1, 0, 0])), null);
assert.equal(scale.parseWeightMeasurement(dv([0, 0x50, 0x46])).unit, "kg");
assert.equal(scale.parseWeightMeasurement(dv([0, 0x50, 0x46])).value, 90);
assert.equal(scale.parseWeightMeasurement(dv([1, 0x20, 0x4e])).value, 200);
assert.equal(Math.round(scale.convertWeight(90, "kg", "lb") * 10) / 10, 198.4);
assert.equal(scale.latestScaleReading(), null);
assert.equal(scale.scaleSupported(), true);

const status = await scale.connectWeightScale();
assert.equal(status.ok, true);
assert.equal(status.name, "Gym Scale");
assert.equal(chooserCalls, 1);
assert.equal(scale.latestScaleReading(), null, "Connecting without a measurement must NOT invent a weight");

const received = [];
const off = scale.onScaleReading(r => received.push(r));
characteristic.value = dv([1, 0x20, 0x4e]);
handlers.get("characteristicvaluechanged")({ target: characteristic });
assert.equal(received.length, 1);
assert.equal(received[0].value, 200);
assert.equal(received[0].unit, "lb");
assert.equal(scale.latestScaleReading().value, 200);
now += 300_001;
assert.equal(scale.latestScaleReading(), null, "Expired weight may not be saved as a fresh measurement");
scale.disconnectWeightScale();
assert.equal(disconnected, true);
assert.equal(scale.latestScaleReading(), null);
off();

// Integration with existing day store: explicitly confirmed only.
const nutrition = read("src/routes/nutrition.tsx");
const store = read("src/lib/store.ts");
const ui = read("src/components/SmartScalePanel.tsx");
const advice = read("src/lib/flex-local-advice.ts");
assert.match(nutrition, /<SmartScalePanel/);
assert.match(nutrition, /bodyweightSource: "bluetooth-scale"/);
assert.match(nutrition, /bodyweightSource: "manual"/);
assert.match(store, /bodyweightRecordedAt\?: string/);
assert.match(ui, /Save measured weight/);
assert.match(ui, /latestScaleReading\(\)/);
assert.match(ui, /No weight is saved automatically/);
assert.match(advice, /most recent recorded weight/);
console.log("M3 FLEX smart-scale QA passed: adopted 0x181D/0x2A9D parser, SI/Imperial, stale-state, consent/save.");
