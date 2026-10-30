import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=readFileSync(new URL("../src/components/MirrorMe.tsx",import.meta.url),"utf8");
const modal=source.slice(source.indexOf("export function MirrorMeButton("));

test("Mirror Me uses a body-level portal, not a trapped transformed route overlay",()=>{
 assert.match(source,/import \{ createPortal \} from "react-dom"/);
 assert.match(modal,/createPortal\([\s\S]+document\.body/);
 assert.match(modal,/data-testid="mirror-me-dialog"/);
});
test("Galaxy Fold always has a visible safe-area-aware Exit Demo button",()=>{
 assert.match(modal,/data-testid="exit-mirror-demo"/);
 assert.match(modal,/Back to workout/);
 assert.match(modal,/safe-area-inset-top/);
 assert.match(modal,/onClick=\{exitDemo\}/);
 assert.match(modal,/aria-label="Close demonstration"/);
});
test("Android system Back and Escape dismiss the demo without resetting workout data",()=>{
 assert.match(modal,/history\.pushState\(/);
 assert.match(modal,/window\.addEventListener\("popstate", onBack\)/);
 assert.match(modal,/window\.removeEventListener\("popstate", onBack\)/);
 assert.match(modal,/window\.addEventListener\("keydown", onKey\)/);
 assert.match(modal,/event\.key !== "Escape"/);
 assert.doesNotMatch(modal,/localStorage\.(?:clear|removeItem)|restartWorkout\(|clearWorkout\(/);
});
test("existing Mirror Me video identity and original workout control remain unchanged",()=>{
 assert.match(source,/exerciseMotionFor\(move\.id\)/);
 assert.match(source,/const motion = exerciseMotionFor\(move\.id\)/);
 assert.match(modal,/MirrorMeCard move=\{move\} work=\{work\}/);
});
