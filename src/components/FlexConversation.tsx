/**
 * M3 FLEX CONVERSATION — ONE existing coaching app, not another video page.
 *
 * Microphone: existing Chrome voice command handler (user enabled).
 * Replies: reliable logged-fact answers or optional local AI running on the
 * phone after explicit download. No paid AI calls, no server prompt upload.
 * Voice: ONLY approved recorded Marcus. Never use a generic TTS voice.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Send, Volume2, Square, MessageCircle, Cpu, X } from "lucide-react";
import { answerFlexLocal } from "@/lib/flex-local-advice";
import { nutritionCoachSnapshot } from "@/lib/nutrition-coach";
import { useApp, type AppState } from "@/lib/store";
import { stopFlexSpeech } from "@/lib/flex-answer-audio";
import { stopApprovedMarcus, playApprovedMarcusTest } from "@/lib/flex-marcus-audio";
import {
  setConversationHandler, startListening, stopListening, useVoiceControl, voiceControlAvailable,
} from "@/lib/voice-commands";

type Turn = { role: "user" | "assistant"; content: string; kind?: "record" | "model" | "help" };
type ModelStatus = "off" | "loading" | "ready" | "unavailable" | "error";
const SESSION_KEY = "m3-flex-conversation-session-v1";
const SUGGESTED = ["How much protein have I logged?", "What is today's workout?", "What should I eat?", "Explain progressive overload"];
const MAX_TURNS = 16;

function factsOf(s: AppState) {
  const today = nutritionCoachSnapshot(s).today;
  return {
    dailyProteinLoggedG: Math.round(today.protein),
    dailyProteinTargetG: today.proteinTarget,
    dailyCaloriesLogged: Math.round(today.calories),
    dailyCaloriesTarget: today.calorieTarget,
    waterCupsLogged: today.water,
    waterCupsTarget: today.waterTarget,
    trainingDay: today.trainingDay,
    foodRules: {
      noCheese: s.flexFoodPreferences?.avoidCheese !== false,
      preferLactoseFree: s.flexFoodPreferences?.preferLactoseFree !== false,
      flavor: s.flexFoodPreferences?.flavor || "chocolate",
    },
    legRestriction: "injured LEFT leg, supported and unloaded unless clinician changes restrictions",
    totalsAre: "logged entries so far; never assume food was eaten if not recorded",
  };
}
function loadTurns(): Turn[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(x => x && (x.role === "user" || x.role === "assistant") && typeof x.content === "string")
      .slice(-MAX_TURNS).map(x => ({
        role: x.role, content: x.content.slice(0, 3500),
        kind: x.kind === "model" ? "model" as const : x.kind === "record" ? "record" as const : "help" as const,
      }));
  } catch { return []; }
}
function preciseQuestion(question: string) {
  return /\b(protein|calori|macros?|carbs?|fat intake|water|hydration|lactose|cheese|injur|pain|boot|workout|exercise|reps?|sets?|progress|food|meal|breakfast|lunch|dinner|snack|next session)\b/i.test(question);
}
function normalizedFollowup(question: string, turns: Turn[]) {
  if (!/^(why\??|how so\??|explain (?:that|more)|what do you mean\??|can you explain\??|tell me more|what about (?:that|it)\??)$/i.test(question.trim())) return question;
  const last = [...turns].reverse().find(x => x.role === "assistant");
  return last ? question + " Your previous answer was: " + last.content.slice(0, 450) : question;
}

export function FlexConversation() {
  const state = useApp();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [turns, setTurns] = useState<Turn[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [micRequested, setMicRequested] = useState(false);
  const micRef = useRef(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("off");
  const [modelInfo, setModelInfo] = useState("");
  const [modelProgress, setModelProgress] = useState<number | null>(null);
  const [audioStatus, setAudioStatus] = useState("");
  const [supportsGPU, setSupportsGPU] = useState(false);
  const [mounted, setMounted] = useState(false);
  const worker = useRef<Worker | null>(null);
  const pending = useRef(new Map<number, { resolve: (value: string) => void; reject: (err: Error) => void }>());
  const requestNumber = useRef(0);
  const vc = useVoiceControl();

  const commit = useCallback((newTurns: Turn[]) => {
    const kept = newTurns.slice(-MAX_TURNS);
    turnsRef.current = kept;
    setTurns(kept);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(kept)); } catch { /* storage optional */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    setSupportsGPU(typeof navigator !== "undefined" && !!("gpu" in navigator));
    const loaded = loadTurns();
    turnsRef.current = loaded;
    setTurns(loaded);
    return () => {
      worker.current?.terminate();
      worker.current = null;
      for (const x of pending.current.values()) x.reject(new Error("Local conversation closed."));
      pending.current.clear();
      stopApprovedMarcus();
      stopFlexSpeech();
    };
  }, []);

  const turnOffModel = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
    for (const x of pending.current.values()) x.reject(new Error("Local AI switched off."));
    pending.current.clear();
    setModelStatus("off");
    setModelInfo("The local AI is off. Existing workout and nutrition answers still work.");
    setModelProgress(null);
  }, []);

  const startModel = useCallback(() => {
    if (typeof window === "undefined" || !("gpu" in navigator)) {
      setModelStatus("unavailable");
      setModelInfo("Chrome WebGPU is not available on this device. No model was downloaded.");
      return;
    }
    if (worker.current) return;
    setModelStatus("loading");
    setModelProgress(0);
    setModelInfo("Loading the optional on-device AI. Model weights are roughly 500 MB plus supporting files; Wi-Fi is recommended.");
    let w: Worker;
    try {
      w = new Worker("/flex-local-ai-worker.mjs", { type: "module" });
      worker.current = w;
    } catch {
      setModelStatus("error");
      setModelInfo("Your browser could not start the local AI worker. Existing coaching still works.");
      return;
    }
    w.onmessage = (event: MessageEvent<{type?:string;id?:number;text?:string;status?:string;percent?:number|null;message?:string;stage?:string}>) => {
      if (worker.current !== w) return;
      const e = event.data;
      if (e.type === "progress") {
        setModelInfo("Preparing on-device AI: " + (e.status || "downloading model") +
          (typeof e.percent === "number" ? " · " + e.percent + "%" : ""));
        if (typeof e.percent === "number") setModelProgress(e.percent);
      }
      if (e.type === "ready") {
        setModelStatus("ready");
        setModelProgress(100);
        setModelInfo("Local AI ready. You can ask broader questions and follow-ups. It may still make mistakes.");
      }
      if (e.type === "reply" && typeof e.id === "number") {
        const p = pending.current.get(e.id);
        if (p) { pending.current.delete(e.id); p.resolve(e.text || ""); }
      }
      if (e.type === "error") {
        if (typeof e.id === "number") {
          const p = pending.current.get(e.id);
          if (p) { pending.current.delete(e.id); p.reject(new Error(e.message || "Local model error")); }
        } else {
          setModelStatus("error");
          setModelInfo((e.message || "Local AI unavailable") + ". No paid service was activated.");
          w.terminate();
          worker.current = null;
        }
      }
    };
    w.onerror = () => {
      setModelStatus("error");
      setModelInfo("Local AI runtime failed on this browser. No paid service was used.");
      w.terminate();
      worker.current = null;
      for (const x of pending.current.values()) x.reject(new Error("Local AI runtime failed."));
      pending.current.clear();
    };
    w.postMessage({ type: "load" });
  }, []);

  const modelAsk = useCallback((history: Turn[], facts: ReturnType<typeof factsOf>) => {
    return new Promise<string>((resolve, reject) => {
      const w = worker.current;
      if (!w) { reject(new Error("Local AI not loaded")); return; }
      const id = ++requestNumber.current;
      pending.current.set(id, { resolve, reject });
      w.postMessage({ type: "ask", id, messages: history.map(x => ({
        role: x.role, content: x.content.slice(0, 680),
      })), facts });
    });
  }, []);

  const ask = useCallback(async (raw: string) => {
    const q = raw.trim().slice(0, 600);
    if (!q || busy) return;
    stopApprovedMarcus();
    stopFlexSpeech();
    const previous = turnsRef.current;
    const question = normalizedFollowup(q, previous);
    const input = [...previous, { role: "user" as const, content: q }];
    commit(input);
    setMessage("");
    setBusy(true);
    const state = stateRef.current;
    const local = answerFlexLocal(question, state);
    let answer = local.text;
    let kind: Turn["kind"] = local.category === "help" ? "help" : "record";
    try {
      if (modelStatus === "ready" && (local.category === "help" || !preciseQuestion(q))) {
        // General knowledge or follow-ups run on the phone, using dialogue context.
        const output = await modelAsk([...previous, {role: "user", content: question}], factsOf(state));
        if (output) { answer = output; kind = "model"; }
      } else if (local.category === "help") {
        answer = "I can answer questions about your logged nutrition, workout, and training now. " +
          "For broader questions and follow-ups, enable the optional On-device AI below (about 500 MB, Wi-Fi recommended). " +
          "I won't make up facts or switch to a different voice.";
      }
    } catch (err) {
      answer = "The local AI could not answer this question. " +
        (err instanceof Error ? err.message.slice(0, 140) : "Please try again.") +
        " Your workout and nutrition records remain available.";
      kind = "help";
    } finally {
      commit([...input, { role: "assistant", content: answer, kind }]);
      setBusy(false);
    }
  }, [busy, commit, modelAsk, modelStatus]);

  const askRef = useRef(ask);
  askRef.current = ask;
  useEffect(() => {
    // The existing voice command module routes spoken questions to this same
    // chat engine; workouts retain their own command handler.
    setConversationHandler(q => { void askRef.current(q); });
    return () => { setConversationHandler(null); micRef.current = false; stopListening(); };
  }, []);

  const toggleMic = () => {
    if (micRef.current || vc.listening) {
      micRef.current = false;
      setMicRequested(false);
      stopListening();
      return;
    }
    stopApprovedMarcus();
    if (startListening()) { micRef.current = true; setMicRequested(true); }
    else { micRef.current = false; setMicRequested(false); }
  };

  const sample = () => {
    if (micRef.current) stopListening();
    setAudioStatus("Starting original approved Marcus recording…");
    playApprovedMarcusTest({
      onPlaying: () => setAudioStatus("Marcus – Warm & Friendly recording playing."),
      onDone: () => {
        setAudioStatus("Recording finished. Live answers are text-only without authorized Marcus synthesis.");
        if (micRef.current) startListening();
      },
      onError: m => { setAudioStatus(m); if (micRef.current) startListening(); },
    });
  };
  return (
    <div data-testid="flex-conversation" className="mt-3 rounded-xl border border-cyan-400/30 bg-background/70 p-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-black"><MessageCircle className="size-4 text-accent" /> Talk to Flex</h3>
        <div className="flex items-center gap-1.5">
          <button type="button" data-testid="marcus-sample" onClick={sample}
            className="min-h-10 rounded-lg border border-accent/30 px-2 text-[11px] font-bold text-accent">
            <Volume2 className="mr-1 inline size-3.5" />Marcus sample
          </button>
          <button type="button" aria-label="Clear this chat" onClick={() => commit([])}
            className="grid size-10 place-items-center rounded-lg border border-border"><X className="size-4" /></button>
        </div>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">A real two-way conversation: ask, read the response, and ask follow-ups. Speak questions with the mic or type. Changing replies require approved Marcus synthesis to be heard; no substitute voice is used.</p>
      {audioStatus && <p className="mt-1 text-[11px] text-accent" role="status">{audioStatus}</p>}

      <div role="log" aria-live="polite" aria-label="Flex conversation" data-testid="flex-chat-history"
        className="mt-2 max-h-80 min-h-14 space-y-2 overflow-y-auto rounded-xl bg-black/15 p-2">
        {!turns.length && <p className="p-2 text-xs text-muted-foreground">Flex: What would you like to discuss? Ask about a workout, meal, recovery, or a follow-up question.</p>}
        {turns.map((t,i) => (
          <div key={i} className={t.role==="user" ? "ml-5 rounded-xl bg-primary/15 px-3 py-2" : "mr-5 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2"}>
            <p className="text-[10px] font-black uppercase text-accent">{t.role==="user"?"You":t.kind==="model"?"Flex · on-device AI":t.kind==="record"?"Flex · your recorded data":"Flex · help"}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{t.content}</p>
          </div>
        ))}
        {busy && <p className="text-xs text-accent" role="status">Flex is preparing a reply…</p>}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SUGGESTED.map(q=><button key={q} disabled={busy} type="button" onClick={() => void ask(q)}
          className="min-h-9 rounded-full border border-border bg-elevated px-2 text-[11px] font-semibold">{q}</button>)}
      </div>
      <form data-testid="flex-chat-form" onSubmit={e=>{e.preventDefault();void ask(message);}}
        className="mt-2 flex gap-1.5">
        <input aria-label="Ask Flex a question" data-testid="flex-chat-input"
          value={message} maxLength={600} onChange={e=>setMessage(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-input bg-elevated px-3 py-2 text-base"
          placeholder="Ask Flex anything…" />
        <button aria-label="Send message" type="submit" disabled={busy || !message.trim()}
          className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Send className="size-4"/></button>
        {mounted && voiceControlAvailable() && <button type="button" data-testid="flex-chat-mic"
          onClick={toggleMic} aria-pressed={micRequested}
          className="grid size-11 place-items-center rounded-lg border border-border bg-elevated"
          aria-label={micRequested?"Stop talking":"Talk to Flex"}>
          {micRequested ? <Mic className="size-5 text-accent" /> : <MicOff className="size-5" />}
        </button>}
      </form>
      {(micRequested||vc.listening)&&<p className="mt-1 text-xs text-accent" role="status">Microphone active. Say “Flex” or ask a question. You can interrupt and ask another one.</p>}
      {vc.heard && <p className="mt-1 text-[11px] text-muted-foreground">Heard: {vc.heard}</p>}
      {vc.error && <p role="alert" className="mt-1 text-xs text-amber-300">{vc.error}</p>}

      <details className="mt-2 rounded-lg border border-border/70 bg-elevated/30 p-2" data-testid="flex-on-device-ai">
        <summary className="cursor-pointer text-xs font-bold">
          <Cpu className="mr-1 inline size-4 text-accent" /> Broader questions · Optional on-device AI
          {modelStatus==="ready"?" · Ready":modelStatus==="loading"?" · Loading":""}
        </summary>
        <p className="mt-2 text-xs text-muted-foreground">
          Open-source Qwen2.5 0.5B runs on your own phone after a model download of roughly 500 MB plus supporting files.
          No AI subscription or per-question fee; Wi-Fi is recommended. Answers can be imperfect.
          Your questions stay in this browser. <strong>Nothing downloads until you tap Enable.</strong>
        </p>
        {modelStatus==="off" || modelStatus==="error" || modelStatus==="unavailable" ? (
          <button type="button" data-testid="flex-enable-local-ai" disabled={!supportsGPU} onClick={startModel}
            className="mt-2 min-h-11 rounded-lg border border-accent/50 bg-accent/20 px-3 text-sm font-bold text-accent disabled:opacity-50">
            {supportsGPU?"Enable on-device AI (~500 MB)":"WebGPU not supported · Chrome needed"}
          </button>
        ) : <button type="button" onClick={turnOffModel}
            className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg border border-border bg-elevated px-3 text-xs font-bold">
            <Square className="size-3"/> Stop local AI
          </button>}
        {modelProgress!==null&&modelStatus==="loading"&&<progress aria-label="Local AI download" value={modelProgress} max={100} className="mt-2 block w-full"/>}
        {modelInfo && <p data-testid="flex-local-ai-status" role="status" className="mt-2 text-xs text-muted-foreground">{modelInfo}</p>}
        <p className="mt-2 text-[11px] text-muted-foreground">This is optional general conversation, not medical diagnosis or guaranteed expert answers. Only existing workout controls can change logged data.</p>
      </details>
    </div>
  );
}
