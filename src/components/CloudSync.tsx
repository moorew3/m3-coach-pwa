/**
 * Cloud sync + device pairing panel.
 *
 * No accounts. This device holds a private sync key; a second device joins
 * the same space with a short-lived pairing code. Once linked, workout
 * history, progress, nutrition, settings AND the live coached session all
 * follow you between phone, computer and display.
 */
import { useEffect, useState } from "react";
import { Cloud, CloudOff, Copy, Link2, Loader2, RefreshCw } from "lucide-react";
import {
  disableCloud,
  enableCloud,
  joinWithCode,
  newPairCode,
  unlinkCloud,
  useCloud,
} from "@/lib/cloud";

const LABEL: Record<string, string> = {
  off: "Off — this device only",
  connecting: "Connecting…",
  online: "Synced",
  offline: "Offline — changes are queued",
  error: "Sync problem",
};

export function CloudSync() {
  const cloud = useCloud();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const run = async (name: string, fn: () => Promise<unknown>) => {
    setBusy(name);
    setNote("");
    try {
      await fn();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const codeLeft = cloud.pairExpiresAt
    ? Math.max(0, Math.round((cloud.pairExpiresAt - now) / 1000))
    : 0;

  return (
    <section className="surface-card mt-5 space-y-3 rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-lg font-bold uppercase">
        {cloud.enabled ? <Cloud className="size-5" /> : <CloudOff className="size-5" />}
        Sync &amp; devices
      </h2>
      <p className="text-sm text-muted-foreground">
        Keeps your workout history, progress, nutrition, settings and the live coached session
        backed up and shared between your phone, computer and display. The app still works fully
        offline — anything you log is saved on the device first and uploaded when you reconnect.
      </p>

      <div className="flex items-center gap-2 rounded-xl bg-elevated px-4 py-3 text-sm font-semibold">
        {cloud.status === "connecting" && <Loader2 className="size-4 animate-spin" />}
        <span
          className={
            cloud.status === "online"
              ? "text-primary"
              : cloud.status === "error"
                ? "text-destructive"
                : "text-muted-foreground"
          }
        >
          {LABEL[cloud.status] ?? cloud.status}
        </span>
        {cloud.lastSyncAt && cloud.status === "online" && (
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(cloud.lastSyncAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      {!cloud.enabled ? (
        <button
          type="button"
          onClick={() => run("on", enableCloud)}
          className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
        >
          {busy === "on" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Cloud className="size-5" />
          )}
          Turn on sync
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={() => run("code", newPairCode)}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
          >
            {busy === "code" ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Link2 className="size-5" />
            )}
            Add another device
          </button>

          {cloud.pairCode && codeLeft > 0 && (
            <div className="rounded-xl border border-primary/50 bg-elevated p-4 text-center">
              <p className="text-xs uppercase text-muted-foreground">
                Enter this code on the other device
              </p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-[0.2em] text-primary">
                {cloud.pairCode}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Expires in {Math.floor(codeLeft / 60)}:{String(codeLeft % 60).padStart(2, "0")} ·
                single use
              </p>
              <button
                type="button"
                onClick={() => void navigator.clipboard?.writeText(cloud.pairCode ?? "")}
                className="tap-target mt-2 inline-flex items-center gap-2 text-xs font-bold uppercase text-accent"
              >
                <Copy className="size-4" /> Copy code
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => run("sync", enableCloud)}
              className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-elevated text-xs font-bold uppercase"
            >
              <RefreshCw className={`size-4 ${busy === "sync" ? "animate-spin" : ""}`} /> Sync now
            </button>
            <button
              type="button"
              onClick={disableCloud}
              className="tap-target flex flex-1 items-center justify-center rounded-xl bg-elevated text-xs font-bold uppercase"
            >
              Pause sync
            </button>
          </div>
        </>
      )}

      <div className="rounded-xl bg-elevated p-3">
        <p className="text-xs uppercase text-muted-foreground">Join from a pairing code</p>
        <div className="mt-2 flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Pairing code"
            className="tap-target min-w-0 flex-1 rounded-xl border border-input bg-surface px-3 text-center font-mono text-xl tracking-widest"
          />
          <button
            type="button"
            disabled={code.trim().length < 4 || busy === "join"}
            onClick={() =>
              run("join", async () => {
                await joinWithCode(code);
                setCode("");
                setNote("This device is now linked.");
              })
            }
            className="tap-target rounded-xl bg-accent px-4 text-sm font-bold uppercase text-accent-foreground disabled:opacity-40"
          >
            {busy === "join" ? <Loader2 className="size-5 animate-spin" /> : "Join"}
          </button>
        </div>
      </div>

      {note && <p className="text-sm text-accent">{note}</p>}

      {cloud.enabled && (
        <button
          type="button"
          onClick={() => {
            if (confirm("Unlink this device from sync? Data on this device is kept.")) {
              unlinkCloud();
              setNote("This device is no longer syncing.");
            }
          }}
          className="tap-target w-full rounded-xl text-xs font-bold uppercase text-muted-foreground"
        >
          Unlink this device
        </button>
      )}
    </section>
  );
}