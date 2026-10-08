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

type AgentManagerLike = {
  agent: { idle_video?: string | null };
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  speak: (payload: { type: "audio"; audio_url: string }) => Promise<unknown>;
  interrupt: (options?: { type?: "text" | "audio" | "click" | "manual" }) => void;
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const managerRef = useRef<AgentManagerLike | null>(null);
  const [state, setState] = useState("inactive");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showIdle = useCallback(() => {
    const video = videoRef.current;
    const manager = managerRef.current;
    if (!video) return;

    video.srcObject = null;
    const idle = manager?.agent?.idle_video;
    if (idle) {
      video.src = idle;
      video.loop = true;
      void video.play().catch(() => {});
    }
  }, []);

  const showStream = useCallback(() => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    video.src = "";
    video.loop = false;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});
  }, []);

  const stop = useCallback(async () => {
    const manager = managerRef.current;
    managerRef.current = null;
    streamRef.current = null;
    setLiveFlexController(null);
    setLiveFlexSpeaking(false);
    setConnected(false);
    setState("inactive");
    if (manager) {
      try {
        await manager.disconnect();
      } catch {
        // A closed D-ID stream is already stopped.
      }
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
      video.removeAttribute("src");
    }
  }, []);

  useEffect(() => () => {
    void stop();
  }, [stop]);

  const start = useCallback(async () => {
    if (managerRef.current) return;
    setError(null);
    setState("connecting");

    try {
      const sdk = await import("@d-id/client-sdk");
      let manager!: AgentManagerLike;

      manager = await sdk.createAgentManager(config.agentId, {
        auth: { type: "key", clientKey: config.clientKey },
        mode: sdk.ChatMode.DirectPlayback,
        analytics: { enabled: false },
        callbacks: {
          onSrcObjectReady(stream) {
            streamRef.current = stream;
            const video = videoRef.current;
            if (video) {
              video.src = "";
              video.srcObject = stream;
              video.loop = false;
              void video.play().catch(() => {});
            }
          },
          onConnectionStateChange(next) {
            const nextState = String(next).toLowerCase();
            setState(nextState);
            if (next === sdk.ConnectionState.Connected) {
              setConnected(true);
            }
            if (
              next === sdk.ConnectionState.Disconnected ||
              next === sdk.ConnectionState.Closed ||
              next === sdk.ConnectionState.Fail
            ) {
              setConnected(false);
              setLiveFlexController(null);
              setLiveFlexSpeaking(false);
            }
          },
          onVideoStateChange(next) {
            if (next === sdk.StreamingState.Start) {
              setLiveFlexSpeaking(true);
              showStream();
            } else if (next === sdk.StreamingState.Stop) {
              setLiveFlexSpeaking(false);
              showIdle();
            }
          },
          onError(cause) {
            setError(cause?.message || "D-ID could not render Flex.");
          },
        },
      }) as unknown as AgentManagerLike;

      managerRef.current = manager;
      await manager.connect();

      setLiveFlexController({
        speakText: async (text) => {
          if (managerRef.current !== manager) return false;

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

          await manager.speak({
            type: "audio",
            audio_url: speech.audioUrl,
          });
          return true;
        },
        interrupt: () => manager.interrupt({ type: "manual" }),
      });

      // DirectPlayback keeps D-ID's own conversational AI out of the session.
      showIdle();
    } catch (cause) {
      const manager = managerRef.current;
      managerRef.current = null;
      setLiveFlexController(null);
      setLiveFlexSpeaking(false);
      setConnected(false);
      setState("error");
      setError(cause instanceof Error ? cause.message : "Live Flex could not connect.");
      if (manager) {
        try { await manager.disconnect(); } catch { /* no-op */ }
      }
    }
  }, [config.agentId, config.clientKey, showIdle, showStream]);

  // The M3 microphone/brain owns listening. D-ID is deliberately only the face.
  useEffect(() => {
    if (presence === "thinking") {
      try { managerRef.current?.interrupt({ type: "manual" }); } catch { /* safe no-op */ }
    }
  }, [presence]);

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
          className={`h-full w-full object-cover transition-opacity ${
            connected ? "opacity-100" : "opacity-0"
          }`}
        />

        {!managerRef.current && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-3 text-center">
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

        {managerRef.current && !connected && !error && (
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
          {connected ? "Flex · Live" : `Flex · ${state}`}
        </span>
        {managerRef.current && (
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
