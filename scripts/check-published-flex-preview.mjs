/**
 * Temporary advisory QA for a user-facing published M3 FLEX preview.
 * It tests the web address the athlete actually opens, NOT GitHub source.
 * No camera/microphone permissions, account data, AI generation or costs.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const url=process.env.M3_FLEX_HOSTED_PREVIEW;
if(!url){console.log("No external preview URL configured; no live-site requests.");process.exit(0)}
if(!url.startsWith("https://dochost.co/d/"))throw Error("Unexpected user-facing preview host");
const browser=await chromium.launch({
 headless:true,
 executablePath:process.env.M3_CHROME_PATH||undefined,
 channel:process.env.M3_CHROME_PATH?undefined:"chrome",
 args:["--no-sandbox","--disable-dev-shm-usage"]
});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 page.setDefaultTimeout(25000);
 const response=await page.goto(url,{waitUntil:"domcontentloaded",timeout:45000});
 assert.equal(response?.status(),200,"Published M3 FLEX web link must return HTTP 200");
 await page.locator('iframe[src*="sandbox-v2"]').waitFor({timeout:30000});
 const deadline=Date.now()+30000;
 let appFrame;
 while(Date.now()<deadline){
  appFrame=page.frames().find(f=>f.url().includes("sandbox-v2--"));
  if(appFrame)break;
  await page.waitForTimeout(350);
 }
 assert.ok(appFrame,"The public preview must load a sandboxed application iframe");
 await appFrame.locator("#moveTitle").waitFor({timeout:25000});
 assert.match(await appFrame.locator("#moveTitle").innerText(),/Calm seated breathing/);
 const button=appFrame.locator('[data-stage="1"]');
 await button.click();
 assert.equal(await appFrame.locator("#moveTitle").innerText(),"Seated dumbbell shrugs");
 assert.equal(await appFrame.locator("#pairMode").count(),1);
 assert.match(await appFrame.locator("#progressText").innerText(),/^0 of 10 steps completed/);
 await appFrame.locator("#startPause").click();
 assert.match(await appFrame.locator("#note").innerText(),/clearance/i,"Hosted app must enforce clinician clearance");
 const links=await appFrame.locator('a[href*="dochost.co/d/"]').evaluateAll(els=>els.map(a=>a.href));
 for(const required of ["https://dochost.co/d/ysd4nkks","https://dochost.co/d/wyaem63h"])
  assert.ok(links.includes(required),"Preview missing working companion app link: "+required);
 console.log("✓ Published M3 FLEX link actually renders JS, stage selection, safety gate and companion links on phone-width Chrome.");
 console.log("✓ Direct user app URL: "+url);
}finally{await browser.close()}
