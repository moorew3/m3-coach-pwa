/**
 * Verify the *entire original M3 FLEX* pre-rendered client works on static
 * hosting (same host for original React app and approved Recovery Coach).
 * Only local runner files and HTTP; no API credentials or paid media.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, join, sep } from "node:path";
import { chromium } from "playwright-core";
const root=resolve(process.env.M3_STATIC_ROOT || "unified-static-web");
const capacitorRouting=process.env.M3_CAPACITOR_ROUTING==="1";
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".wasm":"application/wasm",".task":"application/octet-stream",
 ".json":"application/json",".png":"image/png",".svg":"image/svg+xml",".woff2":"font/woff2"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url??"/","http://localhost").pathname;
  const clean=decodeURIComponent(pathname).replace(/^\/+/,"");
  if(clean.includes("..")||clean.includes("\0"))throw Error("Invalid path");
  // Capacitor 7 sends extensionless paths to the React entry point. It does
  // not implement a web server's directory -> index.html resolution.
  const nativeFallback=capacitorRouting && (pathname==="/" || !clean.split("/").filter(Boolean).at(-1)?.includes("."));
  let local=resolve(root,nativeFallback?"index.html":clean);
  if(local!==root&&!local.startsWith(root+sep))throw Error("Outside app");
  let info=await stat(local);
  if(info.isDirectory()){local=join(local,"index.html");info=await stat(local)}
  const bytes=await readFile(local);
  res.writeHead(200,{"content-type":types[extname(local)]??"application/octet-stream","cache-control":"no-cache"});
  res.end(bytes);
 }catch{res.writeHead(404,{"content-type":"text/plain"});res.end("Not found")}
});
await new Promise(resolve=>server.listen(17397,"127.0.0.1",resolve));
let browser;
const log=[];
try{
 browser=await chromium.launch({executablePath:process.env.M3_CHROME_PATH,headless:true,
  args:["--no-sandbox","--disable-dev-shm-usage"]});
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 page.on("pageerror",error=>log.push(String(error)));
 const origin="http://127.0.0.1:17397";
 const response=await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
 assert.equal(response?.status(),200);
 const intro=page.getByTestId("app-entry-tap");
 if(await intro.count()){
  await intro.click();
  await page.getByTestId("app-entry-yes").click();
  await page.getByTestId("app-entry-gate").waitFor({state:"detached"});
 }
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Settings"}).click();
 await page.getByTestId("m3-full-device-backup").click();
 await page.locator("#counts").waitFor();
 assert.match(await page.title(),/Encrypted Full App Backup/);
 assert.equal(await page.locator("#export").count(),1,"Backup must open the actual local export tool, not the React 404");
 await page.goBack();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Today"}).click();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Recovery"}).click();
 await page.getByTestId("m3-native-recovery").waitFor();
 const recoveryFrame=page.frameLocator('[data-testid="m3-recovery-existing-player"]');
 await recoveryFrame.locator("#workoutChoices").waitFor({state:"attached"});
 assert.equal(await page.getByTestId("m3-recovery-existing-player").getAttribute("src"),"/recovery-coach/index.html?program=recovery&embedded=1");
 assert.equal(await recoveryFrame.locator("#unifiedWorkoutChooser").isVisible(),false,"Embedded Recovery must not duplicate parent A/B selector");
 assert.equal(await recoveryFrame.locator("#emergencyStop").isVisible(),true,"Emergency stop must remain accessible");
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Progress"}).click();
 await page.getByTestId("m3-original-progress-recovery").waitFor();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Program"}).click();
 await page.getByTestId("m3-primary-workout-menu").waitFor();
 assert.equal(await page.getByTestId("m3-legacy-program-archive").getAttribute("open"),null,"Old standing workout must not open by default");
 const scenesUrl=await page.getByTestId("program-scene-library").getAttribute("href");
 assert.equal(scenesUrl,"/recovery-coach/programs/index.html");
 const sceneResponse=await page.request.get(origin+scenesUrl);
 assert.equal(sceneResponse.status(),200,"Packaged Workout A/B scene review must not 404");
 assert.match(await sceneResponse.text(),/Workout A\/B Production Review/);
 // Original approved media and older original-app bench clips must be viewable from one app.
 await page.goto(origin+scenesUrl,{waitUntil:"domcontentloaded"});
 await page.getByTestId("existing-app-videos").waitFor();
 await page.locator("#existingAppVideoLibrary summary").click();
 assert.equal(await page.locator("#existingLockedVideoLinks a").filter({hasText:"▶"}).count(),7,
   "Seven existing approved videos must be linked without creating new clips");
 assert.equal(await page.locator("#existingOriginalAppLinks a").count(),6,
   "Previously built bench/stretch/rowing clips remain accessible as reference only");
 assert.match(await page.locator("#existingVideoCount").textContent(),/7 original approved Recovery videos reused/);
 assert.equal(await page.locator("#sceneVideo").evaluate(v=>v.paused),true,
   "Reused media must not auto-play on entering the gallery");
 await page.goBack();
 await page.getByTestId("m3-primary-workout-menu").waitFor();
 await page.getByTestId("program-approve-scenes").click();
 await page.locator("#allScenesCatalog").waitFor();
 assert.equal(await page.locator("#sceneFilter").inputValue(),"candidates","Owner review must show C13–C23 without manual search");
 assert.equal(await page.locator("#sceneGrid .item").count(),11,"Exactly eleven rendered drafts need explicit review");
 assert.equal(await page.locator("#sceneGrid .item").filter({hasText:"MARCUS AUDIO NOT VERIFIED"}).count(),4);
 assert.equal(await page.locator("#sceneReviewVideo").isVisible(),false,"Review entry must not autoplay or activate a clip");
 await page.goBack();
 await page.getByTestId("m3-primary-workout-menu").waitFor();
 await page.getByTestId("program-v2").click();
 await page.getByTestId("v2-approved-avatar-entrance").waitFor();
 await page.getByTestId("v2-opening-exit").click();
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Today"}).click();
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 assert.equal(log.length,0,"Static original React app had client errors: "+log.join("; ").slice(0,800));
 console.log("ONE unified original M3 FLEX app navigates Home → Recovery → Progress → Program → Home on static hosting. No Node server needed for this smoke.");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
