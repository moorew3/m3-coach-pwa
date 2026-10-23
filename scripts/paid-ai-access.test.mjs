import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_AI_JSON_BYTES,
  PaidAiLimiter,
  authorizePaidAi,
  readBoundedAiJson,
} from "../src/lib/paid-ai-access.ts";

const origin = "https://flex.example";
const url = origin + "/api/public/coach-talk";
const config = {
  FLEX_PAID_AI_ENABLED: "true",
  FLEX_AI_ALLOWED_USER_IDS: "owner-id",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_testonly",
};

function request(options = {}) {
  return new Request(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      ...(options.auth === false ? {} : { Authorization: "Bearer example.jwt.sig" }),
      ...(options.headers ?? {}),
    },
    body: options.body ?? JSON.stringify({ message: "How was my set?" }),
  });
}
function gate(options = {}) {
  return authorizePaidAi(request(options), options.operation ?? "talk", {
    env: options.env ?? config,
    now: options.now ?? 60_000,
    limiter: options.limiter ?? new PaidAiLimiter(),
    verifyIdentity: options.verifyIdentity ?? (async () => "owner-id"),
  });
}

test("paid AI is DISABLED unless explicitly enabled", async () => {
  const res = await gate({ env: { ...config, FLEX_PAID_AI_ENABLED: "" } });
  assert.ok(res instanceof Response);
  assert.equal(res.status, 503);
  const missingAllowlist = await gate({ env: { ...config, FLEX_AI_ALLOWED_USER_IDS: "" } });
  assert.equal(missingAllowlist.status, 503);
});

test("only JSON requests of bounded declared size are accepted", async () => {
  assert.equal((await gate({ headers: { "Content-Type": "text/plain" } })).status, 415);
  assert.equal((await gate({ headers: { "Content-Length": String(MAX_AI_JSON_BYTES + 1) } })).status, 413);
});

test("CSRF origin, authenticated user and explicit identity allowlist gate expensive calls", async () => {
  assert.equal((await gate({ headers: { Origin: "https://attacker.invalid" } })).status, 403);
  assert.equal((await gate({ auth: false })).status, 401);
  assert.equal((await gate({ verifyIdentity: async () => null })).status, 401);
  assert.equal((await gate({ verifyIdentity: async () => "other-user" })).status, 403);
  assert.deepEqual(await gate(), { userId: "owner-id" });
});

test("both paid coach routes share a per-user request limit", async () => {
  const counter = new PaidAiLimiter();
  for (let i = 0; i < 5; i++) assert.deepEqual(await gate({ limiter: counter, operation: "speech" }), { userId: "owner-id" });
  for (let i = 0; i < 5; i++) assert.deepEqual(await gate({ limiter: counter, operation: "talk" }), { userId: "owner-id" });
  assert.equal((await gate({ limiter: counter })).status, 429);
  assert.deepEqual(await gate({ limiter: counter, now: 120_000 }), { userId: "owner-id" });
});

test("a conservative per-process daily quota still stops repeated requests", () => {
  const counter = new PaidAiLimiter();
  for (let i = 0; i < 60; i++) {
    assert.equal(counter.allow("owner", 60_000 + i * 60_000), true);
  }
  assert.equal(counter.allow("owner", 3_720_000), false);
  assert.equal(counter.allow("owner", 86_400_000), true);
});

test("JSON reading rejects malformed or oversized chunked bodies", async () => {
  const valid = await readBoundedAiJson(request());
  assert.deepEqual(valid, { value: { message: "How was my set?" } });
  const malformed = await readBoundedAiJson(request({ body: '{"broken":' }));
  assert.equal(malformed.status, 400);
  const tooBig = await readBoundedAiJson(request({ body: JSON.stringify({ text: "🙂".repeat(2500) }) }));
  assert.equal(tooBig.status, 413);
});

test("source routes consult the authorization gate before requesting paid services", async () => {
  const { readFileSync } = await import("node:fs");
  const paths = ["coach-talk.ts", "coach-speech.ts"];
  for (const name of paths) {
    const src = readFileSync(new URL("../src/routes/api/public/" + name, import.meta.url), "utf8");
    const authAt = src.indexOf("await authorizePaidAi(request,");
    const outboundAt = src.indexOf('fetch("https://api.openai.com/');
    assert.ok(authAt !== -1 && outboundAt !== -1 && authAt < outboundAt, name);
    assert.match(src, /readBoundedAiJson\(request\)/);
  }
});

test("all optional provider calls have timeouts and safe failure responses", async () => {
  const { readFileSync } = await import("node:fs");
  for (const name of ["coach-talk.ts", "coach-speech.ts"]) {
    const src = readFileSync(new URL("../src/routes/api/public/" + name, import.meta.url), "utf8");
    assert.match(src, /signal: AbortSignal\.timeout\(\d+\)/);
    assert.match(src, /return aiError\(504, "Optional AI provider timed out/);
    assert.doesNotMatch(src, /await upstream\.text\(\)/);
  }
});
