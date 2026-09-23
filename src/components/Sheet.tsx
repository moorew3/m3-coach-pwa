import { X } from "lucide-react";

/** Slide-up sheet used for every workout control panel. */
export function SheetPanel({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-4 backdrop-blur"
    >
      <div className="surface-card max-h-[88vh] w-full max-w-lg overflow-auto rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-elevated"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4 space-y-2">{children}</div>
      </div>
    </div>
  );
}

export function SheetButton({
  children,
  onClick,
  primary,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-target w-full rounded-xl px-4 text-left text-sm font-bold uppercase ${
        primary
          ? "bg-primary text-primary-foreground"
          : danger
            ? "border border-destructive/50 bg-destructive/10 text-destructive"
            : "bg-elevated"
      }`}
    >
      {children}
    </button>
  );
}