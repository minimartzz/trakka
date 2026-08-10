"use client";

import MeepleIcon from "@/components/icons/MeepleIcon";
import type { FlowState } from "@/components/onboarding/steps";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

interface PlayerCardProps {
  state: FlowState;
  /** Signature moment only: the completion screen. */
  glow?: boolean;
  className?: string;
}

const SlotLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
    {children}
  </span>
);

const EmptySlot = ({ count = 2 }: { count?: number }) => (
  <div className="flex gap-1.5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="size-7 rounded-md border border-dashed border-border"
      />
    ))}
  </div>
);

/**
 * User's profile card - Updated as they step through the onboarding flow
 */
export const PlayerCard = ({ state, glow, className }: PlayerCardProps) => {
  const reduceMotion = useReducedMotion();
  const { profile, tribes, favouriteGames, claimedCount } = state;
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    "Your name";

  const slotMotion = reduceMotion
    ? {}
    : {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.16, ease: [0.165, 0.84, 0.44, 1] as const },
      };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-card",
        glow && "shadow-[0_0_40px_oklch(41.12%_0.1454_262.39/0.2)]",
        className,
      )}
    >
      <div className="h-1.5 bg-primary" />

      <div className="flex flex-col items-center gap-1 px-5 pt-5 pb-4">
        <div className="relative size-20 overflow-hidden rounded-full border bg-muted">
          <AnimatePresence mode="wait">
            {profile.image ? (
              <motion.div
                key={profile.image}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
                className="absolute inset-0"
              >
                <Image
                  src={profile.image}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div
                key="placeholder"
                className="absolute inset-0 flex items-center justify-center"
              >
                <MeepleIcon className="size-8 text-muted-foreground/50" />
              </div>
            )}
          </AnimatePresence>
        </div>
        <p
          className={cn(
            "mt-2 font-heading text-lg leading-tight font-semibold",
            !profile.firstName && "text-muted-foreground/50",
          )}
        >
          {displayName}
        </p>
        <p className="text-sm text-muted-foreground">
          {profile.username ? `@${profile.username}` : "@username"}
        </p>
      </div>

      <dl className="flex flex-col gap-3 border-t px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <dt>
            <SlotLabel>Regulars</SlotLabel>
          </dt>
          <dd className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/70">soon</span>
            <EmptySlot />
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt>
            <SlotLabel>Tribes</SlotLabel>
          </dt>
          <dd>
            {tribes.length === 0 ? (
              <EmptySlot />
            ) : (
              <div className="flex flex-wrap justify-end gap-1.5">
                {tribes.map((tribe) => (
                  <motion.div
                    key={tribe.id}
                    {...slotMotion}
                    className="relative size-7 overflow-hidden rounded-md border bg-muted"
                    title={tribe.name}
                  >
                    <Image
                      src={tribe.image}
                      alt={tribe.name}
                      fill
                      sizes="28px"
                      className="object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt>
            <SlotLabel>Claimed</SlotLabel>
          </dt>
          <dd className="text-sm tabular-nums">
            {claimedCount > 0 ? (
              <motion.span {...slotMotion} className="font-medium">
                {claimedCount} {claimedCount === 1 ? "player" : "players"}
              </motion.span>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt>
            <SlotLabel>Games</SlotLabel>
          </dt>
          <dd>
            {favouriteGames.length === 0 ? (
              <EmptySlot count={3} />
            ) : (
              <div className="flex flex-wrap justify-end gap-1.5">
                {favouriteGames.map((game) => (
                  <motion.div
                    key={game.bggId}
                    {...slotMotion}
                    className="relative size-7 overflow-hidden rounded-md border bg-muted"
                    title={game.title}
                  >
                    {game.image && (
                      <Image
                        src={game.image}
                        alt={game.title}
                        fill
                        sizes="28px"
                        className="object-cover"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt>
            <SlotLabel>Linked</SlotLabel>
          </dt>
          <dd className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground/70">soon</span>
            <EmptySlot />
          </dd>
        </div>
      </dl>
    </div>
  );
};

/**
 * Mobile stand-in for the card: one line that never eats the fold, opening the
 * full card in a sheet on tap.
 */
export const PlayerCardSummary = ({ state }: { state: FlowState }) => {
  const [open, setOpen] = useState(false);
  const { profile, tribes, favouriteGames } = state;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg border bg-card px-3 py-2 text-left"
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-full border bg-muted">
            {profile.image ? (
              <Image
                src={profile.image}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            ) : (
              <MeepleIcon className="absolute inset-0 m-auto size-4 text-muted-foreground/50" />
            )}
          </div>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {profile.username ? `@${profile.username}` : "Your player card"}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {tribes.length} tribes · {favouriteGames.length} games
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="pb-8">
        <SheetHeader>
          <SheetTitle>Your player card</SheetTitle>
          <SheetDescription>
            This fills in as you work through the steps.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <PlayerCard state={state} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
