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
 assert.equal(await page.getByRole("navigation",{name:"Main"}).count(),0,"No workout navigation covering review");
 const reference=page.getByRole("img",{name:/Original approved Marcus likeness reference/});
 await reference.waitFor();
 assert.equal(await reference.isVisible(),true,"Approved photo must be primary visible content");
 const btn=page.getByTestId("marcus-rejected-toggle");
 assert.equal(await btn.getAttribute("aria-expanded"),"false","Rejected 3D must be hidden by default");
 assert.equal(await page.locator("canvas").count(),0,"Rejected GLB must NOT auto-download/render");
 assert.equal(await page.getByTestId("marcus-review-3d").count(),0,"No failed 3D presented as finished");
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2),"No sideways Fold overflow");
 await mkdir("artifacts",{recursive:true});
 await page.screenshot({path:"artifacts/marcus-quality-hold-fold.png",fullPage:true});
 await btn.click();
 assert.equal(await btn.getAttribute("aria-expanded"),"true");
 await page.getByTestId("marcus-review-3d").locator("canvas").waitFor();
 await page.getByTestId("marcus-3d-ready").waitFor({timeout:45000});
 const viewer=page.getByTestId("marcus-review-3d");
 const image=await viewer.screenshot({path:"artifacts/marcus-photo-3d-review-mobile.png",timeout:12000});
 assert.ok(image.byteLength>18000,"Rejected diagnostic GLB must load only on request");
 const details=page.getByTestId("marcus-review-compare");
 assert.equal(await details.getAttribute("open"),null);
 await details.locator("summary").click();
 assert.equal(await details.getAttribute("open"),"");
 assert.equal(await page.getByTestId("marcus-model-select").locator("option").count(),5);
 assert.deepEqual(errors,[],"No uncaught JavaScript errors");
 console.log("PASS: Fold shows correct Marcus reference first, no rejected 3D by default; gated diagnostics load only on request");
 await context.close();
} catch(error) {console.error("MARCUS REVIEW QA FAILED:",error);
 console.error(logs.slice(-7).join("").slice(-1800));process.exitCode=1;
} finally {await browser?.close().catch(()=>{});server.kill("SIGTERM")}
