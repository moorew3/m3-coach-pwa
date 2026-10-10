import { useCallback, useEffect, useRef, useState } from "react";
import type { FlexPresenceState } from "@/v2/flex-presence";
import { COACH_REFERENCE } from "@/data/coach-identity";
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
  getConnectionState?: () => unknown;
  agent?: {
    idle_video?: string;
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
  const [hasVisual, setHasVisual] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // On an authorization failure, keep the approved coach and Marcus usable.
  const [recordedFallback, setRecordedFallback] = useState(false);

  const showIdleVideo = useCallback(() => {
    const video = videoRef.current;
    // v3 places idle_video directly on agent; presenter.idle_video is a legacy shape.
    const idle = managerRef.current?.agent?.idle_video
      || managerRef.current?.agent?.presenter?.idle_video;
    if (!video) return;
    setHasVisual(false);
    try {
      video.pause();
      video.srcObject = null;
      if (!idle) {
        video.removeAttribute("src");
        video.load();
        return;
      }
      video.src = idle;
      void video.play().catch(() => undefined);
    } catch {
      // Approved still portrait remains visible if the provider has no idle media.
    }
  }, []);

  const showLiveStream = useCallback(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    setHasVisual(false);
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
    setHasVisual(false);
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
          setRecordedFallback(true);
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

      // A resolved connect may race with a disconnect; do not claim live in that case.
      const transportState = String(manager.getConnectionState?.() ?? "connected").toLowerCase();
      if (transportState !== "connected") {
        throw new Error("D-ID did not establish an active connection.");
      }
      setState("connected");
      connectedRef.current = true;
      setConnected(true);
      // Show the provider's idle video until a talking stream arrives. If the
      // idle asset is unavailable, the approved still portrait stays visible.
      showIdleVideo();
    } catch (cause) {
      managerRef.current = null;
      connectedRef.current = false;
      setRecordedFallback(true);
      streamRef.current = null;
      setLiveFlexController(null);
      setLiveFlexSpeaking(false);
      setConnected(false);
      setState("error");
      setError(cause instanceof Error ? cause.message : "Live Flex could not connect.");
    }
  }, [config.agentId, config.clientKey, showIdleVideo, showLiveStream, started]);

  useEffect(() => {
    if (!recordedFallback) return;
    // Do not leave a failed D-ID transport holding audio/video resources.
    void stop();
  }, [recordedFallback, stop]);

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

  if (recordedFallback) {
    return (
      <div
        data-testid="live-flex-recorded-fallback"
        className={`absolute right-3 top-[104px] z-20 w-[min(42vw,240px)] overflow-hidden rounded-2xl border border-cyan-300/30 bg-[#0a1118] shadow-2xl ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        <div className="relative aspect-[3/4] bg-[#0a1118]">
          <video
            src="/media/approved/boxingStance.mp4"
            poster={COACH_REFERENCE}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-label="Previously approved recorded Flex coach movement preview"
            className="h-full w-full object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent px-2 pb-2 pt-8">
            <p className="text-[10px] font-black uppercase text-cyan-200">Flex · Marcus coach mode</p>
            <p className="mt-1 text-[10px] leading-snug text-white/80">
              D-ID live face is not authorized. Your actual workout demos, spoken coaching, and voice controls remain available.
            </p>
            <p className="mt-1 text-[9px] text-white/50">Recorded movement preview — not live lip-sync.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setRecordedFallback(false)}
          className="min-h-11 w-full border-t border-white/15 bg-white/5 px-2 text-[10px] font-bold uppercase text-cyan-200"
        >
          Check D-ID live face again
        </button>
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
        <img
          src={COACH_REFERENCE}
          alt="Approved Flex coach portrait"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={false}
          poster={COACH_REFERENCE}
          onLoadedData={() => setHasVisual(true)}
          onPlaying={() => setHasVisual(true)}
          onEmptied={() => setHasVisual(false)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity ${
            hasVisual ? "opacity-100" : "opacity-0"
          }`}
        />
        {connected && !hasVisual && (
          <div className="absolute inset-x-2 bottom-2 rounded-lg bg-black/80 px-2 py-1.5 text-center text-[10px] text-cyan-100">
            Flex connected · waiting for video frames
          </div>
        )}

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
          {connected ? (hasVisual ? "Flex · Live video" : "Flex · Connected") : `Flex · ${state}`}
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
