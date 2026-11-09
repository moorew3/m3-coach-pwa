import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { motionFrameMayAdvance } from "../src/v2/playback-gate.ts";

const gate = (patch = {}) => motionFrameMayAdvance({
  mediaRequired: true,
  expectedKey: "A:1:0:work",
  decodedKey: "A:1:0:work",
  playingKey: "A:1:0:work",
  ...patch,
});

test("time runs only for the selected, decoded, actively playing Marcus scene", () => {
  assert.equal(gate(), true);
  assert.equal(gate({ playingKey: "" }), false, "buffering or paused video freezes the timer");
  assert.equal(gate({ decodedKey: "" }), false, "never count before first decoded frame");
  assert.equal(gate({ expectedKey: "" }), false, "missing scene key never counts");
  assert.equal(gate({ playingKey: "A:0:0:work" }), false, "previous exercise cannot count");
  assert.equal(gate({ decodedKey: "A:1:0:rest" }), false, "rest and work are distinct");
  assert.equal(gate({ decodedKey: "A:1:1:work" }), false, "previous set cannot count");
  assert.equal(gate({ mediaRequired: false, decodedKey: "", playingKey: "" }), true);
});

test("V2 and the approved player wire playback loss into the clock gate", () => {
  const v2 = readFileSync(new URL("../src/routes/v2.tsx", import.meta.url), "utf8");
  const player = readFileSync(new URL("../src/components/CoachMotion.tsx", import.meta.url), "utf8");
  assert.match(v2, /motionFrameMayAdvance\(\{[\s\S]*?playingKey: activeMotionKey/);
  assert.match(v2, /onPlaybackStateChange=\{\(isPlaying\) => \{/);
  assert.match(player, /onPlaying=\{\(event\) => \{[\s\S]*?playbackStateCallback\.current\?\.\(true\)/);
  assert.match(player, /onWaiting=\{\(\) => \{[\s\S]*?playbackStateCallback\.current\?\.\(false\)/);
  assert.match(player, /onStalled=\{\(\) => \{[\s\S]*?playbackStateCallback\.current\?\.\(false\)/);
  assert.match(player, /onPause=\{\(\) => \{[\s\S]*?playbackStateCallback\.current\?\.\(false\)/);
  assert.match(player, /onError=\{\(\) => \{[\s\S]*?playbackStateCallback\.current\?\.\(false\)/);
});
