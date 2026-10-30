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
const root=resolve("unified-static-web");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".wasm":"application/wasm",".task":"application/octet-stream",
 ".json":"application/json",".png":"image/png",".svg":"image/svg+xml",".woff2":"font/woff2"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url??"/","http://localhost").pathname;
  const clean=decodeURIComponent(pathname).replace(/^\/+/,"");
  if(clean.includes("..")||clean.includes("\0"))throw Error("Invalid path");
  let local=resolve(root,clean);
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
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Recovery"}).click();
 await page.getByTestId("m3-native-recovery").waitFor();
 await page.frameLocator('[data-testid="m3-recovery-existing-player"]')
   .locator("#workoutChoices").waitFor();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Progress"}).click();
 await page.getByTestId("m3-original-progress-recovery").waitFor();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Program"}).click();
 await page.getByRole("navigation",{name:"Main"}).getByRole("link",{name:"Today"}).click();
 await page.getByTestId("m3-unified-workout-picker").waitFor();
 assert.equal(log.length,0,"Static original React app had client errors: "+log.join("; ").slice(0,800));
 console.log("ONE unified original M3 FLEX app navigates Home → Recovery → Progress → Program → Home on static hosting. No Node server needed for this smoke.");
}finally{
 if(browser)await browser.close();
 await new Promise(resolve=>server.close(resolve));
}
