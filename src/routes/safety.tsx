import { createFileRoute } from "@tanstack/react-router";
import { AVOID_LIST, STOP_SIGNS } from "@/data/program";
import { AlertTriangle, Ban, PhoneCall } from "lucide-react";

export const Route = createFileRoute("/safety")({
  head: () => ({
    meta: [
      { title: "Safety — 22-Day Arm Growth Tracker" },
      {
        name: "description",
        content:
          "Exercises to avoid, stop signs during training, and joint-friendly training rules.",
      },
      { property: "og:title", content: "Safety — 22-Day Arm Growth Tracker" },
      { property: "og:description", content: "Train hard without wrecking your joints or back." },
    ],
  }),
  component: Safety,
});

function Safety() {
  return (
    <main className="px-4 pt-6">
      <h1 className="text-3xl font-bold">Safety</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        These rules come first. Progress is worthless if you get hurt.
      </p>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold uppercase text-destructive">
          <Ban className="size-5" /> Never do these
        </h2>
        <ul className="mt-3 space-y-3">
          {AVOID_LIST.map((a) => (
            <li key={a.item} className="rounded-xl bg-elevated p-3">
              <p className="font-bold">{a.item}</p>
              <p className="text-sm text-muted-foreground">{a.why}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold uppercase text-primary">
          <AlertTriangle className="size-5" /> Stop immediately if
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {STOP_SIGNS.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-primary">•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface-card mt-5 rounded-2xl p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold uppercase text-accent">
          <PhoneCall className="size-5" /> After you stop
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>End the session — do not "push through" nerve or joint symptoms.</li>
          <li>Use the Replace Exercise button next session to swap to a pain-free option.</li>
          <li>If symptoms last more than a couple of days, get it checked by a professional.</li>
        </ul>
      </section>
    </main>
  );
}