import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowUpRight, Info, MonitorPlay } from "lucide-react";
import {
  readLastRecoverySession, readRecoveryProgress, recoveryTitle,
  safeLocalRecoveryStorage, type RecoveryProgram,
  type RecoveryProgress, type RecoverySessionReceipt,
} from "@/lib/recovery-progress";

export const Route = createFileRoute("/recovery")({
  validateSearch: (search: Record<string, unknown>) => ({
    program: search.program === "A" || search.program === "B" ? search.program : "recovery" as RecoveryProgram,
  }),
  head: () => ({
    meta: [
      { title: "Recovery Coach · M3 FLEX" },
      { name: "description", content: "Original M3 FLEX app with the same approved Flex and Marcus recovery exercise player, workout history and safety checks." },
    ],
  }),
  component: UnifiedRecovery,
});

function UnifiedRecovery() {
  const { program } = Route.useSearch();
  const iframe = useRef<HTMLIFrameElement>(null);
  const [progress, setProgress] = useState<RecoveryProgress | null>(null);
  const [lastSession, setLastSession] = useState<RecoverySessionReceipt | null>(null);
  const refresh = useCallback(() => {
    const storage = safeLocalRecoveryStorage();
    setProgress(readRecoveryProgress(storage));
    setLastSession(readLastRecoverySession(storage));
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith("m3-flex-recovery-") || event.key === null) refresh();
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframe.current?.contentWindow) return;
      if (event.data?.type === "m3-flex-recovery-progress-updated") refresh();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("message", onMessage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);

  const active = progress?.program ?? program;
  return (
    <main data-testid="m3-native-recovery" className="px-3 pt-4 pb-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">M3 FLEX · Your existing app</p>
          <h1 className="mt-1 text-2xl font-black">Recovery Coach</h1>
          <p className="text-sm text-muted-foreground">Approved Flex motion and Marcus audio, inside your original workout app.</p>
        </div>
        <Link to="/" className="tap-target rounded-xl border border-border px-3 text-xs font-bold">Home</Link>
      </header>

      <nav aria-label="M3 FLEX seated workout selection" className="mt-4 grid grid-cols-3 gap-2">
        {([
          { id: "recovery", label: "Recovery" },
          { id: "A", label: "Workout A" },
          { id: "B", label: "Workout B" },
        ] as const).map(({ id, label }) => (
          <Link
            key={id}
            to="/recovery"
            search={{ program: id }}
            className={`tap-target flex min-h-12 items-center justify-center rounded-xl border px-2 text-center text-xs font-bold ${program === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            aria-current={program === id ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      <section data-testid="m3-recovery-sync" aria-live="polite" className="mt-3 rounded-xl border border-border bg-card p-3">
        <div className="flex items-start gap-2">
          <Activity className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            {progress ? (
              <>
                <p className="text-sm font-bold">Saved in this app: {recoveryTitle(active)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {progress.completedSteps} timed stages recorded · Set {progress.workRound} of {progress.targetRounds} · {progress.mode === "running" || progress.mode === "rest" ? "Resume after confirmation" : "Paused/ready to continue"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">This measures demonstration timing, not your actual repetitions or medical clearance.</p>
              </>
            ) : lastSession ? (
              <>
                <p className="text-sm font-bold">Last completed guided session: {recoveryTitle(lastSession.program)}</p>
                <p className="text-xs text-muted-foreground">{lastSession.demonstratedSteps} timed demonstrations · {new Date(lastSession.finishedAt).toLocaleDateString()} · Reps not verified</p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold">Your Recovery Coach is ready</p>
                <p className="text-xs text-muted-foreground">Its progress stays in this browser alongside your existing app. Existing workout logs are not overwritten.</p>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground"><Info className="size-4" /> A/B use approved scenes; missing footage remains review-only.</span>
        <a
          href={`/recovery-coach/?program=${program}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 font-bold text-primary"
        >
          <MonitorPlay className="size-4" /> Open full-screen <ArrowUpRight className="size-3" />
        </a>
      </div>

      <iframe
        key={program}
        ref={iframe}
        title={`M3 FLEX · ${recoveryTitle(program)}`}
        data-testid="m3-recovery-existing-player"
        src={`/recovery-coach/?program=${program}`}
        onLoad={refresh}
        allow="camera; fullscreen"
        allowFullScreen
        className="mt-2 block h-[max(590px,calc(100dvh-290px))] w-full rounded-xl border border-border bg-[#0b1521]"
      />
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Same original media player and local progress · no separate account, subscription or duplicate workout app.
      </p>
    </main>
  );
}
