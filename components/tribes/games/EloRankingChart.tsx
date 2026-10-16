"use client";

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Gauge } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { eloTier } from "@/utils/elo";
import { CalibratingMark, ELO_TIER_CLASS } from "@/components/GameSessionCard";
import { collapseEloRanking, type EloRankRow } from "./utils";

// Picks a tick step that gives at most 5 intervals
const TICK_STEPS = [50, 100, 200, 250, 500, 1000];

const axisFor = (maxElo: number) => {
  const step =
    TICK_STEPS.find((s) => maxElo / s <= 5) ??
    TICK_STEPS[TICK_STEPS.length - 1];
  const max = Math.max(step, Math.ceil(maxElo / step) * step);
  const ticks = Array.from({ length: max / step + 1 }, (_, i) => i * step);
  return { max, ticks };
};

const TRANSITION = { duration: 0.5, ease: "easeOut" } as const;

// The plot column of one row: the 0..max scale with its gridlines. The right
// margin leaves room for the avatar and value past the longest line.
const PlotCell: React.FC<{
  ticks: number[];
  max: number;
  className?: string;
  children?: React.ReactNode;
}> = ({ ticks, max, className, children }) => (
  <div className={cn("relative ml-4 mr-14", className)}>
    {ticks.map((t) => (
      <span
        key={t}
        aria-hidden
        className="absolute inset-y-0 w-px bg-border"
        style={{ left: `${(t / max) * 100}%` }}
      />
    ))}
    {children}
  </div>
);

// Rows share the chart's columns, so every line starts at the same x while the
// name column is only as wide as the longest name (up to 8rem)
const CHART_GRID = "grid grid-cols-[fit-content(8rem)_1fr]";
const ROW_GRID = "col-span-2 grid grid-cols-subgrid items-center";

const RankRow: React.FC<{
  row: EloRankRow;
  total: number;
  max: number;
  ticks: number[];
  isCurrentUser: boolean;
  showRank: boolean;
}> = ({ row, total, max, ticks, isCurrentUser, showRank }) => {
  const pct = `${(row.elo / max) * 100}%`;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          tabIndex={0}
          className={cn(
            ROW_GRID,
            "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
            isCurrentUser && "bg-primary/5",
          )}
        >
          <span
            className={cn(
              "min-w-0 truncate pr-2 text-right text-sm",
              isCurrentUser
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            {showRank && (
              <span className="mr-1 text-xs text-muted-foreground">
                #{row.rank}
              </span>
            )}
            {row.firstName}
          </span>
          <PlotCell ticks={ticks} max={max} className="h-10">
            {/* Line from 0 to their Elo, in their tier colour */}
            <motion.div
              className={cn(
                "absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-r-full",
                ELO_TIER_CLASS[eloTier(row.elo)],
              )}
              initial={{ width: 0 }}
              animate={{ width: pct }}
              transition={TRANSITION}
            />
            {/* Avatar on the end of the line, then the Elo */}
            <motion.div
              className="absolute inset-y-0 flex items-center"
              initial={{ left: "0%" }}
              animate={{ left: pct }}
              transition={TRANSITION}
            >
              <Avatar
                className={cn(
                  "-ml-3.5 size-7 ring-2",
                  isCurrentUser ? "ring-primary" : "ring-card",
                )}
              >
                <AvatarImage
                  src={row.image || ""}
                  alt={row.firstName}
                  className="object-cover"
                />
                <AvatarFallback className="text-[10px] font-bold">
                  {row.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="ml-1.5 text-xs font-semibold tabular-nums text-foreground">
                {row.elo}
                {row.calibrating && <CalibratingMark />}
              </span>
            </motion.div>
          </PlotCell>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-semibold tabular-nums">
          {row.elo} Elo{row.calibrating && " · Calibrating"}
        </p>
        <p className="opacity-80">
          {row.firstName} {row.lastName} · #{row.rank} of {total} ·{" "}
          {row.sessionsPlayed} rated{" "}
          {row.sessionsPlayed === 1 ? "session" : "sessions"}
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * EloRankingChart - the tribe's members ranked by their Elo in one game.
 *
 * Collapsed, it shows the top 4, plus the current user after a gap when they
 * rank lower; "View All" shows everyone.
 */
export function EloRankingChart({
  rows,
  currentUserId,
}: {
  rows: EloRankRow[];
  currentUserId?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  // From every row, so expanding doesn't rescale the lines
  const { max, ticks } = useMemo(
    () => axisFor(Math.max(0, ...rows.map((r) => r.elo))),
    [rows],
  );
  const collapsed = useMemo(
    () => collapseEloRanking(rows, currentUserId),
    [rows, currentUserId],
  );
  const visible = expanded ? rows : collapsed;
  const canExpand = rows.length > collapsed.filter(Boolean).length;

  return (
    <div>
      {/* Header outside the card, like "Scores vs Tribe" and "Aggregates" */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Gauge className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            ELO Ranking
          </span>
        </div>
        {canExpand && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "Show less" : "View All"}
          </Button>
        )}
      </div>

      <Card className="gap-0 py-0">
        <CardContent className="p-3 sm:p-4">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nobody has an Elo in this game yet
            </p>
          ) : (
            <div className={CHART_GRID}>
              {visible.map((row, i) =>
                row === null ? (
                  <div key="gap" className={ROW_GRID}>
                    <span className="pr-2 text-right text-sm leading-none text-muted-foreground">
                      …
                    </span>
                    <PlotCell ticks={ticks} max={max} className="h-5" />
                  </div>
                ) : (
                  <RankRow
                    key={row.profileId}
                    row={row}
                    total={rows.length}
                    max={max}
                    ticks={ticks}
                    isCurrentUser={row.profileId === currentUserId}
                    // The current user's row after the gap carries their rank
                    showRank={visible[i - 1] === null}
                  />
                ),
              )}

              {/* Elo axis */}
              <div className={ROW_GRID}>
                <span />
                <PlotCell ticks={[]} max={max} className="h-5">
                  {ticks.map((t) => (
                    <span
                      key={t}
                      className="absolute top-1 -translate-x-1/2 text-[10px] tabular-nums text-muted-foreground"
                      style={{ left: `${(t / max) * 100}%` }}
                    >
                      {t}
                    </span>
                  ))}
                </PlotCell>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
