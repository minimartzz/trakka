"use client";

import React from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";

// Pieces shared by the tabs of the detailed stats card.

export type SessionType = "all" | "competitive" | "cooperative" | "solo";
export type SessionResult = "all" | "win" | "loss" | "tied";

// Same derivation as GameSessionCard: a single player is solo regardless of
// the coop flag, otherwise coop decides.
export const sessionType = (
  s: GroupedSession,
): Exclude<SessionType, "all"> =>
  s.numPlayers === 1 ? "solo" : s.coop ? "cooperative" : "competitive";

// Tie takes precedence so the filter matches what the outcome circle shows
export const sessionResult = (
  s: GroupedSession,
): Exclude<SessionResult, "all"> =>
  s.isTied ? "tied" : s.isWinner ? "win" : "loss";

// Sessions ordered oldest to newest, for streaks and "first play" lookups
export const chronological = (sessions: GroupedSession[]) =>
  [...sessions].sort(
    (a, b) =>
      a.datePlayed.localeCompare(b.datePlayed) ||
      a.createdAt.getTime() - b.createdAt.getTime(),
  );

// Win rate chips share the W/T/L outcome tones used across the dashboard
export const winRateClass = (rate: number) =>
  rate >= 60
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : rate >= 40
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-destructive/15 text-destructive";

export const GameThumb: React.FC<{
  image: string | null;
  title: string;
  className?: string;
}> = ({ image, title, className }) => (
  <div
    className={cn(
      "relative shrink-0 overflow-hidden rounded-md bg-muted",
      className,
    )}
  >
    {image ? (
      <Image
        src={image}
        alt={title}
        fill
        sizes="48px"
        className="object-cover"
      />
    ) : (
      <div className="flex size-full items-center justify-center">
        <Dices className="size-4 text-muted-foreground opacity-50" />
      </div>
    )}
  </div>
);

export const HeaderIcon: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex text-muted-foreground" aria-label={label}>
        {children}
      </span>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

export const OutcomeCircle: React.FC<{
  session: GroupedSession;
  className?: string;
}> = ({ session, className }) => {
  if (!session.isPlayer) {
    return <span className="text-muted-foreground">—</span>;
  }

  const result = sessionResult(session);
  const [letter, tone] =
    result === "tied"
      ? ["T", "bg-amber-500/15 text-amber-600 dark:text-amber-400"]
      : result === "win"
        ? ["W", "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"]
        : ["L", "bg-destructive/15 text-destructive"];

  return (
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
        tone,
        className,
      )}
    >
      {letter}
    </span>
  );
};

// Pager shared by the paged tabs
export const Pager: React.FC<{
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}> = ({ page, pageCount, onChange }) => (
  <div className="mt-4 flex items-center justify-between">
    <Button
      variant="secondary"
      size="icon"
      onClick={() => onChange(page - 1)}
      disabled={page <= 1}
      aria-label="Previous page"
    >
      <ChevronLeft className="size-4" />
    </Button>
    <Button
      variant="secondary"
      size="icon"
      onClick={() => onChange(page + 1)}
      disabled={page >= pageCount}
      aria-label="Next page"
    >
      <ChevronRight className="size-4" />
    </Button>
  </div>
);
