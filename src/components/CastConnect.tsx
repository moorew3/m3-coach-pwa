import { useEffect, useState } from "react";
import { Cast, Link2Off, Loader2, RefreshCw, Tv } from "lucide-react";
import { initCast, refreshDevices, searchAndConnect, stopCasting, useCast } from "@/lib/cast-link";
import { DisplayConnect } from "@/components/DisplayConnect";

const LABEL: Record<string, string> = {
  idle: "Ready",
  searching: "Searching",
  connecting: "Connecting",
  connected: "Connected",
  reconnecting: "Reconnecting",
  disconnected: "Disconnected",
  "no-devices": "None found",
  unsupported: "Not available",
  error: "Error",
};

/**
 * App-only casting: sends just the workout screen to a Cast device, then falls
 * back to the QR / pairing-code Display Mode for computers and browsers.
 */
export function CastConnect({ compact = false }: { compact?: boolean }) {
  const cast = useCast();
  const [open, setOpen] = useState(false);
  const [replacing, setReplacing] = useState(false);

  useEffect(() => {
    void initCast();
  }, []);

  const connected = cast.status === "connected";
  const busy =
    cast.status === "connecting" || cast.status === "searching" || cast.status === "reconnecting";

  return (
    <section className={compact ? "mt-3" : "surface-card mt-4 rounded-2xl p-4"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-target flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <Cast className="size-4 text-accent" aria-hidden />
          {connected ? `Casting to ${cast.deviceName}` : "Cast / connect display"}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
            connected
              ? "bg-success/25 text-success"
              : busy
                ? "bg-accent/20 text-accent"
                : "bg-muted text-muted-foreground"
          }`}
        >
          {LABEL[cast.status] ?? "Off"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">
            Only this workout is sent to the display — never your home screen, messages, photos,
            nutrition or history. Your phone stays the controller and can be used normally.
          </p>

          {connected ? (
            <>
              <div className="flex items-center gap-2 rounded-xl bg-elevated px-4 py-3">
                <Tv className="size-5 text-success" aria-hidden />
                <span className="text-sm font-bold">{cast.deviceName}</span>
              </div>
              <button
                type="button"
                onClick={() => setReplacing(true)}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
              >
                Cast different content
              </button>
              <button
                type="button"
                onClick={stopCasting}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
              >
                <Link2Off className="size-4" /> Stop casting workout
              </button>

              {replacing && (
                <div className="rounded-xl border border-border bg-card p-3">
                  <p className="text-sm font-semibold">Replace the workout on {cast.deviceName}?</p>
                  <div className="mt-2 grid gap-2">
                    <button
                      type="button"
                      onClick={() => setReplacing(false)}
                      className="tap-target rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
                    >
                      Keep workout on display
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopCasting();
                        setReplacing(false);
                      }}
                      className="tap-target rounded-xl bg-elevated text-sm font-bold uppercase"
                    >
                      Replace workout with new content
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplacing(false)}
                      className="tap-target rounded-xl bg-elevated text-sm font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={busy || cast.status === "unsupported"}
                onClick={() => void searchAndConnect()}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground disabled:opacity-40"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Cast className="size-4" />}
                {busy ? LABEL[cast.status] : "Search for displays"}
              </button>
              <button
                type="button"
                onClick={() => void refreshDevices()}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
              >
                <RefreshCw className="size-4" /> Refresh search
              </button>
              {cast.lastDeviceName && (
                <p className="text-xs text-muted-foreground">
                  Last used:{" "}
                  <span className="font-bold text-foreground">{cast.lastDeviceName}</span> — it
                  never reconnects without your approval.
                </p>
              )}
              {(cast.error || cast.status === "unsupported" || cast.status === "no-devices") && (
                <p className="text-xs font-semibold text-muted-foreground">
                  {cast.error ??
                    (cast.status === "unsupported"
                      ? "Cast devices aren't discoverable here — use the pairing code below on a TV browser or computer."
                      : "No compatible displays found on this Wi-Fi network.")}
                </p>
              )}
            </>
          )}

          <div className="border-t border-border pt-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Computer or browser display
            </p>
            <DisplayConnect compact />
          </div>
        </div>
      )}
    </section>
  );
}