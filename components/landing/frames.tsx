import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

/**
 * Screenshot placeholder slots for the landing page.
 * Every slot is labelled "Replace with: ..." so real captures can be dropped
 * in later without hunting through markup.
 */

const PlaceholderSlot = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div
    className={cn(
      "relative flex items-center justify-center overflow-hidden bg-secondary/50",
      className,
    )}
  >
    <div
      aria-hidden
      className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_14px,oklch(100%_0_0/0.025)_14px,oklch(100%_0_0/0.025)_28px)]"
    />
    <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
      <ImageIcon className="size-6 text-muted-foreground/70" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-xs text-muted-foreground/60">Screenshot placeholder</p>
    </div>
  </div>
);

/** Desktop app window with browser chrome. */
export const BrowserFrame = ({
  label,
  url = "trakka.co/dashboard",
  className,
  slotClassName,
}: {
  label: string;
  url?: string;
  className?: string;
  slotClassName?: string;
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-xl border border-border bg-card shadow-(--shadow-elegant)",
      className,
    )}
  >
    <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
      <div className="flex gap-1.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
        <span className="size-2.5 rounded-full bg-muted-foreground/25" />
      </div>
      <div className="flex h-6 max-w-60 flex-1 items-center rounded-md bg-secondary px-3 font-mono text-xs text-muted-foreground">
        {url}
      </div>
    </div>
    <PlaceholderSlot
      label={label}
      className={cn("aspect-16/10", slotClassName)}
    />
  </div>
);

/** Phone shell for the at-the-table mobile flow. */
export const PhoneFrame = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-[2.2rem] border-2 border-border bg-card p-2 shadow-(--shadow-elegant)",
      className,
    )}
  >
    <div className="overflow-hidden rounded-[1.6rem] border border-border/60">
      <div
        className="flex justify-center bg-secondary/50 pt-2.5 pb-1"
        aria-hidden
      >
        <span className="h-1.5 w-14 rounded-full bg-muted-foreground/25" />
      </div>
      <PlaceholderSlot label={label} className="aspect-9/16" />
    </div>
  </div>
);

/** Bare panel, used for carousel slides. */
export const PanelFrame = ({
  label,
  className,
}: {
  label: string;
  className?: string;
}) => (
  <div
    className={cn(
      "overflow-hidden rounded-xl border border-border bg-card",
      className,
    )}
  >
    <PlaceholderSlot label={label} className="h-full w-full" />
  </div>
);
