import { useEffect, useRef, useState } from "react";
import { Cast, Link2Off, QrCode, X } from "lucide-react";
import { connectPhone, disconnectLink, useDisplayLink } from "@/lib/display-link";

/** Pull a pairing code out of a scanned URL or raw text. */
const codeFromText = (text: string) => {
  const m = text.match(/pair=([A-Z0-9]{4,10})/i) ?? text.match(/^\s*([A-Z0-9]{6})\s*$/i);
  return m ? m[1].toUpperCase() : "";
};

/**
 * Phone-side control: "Connect to Display".
 * Optional — the workout works exactly the same with no display connected.
 */
export function DisplayConnect({ compact = false }: { compact?: boolean }) {
  const link = useDisplayLink();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* deep link: /?pair=CODE from the display QR code */
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("pair");
    if (param && link.status === "off") {
      setCode(param.toUpperCase());
      connectPhone(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* in-app QR scanning where the browser supports it */
  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;

    const run = async () => {
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (o: { formats: string[] }) => {
            detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]>;
          };
        }
      ).BarcodeDetector;
      if (!Detector) {
        setScanError("This browser can't scan QR codes — type the code instead.");
        setScanning(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
      } catch {
        setScanError("Camera not available — type the code instead.");
        setScanning(false);
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play().catch(() => {});
      const detector = new Detector({ formats: ["qr_code"] });
      const tick = async () => {
        if (stopped) return;
        try {
          const found = await detector.detect(video);
          const hit = found.map((f) => codeFromText(f.rawValue)).find(Boolean);
          if (hit) {
            setCode(hit);
            connectPhone(hit);
            setScanning(false);
            return;
          }
        } catch {
          /* frame not ready */
        }
        raf = requestAnimationFrame(() => void tick());
      };
      void tick();
    };
    void run();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning]);

  const connected = link.status === "connected" && link.role === "phone";
  const waiting = link.status === "waiting" && link.role === "phone";
  const lost = link.status === "lost" && link.role === "phone";

  return (
    <section className={compact ? "mt-3" : "surface-card mt-4 rounded-2xl p-4"}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="tap-target flex w-full items-center justify-between rounded-xl bg-elevated px-4 text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <Cast className="size-4 text-accent" aria-hidden />
          {connected ? "Display connected" : "Connect to display"}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${
            connected
              ? "bg-success/25 text-success"
              : waiting
                ? "bg-accent/20 text-accent"
                : lost
                  ? "bg-destructive/20 text-destructive"
                  : "bg-muted text-muted-foreground"
          }`}
        >
          {connected ? "On" : waiting ? "Pairing" : lost ? "Lost" : "Off"}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {connected ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your phone stays in control. The big screen mirrors this workout only.
              </p>
              <button
                type="button"
                onClick={disconnectLink}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
              >
                <Link2Off className="size-4" /> Disconnect display
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                On the TV or computer open{" "}
                <span className="font-bold text-foreground">/display</span>, then scan its QR code
                or type the pairing code below.
              </p>

              {scanning ? (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="aspect-square w-full rounded-xl bg-black object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setScanning(false)}
                    className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
                  >
                    <X className="size-4" /> Stop scanning
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setScanError(null);
                    setScanning(true);
                  }}
                  className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-elevated text-sm font-bold uppercase"
                >
                  <QrCode className="size-4" /> Scan QR code
                </button>
              )}

              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Pairing code"
                  aria-label="Pairing code"
                  autoComplete="off"
                  className="tap-target w-full rounded-xl border border-input bg-elevated px-3 text-base font-bold tracking-[0.3em]"
                />
                <button
                  type="button"
                  onClick={() => connectPhone(code)}
                  className="tap-target w-28 shrink-0 rounded-xl bg-primary text-sm font-bold uppercase text-primary-foreground"
                >
                  Connect
                </button>
              </div>

              {waiting && (
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Looking for the display…
                </p>
              )}
              {(scanError || link.error || lost) && (
                <p className="text-xs font-semibold text-destructive">
                  {scanError ?? link.error ?? "Display disconnected — pair again with a new code."}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}