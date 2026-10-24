import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=(path)=>readFileSync(new URL(path,import.meta.url),"utf8");
const preview=read("../public/recovery-coach/programs/index.html");
const active=read("../public/recovery-coach/index.html");
const home=read("../src/routes/index.tsx");
const browser=read("./browser-mobile-smoke.mjs");
const docker=read("../Dockerfile");
const ignore=read("../.dockerignore");

test("unapproved backup media are isolated in development preview and never become active",()=>{
  assert.match(preview,/data-testid="recovered-heygen-candidate-review"/);
  for(const id of [
    "01a15fc0-212c-78dc-b0a8-e7a24cf3aba5.mp4",
    "01a15e81-6643-7af0-9d4d-62cb9f37132f.mp4",
    "01a15565-a7a3-710c-9caf-e860fa57b0de.mp4",
  ]){
    assert.ok(preview.includes(id),"Missing review candidate "+id);
    assert.ok(!active.includes(id),"Never add new review footage to active Recovery Coach: "+id);
  }
  assert.match(preview,/finished does not mean approved/);
  assert.match(preview,/controls muted playsinline preload="none"/);
  assert.match(preview,/Shoulder rolls are NOT the specified Controlled arm reaches/);
});

test("legacy standing workout is gated at the home CTA while the seated player stays one tap away",()=>{
  assert.match(home,/data-testid="legacy-workout-start"/);
  assert.match(home,/data-testid="legacy-safety-gate"/);
  assert.match(home,/data-testid="legacy-acknowledge"/);
  assert.match(home,/disabled={!legacyRiskConfirmed}/);
  assert.match(home,/if \(!legacyModeAllowed && !log\.completed\)/);
  assert.match(home,/setLegacyGateOpen\(true\)/);
  assert.match(home,/onClick={requestLegacyCoach}/);
  assert.match(home,/href="\/recovery-coach\/"/);
  assert.match(browser,/legacy-acknowledge/);
  assert.match(browser,/legacy-safety-gate/);
});

test("portable Node image uses unprivileged runtime, no Railway and defaults to closed paid AI",()=>{
  assert.match(docker,/FROM node:22-bookworm-slim AS build/);
  assert.match(docker,/FROM node:22-bookworm-slim AS runtime/);
  assert.match(docker,/ENV VITE_FLEX_PAID_AI_ENABLED=false/);
  assert.match(docker,/FLEX_PAID_AI_ENABLED=false/);
  assert.match(docker,/USER node/);
  assert.match(docker,/EXPOSE 3000/);
  assert.match(docker,/CMD \["node", "\.output\/server\/index\.mjs"\]/);
  assert.match(docker,/\/api\/health/);
  assert.doesNotMatch(docker,/railway|OPENAI_API_KEY\s*=/i);
  assert.match(ignore,/^\.env\.\*$/m);
  assert.match(ignore,/^node_modules$/m);
  assert.match(ignore,/^\.git$/m);
});
