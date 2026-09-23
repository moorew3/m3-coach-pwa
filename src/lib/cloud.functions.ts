/**
 * CLOUD SYNC — server functions
 * ------------------------------------------------------------------
 * The app has no login. Each install generates a long random "sync key"
 * that lives in localStorage. The server only ever stores a SHA-256 hash
 * of that key, and all reads/writes go through these server functions
 * using the service role. The tables themselves are unreachable from the
 * browser (RLS on, no policies, no anon/authenticated grants).
 *
 * A second device joins by redeeming a short-lived pairing code, which
 * hands it the same sync key — so both devices share one personal space.
 */
import { createServerFn } from "@tanstack/react-start";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PAIR_TTL_MS = 10 * 60 * 1000;

async function hashKey(key: string): Promise<string> {
  const bytes = new TextEncoder().encode(`agt:${key}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function assertKey(key: unknown): string {
  if (typeof key !== "string" || key.length < 20 || key.length > 200) {
    throw new Error("Invalid sync key");
  }
  return key;
}

type Admin = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

async function admin(): Promise<Admin> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Find (or create) the account behind a sync key. */
async function accountFor(db: Admin, key: string) {
  const key_hash = await hashKey(key);
  const existing = await db
    .from("sync_accounts")
    .select("id, channel_id")
    .eq("key_hash", key_hash)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data;

  const created = await db
    .from("sync_accounts")
    .insert({ key_hash })
    .select("id, channel_id")
    .single();
  if (created.error) {
    // Race: another request created it first.
    const retry = await db
      .from("sync_accounts")
      .select("id, channel_id")
      .eq("key_hash", key_hash)
      .maybeSingle();
    if (retry.data) return retry.data;
    throw created.error;
  }
  return created.data;
}

/* ------------------------------ app state ------------------------------ */

export const cloudPull = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => ({ key: assertKey(d?.key) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const account = await accountFor(db, data.key);
    const snap = await db
      .from("app_snapshots")
      .select("data, rev, updated_at")
      .eq("account_id", account.id)
      .maybeSingle();
    if (snap.error) throw snap.error;
    return {
      channelId: account.channel_id as string,
      rev: (snap.data?.rev as number) ?? 0,
      updatedAt: (snap.data?.updated_at as string) ?? null,
      state: snap.data?.data ? JSON.stringify(snap.data.data) : null,
    };
  });

export const cloudPush = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; state: unknown; baseRev: number }) => ({
    key: assertKey(d?.key),
    state: d?.state ?? {},
    baseRev: Number(d?.baseRev ?? 0),
  }))
  .handler(async ({ data }) => {
    const db = await admin();
    const account = await accountFor(db, data.key);

    const current = await db
      .from("app_snapshots")
      .select("rev")
      .eq("account_id", account.id)
      .maybeSingle();
    if (current.error) throw current.error;

    const serverRev = (current.data?.rev as number) ?? 0;
    const nextRev = Math.max(serverRev, data.baseRev) + 1;

    // Upsert on the primary key makes retries idempotent: a replayed write
    // lands on the same row instead of creating a duplicate log.
    const saved = await db
      .from("app_snapshots")
      .upsert(
        { account_id: account.id, data: data.state as never, rev: nextRev },
        { onConflict: "account_id" },
      )
      .select("rev")
      .single();
    if (saved.error) throw saved.error;
    return { rev: saved.data.rev as number, channelId: account.channel_id as string };
  });

/* ---------------------------- live session ----------------------------- */

export const sessionPull = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => ({ key: assertKey(d?.key) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const account = await accountFor(db, data.key);
    const row = await db
      .from("live_sessions")
      .select("state, rev")
      .eq("account_id", account.id)
      .maybeSingle();
    if (row.error) throw row.error;
    return {
      channelId: account.channel_id as string,
      rev: (row.data?.rev as number) ?? 0,
      state: row.data?.state ? JSON.stringify(row.data.state) : null,
    };
  });

export const sessionPush = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string; state: unknown; rev: number }) => ({
    key: assertKey(d?.key),
    state: d?.state ?? {},
    rev: Number(d?.rev ?? 0),
  }))
  .handler(async ({ data }) => {
    const db = await admin();
    const account = await accountFor(db, data.key);
    const saved = await db
      .from("live_sessions")
      .upsert(
        { account_id: account.id, state: data.state as never, rev: data.rev },
        { onConflict: "account_id" },
      )
      .select("rev")
      .single();
    if (saved.error) throw saved.error;
    return { rev: saved.data.rev as number };
  });

/* ------------------------------- pairing -------------------------------- */

export const createPairCode = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => ({ key: assertKey(d?.key) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const account = await accountFor(db, data.key);
    const code = makeCode();
    const expires = new Date(Date.now() + PAIR_TTL_MS).toISOString();
    const upd = await db
      .from("sync_accounts")
      .update({ pair_code: code, pair_secret: data.key, pair_expires_at: expires })
      .eq("id", account.id);
    if (upd.error) throw upd.error;
    return { code, expiresAt: expires };
  });

export const redeemPairCode = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string }) => ({
    code: String(d?.code ?? "")
      .trim()
      .toUpperCase(),
  }))
  .handler(async ({ data }) => {
    if (data.code.length < 4) throw new Error("Enter the full pairing code.");
    const db = await admin();
    const row = await db
      .from("sync_accounts")
      .select("id, pair_secret, pair_expires_at, channel_id")
      .eq("pair_code", data.code)
      .maybeSingle();
    if (row.error) throw row.error;
    if (!row.data?.pair_secret) throw new Error("That code is not valid.");
    if (Date.parse(row.data.pair_expires_at as string) < Date.now()) {
      throw new Error("That code has expired — create a new one.");
    }
    const key = row.data.pair_secret as string;
    // Single-use: burn the code immediately after a successful redemption.
    await db
      .from("sync_accounts")
      .update({ pair_code: null, pair_secret: null, pair_expires_at: null })
      .eq("id", row.data.id);
    return { key, channelId: row.data.channel_id as string };
  });