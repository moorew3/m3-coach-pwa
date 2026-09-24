/**
 * CLOUD SYNC — server functions
 * ------------------------------------------------------------------
 * Uses locked SECURITY DEFINER RPCs in Supabase so Railway only needs the
 * project's publishable key. The sync tables remain RLS-protected and are
 * never directly exposed to the browser.
 */
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }
    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function db() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    const missing = [
      ...(!url ? ["SUPABASE_URL"] : []),
      ...(!key ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    throw new Error(`Missing Supabase environment variable(s): ${missing.join(", ")}.`);
  }
  return createClient<any>(url, key, {
    global: { fetch: createSupabaseFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function one<T>(data: T[] | T | null): T {
  if (Array.isArray(data)) {
    if (!data[0]) throw new Error("Sync backend returned no data.");
    return data[0];
  }
  if (!data) throw new Error("Sync backend returned no data.");
  return data;
}

function assertKey(key: unknown): string {
  if (typeof key !== "string" || key.length < 20 || key.length > 200) {
    throw new Error("Invalid sync key");
  }
  return key;
}

export const cloudPull = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => ({ key: assertKey(d?.key) }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await db().rpc("agt_sync_pull", { p_key: data.key });
    if (error) throw error;
    const row = one<any>(rows);
    return {
      channelId: row.channel_id as string,
      rev: Number(row.rev ?? 0),
      updatedAt: (row.updated_at as string | null) ?? null,
      state: row.state ? JSON.stringify(row.state) : null,
    };
  });

export const cloudPush = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; state: unknown; baseRev: number }) => ({
    key: assertKey(d?.key),
    state: d?.state ?? {},
    baseRev: Number(d?.baseRev ?? 0),
  }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await db().rpc("agt_sync_push", {
      p_key: data.key,
      p_state: data.state,
      p_base_rev: data.baseRev,
    });
    if (error) throw error;
    const row = one<any>(rows);
    return { rev: Number(row.rev ?? 0), channelId: row.channel_id as string };
  });

export const sessionPull = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => ({ key: assertKey(d?.key) }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await db().rpc("agt_session_pull", { p_key: data.key });
    if (error) throw error;
    const row = one<any>(rows);
    return {
      channelId: row.channel_id as string,
      rev: Number(row.rev ?? 0),
      state: row.state ? JSON.stringify(row.state) : null,
    };
  });

export const sessionPush = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; state: unknown; rev: number }) => ({
    key: assertKey(d?.key),
    state: d?.state ?? {},
    rev: Number(d?.rev ?? 0),
  }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await db().rpc("agt_session_push", {
      p_key: data.key,
      p_state: data.state,
      p_rev: data.rev,
    });
    if (error) throw error;
    const row = one<any>(rows);
    return { rev: Number(row.rev ?? 0) };
  });

export const createPairCode = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => ({ key: assertKey(d?.key) }))
  .handler(async ({ data }) => {
    const { data: rows, error } = await db().rpc("agt_create_pair_code", { p_key: data.key });
    if (error) throw error;
    const row = one<any>(rows);
    return { code: row.code as string, expiresAt: row.expires_at as string };
  });

export const redeemPairCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({
    code: String(d?.code ?? "").trim().toUpperCase(),
  }))
  .handler(async ({ data }) => {
    if (data.code.length < 4) throw new Error("Enter the full pairing code.");
    const { data: rows, error } = await db().rpc("agt_redeem_pair_code", { p_code: data.code });
    if (error) throw error;
    const row = one<any>(rows);
    return { key: row.key as string, channelId: row.channel_id as string };
  });
