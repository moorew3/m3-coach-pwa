import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
export function stamp(text, release) {
 assert.match(release, /^\d{4}-\d{2}-\d{2}\.\d{1,2}$/);
 const [date,revision]=release.split(".");
 const versionCode=Number(date.replaceAll("-", ""))*100+Number(revision);
 assert.ok(versionCode>0&&versionCode<=2100000000,"Android version is out of bounds");
 assert.match(text,/versionCode \d+/);assert.match(text,/versionName "[^"\n]+"/);
 return text.replace(/versionCode \d+/,"versionCode "+versionCode)
  .replace(/versionName "[^"\n]+"/,'versionName "'+release+'"');
}
if(process.argv[1]===fileURLToPath(import.meta.url)) {
 const root=new URL("../",import.meta.url);
 const source=await readFile(new URL("src/lib/build-info.ts",root),"utf8");
 const release=source.match(/export const RELEASE = "([^"]+)"/)?.[1];assert.ok(release);
 const target=new URL("android/app/build.gradle",root);
 await writeFile(target,stamp(await readFile(target,"utf8"),release));
 console.log("Stamped existing Android app version "+release+"; app ID and signing configuration unchanged.");
}
