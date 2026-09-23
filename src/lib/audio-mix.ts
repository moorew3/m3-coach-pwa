/**
 * AUDIO MIX — music and coach together
 * ------------------------------------------------------------------
 * The coach must never silence the user's music. This module owns an
 * in-app music player and ducks it smoothly whenever the coach starts a
 * line, then restores it just as smoothly when he stops.
 *
 * Platform reality: a web page cannot control another app's playback
 * (Spotify, YouTube Music, the phone's own player). For those we do the
 * only respectful thing available — we never call `pause()` on them and
 * we keep coach audio short and spoken, so the OS mixes both streams.
 * Music loaded into this player IS fully controllable and is ducked.
 */
import { onCoachSpeech, setCoachVolume } from "@/lib/coach-voice";

const KEY = "agt.audio.mix.v1";

export interface MixState {
  coachVolume: number;
  coachMuted: boolean;
  musicVolume: number;
  musicMuted: boolean;
  /** How far the music drops while the coach talks (0.1 = very quiet). */
  duckLevel: number;
  playing: boolean;
  ducking: boolean;
  trackName: string | null;
  /** True once the user has loaded music into the in-app player. */
  hasTrack: boolean;
}

const initial: MixState = {
  coachVolume: 1,
  coachMuted: false,
  /** Normal workout bed: music sits at 50% so the coach can sit on top. */
  musicVolume: 0.5,
  musicMuted: false,
  /** While the coach talks the bed drops to 30% of normal (~15% absolute). */
  duckLevel: 0.3,
  playing: false,
  ducking: false,
  trackName: null,
  hasTrack: false,
};

let mix: MixState = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

let el: HTMLAudioElement | null = null;
let ramp: ReturnType<typeof setInterval> | null = null;
let booted = false;

function target(): number {
  if (!mix.hasTrack) return 0;
  const base = mix.musicMuted ? 0 : mix.musicVolume;
  return mix.ducking ? base * mix.duckLevel : base;
}

/** Smooth fade instead of a jarring jump when the coach cuts in. */
function rampTo(value: number, ms: number) {
  if (!el) return;
  if (ramp) clearInterval(ramp);
  const from = el.volume;
  const steps = Math.max(1, Math.round(ms / 40));
  let n = 0;
  ramp = setInterval(() => {
    n += 1;
    if (!el) return;
    el.volume = Math.max(0, Math.min(1, from + (value - from) * (n / steps)));
    if (n >= steps && ramp) {
      clearInterval(ramp);
      ramp = null;
    }
  }, 40);
}

function persist() {
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        coachVolume: mix.coachVolume,
        coachMuted: mix.coachMuted,
        musicVolume: mix.musicVolume,
        musicMuted: mix.musicMuted,
        duckLevel: mix.duckLevel,
      }),
    );
  } catch {
    /* quota — settings still live in memory */
  }
}

function boot() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) mix = { ...mix, ...(JSON.parse(raw) as Partial<MixState>) };
  } catch {
    /* ignore */
  }
  setCoachVolume(mix.coachMuted ? 0 : mix.coachVolume);
  onCoachSpeech((on) => {
    mix = { ...mix, ducking: on };
    /* Smooth, symmetric 500 ms duck/restore. The track never pauses or
       restarts — only its gain moves, so the music timeline runs on. */
    rampTo(target(), 500);
    emit();
  });
}

function element(): HTMLAudioElement | null {
  if (typeof Audio !== "function") return null;
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.preload = "auto";
    (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    el.volume = target();
    el.onplay = () => {
      mix = { ...mix, playing: true };
      emit();
    };
    el.onpause = () => {
      mix = { ...mix, playing: false };
      emit();
    };
  }
  return el;
}

function set(patch: Partial<MixState>) {
  boot();
  mix = { ...mix, ...patch };
  if (el) rampTo(target(), 120);
  persist();
  emit();
}

/* ------------------------------- controls ------------------------------ */

export function setMusicVolume(v: number) {
  set({ musicVolume: Math.max(0, Math.min(1, v)), musicMuted: false });
}
export function nudgeMusic(delta: number) {
  boot();
  setMusicVolume(mix.musicVolume + delta);
}
export function toggleMusicMute(force?: boolean) {
  boot();
  set({ musicMuted: force ?? !mix.musicMuted });
}
export function setDuckLevel(v: number) {
  set({ duckLevel: Math.max(0.05, Math.min(1, v)) });
}

export function setCoachLevel(v: number) {
  boot();
  const coachVolume = Math.max(0, Math.min(1, v));
  setCoachVolume(coachVolume);
  set({ coachVolume, coachMuted: false });
}
export function nudgeCoach(delta: number) {
  boot();
  setCoachLevel(mix.coachVolume + delta);
}
export function setCoachMuted(muted: boolean) {
  boot();
  setCoachVolume(muted ? 0 : mix.coachVolume);
  set({ coachMuted: muted });
}

/** Load a local audio file the user picked — no upload, no network. */
export function loadMusicFile(file: File) {
  boot();
  const a = element();
  if (!a) return;
  try {
    a.src = URL.createObjectURL(file);
    set({ hasTrack: true, trackName: file.name });
    a.volume = target();
    void a.play().catch(() => undefined);
  } catch {
    /* ignore */
  }
}

export function playMusic() {
  boot();
  const a = element();
  if (!a || !mix.hasTrack) return;
  a.volume = target();
  void a.play().catch(() => undefined);
}

export function pauseMusic() {
  boot();
  el?.pause();
}

export function toggleMusic() {
  boot();
  if (mix.playing) pauseMusic();
  else playMusic();
}

/* -------------------------------- react -------------------------------- */

import { useSyncExternalStore } from "react";

export function useMix(): MixState {
  return useSyncExternalStore(
    (l) => {
      boot();
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => mix,
    () => initial,
  );
}