"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { format, isWithinInterval, startOfDay, subDays } from "date-fns";
import { BarChart3, CalendarDays, Dices, Download, Table2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import DotsIcon from "@/components/icons/DotsIcon";

interface RecentSessionHistoryProps {
  userId: number;
  /** All of the user's sessions; the graph windows these to 30 days itself */
  recentActivity: GroupedSession[];
}

/** Fixed window — deliberately independent of the dashboard timeframe filter */
const WINDOW_DAYS = 30;

/** Avatars shown before collapsing the rest into a "+N" chip */
const MAX_AVATARS = 6;

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const diffDays = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const toCsv = (userId: number, sessions: GroupedSession[]): string => {
  const header = [
    "Date",
    "Game",
    "Tribe",
    "Players",
    "Position",
    "Result",
    "WPA",
  ];

  const rows = sessions.map((s) => {
    const me = s.players.find((p) => p.profileId === userId);
    return [
      s.datePlayed,
      s.gameTitle,
      s.tribe,
      String(s.players.length),
      me?.position ? positionOrdinalSuffix(me.position) : "",
      s.isWinner ? "Win" : s.isLoser ? "Loss" : s.isTied ? "Tie" : "",
      me?.score !== null && me?.score !== undefined ? me.score.toFixed(2) : "",
    ];
  });

  // Quote every field so titles containing commas survive the round trip
  return [header, ...rows]
    .map((row) => row.map((f) => `"${f.replace(/"/g, '""')}"`).join(","))
    .join("\n");
};

// ─── Session details panel ────────────────────────────────────────────────────

const SessionDetails: React.FC<{
  userId: number;
  session?: GroupedSession;
}> = ({ userId, session }) => {
  if (!session) {
    return (
      <div className="flex h-full min-h-50 flex-col items-center justify-center px-4 text-center text-muted-foreground">
        <Dices className="mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">Select a session to see its details</p>
      </div>
    );
  }

  const me = session.players.find((p) => p.profileId === userId);

  // Finishing order; players without a position sink to the bottom
  const ordered = [...session.players].sort(
    (a, b) => (a.position || Infinity) - (b.position || Infinity),
  );
  const shown = ordered.slice(0, MAX_AVATARS);
  const overflow = ordered.length - shown.length;

  return (
    <div className="flex h-full flex-col">
      {/* Game image + title, with the result pills on the right */}
      <div className="flex flex-1 items-center gap-3">
        <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
          {session.gameImage ? (
            <Image
              src={session.gameImage}
              alt={session.gameTitle}
              fill
              sizes="112px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Dices className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h4
            className="truncate font-semibold leading-tight"
            title={session.gameTitle}
          >
            {session.gameTitle}
          </h4>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {format(new Date(session.datePlayed), "d MMM yyyy")}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {session.tribe}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {session.isWinner ? (
            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
              Win
            </Badge>
          ) : session.isLoser ? (
            <Badge variant="destructive">Loss</Badge>
          ) : (
            <Badge
              variant="secondary"
              className="border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
            >
              Played
            </Badge>
          )}
          <Badge variant="outline" className="font-semibold">
            {me?.position ? positionOrdinalSuffix(me.position) : "—"}
            {session.isTied && " 🤝"}
          </Badge>
        </div>
      </div>

      {/* Players in finishing order, with the user's returns alongside */}
      <div className="mt-3 flex items-center gap-3 border-t pt-3">
        <div className="flex flex-1 items-center -space-x-2">
          {shown.map((p) => {
            const isCurrentUser = p.profileId === userId;
            return (
              <Tooltip key={p.profileId}>
                <TooltipTrigger asChild>
                  <div className="relative shrink-0">
                    <Avatar
                      className={cn(
                        "h-7 w-7 ring-2 transition-opacity",
                        p.isWinner
                          ? "ring-amber-400"
                          : isCurrentUser
                            ? "ring-primary"
                            : "opacity-60 ring-card",
                      )}
                    >
                      <AvatarImage src={p.profilePic} className="object-cover" />
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
                  {p.position ? ` · ${positionOrdinalSuffix(p.position)}` : ""}
                  {p.isWinner && " 👑"}
                </TooltipContent>
              </Tooltip>
            );
          })}

          {overflow > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
                  +{overflow}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {ordered
                  .slice(MAX_AVATARS)
                  .map((p) => p.firstName)
                  .join(", ")}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Divider, then the user's returns from this session */}
        <span className="h-10 w-px shrink-0 bg-border" />

        <div className="flex shrink-0 items-center gap-2">
          <div className="min-w-14 rounded-lg border border-accent-4/30 bg-accent-4/15 px-2.5 py-1.5 text-center">
            <p className="text-[10px] font-medium uppercase leading-none tracking-wide text-accent-4">
              WPA
            </p>
            <p className="mt-1 font-display text-base font-bold leading-none text-accent-4">
              {me?.score !== null && me?.score !== undefined
                ? me.score.toFixed(2)
                : "—"}
            </p>
          </div>

          <div className="min-w-14 rounded-lg border border-accent-3/30 bg-accent-3/15 px-2.5 py-1.5 text-center">
            <p className="text-[10px] font-medium uppercase leading-none tracking-wide text-accent-3">
              VP
            </p>
            <p className="mt-1 font-display text-base font-bold leading-none text-accent-3">
              {session.isVp &&
              me?.victoryPoints !== null &&
              me?.victoryPoints !== undefined
                ? me.victoryPoints
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const RecentSessionHistory: React.FC<RecentSessionHistoryProps> = ({
  userId,
  recentActivity,
}) => {
  const [view, setView] = useState<"graph" | "table">("graph");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── 30-day window, bucketed by day ──────────────────────────────────────
  const { days, maxCount, windowSessions } = useMemo(() => {
    const today = startOfDay(new Date());
    const from = subDays(today, WINDOW_DAYS - 1);

    const inWindow = recentActivity
      .filter((s) =>
        isWithinInterval(startOfDay(new Date(s.datePlayed)), {
          start: from,
          end: today,
        }),
      )
      .sort(
        (a, b) =>
          new Date(a.datePlayed).getTime() - new Date(b.datePlayed).getTime(),
      );

    // One bucket per day so gaps stay visible on the x-axis
    const buckets = Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const date = subDays(today, WINDOW_DAYS - 1 - i);
      const key = format(date, "yyyy-MM-dd");
      return {
        date,
        key,
        sessions: inWindow.filter(
          (s) => format(new Date(s.datePlayed), "yyyy-MM-dd") === key,
        ),
      };
    });

    return {
      days: buckets,
      maxCount: Math.max(1, ...buckets.map((b) => b.sessions.length)),
      windowSessions: inWindow,
    };
  }, [recentActivity]);

  const selected = useMemo(
    () => windowSessions.find((s) => s.sessionId === selectedId),
    [windowSessions, selectedId],
  );

  const handleExport = () => {
    const csv = toCsv(userId, [...windowSessions].reverse());
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `trakka-sessions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Y-axis ticks: one per game count, capped so tall days stay readable
  const yTicks = Array.from({ length: maxCount + 1 }, (_, i) => maxCount - i);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card className="gap-0 py-0">
        <CardContent className="p-4 sm:p-5">
          {/* ── Toolbar ──────────────────────────────────────────────── */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Session History</h3>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-full border bg-card p-0.5">
                <button
                  onClick={() => setView("graph")}
                  aria-label="Graph view"
                  aria-pressed={view === "graph"}
                  className={cn(
                    "flex h-7 w-8 items-center justify-center rounded-full transition-colors",
                    view === "graph"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <BarChart3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView("table")}
                  aria-label="Table view"
                  aria-pressed={view === "table"}
                  className={cn(
                    "flex h-7 w-8 items-center justify-center rounded-full transition-colors",
                    view === "table"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  <Table2 className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleExport}
                disabled={windowSessions.length === 0}
                aria-label="Export sessions as CSV"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {windowSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Dices className="mb-2 h-10 w-10 opacity-50" />
              <p className="text-sm">No sessions in the last 30 days</p>
            </div>
          ) : view === "table" ? (
            /* ── Table view (same shape as the previous dashboard table) ── */
            <div className="no-scrollbar max-h-105 overflow-x-auto overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="w-20">Date</TableHead>
                    <TableHead>Game</TableHead>
                    <TableHead>Tribe</TableHead>
                    <TableHead className="hidden text-center sm:table-cell">
                      Players
                    </TableHead>
                    <TableHead className="text-right">Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...windowSessions].reverse().map((session) => {
                    const me = session.players.find(
                      (p) => p.profileId === userId,
                    );
                    const posText = me?.position
                      ? positionOrdinalSuffix(me.position)
                      : "—";

                    return (
                      <TableRow
                        key={session.sessionId}
                        className="transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatRelativeDate(session.datePlayed)}
                        </TableCell>
                        <TableCell>
                          <span
                            className="block max-w-35 truncate font-medium"
                            title={session.gameTitle}
                          >
                            {session.gameTitle}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-20 truncate text-sm text-muted-foreground sm:max-w-none">
                            {session.tribe}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center justify-center gap-2">
                            {session.players.slice(0, 5).map((p) => {
                              const isCurrentUser = p.profileId === userId;
                              return (
                                <Tooltip key={p.profileId}>
                                  <TooltipTrigger asChild>
                                    <div className="relative shrink-0">
                                      <Avatar
                                        className={cn(
                                          "h-7 w-7 ring-2 transition-opacity",
                                          p.isWinner
                                            ? "ring-amber-400"
                                            : isCurrentUser
                                              ? "ring-primary"
                                              : "opacity-50 ring-background",
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
                                      {isCurrentUser && !p.isWinner && (
                                        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-1 ring-background" />
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
                            {session.players.length > 5 && (
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
                                +{session.players.length - 5}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {session.isTied && (
                              <span className="text-xs">🤝</span>
                            )}
                            {session.isWinner ? (
                              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-400">
                                <DotsIcon
                                  value={session.players.length}
                                  className="**:data-dot:bg-current"
                                />
                                {posText}
                              </Badge>
                            ) : session.isLoser ? (
                              <Badge
                                variant="destructive"
                                className="font-semibold"
                              >
                                <DotsIcon value={session.players.length} />
                                {posText}
                              </Badge>
                            ) : session.isPlayer ? (
                              <Badge
                                variant="secondary"
                                className="border-amber-500/30 bg-amber-500/15 text-amber-600 dark:text-amber-400"
                              >
                                <DotsIcon
                                  value={session.players.length}
                                  className="**:data-dot:bg-current"
                                />
                                {posText}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            /* ── Graph view ─────────────────────────────────────────────
               Details sit to the left on desktop, below the graph on
               mobile — hence the order-* swap. */
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="order-2 shrink-0 lg:order-1 lg:w-80 lg:border-r lg:pr-5">
                <SessionDetails userId={userId} session={selected} />
              </div>

              <div className="order-1 min-w-0 flex-1 lg:order-2 lg:pl-2">
                <div className="flex gap-2">
                  {/* Y axis */}
                  <div className="flex shrink-0 flex-col justify-between py-1 text-[10px] text-muted-foreground">
                    {yTicks.map((t) => (
                      <span key={t} className="leading-none">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Plot area */}
                  <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
                    <div className="flex min-w-125 items-end justify-between gap-0.5">
                      {days.map((day) => (
                        <div
                          key={day.key}
                          className="flex flex-1 flex-col-reverse items-center gap-0.5"
                          style={{ minHeight: `${maxCount * 20}px` }}
                        >
                          {day.sessions.map((s) => {
                            const isSelected = s.sessionId === selectedId;
                            return (
                              <button
                                key={s.sessionId}
                                onClick={() =>
                                  setSelectedId(isSelected ? null : s.sessionId)
                                }
                                aria-label={`${s.gameTitle} on ${format(
                                  new Date(s.datePlayed),
                                  "d MMM yyyy",
                                )}`}
                                className={cn(
                                  "h-4 w-4 rounded-full transition-all",
                                  s.isWinner
                                    ? "bg-emerald-500"
                                    : "bg-destructive",
                                  isSelected
                                    ? "scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-background"
                                    : "opacity-70 hover:opacity-100",
                                )}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* X axis — label every 5th day to avoid crowding */}
                    <div className="mt-2 flex min-w-125 justify-between gap-0.5 border-t pt-1.5">
                      {days.map((day, i) => (
                        <span
                          key={day.key}
                          className="flex-1 text-center text-[10px] leading-none text-muted-foreground"
                        >
                          {i % 5 === 0 ? format(day.date, "MMM d") : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Win
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                    Loss
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentSessionHistory;
