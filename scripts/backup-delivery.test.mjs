import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const code = readFileSync(new URL("../public/backup-delivery.js", import.meta.url), "utf8");
const data = JSON.stringify({ days: { 29: { completed: false } }, note: "Keep original records ✓" });
const filename = "arm-tracker-backup-2026-11-02.json";
function load(overrides = {}) {
  const events = [];
  const context = vm.createContext({ Blob, URL: {
    createObjectURL: blob => { events.push(["blob", blob]); return "blob:test"; },
    revokeObjectURL: url => events.push(["revoke", url]),
  }, document: {
    createElement: () => ({ click() { events.push(["click", this.download]); }, remove() { events.push(["remove"]); } }),
    body: { append: () => events.push(["append"]) },
  }, setTimeout: (callback, ms) => events.push(["cleanup", callback, ms]), ...overrides });
  vm.runInContext(code, context);
  return { save: context.M3BackupDelivery.save, events };
}
function native(result) {
  return { isNativePlatform: () => true, isPluginAvailable: () => true,
    registerPlugin: name => { assert.equal(name, "BackupSave"); return { save: async args => {
      assert.equal(args.text, data); assert.equal(args.filename, filename);
      if (result instanceof Error) throw result;
      return result;
    } }; } };
}
test("Android success is returned only after native readback verification", async () => {
  const { save, events } = load({ Capacitor: native({ verified: true, filename }) });
  assert.match(await save(data, filename), /Saved and checked/);
  assert.equal(events.length, 0, "Native path must not launch an unverified blob download");
});
test("cancelled Android picker never reports a successful save", async () => {
  const { save } = load({ Capacitor: native({ cancelled: true }) });
  assert.match(await save(data, filename), /^Save cancelled/);
});
test("missing plugin and Android I/O errors fail without a browser download fallback", async () => {
  for (const cap of [native(new Error("disk full")), native({ verified: false }),
    { isNativePlatform: () => true, isPluginAvailable: () => false }]) {
    const { save, events } = load({ Capacitor: cap });
    await assert.rejects(save(data, filename));
    assert.equal(events.length, 0);
  }
});
test("web save picker writes exact JSON and reopens it before success", async () => {
  let stored;
  const { save } = load({ showSaveFilePicker: async () => ({ name: filename,
    createWritable: async () => ({ write: async blob => { stored = await blob.text(); }, close: async () => {} }),
    getFile: async () => ({ text: async () => stored }),
  }) });
  assert.match(await save(data, filename), /^Saved and checked/);
  assert.equal(stored, data);
});
test("web save readback mismatch and close errors cannot report success", async () => {
  for (const failure of ["mismatch", "close"]) {
    const { save } = load({ showSaveFilePicker: async () => ({ name: filename,
      createWritable: async () => ({ write: async () => {}, close: async () => {
        if (failure === "close") throw Error("disk full");
      } }), getFile: async () => ({ text: async () => "truncated" }),
    }) });
    await assert.rejects(save(data, filename));
  }
});
test("web cancellation does not trigger a second download", async () => {
  const { save, events } = load({ showSaveFilePicker: async () => {
    const error = Error("cancel"); error.name = "AbortError"; throw error;
  } });
  assert.match(await save(data, filename), /^Save cancelled/);
  assert.equal(events.length, 0);
});
test("browser fallback requests exact bytes without claiming file was saved", async () => {
  const { save, events } = load();
  assert.match(await save(data, filename), /Saving is not confirmed/);
  assert.equal(await events.find(e => e[0] === "blob")[1].text(), data);
  assert.ok(events.find(e => e[0] === "append"));
  assert.equal(events.find(e => e[0] === "click")[1], filename);
  const cleanup = events.find(e => e[0] === "cleanup");
  assert.equal(cleanup[2], 60000);
  assert.equal(events.filter(e => e[0] === "revoke").length, 0);
  cleanup[1]();
  assert.equal(events.filter(e => e[0] === "revoke").length, 1);
});
test("invalid JSON and path-like filenames are rejected before any save", async () => {
  const { save, events } = load();
  await assert.rejects(save("not JSON", filename));
  await assert.rejects(save(data, "../backup.json"));
  assert.equal(events.length, 0);
});
test("full-app validation preserves legacy calendar days past day 22", () => {
  const page = readFileSync(new URL("../public/recovery-coach/full-backup/index.html", import.meta.url), "utf8");
  const validation = page.slice(page.indexOf("function validApp("), page.indexOf("function validNum("));
  const valid = vm.runInNewContext(`const isObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);${validation};validApp`);
  const app = { startDate: "2026-09-24", days: { 28: {}, 29: {}, 84: {} }, measurements: [],
    settings: {}, nutrition: {}, favorites: [], targets: {}, savedWorkouts: [], userAvatar: {} };
  assert.equal(valid(app), true);
  assert.equal(valid({ ...app, days: { 85: {} } }), false);
  assert.equal(valid({ ...app, days: { 0: {} } }), false);
});
