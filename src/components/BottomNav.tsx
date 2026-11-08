import { Link } from "@tanstack/react-router";
import { CalendarDays, Dumbbell, LineChart } from "lucide-react";

const items = [
  { to: "/", label: "Today", icon: Dumbbell },
  { to: "/program", label: "Programs", icon: CalendarDays },
  { to: "/progress", label: "Progress", icon: LineChart },
] as const;

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-lg">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="tap-target flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wide"
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}