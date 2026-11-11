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
 // The active Recovery and Coach routes now converge on the unified V2 screen.
 const intro=page.getByTestId("app-entry-tap");
 if(await intro.count()){
  await page.locator('[data-testid="app-entry-gate"][data-hydrated="true"]').waitFor();
  await intro.click();await page.getByTestId("app-entry-yes").click();
  await page.getByTestId("app-entry-gate").waitFor({state:"detached"});
 }
 await page.getByRole("button",{name:"Workout library and tools"}).click();
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 const picker=page.getByTestId("m3-unified-workout-picker");
 // Recovery is intentionally behind the collapsed secondary-workouts menu.
 await picker.locator("details > summary").click();
 assert.equal(await picker.getByRole("link",{name:"Recovery · 5 approved moves"}).count(),1);
 const v2=await page.goto(origin+"/v2?workout=recovery",{waitUntil:"domcontentloaded"});
 assert.equal(v2?.status(),200,"Static host must serve V2");
 await page.getByTestId("flex-training").waitFor();
 const stage=page.getByTestId("v2-trainer-stage");
 assert.equal(await page.getByLabel("Workout",{exact:true}).inputValue(),"recovery");
 assert.equal(await stage.getAttribute("data-scene-id"),"C09-PRE-BREATH-R2");
 await page.getByLabel("Exercise",{exact:true}).selectOption("1");
 assert.equal(await stage.getAttribute("data-scene-id"),"C01-R3");
 await page.getByLabel("Workout mode").selectOption("hologram");
 assert.equal(await stage.getAttribute("data-scene-id"),"C01-R3");
 assert.match(await page.getByTestId("projection-format-disclosure").textContent(),/2D projection/);
 const archive=await page.request.get(origin+"/recovery-coach/index.html");
 assert.equal(archive.status(),200);
 const archivedHtml=await archive.text();
 assert.match(archivedHtml,/id="workoutChoices"/);
 for(const id of ["C09-PRE-BREATH-R2","C01-R3","C02","C03","C04-R2","C08-PRESS-R3","C10-POST-BREATH-R1"])
  assert.ok(archivedHtml.includes(id),"Original approved scene absent: "+id);
 const gallery=await page.request.get(origin+"/recovery-coach/programs/index.html");
 assert.equal(gallery.status(),200,"Original scene gallery must be served");
 assert.match(await gallery.text(),/existing-app-videos/);
 const backup=await page.request.get(origin+"/recovery-coach/full-backup/index.html");
 assert.equal(backup.status(),200,"Original full backup must be served");
 const backupHtml=await backup.text();
 assert.match(backupHtml,/Encrypted Full App Backup/);
 assert.match(backupHtml,/id="export"/);
 await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
 await page.getByRole("button",{name:"Workout library and tools"}).click();
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 assert.equal(log.length,0,"Static M3 FLEX browser error: "+log.join("; ").slice(0,800));
 console.log("Unified M3 FLEX V2 works on static hosting at Fold width with approved scenes, Hologram, archive and owner backup. No paid AI.");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
