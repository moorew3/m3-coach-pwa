/** Fold-width browser QA for the active, unified V2 trainer. No paid AI or new services. */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as delay} from "node:timers/promises";
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
 assert.equal(await workout.inputValue(),"recovery");
 assert.equal(await stage.getAttribute("data-scene-id"),"C09-PRE-BREATH-R2");
 await exercise.selectOption("1");assert.equal(await stage.getAttribute("data-scene-id"),"C01-R3");
 await exercise.selectOption("2");assert.equal(await stage.getAttribute("data-scene-id"),"C02");
 console.log("✓ Recovery selects exact original approved Marcus demonstrations");
 await workout.selectOption("A");await exercise.selectOption("1");
 assert.equal(await stage.getAttribute("data-scene-id"),"C01-R3");
 await exercise.selectOption("2");assert.equal(await stage.getAttribute("data-scene-id"),"C02");
 await workout.selectOption("B");await exercise.selectOption("1");
 assert.equal(await stage.getAttribute("data-scene-id"),"C08-PRESS-R3");
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
 await workout.selectOption("recovery");await exercise.selectOption("1");
 const clearance=page.locator('[data-testid="unified-workout-selectors"] input[type="checkbox"]');
 assert.equal(await clearance.count(),3);
 assert.equal(await page.getByRole("button",{name:"Start workout"}).isDisabled(),true);
 for(const c of await clearance.all())await c.check();
 await page.getByRole("button",{name:"Start workout"}).click();
 await page.getByRole("button",{name:"Pause workout"}).waitFor();
 await page.getByRole("button",{name:"Complete set and advance"}).click();
 assert.equal(await stage.getAttribute("data-scene-role"),"rest");
 assert.equal(await stage.getAttribute("data-scene-id"),"C09-PRE-BREATH-R2");
 await page.getByRole("button",{name:"Pause workout"}).click();
 await page.getByRole("button",{name:"Start workout"}).waitFor();
 console.log("✓ Clearance guard, set-to-rest breathing and pause");
 const archive=await context.newPage();archive.setDefaultTimeout(15000);
 response=await archive.goto(base+"/recovery-coach/?program=A",{waitUntil:"domcontentloaded"});
 assert.equal(response?.status(),200);
 await archive.locator("#workoutChoices").waitFor();
 await archive.locator('[data-stage="1"]').click();
 assert.equal(await archive.locator("#steps .item").count(),2);
 await archive.close();
 assert.deepEqual(errors,[],"No uncaught browser errors");
 assert.equal(requests.some(u=>u.includes("/api/public/coach-talk")||u.includes("/api/public/coach-speech")),false);
 console.log("M3 FLEX V2 mobile smoke PASSED: approved movement, safety, rest, projection and archive; no paid AI");
}catch(error){console.error("M3 FLEX V2 mobile smoke FAILED",error);
 console.error("Recent server log:",logs.slice(-8).join("").slice(-1000));process.exitCode=1;
}finally{await browser?.close().catch(()=>{});server.kill("SIGTERM");}
