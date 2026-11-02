/**
 * COACH AUDIO STATUS PANEL
 * ------------------------------------------------------------------
 * Hidden by default. One tap opens a plain-language readout of what the
 * audio engine is ACTUALLY doing on this device — the thing we need when
 * a real phone says "I don't hear audio" but the sandbox says it's fine.
 */
import { useState } from "react";
import { Activity, ChevronDown, ChevronUp, Play } from "lucide-react";
import { bufferedSegments, stopSpeech, testCoachAudio, useVoiceDiagnostics } from "@/lib/coach-voice";

function Row({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/50 py-1.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={`text-right text-[11px] font-bold ${warn ? "text-accent" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export function CoachAudioPanel({
  isLeader,
  muted,
  dark = false,
}: {
  isLeader: boolean;
  muted: boolean;
  dark?: boolean;
}) {
  const d = useVoiceDiagnostics();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [recordedStatus, setRecordedStatus] = useState<string | null>(null);
  const premiumSpeechEnabled = import.meta.env["VITE_FLEX_PAID_AI_ENABLED"] === "true";

  return (
    <div
      className={`rounded-2xl border ${dark ? "border-white/20 bg-white/5" : "border-border bg-elevated"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tap-target flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <Activity className="size-4" />
          Audio status
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>

      {open && (
        <div className="px-3 pb-3">
          <Row
            label="Live generated voice"
            value={premiumSpeechEnabled ? "Enabled by build configuration" : "Off — no paid speech requests"}
          />
          <Row label="Status" value={d.status} warn={premiumSpeechEnabled && d.status !== "ready"} />
          <Row label="Voice path" value={d.path} warn={d.path === "none"} />
          <Row label="Unlocked by tap" value={d.unlocked ? "yes" : "no"} warn={!d.unlocked} />
          <Row
            label="Audio context"
            value={`${d.ctxState}${d.ctxSampleRate ? ` @ ${Math.round(d.ctxSampleRate)}Hz` : ""}`}
            warn={d.ctxState !== "running"}
          />
          <Row
            label="Audio element"
            value={d.elementUnlocked ? "unlocked" : "not unlocked"}
            warn={!d.elementUnlocked}
          />
          <Row label="Local tone" value={d.localTone} warn={d.localTone === "failed"} />
          <Row
            label="Last TTS status"
            value={d.lastHttpStatus === null ? "—" : `${d.lastHttpStatus} (${d.lastFormat ?? "—"})`}
            warn={!!d.lastHttpStatus && d.lastHttpStatus >= 400}
          />
          <Row
            label="Audio received"
            value={d.bytes ? `${d.chunks} chunk(s), ${d.bytes} bytes` : "none"}
            warn={!d.bytes}
          />
          <Row label="Playback scheduled" value={d.scheduled ? "yes" : "no"} warn={!d.scheduled} />
          <Row label="Fallback" value={d.fallbackFired ?? "none"} warn={!!d.fallbackFired} />
          <Row label="Browser speech" value={d.speechSynthesis ? "available" : "missing"} />
          <Row label="Mute" value={muted ? "muted" : "on"} warn={muted} />
          <Row label="This screen" value={isLeader ? "leader (speaks)" : "follower (silent)"} />
          <Row label="Last line" value={d.lastLine ?? "—"} />
          <Row label="Pre-buffered" value={`${bufferedSegments()} segments`} />
          <Row label="Last error" value={d.lastError ?? "none"} warn={!!d.lastError} />

          <div className="mt-3 rounded-xl border border-border p-3">
            <p className="text-xs font-bold">Test approved Marcus recording</p>
            <p className="my-1 text-xs text-muted-foreground">
              Plays the original C09 seated-breathing voice. No AI generation or credits are used.
              A successful browser play does not prove your speaker or Bluetooth output is audible.
            </p>
            <audio
              controls
              preload="none"
              aria-label="Play approved Marcus C09 English recording"
              data-testid="test-approved-marcus-recording"
              src="https://d2ol7oe51mr4n9.cloudfront.net/user_3K9xbNmff2bXeIoip4mpHRDh2md/9226f649-9808-4275-b269-bcc93d3b0342.mp3"
              className="w-full"
              onPlay={() => {
                stopSpeech();
                setRecordedStatus("Approved recording playback started. Check your actual sound output.");
              }}
              onError={() => setRecordedStatus("The approved audio recording could not load. Check your network or media host.")}
            />
            {recordedStatus && (
              <p className="mt-1 text-xs text-muted-foreground" role="status">{recordedStatus}</p>
            )}
          </div>
          <button
            type="button"
            disabled={busy || !premiumSpeechEnabled}
            onClick={async () => {
              setBusy(true);
              setResult(null);
              try {
                const r = await testCoachAudio();
                setResult(r.detail);
              } finally {
                setBusy(false);
              }
            }}
            className="tap-target mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-xs font-black uppercase tracking-wide text-primary-foreground"
          >
            <Play className="size-4" />
            {busy ? "Testing…" : premiumSpeechEnabled ? "Test generated coach audio" : "Generated speech disabled (no charge)"}
          </button>
          {result && (
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{result}</p>
          )}
        </div>
      )}
    </div>
  );
}