/**
 * SESSION AUDIO — music + coach mixer and hands-free commands.
 * ------------------------------------------------------------------
 * Music and coaching run together: the coach ducks the music while he
 * talks and it comes straight back up afterwards. Sliders and mute
 * buttons stay available for both, and every spoken command has an
 * equivalent button elsewhere on the screen.
 */
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Music, Pause, Play, Volume2, VolumeX } from "lucide-react";
import {
  loadMusicFile,
  setCoachLevel,
  setCoachMuted,
  setDuckLevel,
  setMusicVolume,
  toggleMusic,
  toggleMusicMute,
  useMix,
} from "@/lib/audio-mix";
import {
  startListening,
  stopListening,
  useVoiceControl,
  voiceControlAvailable,
} from "@/lib/voice-commands";

const PHRASES = [
  "pause / resume",
  "next / previous",
  "repeat · skip",
  "add 30 seconds",
  "reduce 30 seconds",
  "what's next",
  "show the form",
  "swap exercise",
  "mute coach / unmute",
  "louder / quieter",
  "music louder / quieter",
  "pause music / resume music",
  "end workout",
];

function Slider({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label} · {Math.round(value * 100)}%
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-elevated accent-primary disabled:opacity-40"
        aria-label={label}
      />
    </label>
  );
}

export function SessionAudio({ compact = false }: { compact?: boolean }) {
  const mix = useMix();
  const vc = useVoiceControl();
  const file = useRef<HTMLInputElement>(null);
  /* Speech recognition only exists in the browser — decide after hydration
     so the server and the phone render the same first paint. */
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const canListen = ready && voiceControlAvailable();

  return (
    <section className="surface-card rounded-2xl p-4">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        <Volume2 className="size-4 text-accent" aria-hidden /> Coach &amp; music
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Your music keeps playing — it only dips while the coach speaks.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <Slider
            label="Coach volume"
            value={mix.coachMuted ? 0 : mix.coachVolume}
            onChange={setCoachLevel}
          />
          <button
            type="button"
            onClick={() => setCoachMuted(!mix.coachMuted)}
            aria-pressed={mix.coachMuted}
            className={`tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase ${
              mix.coachMuted ? "bg-destructive/20 text-destructive" : "bg-elevated"
            }`}
          >
            {mix.coachMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            {mix.coachMuted ? "Coach muted" : "Mute coach"}
          </button>
        </div>

        <div>
          <Slider
            label="Music volume"
            value={mix.musicMuted ? 0 : mix.musicVolume}
            onChange={setMusicVolume}
            disabled={!mix.hasTrack}
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={toggleMusic}
              disabled={!mix.hasTrack}
              className="tap-target flex items-center justify-center gap-2 rounded-xl bg-elevated text-xs font-bold uppercase disabled:opacity-40"
            >
              {mix.playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              {mix.playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => toggleMusicMute()}
              disabled={!mix.hasTrack}
              aria-pressed={mix.musicMuted}
              className="tap-target flex items-center justify-center gap-2 rounded-xl bg-elevated text-xs font-bold uppercase disabled:opacity-40"
            >
              {mix.musicMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              {mix.musicMuted ? "Muted" : "Mute"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => file.current?.click()}
          className="tap-target flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 text-xs font-bold uppercase"
        >
          <Music className="size-4" aria-hidden /> {mix.hasTrack ? "Change track" : "Add my music"}
        </button>
        {mix.trackName && (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {mix.trackName}
            {mix.ducking && <span className="ml-2 text-accent">· ducked for the coach</span>}
          </span>
        )}
        <input
          ref={file}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadMusicFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {!compact && (
        <div className="mt-3">
          <Slider
            label="How far music dips"
            value={1 - mix.duckLevel}
            onChange={(v) => setDuckLevel(1 - v)}
          />
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground">
        Music playing in another app (Spotify, YouTube Music) keeps running — this app never stops
        it, but only music added here can be dipped automatically.
      </p>

      <h3 className="mt-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">
        <Mic className="size-4 text-accent" aria-hidden /> Hands-free commands
      </h3>
      {!ready ? null : canListen ? (
        <>
          <button
            type="button"
            onClick={() => (vc.listening ? stopListening() : startListening())}
            aria-pressed={vc.listening}
            className={`tap-target mt-2 flex w-full items-center justify-center gap-2 rounded-xl text-sm font-bold uppercase ${
              vc.listening ? "bg-primary text-primary-foreground" : "bg-elevated"
            }`}
          >
            {vc.listening ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            {vc.listening ? "Listening — say a command" : "Turn on voice control"}
          </button>
          {vc.heard && (
            <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
              Heard: “{vc.heard}”{vc.lastCommand ? "" : " — no matching command"}
            </p>
          )}
          {vc.error && <p className="mt-2 text-xs font-semibold text-destructive">{vc.error}</p>}
        </>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          This browser can't listen for spoken commands. Chrome or Samsung Internet on Android
          supports it — every command below also has a button.
        </p>
      )}
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {PHRASES.map((p) => (
          <li
            key={p}
            className="rounded-full bg-elevated px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
          >
            “{p}”
          </li>
        ))}
      </ul>
    </section>
  );
}