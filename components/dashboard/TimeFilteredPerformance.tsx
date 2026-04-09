"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { endOfDay, isWithinInterval, subMonths, subYears } from "date-fns";
import { motion } from "motion/react";
import {
  TrendingUp,
  Trophy,
  Users,
  Dices,
  Gamepad2,
  Swords,
  Library,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { GroupedSession, SessionDataInterface } from "@/lib/interfaces";
import { SelectRollingPlayerStats } from "@/db/schema/rollingPlayerStats";
import { topGames, topOpponents } from "@/utils/dashboardProcessing";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import StatCard from "@/components/tribes/StatCard";
import MeepleIcon from "@/components/icons/MeepleIcon";
import DotsIcon from "@/components/icons/DotsIcon";
import DateRangePicker from "./DateRangePicker";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeFilteredPerformanceProps {
  userId: number;
  recentActivity: GroupedSession[];
  sessions: SessionDataInterface[];
  rollingStats: SelectRollingPlayerStats[];
}

type Timeframe =
  | "1month"
  | "3months"
  | "6months"
  | "1year"
  | "3years"
  | "all"
  | "custom";

const TIMEFRAME_LABELS: Record<Exclude<Timeframe, "custom">, string> = {
  "1month": "1M",
  "3months": "3M",
  "6months": "6M",
  "1year": "1Y",
  "3years": "3Y",
  all: "ALL",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateStartDate = (timeframe: string): Date => {
  const today = endOfDay(new Date());
  switch (timeframe) {
    case "1month":
      return subMonths(today, 1);
    case "3months":
      return subMonths(today, 3);
    case "6months":
      return subMonths(today, 6);
    case "1year":
      return subYears(today, 1);
    case "3years":
      return subYears(today, 3);
    default:
      return subYears(today, 1);
  }
};

const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Section Header (matches TribeHomeTab pattern) ────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  delay?: number;
}> = ({ icon, title, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="flex items-center gap-2 mb-4"
  >
    {icon}
    <h2 className="text-lg font-semibold">{title}</h2>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TimeFilteredPerformance: React.FC<TimeFilteredPerformanceProps> = ({
  userId,
  recentActivity,
  sessions,
  rollingStats,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>("1year");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    if (dateRange?.from && dateRange.to) {
      setTimeframe("custom");
    }
  }, [dateRange]);

  // ── Filtered activities ───────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    const activitiesWithDates = recentActivity.map((activity) => ({
      ...activity,
      parsedDate: new Date(activity.datePlayed),
    }));

    let finalFromDate: Date | undefined;
    let finalToDate: Date | undefined;

    if (dateRange?.from && dateRange.to) {
      finalFromDate = dateRange.from;
      finalToDate = endOfDay(dateRange.to);
    } else if (timeframe !== "custom" && timeframe !== "all") {
      finalFromDate = calculateStartDate(timeframe);
      finalToDate = endOfDay(new Date());
    } else {
      return activitiesWithDates;
    }

    if (finalFromDate && finalToDate) {
      return activitiesWithDates.filter((activity) =>
        isWithinInterval(activity.parsedDate, {
          start: finalFromDate!,
          end: finalToDate!,
        }),
      );
    }

    return activitiesWithDates;
  }, [recentActivity, timeframe, dateRange]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const { top5Players, topGamesStats } = useMemo(() => {
    const sessionsWithDates = sessions.map((s) => ({
      ...s,
      parsedDate: new Date(s.datePlayed),
    }));

    let finalFromDate: Date | undefined;
    let finalToDate: Date | undefined;

    if (dateRange?.from && dateRange.to) {
      finalFromDate = dateRange.from;
      finalToDate = endOfDay(dateRange.to);
    } else if (timeframe !== "custom" && timeframe !== "all") {
      finalFromDate = calculateStartDate(timeframe);
      finalToDate = endOfDay(new Date());
    } else {
      const topPlayers = topOpponents(userId, sessionsWithDates);
      const tg = topGames(userId, sessionsWithDates);
      return { top5Players: topPlayers.slice(0, 5), topGamesStats: tg };
    }

    const filtered = sessionsWithDates.filter((s) =>
      isWithinInterval(s.parsedDate, {
        start: finalFromDate!,
        end: finalToDate!,
      }),
    );
    const topPlayers = topOpponents(userId, filtered);
    const tg = topGames(userId, filtered);
    return { top5Players: topPlayers.slice(0, 5), topGamesStats: tg };
  }, [sessions, userId, timeframe, dateRange]);

  // ── Metric calculations ───────────────────────────────────────────────────

  const gamesPlayed = filteredActivities.length;
  const uniqueGames = new Set(filteredActivities.map((a) => a.gameId)).size;

  // Rolling stats aggregated across all groups
  const totalSessionsPlayed = rollingStats.reduce(
    (sum, s) => sum + s.sessionsPlayed,
    0,
  );
  const totalSessionsWon = rollingStats.reduce(
    (sum, s) => sum + s.sessionsWon,
    0,
  );
  const totalRollingScore = rollingStats.reduce(
    (sum, s) => sum + s.rollingScore,
    0,
  );

  // Win Rate: total sessionsWon / total sessionsPlayed, rounded to nearest whole number
  const winRate =
    totalSessionsPlayed > 0
      ? Math.round((totalSessionsWon / totalSessionsPlayed) * 100)
      : 0;

  // WPA: total rollingScore / total sessionsPlayed, rounded to 2 decimal places
  const wpa =
    totalSessionsPlayed > 0
      ? Math.round((totalRollingScore / totalSessionsPlayed) * 100) / 100
      : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleTimeframeChange = (value: Timeframe) => {
    setTimeframe(value);
    if (value !== "custom") {
      setDateRange({ from: undefined, to: undefined });
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setTimeframe("custom");
    }
  };

  // ── Empty state ───────────────────────────────────────────────────────────

  if (sessions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-center py-20"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Dices className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Games Recorded Yet</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Start logging game sessions to see your performance statistics.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Timeframe filter bar ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3"
      >
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-1">
          {(
            Object.entries(TIMEFRAME_LABELS) as [
              Exclude<Timeframe, "custom">,
              string,
            ][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => handleTimeframeChange(key)}
              className={cn(
                "text-sm font-semibold px-2.5 py-1 rounded-md transition-colors",
                timeframe === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">or</span>
          <DateRangePicker date={dateRange} setDate={handleDateRangeChange} />
        </div>
      </motion.div>

      {/* ── Section: Key Stats ───────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={<TrendingUp className="w-5 h-5 text-primary" />}
          title="Overview"
          delay={0.05}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Games Played"
            value={gamesPlayed}
            icon={<MeepleIcon className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-br from-accent-3 to-accent-1"
            delay={0.1}
          />
          <StatCard
            title="Unique Games"
            value={uniqueGames}
            icon={<Library className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-4 to-accent-2"
            delay={0.15}
          />
          <StatCard
            title="Win Rate"
            value={gamesPlayed > 0 ? winRate : "-"}
            suffix={gamesPlayed > 0 ? "%" : ""}
            icon={<Trophy className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-1 to-accent-3"
            delay={0.2}
          />
          <StatCard
            title="WPA"
            value={gamesPlayed > 0 ? wpa : "-"}
            suffix=""
            icon={<Swords className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-br from-accent-2 to-accent-4"
            delay={0.25}
          />
        </div>
      </section>

      {/* ── Section: Recent Activity + Top Opponents ─────────────────────── */}
      <section>
        <SectionHeader
          icon={<Dices className="w-5 h-5 text-primary" />}
          title="Recent Activity"
          delay={0.25}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent sessions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="h-full">
              <CardContent className="p-0">
                {filteredActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Dices className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">No sessions in this period</p>
                  </div>
                ) : (
                  <div className="max-h-[420px] overflow-y-auto overflow-x-auto no-scrollbar">
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-card">
                        <TableRow>
                          <TableHead className="w-[80px]">Date</TableHead>
                          <TableHead>Game</TableHead>
                          <TableHead>Tribe</TableHead>
                          <TableHead className="hidden sm:table-cell text-center">
                            Players
                          </TableHead>
                          <TableHead className="text-right">Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActivities.slice(0, 15).map((session) => {
                          const playerDetails = session.players.find(
                            (p) => p.profileId === userId,
                          );
                          const position = playerDetails?.position;
                          const posText = position
                            ? positionOrdinalSuffix(position)
                            : "—";

                          return (
                            <TableRow
                              key={session.sessionId}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                {formatRelativeDate(session.datePlayed)}
                              </TableCell>
                              <TableCell>
                                <span
                                  className="font-medium truncate max-w-[140px] block"
                                  title={session.gameTitle}
                                >
                                  {session.gameTitle}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground truncate max-w-[80px] sm:max-w-none block">
                                  {session.tribe}
                                </span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell text-center">
                                <div className="flex justify-center -space-x-1.5">
                                  {session.players.slice(0, 4).map((p) => (
                                    <Tooltip key={p.profileId}>
                                      <TooltipTrigger asChild>
                                        <Avatar
                                          className={cn(
                                            "w-6 h-6 ring-2 ring-background",
                                            p.isWinner && "ring-accent-1",
                                          )}
                                        >
                                          <AvatarImage
                                            src={p.profilePic}
                                            className={cn(
                                              "object-cover",
                                              !p.isWinner && "grayscale",
                                            )}
                                          />
                                          <AvatarFallback className="text-[10px] bg-muted">
                                            {p.firstName[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {p.firstName} {p.isWinner && "👑"}
                                      </TooltipContent>
                                    </Tooltip>
                                  ))}
                                  {session.players.length > 4 && (
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
                                      +{session.players.length - 4}
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
                                    <Badge className="bg-accent-1/15 text-accent-1 border-accent-1/30 hover:bg-accent-1/20">
                                      <DotsIcon
                                        value={session.players.length}
                                        className="[&_[data-dot]]:bg-current"
                                      />
                                      {posText}
                                    </Badge>
                                  ) : session.isLoser ? (
                                    <Badge
                                      variant="destructive"
                                      className="font-semibold"
                                    >
                                      <DotsIcon
                                        value={session.players.length}
                                      />
                                      {posText}
                                    </Badge>
                                  ) : session.isPlayer ? (
                                    <Badge
                                      variant="secondary"
                                      className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                    >
                                      <DotsIcon
                                        value={session.players.length}
                                        className="[&_[data-dot]]:bg-current"
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
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Opponents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="lg:col-span-1"
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Top Opponents</h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {top5Players.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No games found
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {top5Players.map((opponent, idx) => (
                      <li
                        key={opponent.player.id}
                        className="flex items-center gap-3"
                      >
                        <span className="text-sm font-semibold text-muted-foreground w-5 text-center font-display">
                          {idx + 1}
                        </span>
                        <Avatar className="w-8 h-8">
                          <AvatarImage
                            src={opponent.player.profilePic}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {opponent.player.firstName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {opponent.player.firstName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{opponent.player.username}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="font-semibold shrink-0"
                        >
                          {opponent.count}{" "}
                          {opponent.count === 1 ? "game" : "games"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Section: Game Performance ────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={<Gamepad2 className="w-5 h-5 text-primary" />}
          title="Game Performance"
          delay={0.35}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card>
            <CardContent className="p-0">
              {topGamesStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Gamepad2 className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">No games in this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Game</TableHead>
                        <TableHead className="text-center w-[100px]">
                          Played
                        </TableHead>
                        <TableHead className="hidden sm:table-cell w-[200px]">
                          W / L
                        </TableHead>
                        <TableHead className="text-right w-[80px]">
                          Win %
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topGamesStats.slice(0, 10).map((game, idx) => (
                        <TableRow key={game.game.gameId}>
                          <TableCell className="text-center text-sm text-muted-foreground font-display font-semibold">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium truncate max-w-[180px] block">
                              {game.game.gameTitle}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {game.count}
                          </TableCell>
                          {/* Win/Loss bar — desktop only */}
                          <TableCell className="hidden sm:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-destructive/20 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-accent-1 transition-all duration-500"
                                  style={{ width: `${game.winRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap w-16 text-right">
                                {game.wins}W / {game.count - game.wins}L
                              </span>
                            </div>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-bold",
                              game.winRate >= 50
                                ? "text-accent-1"
                                : "text-destructive",
                            )}
                          >
                            {game.winRate}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
};

export default TimeFilteredPerformance;
