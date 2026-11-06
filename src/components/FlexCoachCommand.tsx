/**
 * FLEX COMMAND — integrated native coaching entry point.
 * Uses the same app state, workouts, progress and nutrition data as all
 * existing M3 FLEX screens. Never starts a second tracker or paid provider.
 */
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Apple, ArrowRight, Check, Dumbbell, Mic, MicOff, Send, ShieldCheck, TrendingUp, Waves, Volume2, VolumeX } from "lucide-react";
import { answerFlexLocal, foodPreferencesFor, type FlexLocalReply } from "@/lib/flex-local-advice";
import { nutritionCoachSnapshot } from "@/lib/nutrition-coach";
import { stopFlexSpeech } from "@/lib/flex-answer-audio";
import { marcusRecordedAudioAvailable, playApprovedMarcusTest, stopApprovedMarcus } from "@/lib/flex-marcus-audio";
import {
  currentDayNumber, getNutrition, setState, todayKey, updateNutrition, useApp,
  type AppState, type FlexFoodPreferences,
} from "@/lib/store";
import {
  setConversationHandler, startListening, stopListening, useVoiceControl, voiceControlAvailable,
} from "@/lib/voice-commands";

const IDEAS = ["How am I doing today?", "What should I eat?", "How much protein do I have?", "What's my workout?"];

export function FlexCoachCommand({ compact = false }: { compact?: boolean }) {
  const state = useApp();
  const day = currentDayNumber(state);
  const nutrition = nutritionCoachSnapshot(state);
  const prefs = foodPreferencesFor(state);
  const [question, setQuestion] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [answer, setAnswer] = useState<FlexLocalReply | null>(null);
  const [ready, setReady] = useState(false);
  const [marcusReady, setMarcusReady] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "playing" | "error">("idle");
  const [voiceInfo, setVoiceInfo] = useState("");
  const vc = useVoiceControl();
  const current = useRef<AppState>(state);
  const wantMic = useRef(false);
  current.current = state;
  useEffect(() => {
    setReady(true);
    setMarcusReady(marcusRecordedAudioAvailable());
    // Stop the previously installed phone-voice fallback, if it is still queued.
    stopFlexSpeech();
  }, []);
  const canListen = ready && voiceControlAvailable();

  const playMarcus = useCallback(() => {
    stopFlexSpeech();
    if (wantMic.current) stopListening(); // Never transcribe approved audio as the user's question.
    setVoiceStatus("idle");
    setVoiceInfo("Loading an original approved Marcus recording…");
    const restartMic = () => {
      if (wantMic.current)
        window.setTimeout(() => { if (wantMic.current) startListening(); }, 450);
    };
    playApprovedMarcusTest({
      onPlaying: () => {
        setVoiceStatus("playing");
        setVoiceInfo("Playing Marcus – Warm & Friendly (original approved recording).");
      },
      onDone: () => {
        setVoiceStatus("idle");
        setVoiceInfo("Marcus recording finished.");
        restartMic();
      },
      onError: (message) => {
        setVoiceStatus("error");
        setVoiceInfo(message);
        restartMic();
      },
    });
  }, []);

  const ask = useCallback((raw: string, spokenQuestion = false) => {
    const text = raw.trim().slice(0, 600);
    if (!text) return;
    stopApprovedMarcus();
    stopFlexSpeech();
    const result = answerFlexLocal(text, current.current);
    setLastQuestion(text);
    setQuestion("");
    setAnswer(result);
    setVoiceStatus("idle");
    setVoiceInfo("Answer shown below. Marcus can speak approved recordings; live narration of changing answers is not available without his voice-generation service.");
    if (spokenQuestion && wantMic.current) {
      window.setTimeout(() => { if (wantMic.current) startListening(); }, 450);
    }
  }, []);

  useEffect(() => {
    setConversationHandler((phrase) => ask(phrase, true));
    return () => {
      wantMic.current = false;
      setConversationHandler(null);
      stopListening();
      stopFlexSpeech();
      stopApprovedMarcus();
    };
  }, [ask]);

  const setPreference = (changes: Partial<FlexFoodPreferences>) =>
    setState((s) => ({
      ...s,
      flexFoodPreferences: { ...foodPreferencesFor(s), ...changes },
    }));

  const water = getNutrition(state, todayKey()).water;
  return (
    <section data-testid="flex-coach-command" className="surface-card mt-4 overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-card via-card to-cyan-950/30 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-accent">M3 FLEX · Personal coach</p>
          <h2 className="mt-1 text-xl font-black leading-tight sm:text-2xl">Train. Talk. Eat. Improve.</h2>
        </div>
        <span className="rounded-full border border-green-500/50 bg-green-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-green-200">
          No paid AI calls
        </span>
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Your existing live workout engine, coaching, nutrition and progress share one log. Flex answers common questions from real entries, never invented results.
      </p>

      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link data-testid="flex-start-coach" to="/coach/$day" params={{ day: String(day) }}
            className="tap-target flex min-h-16 flex-col justify-center rounded-xl bg-primary px-3 text-primary-foreground">
            <Dumbbell className="size-5" aria-hidden />
            <span className="mt-1 text-sm font-black leading-tight">Start Coached Workout</span>
            <span className="text-[10px] opacity-80">Live sets, voice and camera</span>
          </Link>
          <Link to="/recovery" search={{ program: "recovery" }}
            className="tap-target flex min-h-16 flex-col justify-center rounded-xl border border-border bg-elevated px-3">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold leading-tight">Seated Recovery</span>
            <span className="text-[10px] text-muted-foreground">Only clinician-cleared moves</span>
          </Link>
          <Link to="/nutrition" className="tap-target flex min-h-16 flex-col justify-center rounded-xl border border-border bg-elevated px-3">
            <Apple className="size-5 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold leading-tight">Nutrition & meals</span>
            <span className="text-[10px] text-muted-foreground">Food log and daily targets</span>
          </Link>
          <Link to="/progress" className="tap-target flex min-h-16 flex-col justify-center rounded-xl border border-border bg-elevated px-3">
            <TrendingUp className="size-5 text-accent" aria-hidden />
            <span className="mt-1 text-sm font-bold leading-tight">My progress</span>
            <span className="text-[10px] text-muted-foreground">Workout history and trends</span>
          </Link>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2" data-testid="flex-live-nutrition">
        <div className="rounded-lg border border-border/50 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Calories</p>
          <p className="text-lg font-black tabular-nums">{Math.round(nutrition.today.calories)}</p>
          <p className="text-[10px] text-muted-foreground">of {nutrition.today.calorieTarget} kcal</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Protein</p>
          <p className="text-lg font-black tabular-nums">{Math.round(nutrition.today.protein)} g</p>
          <p className="text-[10px] text-muted-foreground">of {nutrition.today.proteinTarget} g</p>
        </div>
        <div className="rounded-lg border border-border/50 bg-black/20 p-2">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Water</p>
          <p className="text-lg font-black tabular-nums">{water} cups</p>
          <button data-testid="flex-water" type="button"
            onClick={() => updateNutrition(todayKey(), (n) => ({ ...n, water: n.water + 1 }))}
            className="mt-0.5 inline-flex min-h-7 items-center gap-1 rounded-md bg-accent/20 px-2 text-[11px] font-bold text-accent">
            <Waves className="size-3" aria-hidden /> +1 drank
          </button>
        </div>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Daily totals reflect only food and water you have recorded.</p>

      <div className="mt-3 rounded-xl border border-cyan-400/20 bg-background/70 p-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black">Ask Flex</h3>
          <div className="flex flex-wrap gap-1.5">
            <button data-testid="flex-sound-test" type="button" onClick={playMarcus}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/20 px-3 text-[12px] font-bold text-accent">
              <Volume2 className="size-4" aria-hidden /> Test Marcus
            </button>
            <button data-testid="flex-stop-marcus" type="button" onClick={() => {
              stopApprovedMarcus();
              setVoiceStatus("idle");
              setVoiceInfo("Marcus playback stopped.");
            }} className="min-h-11 rounded-lg border border-border bg-elevated px-3 text-[12px] font-bold">
              Stop audio
            </button>
          </div>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Voice: Marcus – Warm & Friendly, approved recordings only. New nutrition answers appear as text until his exact voice is available for dynamic speech.
        </p>
        {!marcusReady && ready && <p role="status" className="mt-1 text-xs text-amber-300">This browser cannot play Marcus recordings. Written answers remain available.</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {IDEAS.map((idea) => (
            <button key={idea} type="button" onClick={() => ask(idea)}
              className="min-h-9 rounded-full border border-border bg-elevated px-2.5 text-[11px] font-semibold">
              {idea}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(question); }} className="mt-2 flex gap-1.5">
          <input data-testid="flex-question" aria-label="Ask Flex a question" value={question} maxLength={600}
            onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about training or food…"
            className="min-w-0 flex-1 rounded-lg border border-input bg-elevated px-3 py-2 text-base" />
          <button type="submit" aria-label="Send question" className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Send className="size-5" aria-hidden />
          </button>
          {canListen && (
            <button data-testid="flex-voice-input" type="button" aria-label={vc.listening ? "Stop microphone" : "Start microphone"}
              aria-pressed={vc.listening}
              onClick={() => {
                if (vc.listening || wantMic.current) {
                  wantMic.current = false;
                  stopListening();
                  stopFlexSpeech();
                  stopApprovedMarcus();
                  setVoiceStatus("idle");
                  setVoiceInfo("Microphone off.");
                } else {
                  stopFlexSpeech();
                  stopApprovedMarcus();
                  wantMic.current = true;
                  if (!startListening()) {
                    wantMic.current = false;
                    setVoiceInfo("Microphone was blocked. You can still type questions.");
                  } else setVoiceInfo("Listening for your question.");
                }
              }}
              className="grid size-11 place-items-center rounded-lg border border-border bg-elevated">
              {vc.listening ? <Mic className="size-5 text-accent" /> : <MicOff className="size-5" />}
            </button>
          )}
        </form>
        {vc.listening && <p role="status" className="mt-1 text-xs text-accent">Listening for your question…</p>}
        {voiceInfo && <p data-testid="flex-audio-state" role="status" aria-live="polite"
          className={voiceStatus === "error" ? "mt-1 text-xs text-amber-300" : "mt-1 text-xs text-muted-foreground"}>
          {voiceInfo}
        </p>}
        {vc.heard && <p className="mt-1 text-xs text-muted-foreground">Heard: {vc.heard}</p>}
        {vc.error && <p role="alert" className="mt-1 text-xs text-destructive">{vc.error}</p>}
        {answer && (
          <div data-testid="flex-answer" aria-live="polite" className="mt-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-accent">
              FLEX · {answer.category === "nutrition" ? "Nutrition coach" : answer.category === "training" ? "Training coach" : answer.category === "safety" ? "Safety" : "Assistant"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">You: {lastQuestion}</p>
            <p className="mt-1 text-sm leading-relaxed">{answer.text}</p>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Marcus has not recorded this changing answer. No other voice will be substituted.
            </p>
          </div>
        )}
      </div>
      <details className="mt-2 rounded-xl border border-border bg-elevated/40 p-2.5">
        <summary className="cursor-pointer text-xs font-bold">Food preferences (used for meal ideas)</summary>
        <div className="mt-2 space-y-2">
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={prefs.avoidCheese} onChange={(e) => setPreference({ avoidCheese: e.target.checked })}
              className="size-5 accent-primary" /> Avoid all cheese
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm">
            <input type="checkbox" checked={prefs.preferLactoseFree} onChange={(e) => setPreference({ preferLactoseFree: e.target.checked })}
              className="size-5 accent-primary" /> Prefer lactose-free dairy options
          </label>
          <label className="flex items-center justify-between gap-2 text-sm">
            Preferred snack flavor
            <select aria-label="Preferred snack flavor" value={prefs.flavor}
              onChange={(e) => setPreference({ flavor: e.target.value as FlexFoodPreferences["flavor"] })}
              className="min-h-10 rounded-lg border border-border bg-background px-3">
              <option value="chocolate">Chocolate</option>
              <option value="strawberry">Strawberry</option>
              <option value="plain">Plain</option>
            </select>
          </label>
          <p className="text-[11px] text-muted-foreground">Preferences are saved in your existing M3 FLEX workout data and included in its backup/sync.</p>
        </div>
      </details>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span><Check className="mr-1 inline size-3 text-accent" aria-hidden /> Original Marcus recordings are preserved. No generic phone voice is used in Ask Flex.</span>
        {!compact && <a href="/playable/#review" className="shrink-0 font-bold text-accent">Review videos <ArrowRight className="inline size-3" /></a>}
      </div>
    </section>
  );
}
