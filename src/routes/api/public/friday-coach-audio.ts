import { createFileRoute } from "@tanstack/react-router";

const ENV_BY_KEY: Record<string, string> = {
  easyWalk: "M3_FRIDAY_VOICE_EASYWALK",
  lowerBodyMobility: "M3_FRIDAY_VOICE_LOWERBODYMOBILITY",
  gluteBridge: "M3_FRIDAY_VOICE_GLUTEBRIDGE",
  squat: "M3_FRIDAY_VOICE_SQUAT",
  romanianDeadlift: "M3_FRIDAY_VOICE_ROMANIANDEADLIFT",
  trapBarDeadlift: "M3_FRIDAY_VOICE_TRAPBARDEADLIFT",
  legPress: "M3_FRIDAY_VOICE_LEGPRESS",
  bulgarianSplitSquat: "M3_FRIDAY_VOICE_BULGARIANSPLITSQUAT",
  hamstringCurl: "M3_FRIDAY_VOICE_HAMSTRINGCURL",
  chestPress: "M3_FRIDAY_VOICE_CHESTPRESS",
  seatedRow: "M3_FRIDAY_VOICE_SEATEDROW",
  lateralRaise: "M3_FRIDAY_VOICE_LATERALRAISE",
  dumbbellCurl: "M3_FRIDAY_VOICE_DUMBBELLCURL",
  tricepsPressdown: "M3_FRIDAY_VOICE_TRICEPSPRESSDOWN",
  suitcaseCarry: "M3_FRIDAY_VOICE_SUITCASECARRY",
};

export const Route = createFileRoute("/api/public/friday-coach-audio")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key") ?? "";
        const envName = ENV_BY_KEY[key];
        if (!envName) {
          return new Response("Unknown Friday coach cue.", { status: 404 });
        }

        const source = process.env[envName];
        if (!source) {
          return new Response("Friday coach cue is not configured.", { status: 503 });
        }

        const upstream = await fetch(source);
        if (!upstream.ok || !upstream.body) {
          return new Response("Friday coach cue is temporarily unavailable.", {
            status: 502,
          });
        }

        return new Response(upstream.body, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "private, max-age=3600",
            "X-M3-Coach-Voice": "premium-friday-male",
          },
        });
      },
    },
  },
});
