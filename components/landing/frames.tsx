import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import Image from "next/image";

/**
 * Screenshot slots for the landing page.
 *
 * Each frame can either show a placeholder (when no `images` are provided) or
 * crossfade through a list of screenshots driven by an external `activeIndex`,
 * so the BrowserFrame and PhoneFrame can advance their image pairs in sync.
 */

/**
 * A single slot that crossfades through `images` at `activeIndex`. Falls back to
 * a labelled placeholder when no images are supplied.
 */
const CarouselSlot = ({
  label,
  images,
  activeIndex = 0,
  alt,
  sizes,
  className,
}: {
  label: string;
  images?: string[];
  activeIndex?: number;
  alt: string;
  sizes?: string;
  className?: string;
}) => {
  const hasImages = images && images.length > 0;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-secondary/50",
        className,
      )}
    >
      {hasImages ? (
        images.map((src, i) => (
          <Image
            key={src + i}
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={i === 0}
            className={cn(
              "object-cover transition-opacity duration-1500 ease-in-out",
              i === activeIndex % images.length ? "opacity-100" : "opacity-0",
            )}
          />
        ))
      ) : (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(135deg,transparent_0,transparent_14px,oklch(100%_0_0/0.025)_14px,oklch(100%_0_0/0.025)_28px)]"
          />
          <div className="relative z-10 flex flex-col items-center gap-2 px-6 text-center">
            <ImageIcon
              className="size-6 text-muted-foreground/70"
              aria-hidden
            />
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/60">
              Screenshot placeholder
            </p>
          </div>
        </>
      )}
    </div>
  );
};

/** Desktop app window with browser chrome. */
export const BrowserFrame = ({
  label,
  url = "trakka.co",
  className,
  slotClassName,
  images,
  activeIndex,
}: {
  label: string;
  url?: string;
  className?: string;
  slotClassName?: string;
  /** Optional set of screenshots to crossfade through. */
  images?: string[];
  /** Externally-driven index so it stays in sync with the phone frame. */
  activeIndex?: number;
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
    <CarouselSlot
      label={label}
      images={images}
      activeIndex={activeIndex}
      alt="Trakka dashboard screenshot"
      sizes="(max-width: 768px) 90vw, 800px"
      className={cn("aspect-16/10", slotClassName)}
    />
  </div>
);

/** Phone shell for the at-the-table mobile flow. */
export const PhoneFrame = ({
  label,
  className,
  images,
  activeIndex,
}: {
  label: string;
  className?: string;
  /** Optional set of screenshots to crossfade through. */
  images?: string[];
  /** Externally-driven index so it stays in sync with the browser frame. */
  activeIndex?: number;
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
      <CarouselSlot
        label={label}
        images={images}
        activeIndex={activeIndex}
        alt="Trakka mobile screenshot"
        sizes="(max-width: 768px) 90vw, 300px"
        className="aspect-9/16"
      />
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
    <CarouselSlot label={label} alt={label} className="h-full w-full" />
  </div>
);
