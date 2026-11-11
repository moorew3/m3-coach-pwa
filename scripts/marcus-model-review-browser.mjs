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
 await page.getByRole("heading",{name:"Marcus · 3D Review"}).waitFor();
 assert.equal(await page.getByTestId("marcus-review-warning").isVisible(),true);
 assert.equal(await page.getByRole("navigation",{name:"Main"}).count(),0,"No fixed workout nav should cover the model on review screen");
 const details=page.getByTestId("marcus-review-compare");
 assert.equal(await details.getAttribute("open"),null,"Reference and variants must start collapsed");
 assert.equal(await page.getByRole("img",{name:/Original approved coach photo/}).isVisible(),false,"Reference photo must not push model below the fold");
 assert.equal(await page.getByTestId("marcus-selected-version").innerText(),"Original photo detail · working 3D rig");
 const frame=page.getByTestId("marcus-review-3d");
 await frame.locator("canvas").waitFor();
 await page.getByTestId("marcus-3d-ready").waitFor({timeout:45000});
 const rect=await frame.boundingBox();
 assert.ok(rect && rect.y<185,"3D viewer must start near top of Samsung Fold, not below buttons: "+JSON.stringify(rect));
 assert.ok(rect.height>=380 && rect.width>=320,"Viewer needs usable touch viewport");
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"No sideways Fold overflow");
 await mkdir("artifacts",{recursive:true});
 await page.waitForTimeout(750);
 const shot=await frame.screenshot({path:"artifacts/marcus-photo-3d-review-mobile.png",timeout:12000});
 assert.ok(shot.byteLength > 18000,"Real 3D actor must appear in rendered viewport; reject blank WebGL");
 await details.locator("summary").click();
 assert.equal(await details.getAttribute("open"),"","Reference must expand on request");
 assert.equal(await page.getByRole("img",{name:/Original approved coach photo/}).isVisible(),true);
 assert.equal(await page.getByTestId("marcus-model-select").locator("option").count(),5);
 assert.deepEqual(errors,[],"No uncaught JavaScript page errors");
 console.log("PASS: 3D actor above Fold fold; no bottom nav; reference/versions collapsed; rig rendered; no paid AI calls");
 await context.close();
} catch(error) {console.error("MARCUS REVIEW QA FAILED:",error);
 console.error(logs.slice(-7).join("").slice(-1800));process.exitCode=1;
} finally {await browser?.close().catch(()=>{});server.kill("SIGTERM")}
