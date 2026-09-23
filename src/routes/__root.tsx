import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BottomNav } from "../components/BottomNav";
import { AppEntryGate } from "../components/AppEntryIntro";
import { useApp } from "../lib/store";
import { clearStaleChunkFlag, isStaleChunkError, recoverFromStaleChunk } from "../lib/stale-chunk";
import { cleanupLegacyServiceWorkers } from "../lib/sw-cleanup";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const stale = isStaleChunkError(error);
  useEffect(() => {
    if (recoverFromStaleChunk(error)) return;
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          {stale ? "A new version is available" : "This page didn't load"}
        </h1>
        {stale && (
          <p className="mt-2 text-sm text-muted-foreground">
            Reload to get the latest version. Your saved workouts are untouched.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              if (stale) {
                window.location.reload();
                return;
              }
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            {stale ? "Reload" : "Try again"}
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1c1d20" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Arm Tracker" },
      { title: "22-Day Arm Growth Tracker" },
      {
        name: "description",
        content:
          "A 22-day guided arm growth program with offline exercise diagrams, set tracking and rest timers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.svg" },
      { rel: "icon", href: "/icon-192.svg", type: "image/svg+xml" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter+Tight:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ThemeSync() {
  const { settings } = useApp();
  useEffect(() => {
    const el = document.documentElement;
    const resolved =
      settings.theme === "system"
        ? window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark"
        : settings.theme;
    el.dataset.theme = resolved;
    el.classList.toggle("dark", resolved === "dark");
    el.dataset.accent = settings.accent;
    el.dataset.surface = settings.surface;
    el.dataset.contrast = settings.contrast;
  }, [settings.accent, settings.surface, settings.contrast, settings.theme]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { pathname } = useLocation();
  // Display Mode is a big-screen surface: no phone chrome, no width cap.
  const displayMode =
    pathname.startsWith("/display") ||
    pathname.startsWith("/glasses") ||
    pathname.startsWith("/presentation");
  // The coached session keeps the bottom nav but goes full width on desktop.
  const wide = pathname.startsWith("/coach");

  // App rendered fine — allow a future stale-chunk auto-reload.
  useEffect(() => {
    clearStaleChunkFlag();
    // Remove any leftover service worker from an older build so installed
    // Android PWAs always launch the newest published app shell.
    void cleanupLegacyServiceWorkers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeSync />
      <AppEntryGate>
        <div
          className={
            displayMode
              ? "min-h-screen w-full"
              : wide
                ? "mx-auto min-h-screen w-full max-w-lg pb-28 lg:max-w-none"
                : "mx-auto min-h-screen w-full max-w-lg pb-28"
          }
        >
          {/* Required: nested routes render here. */}
          <Outlet />
        </div>
        {!displayMode && <BottomNav />}
      </AppEntryGate>
    </QueryClientProvider>
  );
}