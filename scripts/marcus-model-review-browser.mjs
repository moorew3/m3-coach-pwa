/** QA: actual interactive Marcus GLB, separate from current workout. No paid AI. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";

const port=17381, base="http://127.0.0.1:"+port, logs=[];
const server=spawn(process.execPath,[".output/server/index.mjs"], {
 env:{...process.env,HOST:"127.0.0.1",PORT:String(port),FLEX_PAID_AI_ENABLED:"false",OPENAI_API_KEY:""},
 stdio:["ignore","pipe","pipe"]
});
for(const stream of [server.stdout,server.stderr])stream.on("data",d=>{logs.push(String(d));if(logs.length>30)logs.shift()});
let browser;
try {
 let healthy=false;
 for(let i=0;i<40;i++){try{const r=await fetch(base+"/api/health",{signal:AbortSignal.timeout(1000)});if(r.ok){healthy=true;break}}catch{}await delay(350)}
 assert.ok(healthy,"M3 FLEX compiled Node server must be healthy");
 browser=await chromium.launch({headless:true,executablePath:process.env.M3_CHROME_PATH||undefined,
  channel:process.env.M3_CHROME_PATH?undefined:"chrome",
  args:["--no-sandbox","--disable-dev-shm-usage","--enable-unsafe-swiftshader","--use-gl=angle","--use-angle=swiftshader"]});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 const errors=[]; page.on("pageerror",e=>errors.push(String(e)));
 const res=await page.goto(base+"/marcus-review",{waitUntil:"domcontentloaded"});
 assert.equal(res?.status(),200);
 const gate=page.getByTestId("app-entry-tap");
 if(await gate.isVisible({timeout:1200}).catch(()=>false)){
   await gate.click(); await page.getByTestId("app-entry-yes").click();
 }
 await page.getByRole("heading",{name:"Marcus 3D Candidate"}).waitFor();
 // Do not mistake an old rendered portrait for the new real 3D model.
 await page.getByText("This updated model has no substitute still image",{exact:false}).waitFor();
 assert.equal(await page.getByRole("img",{name:/Generated draft/}).count(),0);
 assert.equal(await page.getByRole("button",{name:/Original photo detail · working 3D rig/}).getAttribute("aria-pressed"),"true");
 assert.equal(await page.getByRole("img",{name:/Original approved coach photo/}).count(),1);
 await page.getByTestId("marcus-review-3d").locator("canvas").waitFor();
 await page.getByTestId("marcus-3d-ready").waitFor({timeout:45000});
 assert.equal(await page.locator("main").getByText("REVIEW ONLY",{exact:false}).count()>0,true);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"no sideways Fold overflow");
 await mkdir("artifacts",{recursive:true});
 await page.getByTestId("marcus-review-3d").scrollIntoViewIfNeeded();
 await page.getByTestId("marcus-review-3d").screenshot({path:"artifacts/marcus-photo-3d-review-mobile.png",timeout:12000});
 assert.deepEqual(errors,[],"no uncaught JavaScript page errors");
 console.log("PASS: Samsung Fold review renders actual rigged model, is isolated, correct identity warnings");
 await context.close();
} catch(error) {console.error("MARCUS REVIEW QA FAILED:",error);
 console.error(logs.slice(-7).join("").slice(-1800));process.exitCode=1;
} finally {await browser?.close().catch(()=>{});server.kill("SIGTERM")}
