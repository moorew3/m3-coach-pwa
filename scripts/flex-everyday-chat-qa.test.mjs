#!/usr/bin/env node
/** QA for everyday conversation alongside existing coaching. No model download. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const read=name=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const source=read("src/lib/flex-everyday-chat.ts");
const chat=read("src/components/FlexConversation.tsx");
const worker=read("public/flex-local-ai-worker.mjs");
const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
assert.equal(result.diagnostics?.filter(x=>x.category===ts.DiagnosticCategory.Error).length||0,0);
const exports={};
vm.runInNewContext(result.outputText,{exports},{timeout:1000});
const {everydayFallback}=exports;
const checks=[
["Greeting",everydayFallback("Hi")?.includes("tell me about your day")],
["Normal hello",everydayFallback("Hey Flex, how are you?")?.includes("How has your day")],
["User tells good news",everydayFallback("I'm feeling great")?.includes("best part")],
["User tells bad news",everydayFallback("I had a rough day")?.includes("what happened")],
["Casual joke",everydayFallback("Tell me a joke")?.includes("dumbbell")],
["Talk about family",everydayFallback("Let's talk about my family")?.includes("What about")],
["Not locked to fitness",everydayFallback("Are you only a trainer?")?.includes("everyday life")],
["Followup",everydayFallback("Why?",[{role:"user",content:"I had a rough day"},{role:"assistant",content:"What happened?"}])?.includes("what made the day difficult")],
["Unknown questions are routed to actual model",everydayFallback("What's the history of jazz?")===null],
["Personalized tracker still authoritative",chat.includes('else if (local.category !== "help") { answer = local.text')],
["Open conversation branch uses real model",chat.includes("modelStatus === \\"ready\\" && !shouldUseRecorded")],
["Natural conversation model opt-in obvious",chat.includes('data-testid="flex-natural-chat-enable"')],
["Model instructed to converse beyond exercise",worker.includes("music, movies, entertainment, work")],
["Model told not to redirect to workout",worker.includes("never steer every discussion back to exercise")],
["Original voice only",!chat.includes("speakFlexAnswer(")&&chat.includes("Marcus synthesis")],
["No paid API",!worker.includes("api.openai.com")&&!chat.includes("/api/public/coach-talk")]
];
for(const [name,pass] of checks)assert.ok(pass,name);
console.log("M3 FLEX everyday conversation QA passed: "+checks.length+" checks; no model downloaded.");
