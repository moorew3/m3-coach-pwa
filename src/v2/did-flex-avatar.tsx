import { useCallback, useEffect, useRef, useState } from "react";
import type { FlexPresenceState } from "@/v2/flex-presence";
import {
  setLiveFlexController,
  setLiveFlexSpeaking,
} from "@/v2/live-flex-bridge";

type DidConfig = {
  agentId: string;
  clientKey: string;
};

type DidAgentManager = {
  connect: () => Promise<unknown>;
  disconnect: () => Promise<unknown>;
  speak: (payload: Record<string, unknown>) => Promise<unknown>;
  interrupt?: (interrupt?: boolean) => unknown;
  agent?: {
    presenter?: {
      idle_video?: string;
    };
  };
};

export function DidFlexAvatar({
  config,
  presence,
  visible,
}: {
  config: DidConfig;
  presence: FlexPresenceState;
  visible: boolean;
}) {
  const plainDidDiagnostic =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("didPlain") === "1";
  const videoRef = useRef<HTMLVideoElement>(null);
  const managerRef = useRef<DidAgentManager | null>(null);
  // Keep transport state current inside SDK callbacks and live speech handlers.
  const connectedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState("inactive");
  const [connected, setConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showIdleVideo = useCallback(() => {
    const video = videoRef.current;
    const idle = managerRef.current?.agent?.presenter?.idle_video;
    if (!video || !idle) return;
    try {
      video.srcObject = null;
      video.src = idle;
      void video.play().catch(() => undefined);
    } catch {
      // Idle video is optional; a transient media error should not break training.
    }
  }, []);

  const showLiveStream = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    try {
      video.removeAttribute("src");
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    } catch {
      // Connection callbacks will surface the real transport state.
    }
  }, []);

  const stop = useCallback(async () => {
    const manager = managerRef.current;
    managerRef.current = null;
    connectedRef.current = false;
    setLiveFlexController(null);
    setLiveFlexSpeaking(false);
    setConnected(false);
    setStarted(false);
    setState("inactive");
    setError(null);
    streamRef.current = null;

    if (manager) {
      try { await manager.disconnect(); } catch { /* session may already be closed */ }
    }

    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
        video.srcObject = null;
        video.removeAttribute("src");
        video.load();
      } catch { /* no-op */ }
    }
  }, []);

  useEffect(() => {
    if (!plainDidDiagnostic) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://agent.d-id.com/v2/index.js";
    script.dataset.mode = "fabio";
    script.dataset.clientKey = config.clientKey;
    script.dataset.agentId = config.agentId;
    script.dataset.name = "did-agent";
    document.body.appendChild(script);

    return () => {
      try { script.remove(); } catch { /* no-op */ }
    };
  }, [config.agentId, config.clientKey, plainDidDiagnostic]);

  useEffect(() => () => {
    void stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (started || managerRef.current) return;

    setError(null);
    setState("connecting");
    setStarted(true);

    try {
      const sdk = await import("@d-id/client-sdk");
      let manager: DidAgentManager | null = null;

      const callbacks = {
        onSrcObjectReady(value: MediaStream) {
          streamRef.current = value;
          showLiveStream();
          return value;
        },
        onConnectionStateChange(nextState: unknown) {
          const normalized = String(nextState || "").toLowerCase();
          setState(normalized || "connecting");
          const isConnected = normalized === "connected";
          connectedRef.current = isConnected;
          setConnected(isConnected);

          if (
            normalized === "fail" ||
            normalized === "closed" ||
            normalized === "disconnected"
          ) {
            setLiveFlexController(null);
            setLiveFlexSpeaking(false);
          }
        },
        onVideoStateChange(nextState: unknown) {
          const normalized = String(nextState || "").toUpperCase();
          const talking = normalized !== "STOP";
          setLiveFlexSpeaking(talking);
          if (talking) showLiveStream();
          else showIdleVideo();
        },
        onError(nextError: unknown, errorData: unknown) {
          const message =
            nextError instanceof Error
              ? nextError.message
              : typeof nextError === "string"
                ? nextError
                : "D-ID could not connect Flex.";
          const detail =
            errorData && typeof errorData === "object"
              ? JSON.stringify(errorData)
              : "";
          setError(detail ? `${message} · ${detail}` : message);
        },
      };

      manager = await sdk.createAgentManager(config.agentId, {
        auth: {
          type: "key",
          clientKey: config.clientKey,
        },
        callbacks,
        streamOptions: {
          compatibilityMode: "auto",
          streamWarmup: true,
        },
      }) as unknown as DidAgentManager;

      managerRef.current = manager;

      setLiveFlexController({
        speakText: async (text) => {
          const active = managerRef.current;
          if (!active || !connectedRef.current) return false;

          const speechResponse = await fetch("/api/public/flex-speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          const speech = await speechResponse.json() as {
            audioUrl?: string;
            message?: string;
          };
          if (!speechResponse.ok || !speech.audioUrl) {
            throw new Error(speech.message || "Marcus audio could not be generated.");
          }

          await active.speak({
            type: "audio",
            audio_url: speech.audioUrl,
          });
          return true;
        },
        interrupt: () => {
          try { managerRef.current?.interrupt?.(true); } catch { /* safe no-op */ }
        },
      });

      await manager.connect();

      // The connection callback is authoritative, but this keeps the UI useful
      // if a browser delays the callback after connect() resolves.
      setState((current) => current === "connecting" ? "connected" : current);
      connectedRef.current = true;
      setConnected(true);
      showLiveStream();
    } catch (cause) {
      managerRef.current = null;
    connectedRef.current = false;
      streamRef.current = null;
      setLiveFlexController(null);
      setLiveFlexSpeaking(false);
      setConnected(false);
      setState("error");
      setError(cause instanceof Error ? cause.message : "Live Flex could not connect.");
    }
  }, [config.agentId, config.clientKey, showIdleVideo, showLiveStream, started]);

  useEffect(() => {
    if (presence !== "thinking") return;
    try { managerRef.current?.interrupt?.(true); } catch { /* safe no-op */ }
  }, [presence]);

  if (plainDidDiagnostic) {
    return (
      <div className="absolute right-3 top-[104px] z-20 w-[min(42vw,240px)] rounded-2xl border border-cyan-300/30 bg-black/80 p-3 text-[10px] text-cyan-100">
        Plain D-ID diagnostic mode is active. Use the D-ID floating widget to test the provider directly.
      </div>
    );
  }

  return (
    <div
      data-testid="live-flex-did"
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
            connected ? "opacity-100" : "opacity-50"
          }`}
        />

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a1118] p-3 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-200">
              Live Flex
            </p>
            <p className="text-[10px] leading-relaxed text-white/55">
              Flex's face uses D-ID. His words and workout intelligence stay in M3 Coach, and his live voice stays Marcus.
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

        {started && !connected && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 p-4 text-center text-[11px] font-bold text-white/80">
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
          {connected ? "Flex · Live" : `Flex · ${state}`}
        </span>
        {started && (
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
