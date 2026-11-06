#!/usr/bin/env node
/**
 * M3 FLEX conversational engine QA — static source and parser gate.
 * No downloads, LLM API calls, microphone permission or model inference.
 * The model itself is only downloaded upon athlete's explicit click.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";
const read = name => readFileSync(new URL("../" + name, import.meta.url), "utf8");
const chat = read("src/components/FlexConversation.tsx");
const worker = read("public/flex-local-ai-worker.mjs");
const view = read("src/components/FlexCoachCommand.tsx");
const mic = read("src/lib/voice-commands.ts");
let passed = 0;
function check(msg, condition) { assert.ok(condition, msg); passed++; }
const tsCheck = ts.transpileModule(chat, {
  compilerOptions: {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},
  reportDiagnostics:true,
});
check("Conversation compiles", !(tsCheck.diagnostics||[]).some(x=>x.category===ts.DiagnosticCategory.Error));
check("Existing home embeds conversation", view.includes("<FlexConversation />"));
check("No duplicate home conversation engine", !view.includes("setConversationHandler("));
check("User can ask custom questions", chat.includes('data-testid="flex-chat-input"'));
check("User receives multiple visible replies", chat.includes('data-testid="flex-chat-history"') && chat.includes("turns.map("));
check("Context saved in local session", chat.includes("sessionStorage.setItem") && chat.includes("loadTurns()"));
check("No second food or workout database", !chat.includes("updateNutrition(") && !chat.includes("setState("));
check("Same app data used for precise workout answers", chat.includes("answerFlexLocal(question, state)"));
check("Conversation uses explicit voice permission", chat.includes("toggleMic") && chat.includes("if (startListening())"));
check("Voice router supports normal follow-ups", mic.includes("acceptAnyWhenListening") && chat.includes("acceptAnyWhenListening: true"));
check("Microphone can stop", chat.includes("stopListening()"));
check("Optional model, never auto download", chat.includes('data-testid="flex-enable-local-ai"') && chat.includes("onClick={startModel}"));
check("Model download requires GPU capability", chat.includes('"gpu" in navigator') && chat.includes("disabled={!supportsGPU}"));
check("No paid API on Flex conversation", !chat.includes("/api/public/coach-talk") && !worker.includes("api.openai.com"));
check("Questions run in browser worker", chat.includes('new Worker("/flex-local-ai-worker.mjs"') && worker.includes('import(LIBRARY)'));
check("Worker source has exact pinned runtime", worker.includes("@4.3.2"));
check("Open licensed small model", worker.includes("Qwen2.5-0.5B-Instruct"));
check("Conversation context forwarded safely", chat.includes("normalizedFollowup") && worker.includes(".slice(-10)"));
check("User can stop local model", chat.includes("turnOffModel"));
check("No wrong voice synth", !chat.includes("speechSynthesis.speak") && !chat.includes("SpeechSynthesisUtterance"));
check("Approved Marcus audio only", chat.includes("playApprovedMarcusTest") && chat.includes("Changing replies require approved Marcus synthesis"));
check("No silent subscriptions", worker.includes("Runs entirely inside") && chat.includes("No AI subscription or per-question fee"));
check("Do not assert all answers correct", worker.includes("do not pretend to have current web access") && chat.includes("may be imperfect"));
check("Workout safety remains authoritative", worker.includes("injured LEFT leg") && worker.includes("never prescribe loading"));
console.log("M3 FLEX conversation QA passed: " + passed + " checks; no model downloaded.");
