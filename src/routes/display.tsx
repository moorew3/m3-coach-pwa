import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ChevronLeft, ChevronRight, CheckCircle2, Pause, Play, SkipForward } from "lucide-react";
import { hostDisplay, sendCommand, useDisplayLink, CODE_TTL_MS } from "@/lib/display-link";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "Display Mode — 22-Day Arm Growth Tracker" },
      {
        name: "description",
        content:
          "Show the live workout on a TV or touchscreen computer while your phone stays in control.",
      },
      { property: "og:title", content: "Display Mode — 22-Day Arm Growth Tracker" },
      {
        property: "og:description",
        content: "Big-screen view of the current workout, controlled from your phone.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DisplayPage,
});

const mmss = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, sec) % 60)).padStart(2, "0")}`;

function DisplayPage() {
  const link = useDisplayLink();
  const [qr, setQr] = useState("");
  const [pairUrl, setPairUrl] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(Math.round(CODE_TTL_MS / 1000));
  const bellRef = useRef(false);

  const start = () => {
    const code = hostDisplay();
    const url = `${window.location.origin}/?pair=${code}`;
    setPairUrl(url);
    void QRCode.toDataURL(url, { width: 420, margin: 1 })
      .then(setQr)
      .catch(() => setQr(""));
  };

  /* code countdown */
  useEffect(() => {
    if (link.status !== "waiting") return;
    const t = setInterval(() => {
      setSecondsLeft(Math.max(0, Math.round((link.expiresAt - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, [link.status, link.expiresAt]);

  /* keep the TV awake while a workout is on screen */
  useEffect(() => {
    if (link.status !== "connected") return;
    let sentinel: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    nav.wakeLock
      ?.request("screen")
      .then((s) => {
        sentinel = s;
      })
      .catch(() => {});
    return () => {
      void sentinel?.release().catch(() => {});
    };
  }, [link.status]);

  /* optional chime on the big screen when rest hits zero */
  const snap = link.snapshot;
  useEffect(() => {
    if (!snap?.restDone) {
      bellRef.current = false;
      return;
    }
    if (bellRef.current) return;
    bellRef.current = true;
    try {
      const AC =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.62);
    } catch {
      /* audio blocked until the screen is touched */
    }
  }, [snap?.restDone]);

  /* ------------------------------ pairing screen ------------------------------ */
  if (link.status === "off" || (link.status !== "connected" && !snap)) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-center">
        <h1 className="font-display text-4xl font-bold sm:text-6xl">Display Mode</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Show the current workout on this screen. Your phone stays in control.
        </p>

        {link.status === "off" ? (
          <button
            type="button"
            onClick={start}
            className="mt-8 rounded-2xl bg-primary px-10 py-6 text-2xl font-bold uppercase text-primary-foreground"
          >
            Open Display Mode
          </button>
        ) : (
          <div className="mt-8 space-y-5">
            {qr && (
              <img
                src={qr}
                alt={`QR code to pair a phone using code ${link.code}`}
                className="mx-auto size-64 rounded-2xl bg-white p-3 sm:size-80"
              />
            )}
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Pairing code</p>
            <p className="font-display text-6xl font-bold tracking-[0.35em] text-primary sm:text-7xl">
              {link.code}
            </p>
            <p className="text-lg text-accent">Waiting for your phone…</p>
            <p className="text-sm text-muted-foreground">
              Code expires in {mmss(secondsLeft)} · open {pairUrl} on the phone or enter the code in
              “Connect to display”.
            </p>
            <button
              type="button"
              onClick={start}
              className="rounded-xl bg-elevated px-6 py-4 text-base font-bold uppercase"
            >
              New code
            </button>
          </div>
        )}
      </main>
    );
  }

  if (!snap) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-5xl font-bold">Reconnect</p>
        <p className="mt-3 text-xl text-muted-foreground">
          The phone dropped off. Your workout is safe — pair again to keep the big screen live.
        </p>
        <button
          type="button"
          onClick={start}
          className="mt-8 rounded-2xl bg-primary px-10 py-6 text-2xl font-bold uppercase text-primary-foreground"
        >
          New pairing code
        </button>
      </main>
    );
  }

  const disconnected = link.status === "lost";
  const statusLabel = disconnected
    ? "Phone disconnected"
    : snap.restDone
      ? "Rest complete"
      : snap.status;

  const bigButton =
    "rounded-2xl bg-elevated px-4 py-6 text-xl font-bold uppercase disabled:opacity-40";

  return (
    <main className="min-h-screen px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xl font-semibold uppercase tracking-widest text-primary">
          Day {snap.day} · {snap.weekday} · {snap.planTitle}
        </p>
        <p
          className={`rounded-full px-5 py-2 text-xl font-bold uppercase ${
            disconnected
              ? "bg-destructive/25 text-destructive"
              : snap.status === "paused"
                ? "bg-muted text-muted-foreground"
                : snap.restDone
                  ? "bg-success/25 text-success"
                  : "bg-accent/20 text-accent"
          }`}
        >
          {statusLabel}
        </p>
      </header>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <section>
          <h1 className="font-display text-5xl font-bold leading-tight xl:text-6xl">
            {snap.exerciseName}
          </h1>
          <p className="mt-2 text-2xl text-accent">
            {snap.targetSets} × {snap.targetReps} · rest {snap.restLength}s
            {snap.superset ? ` · Pair ${snap.superset} ${snap.supersetSlot ?? ""}` : ""}
            {snap.round ? ` · round ${snap.round.n} of ${snap.round.of}` : ""}
          </p>

          {snap.guideSrc && (
            <img
              src={snap.guideSrc}
              alt={snap.guideAlt ?? "Workout guide"}
              className="mt-4 w-full rounded-2xl border border-border object-contain"
            />
          )}
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-elevated p-5 text-center">
              <p className="text-base uppercase tracking-widest text-muted-foreground">Workout</p>
              <p className="font-display text-6xl font-bold tabular-nums">
                {mmss(snap.clockMs / 1000)}
              </p>
            </div>
            <div className="rounded-2xl bg-elevated p-5 text-center">
              <p className="text-base uppercase tracking-widest text-muted-foreground">Rest</p>
              <p
                className={`font-display text-6xl font-bold tabular-nums ${
                  snap.restOpen || snap.restDone ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {mmss(snap.restSeconds)}
              </p>
            </div>
          </div>

          {snap.restDone && (
            <p className="rounded-2xl bg-success/20 py-5 text-center font-display text-5xl font-bold uppercase text-success">
              Rest complete
            </p>
          )}

          <div className="rounded-2xl bg-elevated p-5">
            <p className="text-base uppercase tracking-widest text-muted-foreground">
              Set {Math.min(snap.setIndex + 1, snap.sets.length)} of {snap.sets.length}
            </p>
            <ul className="mt-2 space-y-1 text-2xl font-bold tabular-nums">
              {snap.sets.map((s, i) => (
                <li
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                    i === snap.setIndex ? "bg-primary/20" : ""
                  }`}
                >
                  <span>Set {i + 1}</span>
                  <span>
                    {s.weight || "—"} {snap.units} × {s.reps || "—"}
                    {s.time ? ` · ${s.time}` : ""}
                  </span>
                  <span className={s.done ? "text-success" : "text-muted-foreground"}>
                    {s.done ? "Done" : "—"}
                  </span>
                </li>
              ))}
            </ul>
            {snap.lastResult && (
              <p className="mt-3 text-xl text-muted-foreground">Last time: {snap.lastResult}</p>
            )}
          </div>

          <p className="text-2xl font-semibold">Next: {snap.nextLabel}</p>
          <div>
            <div className="h-4 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{ width: `${(snap.doneSets / Math.max(1, snap.totalSets)) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xl text-muted-foreground">
              Exercise {snap.exerciseIndex} of {snap.exerciseTotal} · {snap.doneSets}/
              {snap.totalSets} sets
            </p>
          </div>

          {/* touchscreen shortcuts — the phone remains the owner */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={disconnected}
              onClick={() => sendCommand({ type: "completeSet" })}
              className="col-span-2 rounded-2xl bg-primary px-4 py-6 text-2xl font-bold uppercase text-primary-foreground disabled:opacity-40"
            >
              <CheckCircle2 className="mr-2 inline size-7" /> Complete set
            </button>
            <button
              type="button"
              disabled={disconnected}
              onClick={() => sendCommand({ type: "toggleClock" })}
              className={bigButton}
            >
              {snap.clockRunning ? (
                <Pause className="mr-2 inline size-6" />
              ) : (
                <Play className="mr-2 inline size-6" />
              )}
              {snap.clockRunning ? "Pause" : "Resume"}
            </button>
            <button
              type="button"
              disabled={disconnected}
              onClick={() => sendCommand({ type: "skipRest" })}
              className={bigButton}
            >
              <SkipForward className="mr-2 inline size-6" /> Skip rest
            </button>
            <button
              type="button"
              disabled={disconnected}
              onClick={() => sendCommand({ type: "prev" })}
              className={bigButton}
            >
              <ChevronLeft className="mr-2 inline size-6" /> Previous
            </button>
            <button
              type="button"
              disabled={disconnected}
              onClick={() => sendCommand({ type: "next" })}
              className={bigButton}
            >
              Next <ChevronRight className="ml-2 inline size-6" />
            </button>
          </div>
          {disconnected && (
            <p className="text-xl font-bold text-destructive">
              Remote controls paused until the phone reconnects.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}