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

type DidEmbedApi = {
  functions: {
    speak: (payload: { type: "text" | "audio"; input: string }) => Promise<unknown>;
    toggleMicState: (state?: boolean) => unknown;
    toggleSpeakerState: (state?: boolean) => unknown;
    interrupt: () => unknown;
  };
  configure: (options: Record<string, unknown>) => unknown;
  events: {
    on: (
      event: "connection" | "agentActivity" | "error",
      callback: (payload: any) => void,
    ) => () => void;
  };
};

function didApi() {
  return (window as typeof window & { DID_AGENTS_API?: DidEmbedApi }).DID_AGENTS_API;
}

async function waitForDidApi(timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const api = didApi();
    if (api) return api;
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
  throw new Error("D-ID embed did not finish loading.");
}

export function DidFlexAvatar({
  config,
  presence,
  visible,
}: {
  config: DidConfig;
  presence: FlexPresenceState;
  visible: boolean;
}) {
  const targetId = useRef(`did-flex-${Math.random().toString(36).slice(2)}`);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  const [state, setState] = useState("inactive");
  const [connected, setConnected] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupSubscriptions = useCallback(() => {
    for (const unsubscribe of unsubscribersRef.current.splice(0)) {
      try { unsubscribe(); } catch { /* no-op */ }
    }
  }, []);

  const stop = useCallback(() => {
    const api = didApi();
    try { api?.functions.interrupt(); } catch { /* no-op */ }
    try { api?.functions.toggleMicState(true); } catch { /* no-op */ }
    cleanupSubscriptions();
    setLiveFlexController(null);
    setLiveFlexSpeaking(false);
    setConnected(false);
    setStarted(false);
    setState("inactive");

    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }
    const target = document.getElementById(targetId.current);
    if (target) target.replaceChildren();
  }, [cleanupSubscriptions]);

  useEffect(() => () => stop(), [stop]);

  const start = useCallback(async () => {
    if (started) return;
    setError(null);
    setState("connecting");
    setStarted(true);

    try {
      // The official Embed client owns WebRTC/session setup. M3 Coach still owns
      // workout intelligence and the Marcus audio passed into speak().
      const script = document.createElement("script");
      script.type = "module";
      script.src = "https://agent.d-id.com/v2/index.js";
      script.dataset.mode = "full";
      script.dataset.targetId = targetId.current;
      script.dataset.clientKey = config.clientKey;
      script.dataset.agentId = config.agentId;
      script.dataset.name = "did-agent";
      script.dataset.autoConnect = "true";
      script.dataset.orientation = "vertical";
      script.dataset.showRestartButton = "false";
      script.dataset.showAgentName = "false";
      script.dataset.track = "false";
      scriptRef.current = script;
      document.body.appendChild(script);

      const api = await waitForDidApi();

      try {
        api.configure({
          openMode: "expanded",
          showChatToggle: false,
          showMicToggle: false,
          showRestartButton: false,
        });
      } catch {
        // Older embed builds may ignore some runtime appearance controls.
      }

      // D-ID is the face only. M3 Coach owns the listening/conversation loop.
      try { api.functions.toggleMicState(true); } catch { /* safe no-op */ }
      try { api.functions.toggleSpeakerState(false); } catch { /* safe no-op */ }

      unsubscribersRef.current.push(
        api.events.on("connection", ({ state: nextState }) => {
          const normalized = String(nextState || "").toLowerCase();
          setState(normalized || "connecting");
          const isConnected = normalized === "connected";
          setConnected(isConnected);
          if (
            normalized === "fail" ||
            normalized === "closed" ||
            normalized === "disconnected"
          ) {
            setLiveFlexController(null);
            setLiveFlexSpeaking(false);
          }
        }),
      );

      unsubscribersRef.current.push(
        api.events.on("agentActivity", ({ state: activity }) => {
          const normalized = String(activity || "").toUpperCase();
          setLiveFlexSpeaking(normalized === "TALKING");
        }),
      );

      unsubscribersRef.current.push(
        api.events.on("error", ({ error: nextError }) => {
          const code = nextError?.code || nextError?.type;
          const message = nextError?.message || "D-ID embed could not connect Flex.";
          setError(code ? `${message} (${code})` : message);
        }),
      );

      setLiveFlexController({
        speakText: async (text) => {
          const liveApi = didApi();
          if (!liveApi) return false;

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

          await liveApi.functions.speak({
            type: "audio",
            input: speech.audioUrl,
          });
          return true;
        },
        interrupt: () => {
          try { didApi()?.functions.interrupt(); } catch { /* safe no-op */ }
        },
      });
    } catch (cause) {
      setLiveFlexController(null);
      setLiveFlexSpeaking(false);
      setConnected(false);
      setState("error");
      setError(cause instanceof Error ? cause.message : "Live Flex could not connect.");
    }
  }, [config.agentId, config.clientKey, started]);

  useEffect(() => {
    if (presence === "thinking") {
      try { didApi()?.functions.interrupt(); } catch { /* safe no-op */ }
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
        <div id={targetId.current} className="h-full w-full overflow-hidden" />

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
            onClick={stop}
            className="rounded-md border border-white/15 px-2 py-1 font-bold text-white/60"
          >
            End
          </button>
        )}
      </div>
    </div>
  );
}
