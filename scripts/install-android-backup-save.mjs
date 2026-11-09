import assert from "node:assert/strict";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const directory = new URL("android/app/src/main/java/com/m3legacy/flexrecovery/", root);
const activity = new URL("MainActivity.java", directory);
let source = await readFile(activity, "utf8");
assert.match(source, /package com\.m3legacy\.flexrecovery;/);
if (!source.includes("registerPlugin(BackupSavePlugin.class)")) {
  // Fail rather than overwrite any pre-existing custom lifecycle code.
  assert.doesNotMatch(source, /onCreate\s*\(/);
  assert.match(source, /extends BridgeActivity\s*\{/);
  source = source.replace(/extends BridgeActivity\s*\{/, `extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(BackupSavePlugin.class);
        super.onCreate(savedInstanceState);
    }
`);
  await writeFile(activity, source);
}
await copyFile(new URL("native/BackupSavePlugin.java", root), new URL("BackupSavePlugin.java", directory));
console.log("Installed verified backup save bridge in existing Android application: " + fileURLToPath(directory));
