#!/usr/bin/env node
/** M3 FLEX live voice gateway contract tests. No network or paid calls. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const contract=read("src/lib/marcus-tts-contract.ts");
const route=read("src/routes/api/public/marcus-speech.ts");
const client=read("src/lib/marcus-live-client.ts");
const chat=read("src/components/FlexConversation.tsx");
const compiled=ts.transpileModule(contract,{
 compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
 reportDiagnostics:true,
});
assert.equal(compiled.diagnostics?.filter(d=>d.category===ts.DiagnosticCategory.Error).length||0,0);
const context={exports:{},URL};
vm.runInNewContext(compiled.outputText,context,{timeout:2000});
const {APPROVED_MARCUS_VOICE_ID: voice,MAX_MARCUS_TTS_CHARS:limit,validMarcusLine:valid,approvedMarcusAudioUrl:safe}=context.exports;
let passed=0;const check=(name,ok)=>{assert.ok(ok,name);passed++};
check("Exact verified Marcus voice",voice==="0fadce1e82af494a93873aa38ea8d106");
check("Bounded maximum text",limit===350&&valid("hello") === "hello"&&valid(" ")===null);
check("Reject oversized text",valid("x".repeat(351))===null);
check("Normalize whitespace",valid(" hello   world ")==="hello world");
check("Accept HeyGen audio delivery only",safe({data:{audio_url:"https://resource2.heygen.ai/audio/1.wav"}})==="https://resource2.heygen.ai/audio/1.wav");
check("Reject private URL and substitutes",safe({data:{audio_url:"https://malicious.example/1.mp3"}})===null);
check("Reject HTTP delivery",safe({data:{audio_url:"http://files.heygen.ai/1.mp3"}})===null);
check("Reject credentials in audio URL",safe({data:{audio_url:"https://user:pass@files.heygen.ai/1.mp3"}})===null);
check("No client voice ID override",!route.includes("parsed.data.voiceId")&&route.includes("voice_id: APPROVED_MARCUS_VOICE_ID"));
check("Hard budget switch defaults off",route.includes('process.env["FLEX_MARCUS_TTS_ENABLED"] !== "true"'));
check("No request reaches HeyGen without flag",route.indexOf('if (disabled()) return aiError(503')<route.indexOf('fetch("https://api.heygen.com'));
check("Server auth and user allowlist",route.includes("authorizePaidAi(request")&&route.includes("FLEX_AI_ALLOWED_USER_IDS"));
check("Other paid providers remain disabled",route.includes('FLEX_PAID_AI_ENABLED: process.env["FLEX_MARCUS_TTS_ENABLED"]')&&!route.includes("api.openai.com"));
check("Only documented catalog TTS endpoint",route.includes("https://api.heygen.com/v3/voices/speech"));
check("Never auto-retry paid calls",!route.includes("for (")&&!route.includes("retry("));
check("Client checks returned voice identity",client.includes("payload.voiceId !== APPROVED_MARCUS_VOICE_ID"));
check("Client never uses browser TTS",!client.includes("speechSynthesis")&&!chat.includes("speakFlexAnswer("));
check("UI shows truth about missing funding",chat.includes("Live spoken replies are not connected yet"));
check("UI has voice replay and stop",chat.includes('data-testid="flex-live-marcus-replay"')&&chat.includes('data-testid="flex-stop-live-marcus"'));
check("UI keeps original Marcus clips",chat.includes('data-testid="marcus-sample"')&&chat.includes("playApprovedMarcusTest"));
check("No plaintext or untrusted voice endpoint",!route.includes("http://api.heygen.com")&&!client.includes("api.heygen.com")); // benign literal check
console.log("M3 FLEX live Marcus gateway QA passed: "+passed+" tests; no paid calls performed.");
