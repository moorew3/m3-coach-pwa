import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const build=readFileSync(new URL("./package-static-recovery-preview.py",import.meta.url),"utf8");
const action=readFileSync(new URL("../.github/workflows/build-check.yml",import.meta.url),"utf8");
const page=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");

test("portable reviewed Recovery Coach preview is HTML-only and preserves exact live approved sources",()=>{
  for(const entry of ["recovery-coach/index.html","recovery-coach/bench-core/index.html","recovery-coach/programs/index.html","recovery-coach/device-check/index.html","recovery-coach/form-check/index.html"])
    assert.ok(build.includes('"'+entry+'"'),"Missing original source page "+entry);
  assert.match(build,/NO Node\.js or paid app runtime/);
  assert.match(build,/No owner media binaries, credential files/);
  assert.match(build,/read_bytes\(\)/);
  assert.match(build,/sha256-manifest\.json/);
  assert.match(build,/bench-core\/index\.html/);
  assert.match(build,/archive\.testzip\(\) is None/);
  assert.match(build,/if ZIP\.exists\(\)/);
  assert.doesNotMatch(build,/subprocess\.run|https:\/\/|urlopen|requests\.get/);
  assert.match(page,/id="handsfreeStart"/);
});

test("CI packages the static review only and does not deploy over any existing website",()=>{
  assert.match(action,/python3 scripts\/package-static-recovery-preview\.py/);
  assert.match(action,/name: m3-flex-seated-recovery-static-preview/);
  assert.match(action,/path: artifacts\/m3-flex-seated-recovery-static-preview\.zip/);
  assert.doesNotMatch(action,/deploy-pages|push.*gh-pages|hostinger.*deploy/);
});
