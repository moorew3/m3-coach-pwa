import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const stage=readFileSync(new URL("./stage-pose-runtime.mjs",import.meta.url),"utf8");
const pack=readFileSync(new URL("./package-static-recovery-preview.py",import.meta.url),"utf8");
const workflow=readFileSync(new URL("../.github/workflows/build-check.yml",import.meta.url),"utf8");
const docker=readFileSync(new URL("../Dockerfile",import.meta.url),"utf8");
const form=readFileSync(new URL("../public/recovery-coach/form-check/index.html",import.meta.url),"utf8");

test("pose assets staged from the installed official runtime and Google model, never paid inference",()=>{
 assert.match(stage,/node_modules", "@mediapipe", "tasks-vision"/);
 assert.match(stage,/vision_wasm_internal\.wasm/);
 assert.match(stage,/nosimd/);
 assert.match(stage,/MODEL_URL = "https:\/\/storage\.googleapis\.com\/mediapipe-models\/pose_landmarker/);
 assert.match(stage,/new URL\(response\.url\)\.hostname !== "storage\.googleapis\.com"/);
 assert.match(stage,/const LIMIT = 20 \* 1024 \* 1024/);
 assert.match(stage,/sha256-manifest\.json/);
 assert.match(stage,/THIRD_PARTY_NOTICE\.txt/);
 assert.doesNotMatch(stage,/OPENAI_API_KEY|heygen\.ai|\/api\/public\/coach-talk|method:\s*["']POST/);
});
test("Docker and static preview include same-origin model assets; no third-party inference URL at workout time",()=>{
 assert.match(form,/const LIBRARY="\.\/vendor\/vision_bundle\.mjs"/);
 assert.match(form,/const WASM="\.\/vendor\/wasm"/);
 assert.match(form,/const MODEL="\.\/vendor\/pose_landmarker_lite\.task"/);
 assert.doesNotMatch(form,/import\("https:\/\/cdn\.jsdelivr|modelAssetPath:"https:\/\/storage\.googleapis/);
 assert.match(workflow,/node scripts\/stage-pose-runtime\.mjs/);
 assert.match(docker,/RUN node scripts\/stage-pose-runtime\.mjs && npm run build/);
 assert.match(pack,/MediaPipe local runtime hash mismatch/);
 assert.match(pack,/vendor_dir\.rglob/);
});
