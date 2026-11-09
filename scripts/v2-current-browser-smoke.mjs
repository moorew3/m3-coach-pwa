/** Fold-width browser QA for the active, unified V2 trainer. No paid AI or new services. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
import {mkdir} from "node:fs/promises";
import {chromium} from "playwright-core";
const port=17379,base="http://127.0.0.1:"+port,logs=[];
const server=spawn(process.execPath,[".output/server/index.mjs"],{
 env:{...process.env,HOST:"127.0.0.1",PORT:String(port),FLEX_PAID_AI_ENABLED:"false",OPENAI_API_KEY:"",FLEX_AI_ALLOWED_USER_IDS:""},
 stdio:["ignore","pipe","pipe"]});
for(const stream of [server.stdout,server.stderr])stream.on("data",d=>{logs.push(String(d));if(logs.length>40)logs.shift();});
let browser;
try{
 let healthy=false;
 for(let i=0;i<35;i++){try{const r=await fetch(base+"/api/health",{signal:AbortSignal.timeout(1000)});if(r.ok){healthy=true;break;}}catch{}await delay(350);}
 assert.ok(healthy,"Compiled M3 FLEX server must be healthy");
 browser=await chromium.launch({headless:true,executablePath:process.env.M3_CHROME_PATH||undefined,
  channel:process.env.M3_CHROME_PATH?undefined:"chrome",args:["--no-sandbox","--disable-dev-shm-usage"]});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:"reduce"});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const requests=[],errors=[];
 page.on("request",r=>requests.push(r.url()));page.on("pageerror",e=>errors.push(String(e)));
 let response=await page.goto(base+"/",{waitUntil:"domcontentloaded"});
 assert.equal(response?.status(),200);
 await page.locator('[data-testid="app-entry-gate"][data-hydrated="true"]').waitFor();
 await page.getByTestId("app-entry-tap").click();
 await page.getByTestId("app-entry-yes").click();
 await page.getByTestId("app-entry-gate").waitFor({state:"detached"});
 await page.getByRole("button",{name:"Workout library and tools"}).click();
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 console.log("✓ Fold entrance, accessible tools, one workout picker");
 await page.getByTestId("m3-unified-workout-picker").getByRole("link",{name:"Recovery · 5 approved moves"}).click();
 await page.getByTestId("flex-training").waitFor();
 const stage=page.getByTestId("v2-trainer-stage"),workout=page.getByLabel("Workout",{exact:true}),exercise=page.getByLabel("Exercise",{exact:true});
 const verifyMovingVideo=async(label)=>{
  // This rejects the previous false green: a matching URL can still be black.
  await page.waitForFunction(()=>{
   const box=document.querySelector('[data-testid="coach-motion"]');
   const v=box?.querySelector('video[data-active="true"]');
   return box?.getAttribute('data-frame-ready')==="true" &&
    v?.readyState>=2 && v.videoWidth>0 && !v.paused && v.currentTime>0.15;
  },null,{timeout:25000});
  const video=page.locator('[data-testid="coach-motion"] video[data-active="true"]');
  const before=await video.evaluate(v=>v.currentTime);
  await page.waitForTimeout(650);
  const after=await video.evaluate(v=>v.currentTime);
  assert.ok(after>before+0.08,label+" must render advancing, decoded frames, not only a video URL");
  assert.equal(await page.getByTestId("coach-motion-loading").count(),0,"No poster covering moving "+label);
  console.log("✓ Decoded moving frame: "+label+" ("+before.toFixed(2)+" → "+after.toFixed(2)+"s)");
 };
 assert.equal(await workout.inputValue(),"recovery");
 assert.equal(await stage.getAttribute("data-scene-id"),"C09-PRE-BREATH-R2");
 await verifyMovingVideo("C09 breathing preview");
 await exercise.selectOption("1");assert.equal(await stage.getAttribute("data-scene-id"),"C01-R3");
 await verifyMovingVideo("C01 seated shrugs preview");
 // The old UI scrolled Marcus below the Fold; video must now be FIRST.
 await page.evaluate(()=>window.scrollTo(0,0));
 const stageBox=await stage.boundingBox();
 const coachBox=await page.getByTestId("coach-motion").boundingBox();
 const videoPosition=await page.getByTestId("coach-motion").evaluate(el=>getComputedStyle(el).position);
 assert.equal(videoPosition,"absolute","Moving coach must not collapse to a zero-height relative box");
 console.log("Fold visible-frame bounds:",JSON.stringify({stageBox,coachBox,videoPosition}));
 await mkdir("artifacts",{recursive:true});
 await page.screenshot({path:"artifacts/m3-flex-recovery-visual-check.png",timeout:8000});
 assert.ok(stageBox && stageBox.y<185,"Marcus stage must be visible near the TOP of the phone");
 assert.ok(coachBox && coachBox.y<320 && coachBox.y+coachBox.height>360 && coachBox.height>=200,
  "Moving Marcus must occupy at least 200 visible vertical pixels in the Fold viewport");
 console.log("✓ Visible-first Fold layout: stage at "+stageBox.y.toFixed(0)+"px, moving coach at "+coachBox.y.toFixed(0)+"px");
 await exercise.selectOption("2");assert.equal(await stage.getAttribute("data-scene-id"),"C02");
 console.log("✓ Recovery selects exact original approved Marcus demonstrations");
 await workout.selectOption("A");await exercise.selectOption("1");
 assert.equal(await stage.getAttribute("data-scene-id"),"C01-R3");
 await exercise.selectOption("2");assert.equal(await stage.getAttribute("data-scene-id"),"C02");
 await workout.selectOption("B");await exercise.selectOption("1");
 assert.equal(await stage.getAttribute("data-scene-id"),"C08-PRESS-R3");
 await verifyMovingVideo("C08 INNSTAR chest press preview");
 await exercise.selectOption("2");assert.equal(await stage.getAttribute("data-scene-id"),"C03");
 console.log("✓ Workouts A/B maintain existing exercise order and identity");
 await page.getByLabel("Workout mode").selectOption("hologram");
 assert.equal(await page.getByTestId("flex-training").getAttribute("data-projection-focus"),"true");
 assert.equal(await stage.getAttribute("data-scene-id"),"C03");
 assert.match(await page.getByTestId("projection-format-disclosure").innerText(),/2D projection.*3D avatar pending/);
 await page.getByTestId("projection-exit-toggle").click();
 assert.equal(await workout.inputValue(),"B");
 assert.equal(await stage.getAttribute("data-scene-id"),"C03");
 console.log("✓ Coach/Hologram share selected workout, and 3D availability is honest");
 // RayNeo is a screen/output mode, never a replacement workout or avatar.
 await page.getByLabel("Workout mode").selectOption("glasses");
 assert.equal(await page.getByTestId("flex-training").getAttribute("data-display-mode"),"glasses");
 assert.equal(await page.getByTestId("flex-training").getAttribute("data-glasses-mode"),"true");
 assert.ok(page.url().includes("display=glasses"));
 assert.equal(await stage.getAttribute("data-scene-id"),"C03");
 assert.match(await page.getByTestId("projection-format-disclosure").innerText(),/RayNeo GT Max.*2D display.*3D avatar pending/);
 await page.getByTestId("rayneo-fullscreen-toggle").waitFor();
 await page.getByTestId("projection-controls-toggle").click();
 await page.getByTestId("rayneo-connection-guide").waitFor();
 assert.equal(await page.getByLabel("Workout mode").inputValue(),"glasses");
 await page.getByTestId("projection-close-settings").click();
 await page.getByTestId("projection-exit-toggle").click();
 assert.equal(await page.getByTestId("flex-training").getAttribute("data-display-mode"),"coach");
 assert.equal(await workout.inputValue(),"B");
 assert.equal(await stage.getAttribute("data-scene-id"),"C03");
 console.log("✓ RayNeo mode retains approved exercise, offers fullscreen and never invents a glasses microphone");
 await workout.selectOption("recovery");await exercise.selectOption("1");
 const clearance=page.locator('[data-testid="unified-workout-selectors"] input[type="checkbox"]');
 assert.equal(await clearance.count(),3);
 assert.equal(await page.getByRole("button",{name:"Start workout"}).isDisabled(),true);
 for(const c of await clearance.all())await c.check();
 await page.getByRole("button",{name:"Start workout"}).click();
 await page.getByRole("button",{name:"Pause workout"}).waitFor();
 await verifyMovingVideo("C01 active work after Start");
 await page.getByRole("button",{name:"Complete set and advance"}).click();
 assert.equal(await stage.getAttribute("data-scene-role"),"rest");
 assert.equal(await stage.getAttribute("data-scene-id"),"C09-PRE-BREATH-R2");
 await verifyMovingVideo("C09 rest breathing after set");
 await page.getByRole("button",{name:"Pause workout"}).click();
 await page.getByRole("button",{name:"Start workout"}).waitFor();
 console.log("✓ Clearance guard, set-to-rest breathing and pause");
 const archived=await fetch(base+"/recovery-coach/index.html?program=A");
 assert.equal(archived.status,200,"Archive player must remain served by same origin");
 const archivedHtml=await archived.text();
 assert.match(archivedHtml,/id="workoutChoices"/);
 assert.match(archivedHtml,/C01-R3/);
 assert.match(archivedHtml,/C02/);
 // A RayNeo GT Max exposes a 1920x1080 video display. Test the same
 // source at that aspect ratio independently of the user's phone session.
 const externalContext=await browser.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"reduce"});
 const rayneo=await externalContext.newPage();
 rayneo.setDefaultTimeout(15000);
 const direct=await rayneo.goto(base+"/v2?workout=recovery&display=glasses",{waitUntil:"domcontentloaded"});
 assert.equal(direct?.status(),200);
 await rayneo.getByTestId("flex-training").waitFor();
 assert.equal(await rayneo.getByTestId("flex-training").getAttribute("data-display-mode"),"glasses");
 assert.equal(await rayneo.getByTestId("v2-trainer-stage").getAttribute("data-scene-id"),"C09-PRE-BREATH-R2");
 await rayneo.waitForFunction(()=>{
  const c=document.querySelector('[data-testid="coach-motion"]');
  const v=c?.querySelector('video[data-active="true"]');
  return c?.getAttribute("data-frame-ready")==="true" && v?.videoWidth>0 && !v.paused && v.currentTime>0.15;
 },null,{timeout:25000});
 const rayneoVideo=rayneo.locator('[data-testid="coach-motion"] video[data-active="true"]');
 const t0=await rayneoVideo.evaluate(v=>v.currentTime);
 await rayneo.waitForTimeout(450);
 const t1=await rayneoVideo.evaluate(v=>v.currentTime);
 assert.ok(t1>t0+0.05,"RayNeo display must show advancing approved Marcus video frames");
 const rayneoStage=await rayneo.getByTestId("v2-trainer-stage").boundingBox();
 assert.ok(rayneoStage && rayneoStage.width>=1700 && rayneoStage.height>=850,"Wide RayNeo workout stage must fill the external display");
 await rayneo.screenshot({path:"artifacts/m3-flex-rayneo-display-review.png",timeout:8000});
 await externalContext.close();
 console.log("✓ 1920x1080 RayNeo direct link: full-height approved moving Marcus and native 2D disclosure");
 assert.deepEqual(errors,[],"No uncaught browser errors");
 assert.equal(requests.some(u=>u.includes("/api/public/coach-talk")||u.includes("/api/public/coach-speech")),false);
 console.log("M3 FLEX V2 mobile smoke PASSED: approved movement, safety, rest, projection and archive; no paid AI");
}catch(error){console.error("M3 FLEX V2 mobile smoke FAILED",error);
 console.error("Recent server log:",logs.slice(-8).join("").slice(-1000));process.exitCode=1;
}finally{await browser?.close().catch(()=>{});server.kill("SIGTERM");}
