#!/usr/bin/env node
/** M3 FLEX approved Marcus FREE voice + owner pairing security regression gate.
 * Source and mocked crypto checks only. Does not use HeyGen quota.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const contract = read("src/lib/marcus-tts-contract.ts");
const owner = read("src/lib/marcus-owner-access.ts");
const route = read("src/routes/api/public/marcus-speech.ts");
const client = read("src/lib/marcus-live-client.ts");
const chat = read("src/components/FlexConversation.tsx");
const compiled = ts.transpileModule(contract, {
  compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  reportDiagnostics:true,
});
assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const a={exports:{},URL};
vm.runInNewContext(compiled.outputText,a,{timeout:2000});
const {APPROVED_MARCUS_VOICE_ID:voice,MAX_MARCUS_TTS_CHARS:limit,
  validMarcusLine:valid,approvedMarcusAudioUrl:safe}=a.exports;
let n=0;
const check=(name,yes)=>{assert.ok(yes,name);n++};
check("Exact Marcus identity",voice==="0fadce1e82af494a93873aa38ea8d106");
check("Text bounded",limit===350 && valid("hello")==="hello" && valid(" ")===null);
check("Oversized text rejected",valid("x".repeat(351))===null);
check("Whitespace normalized",valid(" hello   world ")==="hello world");
check("Trusted HeyGen audio",safe({data:{audio_url:"https://resource2.heygen.ai/audio/1.wav"}})==="https://resource2.heygen.ai/audio/1.wav");
check("Non-HeyGen audio rejected",safe({data:{audio_url:"https://malicious.example/1.mp3"}})===null);
check("Insecure HTTP rejected",safe({data:{audio_url:"http://files.heygen.ai/1.mp3"}})===null);
check("Embedded credentials rejected",safe({data:{audio_url:"https://u:p@files.heygen.ai/1.mp3"}})===null);
check("No client identity override",!route.includes("parsed.data.voiceId") && route.includes("voice_id: APPROVED_MARCUS_VOICE_ID"));
check("Exact free HeyGen model",route.includes("model: MARCUS_VOICE_MODEL") && owner.includes('heygen-voice-1-turbo-free'));
check("No chargeable TTS fallback",!route.includes('model: "heygen-voice-1"') && !route.includes("retry("));
check("HeyGen published TTS endpoint",route.includes("https://api.heygen.com/v3/models/audio/tts"));
check("Server owner access precedes vendor",route.indexOf("authorizeMarcusOwner(request)") < route.indexOf("await fetch("));
check("Owner key never in public app",!client.includes("HEYGEN_API_KEY") && !chat.includes("FLEX_MARCUS_OWNER_TOKEN_SHA256"));
check("Owner proof only in header",client.includes('x-m3-flex-owner') && !client.includes("?token="));
check("No tokens stored on API server in source",!owner.includes("A4r3OzbRTWog"));
check("URL fragment cleared on pairing",client.includes("window.history.replaceState"));
check("Paired token kept only in browser session",client.includes("window.sessionStorage.setItem") && !client.includes("window.localStorage.setItem"));
check("Hard expiry at Dec 1",owner.includes("Date.UTC(2026, 11, 1"));
check("GET requires owner proof for enabled",route.includes("marcusVoiceConfigured() && verifyMarcusOwner(request)"));
check("Client rejects unapproved model",client.includes('payload.model !== "heygen-voice-1-turbo-free"'));
check("Client rejects different voice",client.includes("payload.voiceId !== APPROVED_MARCUS_VOICE_ID"));
check("Legacy phone TTS never enabled",!chat.includes("speakFlexAnswer("));
check("UI supports audio stop/replay",chat.includes('data-testid="flex-live-marcus-replay"') && chat.includes('data-testid="flex-stop-live-marcus"'));
check("Original approved Marcus recordings preserved",chat.includes("playApprovedMarcusTest"));
check("Exact free model only before expiry",owner.includes('env["FLEX_MARCUS_TTS_MODEL"] === VOICE_MODEL'));
check("No OpenAI paid calls",!route.includes("api.openai.com")&&!client.includes("api.openai.com"));

const ownerJs=ts.transpileModule(owner,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
const crypto=await import("node:crypto");
const env={
  FLEX_MARCUS_TTS_ENABLED:"true",
  FLEX_MARCUS_TTS_MODEL:"heygen-voice-1-turbo-free",
  HEYGEN_API_KEY:"not-a-real-api-key",
  FLEX_MARCUS_OWNER_TOKEN_SHA256:createHash("sha256").update("a".repeat(43)).digest("hex"),
};
const b={exports:{}, Buffer, process:{env}, Request, Date, URL,
  require:(name)=>{
    if(name==="node:crypto")return crypto;
    if(name==="@/lib/paid-ai-access")return {aiError:(status,message)=>({status,message}),
      PaidAiLimiter:class {allow(){return true}}};
    throw Error("Unknown test dependency "+name);
  },
};
vm.runInNewContext(ownerJs.outputText,b,{timeout:2500});
const f=b.exports;
const okReq=new Request("https://m3-coach-v2-preview-production.up.railway.app/api/public/marcus-speech",{
  headers:{"x-m3-flex-owner":"a".repeat(43),"origin":"https://m3-coach-v2-preview-production.up.railway.app"},
});
check("Free service configured under explicit model",f.marcusVoiceConfigured(env,Date.UTC(2026,10,8)));
check("Service auto shuts off after deadline",!f.marcusVoiceConfigured(env,Date.UTC(2026,11,1)));
check("Matching high entropy token verified",f.verifyMarcusOwner(okReq,env));
check("Invalid token rejected",!f.verifyMarcusOwner(new Request(okReq.url,{headers:{"x-m3-flex-owner":"b".repeat(43)}}),env));
check("Wrong origin rejected",f.authorizeMarcusOwner(new Request(okReq.url,{headers:{"x-m3-flex-owner":"a".repeat(43),"origin":"https://bad.example"}})).status===403);
check("Correct token authorized",f.authorizeMarcusOwner(okReq)===null);
check("Missing enable flag blocks speech",f.authorizeMarcusOwner(okReq)===null && !f.marcusVoiceConfigured({...env,FLEX_MARCUS_TTS_ENABLED:"false"},Date.UTC(2026,10,8)));
console.log("M3 FLEX owner-paired free Marcus QA passed: "+n+" checks; no network, charge, or speech generated.");
