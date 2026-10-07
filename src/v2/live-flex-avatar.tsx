import { useCallback, useEffect, useRef, useState } from "react";
import type { FlexPresenceState } from "@/v2/flex-presence";
import { setLiveFlexController } from "@/v2/live-flex-bridge";

type ConfigState = {
  configured: boolean;
  hasApiKey: boolean;
  hasAvatarId: boolean;
  sandbox: boolean;
  mode: "LITE";
};

type LiveSessionLike = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  attach: (element: HTMLMediaElement) => void;
  startListening: () => string;
  stopListening: () => string;
  interrupt: () => void;
  repeat: (message: string) => string;
  on: (event: string, cb: (...args: any[]) => void) => unknown;
};

export function LiveFlexAvatar({
  presence,
  visible,
}: {
  presence: FlexPresenceState;
  visible: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveSessionLike | null>(null);
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [sessionState, setSessionState] = useState("inactive");
  const [streamReady, setStreamReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void fetch("/api/public/live-avatar-token", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Live Flex configuration check failed.");
        return response.json() as Promise<ConfigState>;
      })
      .then((next) => {
        if (alive) setConfig(next);
      })
      .catch(() => {
        if (alive) setConfig(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const stop = useCallback(async () => {
    const active = sessionRef.current;
    sessionRef.current = null;
    setLiveFlexController(null);
    setStreamReady(false);
    setSessionState("inactive");
    if (active) {
      try { await active.stop(); } catch { /* session may already be closed */ }
    }
  }, []);

  useEffect(() => () => {
    void stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (!config?.configured || sessionRef.current) return;
    setError(null);
    setSessionState("connecting");

    try {
      const tokenResponse = await fetch("/api/public/live-avatar-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const tokenBody = await tokenResponse.json() as {
        sessionToken?: string;
        message?: string;
      };
      if (!tokenResponse.ok || !tokenBody.sessionToken) {
        throw new Error(tokenBody.message || "Live Flex session could not start.");
      }

      const sdk = await import("@heygen/liveavatar-web-sdk");
      const session = new sdk.LiveAvatarSession(tokenBody.sessionToken, {
        autoKeepAlive: true,
        // M3 owns ASR + conversation. Do not let LiveAvatar open a second mic.
        voiceChat: { defaultMuted: true },
      }) as unknown as LiveSessionLike;

      session.on(sdk.SessionEvent.SESSION_STATE_CHANGED, (state: unknown) => {
        setSessionState(String(state).toLowerCase());
      });
      session.on(sdk.SessionEvent.SESSION_STREAM_READY, () => {
        setStreamReady(true);
        const element = videoRef.current;
        if (element) session.attach(element);
      });
      session.on(sdk.SessionEvent.SESSION_DISCONNECTED, () => {
        sessionRef.current = null;
        setLiveFlexController(null);
        setStreamReady(false);
        setSessionState("disconnected");
      });

      sessionRef.current = session;
      await session.start();
      setLiveFlexController({
        speakText: (text) => {
          if (!sessionRef.current || !streamReady) return false;
          session.repeat(text);
          return true;
        },
        interrupt: () => session.interrupt(),
      });
      if (videoRef.current) session.attach(videoRef.current);
    } catch (cause) {
      sessionRef.current = null;
      setStreamReady(false);
      setSessionState("error");
      setError(cause instanceof Error ? cause.message : "Live Flex could not start.");
    }
  }, [config?.configured]);

  useEffect(() => {
    const session = sessionRef.current;
    if (!session || !streamReady) return;
    try {
      if (presence === "listening") session.startListening();
      else session.stopListening();

      // When the athlete takes the floor, stop any avatar-side utterance.
      if (presence === "thinking") session.interrupt();
    } catch {
      // A transient LiveAvatar state should not interrupt the workout.
    }
  }, [presence, streamReady]);

  // No credential placeholders in the workout UI. The component appears
  // automatically after the correct LiveAvatar key + Flex avatar ID exist.
  if (!config?.configured) return null;

  const active = sessionRef.current !== null;

  return (
    <div
      data-testid="live-flex-avatar"
      className={`absolute right-3 top-[104px] z-20 w-[min(42vw,240px)] overflow-hidden rounded-2xl border border-cyan-300/30 bg-black/80 shadow-2xl transition-opacity ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="relative aspect-[3/4] bg-[#0a1118]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          className={`h-full w-full object-cover transition-opacity ${
            streamReady ? "opacity-100" : "opacity-0"
          }`}
        />
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-3 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-200">
              Live Flex
            </p>
            <p className="text-[10px] leading-relaxed text-white/55">
              {config.sandbox
                ? "Sandbox is ready. Starting requires your tap and does not auto-start with the workout."
                : "Production LiveAvatar is ready. Starting requires your tap."}
            </p>
            <button
              type="button"
              onClick={() => void start()}
              className="min-h-11 rounded-xl bg-cyan-300 px-3 text-[11px] font-black uppercase text-black"
            >
              Start Live Flex
            </button>
          </div>
        )}
        {active && !streamReady && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-[11px] font-bold text-white/70">
            Connecting Flex…
          </div>
        )}
        {error && (
          <div className="absolute inset-x-2 bottom-2 rounded-lg bg-red-950/90 px-2 py-1.5 text-[10px] text-red-100">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-2 py-1.5 text-[10px]">
        <span className="font-black uppercase text-cyan-200">
          {streamReady ? "Flex · Live" : `Flex · ${sessionState}`}
        </span>
        {active && (
          <button
            type="button"
            onClick={() => void stop()}
            className="rounded-md border border-white/15 px-2 py-1 font-bold text-white/60"
          >
            End
          </button>
        )}
      </div>
    </div>
  );
}
