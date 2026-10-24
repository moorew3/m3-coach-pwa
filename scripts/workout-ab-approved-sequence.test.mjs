import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const active=readFileSync(new URL("../public/recovery-coach/index.html",import.meta.url),"utf8");
const programs=readFileSync(new URL("../public/recovery-coach/programs/index.html",import.meta.url),"utf8");

const locked=[
  ["C09 video","f92c84ea-a2bc-4623-966b-deb8ceff8a87.mp4"],
  ["C09 Marcus","9226f649-9808-4275-b269-bcc93d3b0342.mp3"],
  ["C10 video","d65e6c81-dae1-484f-9bb9-48f7e18d8dbc.mp4"],
  ["C10 Marcus","37ab7891-1c9c-4bfc-bd84-b582a76a37af.mp3"],
];
test("Workout A/B reuse *exact* existing approved moving pre- and post-workout footage",()=>{
 for(const [label,name] of locked){
  assert.ok(active.includes(name),label+" source must already be approved and active");
  assert.ok(programs.includes(name),label+" source must now be reused by A/B previews");
 }
 assert.match(programs,/"phase":"Before","name":"Calm seated breathing · C09-R2","status":"approved"/);
 assert.match(programs,/"phase":"Cooldown","name":"Steady breathing · C10-R1","status":"approved"/);
 assert.doesNotMatch(programs,/09f86822-f251-4917-a98c-9ec7c286a6c2\.mp3/);
 assert.doesNotMatch(programs,/5c14f6cd-3467-4686-9fd0-6070ea20d76a\.mp3/);
});
test("missing/unsafe A/B footage stays blocked and controlled arm reaches remain text + general Marcus",()=>{
 assert.match(programs,/"name":"Controlled arm reaches","status":"audio"/);
 assert.match(programs,/general shoulder-mobility guidance; no approved moving reaches demonstration/);
 assert.match(programs,/"name":"Seated wrist curls","status":"source"/);
 assert.match(programs,/"name":"Seated lateral raises","status":"source"/);
 assert.match(programs,/"name":"AMYCO wrist system","status":"missing"/);
 assert.match(programs,/"name":"INNSTAR chest fly","status":"pending"/);
 assert.match(programs,/"name":"Arm-only seated boxing","status":"source"/);
 assert.match(programs,/Workout A\/B are in development/);
});
