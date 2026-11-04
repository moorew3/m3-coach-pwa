#!/usr/bin/env node
/**
 * One M3 FLEX app, portable static/browser snapshot.
 *
 * Start the *actual* TanStack/Nitro production bundle locally and save its
 * SSR HTML for existing app routes, then copy its real public assets,
 * approved recovery video player, A/B scene browser and local pose runtime.
 * No new project, paid AI request, new host, rep manipulation or production
 * deployment. The offline shell still streams the exact original media.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { cp, mkdir, rm, writeFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const OUT=join(ROOT,"unified-static-web");
const PUBLIC=join(ROOT,".output","public");
const NODE_BUNDLE=join(ROOT,".output","server","index.mjs");
assert.ok((await stat(NODE_BUNDLE)).size>0,"Build original M3 FLEX first: npm run build");
const PORT=17396,ORIGIN="http://127.0.0.1:"+PORT;
const server=spawn(process.execPath,[NODE_BUNDLE],{
  cwd:ROOT,env:{...process.env,PORT:String(PORT),HOST:"127.0.0.1",
    OPENAI_API_KEY:"",FLEX_PAID_AI_ENABLED:"false"},
  stdio:["ignore","pipe","pipe"],
});
let exited=false,output="";
server.on("exit",()=>{exited=true});
for(const source of [server.stdout,server.stderr])
  source.on("data",data=>{output=(output+String(data)).slice(-2000)});
async function fetchHtml(path){
  const response=await fetch(ORIGIN+path,{signal:AbortSignal.timeout(12000)});
  assert.equal(response.status,200,"Original route failed: "+path+" "+response.status);
  assert.match(response.headers.get("content-type")??"",/text\/html/,"Wrong SSR response type: "+path);
  const html=await response.text();
  assert.match(html,/<html\b/,"Missing original React app HTML shell: "+path);
  assert.match(html,/<script/,"Missing original React client scripts: "+path);
  assert.ok(!html.includes("Page not found</h2>"),"Found 404 shell at "+path);
  return html;
}
const routes=[
  "/","/program","/nutrition","/progress","/settings","/recovery",
  "/glasses","/presentation","/display","/v2",
  ...Array.from({length:22},(_,i)=>"/coach/"+(i+1)),
  ...Array.from({length:22},(_,i)=>"/workout/"+(i+1)),
];
try{
  let ready=false;
  for(let i=0;i<48;i++){
    if(exited)throw Error("Node production SSR process exited: "+output);
    try{const r=await fetch(ORIGIN+"/api/health",{signal:AbortSignal.timeout(800)});
      if(r.ok){ready=true;break}}catch{}
    await delay(250);
  }
  if(!ready)throw Error("Existing M3 FLEX production server did not become ready: "+output);
  // Never silently overwrite an earlier built owner package.
  await rm(OUT,{recursive:true,force:true});
  await cp(PUBLIC,OUT,{recursive:true,force:true});
  for(const route of routes){
    const html=await fetchHtml(route);
    const path=route==="/"?join(OUT,"index.html"):join(OUT,route.slice(1),"index.html");
    await mkdir(dirname(path),{recursive:true});
    await writeFile(path,html);
  }
  const mandatory=[
    "index.html","program/index.html","progress/index.html","v2/index.html",
    "recovery/index.html","recovery-coach/index.html",
    "recovery-coach/form-check/index.html",
    "recovery-coach/form-check/vendor/pose_landmarker_lite.task",
    "recovery-coach/logbook/index.html",
    "recovery-coach/full-backup/index.html"
  ];
  for(const name of mandatory)assert.ok((await stat(join(OUT,name))).size>0,"Missing bundled original route: "+name);
  await writeFile(join(OUT,"UNIFIED-M3-FLEX-README.txt"),[
    "M3 FLEX — ONE ORIGINAL APP + APPROVED RECOVERY",
    "Original React navigation, workout history, settings, nutrition, progress,",
    "22-day coached/workout routes, original M3 Coach V2, and seated Recovery Coach are bundled here.",
    "A/B retains only explicitly approved movements; other clips need review.",
    "This is a static prerendered client shell, NOT a live Nitro backend.",
    "Online login, Supabase features and cloud/paid coach APIs require separate",
    "verification; premium AI endpoints remain disabled. Do not infer they work.",
    "Original Flex and Marcus MP4/MP3 sources require internet.",
    "Users must export local Recovery logbook and original workout state before",
    "reinstalling a debug APK signed with an unstable key.",
    "No published production domain or server changed.",
  ].join("\n")+"\n");
  const receipt={
    schema:1,mode:"unified-client-prerender",routes:routes.length,
    recoveryIntegrated:true,paidAiEnabled:false,
    disclaimer:"Original app plus approved Recovery; not a fully validated cloud AI coach",
  };
  await writeFile(join(OUT,"unified-build-info.json"),JSON.stringify(receipt,null,2)+"\n");
  console.log("Created ONE unified M3 FLEX web bundle:",routes.length,
    "existing React SSR routes plus original Recovery and static assets.");
}finally{
  server.kill("SIGTERM");
  await Promise.race([new Promise(resolve=>server.once("exit",resolve)),delay(1500)]);
  if(!exited)server.kill("SIGKILL");
}
