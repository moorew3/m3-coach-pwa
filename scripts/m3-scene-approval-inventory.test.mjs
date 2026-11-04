import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const source=read("public/recovery-coach/scene-library.js");
const scope={window:{}};
vm.runInNewContext(source,scope);
const scenes=scope.window.M3_FLEX_SCENE_LIBRARY;
const candidates=scenes.filter(s=>/^C(?:1[3-9]|2[0-3])$/.test(s.id));
test("all eleven existing render candidates are catalogued as review only, with no fabricated approvals",()=>{
 assert.equal(candidates.length,11);
 assert.equal(new Set(candidates.map(s=>s.id)).size,11);
 for(const s of candidates){
  assert.equal(s.status,"owner-review",s.id);
  assert.ok(s.video?.startsWith("https://resource2.heygen.ai/"),s.id);
  assert.ok(!s.video.includes("Expires="),"Expiring URL for "+s.id);
 }
});
test("exactly four C13–C23 drafts lack verified matching Marcus audio and cannot be promoted",()=>{
 const noAudio=Array.from(candidates.filter(s=>!s.audio),s=>s.id).sort();
 assert.deepEqual(noAudio,["C13","C16","C20","C21"]);
 const page=read("public/recovery-coach/index.html");
 assert.match(page,/OPTIONAL_SCENE_IDS=new Set\(\["C14","C15","C17","C18","C19","C22","C23"\]\)/);
 assert.match(page,/entry.video===item.video&&entry.audio===item.audio/);
 assert.match(page,/scene\.audio\|\|!OPTIONAL_SCENE_IDS\.has\(scene\.id\)/);
});
test("one-app Program tab links to exact scenes and owner reviews without starting playback",()=>{
 const program=read("src/routes/program.tsx");
 const page=read("public/recovery-coach/index.html");
 assert.match(program,/data-testid="program-approve-scenes"/);
 assert.match(program,/\/recovery-coach\/index\.html\?program=recovery&review=1/);
 assert.match(page,/value="candidates"/);
 assert.match(page,/get\("review"\)==="1"/);
 assert.match(page,/showExistingScenes\(\)/);
 assert.match(page,/scrollIntoView\(\{block:"start"\}\)/);
 assert.match(page,/LEFT LEG SUPPORTED · SEATED SESSION/);
 assert.match(page,/supported on a padded rest and unloaded/);
});
