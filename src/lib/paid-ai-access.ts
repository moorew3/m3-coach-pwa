/**
 * M3 FLEX paid-AI access gate.
 *
 * Fail closed by default. This file does not expose credentials to a browser,
 * and the bearer token is verified by Supabase Auth (not decoded locally).
 * The limiter is intentionally a *per-process* second line of defence. A
 * durable multi-instance quota/provider spending limit is still required
 * before a production paid-AI rollout.
 */
import { createClient } from "@supabase/supabase-js";

export type PaidAiOperation = "speech" | "talk";
export const MAX_AI_JSON_BYTES = 8192;

type IdentityVerifier = (token: string, env: NodeJS.ProcessEnv) => Promise<string | null>;
type Permit = { userId: string };

export function aiError(status: number, message: string, retryAfter?: number): Response {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "cache-control": "no-store",
  };
  if (retryAfter !== undefined) headers["retry-after"] = String(retryAfter);
  return new Response(JSON.stringify({ message }), { status, headers });
}

export class PaidAiLimiter {
  private readonly windows = new Map<string, { minute: number; minuteCount: number; day: number; dayCount: number }>();

  allow(id: string, now: number, perMinute = 10, perDay = 60): boolean {
    const minute = Math.floor(now / 60_000);
    const day = Math.floor(now / 86_400_000);
    const current = this.windows.get(id);
    const minuteCount = current?.minute === minute ? current.minuteCount : 0;
    const dayCount = current?.day === day ? current.dayCount : 0;
    if (minuteCount >= perMinute || dayCount >= perDay) return false;
    this.windows.set(id, { minute, minuteCount: minuteCount + 1, day, dayCount: dayCount + 1 });
    return true;
  }
}

const limiter = new PaidAiLimiter();

async function verifiedUserId(token: string, env: NodeJS.ProcessEnv): Promise<string | null> {
  const url = env["SUPABASE_URL"];
  const key = env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // getUser verifies the token with Supabase Auth. No local unverified JWT trust.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export interface PaidAiGateOptions {
  /** Only injected from isolated tests; never from a client request. */
  env?: NodeJS.ProcessEnv;
  verifyIdentity?: IdentityVerifier;
  limiter?: PaidAiLimiter;
  now?: number;
}

export async function authorizePaidAi(
  request: Request,
  operation: PaidAiOperation,
  options: PaidAiGateOptions = {},
): Promise<Permit | Response> {
  const env = options.env ?? process.env;
  if (env["FLEX_PAID_AI_ENABLED"] !== "true") {
    return aiError(503, "Optional live AI coaching is disabled. Approved recorded workout media remains available.");
  }
  const allowedIds = new Set(
    (env["FLEX_AI_ALLOWED_USER_IDS"] ?? "").split(",").map((x) => x.trim()).filter(Boolean),
  );
  if (!allowedIds.size || !env["SUPABASE_URL"] || !env["SUPABASE_PUBLISHABLE_KEY"]) {
    return aiError(503, "Live AI coaching access has not been securely configured.");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) {
    return aiError(415, "JSON request required.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AI_JSON_BYTES) {
    return aiError(413, "Coach request is too large.");
  }

  // Same-origin browsers only. Bearer authentication remains mandatory for
  // callers whose Origin header is absent or spoofed.
  const origin = request.headers.get("origin");
  const expected = env["FLEX_PUBLIC_ORIGIN"] || new URL(request.url).origin;
  if (origin && origin !== expected) return aiError(403, "Origin not permitted.");

  const auth = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([-\w.]+)$/.exec(auth);
  if (!match) return aiError(401, "Sign in to use optional live AI coaching.");
  const id = await (options.verifyIdentity ?? verifiedUserId)(match[1], env);
  if (!id) return aiError(401, "Invalid or expired session.");
  if (!allowedIds.has(id)) return aiError(403, "This account is not enabled for live AI coaching.");

  // A bounded second layer only; this resets when the process restarts.
  // Both AI routes share one authenticated user's quota.
  const counter = options.limiter ?? limiter;
  const key = "paid-ai:" + id;
  if (!counter.allow(key, options.now ?? Date.now())) {
    return aiError(429, "Live AI coaching limit reached.", 60);
  }
  return { userId: id };
}

/** Read a JSON body without allowing unbounded memory allocation. */
export async function readBoundedAiJson(
  request: Request,
): Promise<{ value: unknown } | Response> {
  if (!request.body) return aiError(400, "Missing JSON body.");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let body = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_AI_JSON_BYTES) {
        await reader.cancel();
        return aiError(413, "Coach request is too large.");
      }
      body += decoder.decode(part.value, { stream: true });
    }
    body += decoder.decode();
    return { value: JSON.parse(body) };
  } catch {
    return aiError(400, "Invalid coach JSON.");
  } finally {
    reader.releaseLock();
  }
}
