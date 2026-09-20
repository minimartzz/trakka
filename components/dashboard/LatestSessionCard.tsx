"use client";

import React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { format } from "date-fns";
import { CalendarDays, Dices } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";

interface LatestSessionCardProps {
  userId: number;
  session?: GroupedSession;
  delay?: number;
}

const StatChip: React.FC<{
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}> = ({ label, value, className, valueClassName }) => (
  <div
    className={cn(
      "flex w-16 shrink-0 flex-col items-center overflow-hidden rounded-lg sm:w-20",
      className,
    )}
  >
    <p
      className={cn(
        "w-full border-b border-current/15 px-2 py-1 text-center text-[10px] font-bold uppercase leading-none tracking-wide sm:py-1.5 sm:text-[11px]",
        valueClassName,
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        "w-full px-2 py-1.5 text-center font-display text-xl font-bold leading-none sm:py-2 sm:text-2xl",
        valueClassName,
      )}
    >
      {value}
    </p>
  </div>
);

/**
 * LatestSessionCard - Snapshot of the user's most recent game.
 *
 * Sits beside the profile card, so it stays horizontal: image on the left,
 * details and per-player avatars filling the remaining width.
 */
const LatestSessionCard: React.FC<LatestSessionCardProps> = ({
  userId,
  session,
  delay = 0,
}) => {
  const me = session?.players.find((p) => p.profileId === userId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full gap-0 py-0">
        <CardContent className="flex h-full flex-col p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold">Latest Session</h2>

          {!session ? (
            <div className="flex flex-1 min-h-40 flex-col items-center justify-center text-muted-foreground">
              <Dices className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">No sessions recorded yet</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4 sm:flex-row">
              {/* ── Game image ─────────────────────────────────────────── */}
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:aspect-square sm:h-auto sm:w-auto">
                {session.gameImage ? (
                  <Image
                    src={session.gameImage}
                    alt={session.gameTitle}
                    fill
                    sizes="(max-width: 640px) 100vw, 144px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Dices className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                )}
              </div>

              {/* ── Details ────────────────────────────────────────────── */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="truncate text-lg font-semibold"
                      title={session.gameTitle}
                    >
                      {session.gameTitle}
                    </h3>
                    {me && (
                      <Badge
                        className={cn(
                          "shrink-0",
                          session.isWinner
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400"
                            : "border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        )}
                      >
                        {session.isWinner ? "Winner" : "Played"}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(session.datePlayed), "d MMM yyyy")}
                    <span className="text-muted-foreground/60">·</span>
                    <span className="truncate">{session.tribe}</span>
                  </p>
                </div>

                {/* ── Players + Stats ───────────────────────────────────── */}
                <div className="flex flex-row items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Players
                    </p>
                    <div className="flex min-w-0 flex-wrap items-center -space-x-3 sm:space-x-0 sm:gap-2">
                      {session.players.map((p, index) => {
                        const isCurrentUser = p.profileId === userId;
                        return (
                          <Tooltip key={p.profileId}>
                            <TooltipTrigger asChild>
                              <div
                                className="relative shrink-0"
                                style={{ zIndex: session.players.length - index }}
                              >
                                <Avatar
                                  className={cn(
                                    "h-9 w-9 ring-2 transition-opacity sm:h-11 sm:w-11",
                                    isCurrentUser
                                      ? "ring-primary"
                                      : "opacity-60 ring-background",
                                  )}
                                >
                                  <AvatarImage
                                    src={p.profilePic}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-muted text-[10px]">
                                    {p.firstName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                {p.isWinner && (
                                  <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 select-none text-[10px] leading-none">
                                    👑
                                  </span>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isCurrentUser ? "You" : p.firstName}
                              {p.isWinner && " 👑"}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>

                  {me && (
                    <div className="shrink-0">
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Stats
                      </p>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <StatChip
                          label="Position"
                          value={
                            me.position
                              ? positionOrdinalSuffix(me.position)
                              : "—"
                          }
                          className="bg-accent-3/15"
                          valueClassName="text-accent-3"
                        />
                        <StatChip
                          label="VP"
                          value={
                            session.isVp && me.victoryPoints !== null
                              ? String(me.victoryPoints)
                              : "—"
                          }
                          className="bg-accent-5/15"
                          valueClassName="text-accent-5"
                        />
                        <StatChip
                          label="WPA"
                          value={
                            me.score !== null && me.score !== undefined
                              ? me.score.toFixed(2)
                              : "—"
                          }
                          className="bg-accent-4/15"
                          valueClassName="text-accent-4"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LatestSessionCard;
