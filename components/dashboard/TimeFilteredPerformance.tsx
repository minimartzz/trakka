"use client";

import React, { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import {
  endOfDay,
  isWithinInterval,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { motion } from "motion/react";
import {
  TrendingUp,
  Trophy,
  Users,
  Dices,
  Swords,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GroupedSession, SessionDataInterface } from "@/lib/interfaces";
import { SelectHistDailyPlayerStats } from "@/db/schema/histDailyPlayerStats";
import type { FavouriteGame } from "@/db/schema/profile";
import type { GameMeta } from "@/app/(account)/dashboard/action";
import { topGames, topOpponents } from "@/utils/dashboardProcessing";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import DotsIcon from "@/components/icons/DotsIcon";
import TimeframeFilter, { Timeframe } from "./TimeframeFilter";
import DashboardProfileCard from "./DashboardProfileCard";
import DashboardStatCard from "./DashboardStatCard";
import LatestSessionCard from "./LatestSessionCard";
import DashboardDetailedStats from "./DashboardDetailedStats";
import GenreOverview from "./GenreOverview";
import PlayerSummary from "./PlayerSummary";
import DashboardTribes from "./DashboardTribes";
import DashboardPlayers from "./DashboardPlayers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardProfile {
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  memberSince: string;
  favouriteGames?: FavouriteGame[];
  showcaseSlots?: (string | null)[];
}

interface TimeFilteredPerformanceProps {
  userId: number;
  profile: DashboardProfile;
  recentActivity: GroupedSession[];
  sessions: SessionDataInterface[];
  dailyStats: SelectHistDailyPlayerStats[];
  gameMeta: GameMeta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const calculateStartDate = (timeframe: string): Date => {
  const today = endOfDay(new Date());
  switch (timeframe) {
    case "1week":
      return subWeeks(today, 1);
    case "1month":
      return subMonths(today, 1);
    case "1quarter":
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

// ─── Page Heading ─────────────────────────────────────────────────────────────

const PageHeading: React.FC = () => (
  <div>
    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
      My Performance
    </h1>
    <p className="text-sm text-muted-foreground mt-1">
      Track your stats across all tribes
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TimeFilteredPerformance: React.FC<TimeFilteredPerformanceProps> = ({
  userId,
  profile,
  recentActivity,
  sessions,
  dailyStats,
  gameMeta,
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

  // ── Active window ─────────────────────────────────────────────────────────

  const activeRange = useMemo(() => {
    if (dateRange?.from && dateRange.to) {
      return { from: dateRange.from, to: endOfDay(dateRange.to) };
    }
    if (timeframe !== "custom" && timeframe !== "all") {
      return {
        from: calculateStartDate(timeframe),
        to: endOfDay(new Date()),
      };
    }
    return null;
  }, [timeframe, dateRange]);

  // ── Filtered activities ───────────────────────────────────────────────────

  const filteredActivities = useMemo(() => {
    const activitiesWithDates = recentActivity.map((activity) => ({
      ...activity,
      parsedDate: new Date(activity.datePlayed),
    }));

    if (!activeRange) return activitiesWithDates;

    return activitiesWithDates.filter((activity) =>
      isWithinInterval(activity.parsedDate, {
        start: activeRange.from,
        end: activeRange.to,
      }),
    );
  }, [recentActivity, activeRange]);

  // ── Derived stats ─────────────────────────────────────────────────────────

  const { top5Players } = useMemo(() => {
    const sessionsWithDates = sessions.map((s) => ({
      ...s,
      parsedDate: new Date(s.datePlayed),
    }));

    const filtered = activeRange
      ? sessionsWithDates.filter((s) =>
          isWithinInterval(s.parsedDate, {
            start: activeRange.from,
            end: activeRange.to,
          }),
        )
      : sessionsWithDates;

    const topPlayers = topOpponents(userId, filtered);
    const tg = topGames(userId, filtered);
    return { top5Players: topPlayers.slice(0, 5), topGamesStats: tg };
  }, [sessions, userId, activeRange]);

  // ── Metric calculations ───────────────────────────────────────────────────

  // Most recent session overall — like the profile card, it ignores the
  // timeframe filter so it always shows the actual latest game.
  const latestSession = useMemo(
    () =>
      [...recentActivity].sort(
        (a, b) =>
          new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime(),
      )[0],
    [recentActivity],
  );

  // Profile card shows lifetime totals — it's an identity card, so it stays
  // fixed while the timeframe filter changes everything around it.
  const lifetimeGamesPlayed = recentActivity.length;
  const lifetimeGamesWon = recentActivity.filter((a) => a.isWinner).length;

  // Win Rate over the active window, plus the preceding window of equal length
  // so the card can show a trend.
  const { winRate, winRateTrend } = useMemo(() => {
    const rate = (rows: { isWinner: boolean }[]) =>
      rows.length > 0
        ? (rows.filter((r) => r.isWinner).length / rows.length) * 100
        : null;

    const current = rate(filteredActivities);

    // "All time" has no preceding window to compare against
    if (!activeRange || current === null) {
      return { winRate: current, winRateTrend: undefined };
    }

    const spanMs = activeRange.to.getTime() - activeRange.from.getTime();
    const priorRows = recentActivity.filter((a) => {
      const d = new Date(a.datePlayed).getTime();
      return (
        d >= activeRange.from.getTime() - spanMs &&
        d < activeRange.from.getTime()
      );
    });

    const previous = rate(priorRows);
    if (previous === null) {
      return { winRate: current, winRateTrend: undefined };
    }

    const delta = current - previous;
    return {
      winRate: current,
      winRateTrend: {
        direction:
          Math.abs(delta) < 0.05
            ? ("flat" as const)
            : delta > 0
              ? ("up" as const)
              : ("down" as const),
        value: `${Math.abs(delta).toFixed(1)}%`,
      },
    };
  }, [filteredActivities, recentActivity, activeRange]);

  // Win Rate sparkline: cumulative win rate walked forward through the window,
  // so the line shows how the number arrived at its current value.
  const winRateSeries = useMemo(() => {
    const ordered = [...filteredActivities].sort(
      (a, b) => a.parsedDate.getTime() - b.parsedDate.getTime(),
    );

    let wins = 0;
    return ordered.map((a, i) => {
      if (a.isWinner) wins++;
      return (wins / (i + 1)) * 100;
    });
  }, [filteredActivities]);

  // WPA over the active window, from the daily snapshots. Each snapshot holds
  // that day's score per tribe, so a day's WPA is the mean across tribes that
  // recorded play; the card value is the mean over the window.
  const { wpa, wpaTrend, wpaSeries } = useMemo(() => {
    // Collapse per-tribe rows into one value per day
    const byDate = new Map<string, { score: number; count: number }>();
    for (const s of dailyStats) {
      if (s.sessionsPlayed <= 0) continue;
      const entry = byDate.get(s.snapshotDate) ?? { score: 0, count: 0 };
      entry.score += s.score;
      entry.count += 1;
      byDate.set(s.snapshotDate, entry);
    }

    const daily = [...byDate.entries()]
      .map(([date, { score, count }]) => ({
        time: new Date(date).getTime(),
        wpa: score / count,
      }))
      .sort((a, b) => a.time - b.time);

    const inWindow = activeRange
      ? daily.filter(
          (d) =>
            d.time >= activeRange.from.getTime() &&
            d.time <= activeRange.to.getTime(),
        )
      : daily;

    const mean = (rows: { wpa: number }[]) =>
      rows.length > 0
        ? rows.reduce((sum, r) => sum + r.wpa, 0) / rows.length
        : null;

    const current = mean(inWindow);
    if (current === null) {
      return { wpa: null, wpaTrend: undefined, wpaSeries: [] };
    }

    const series = inWindow.map((d) => d.wpa);

    if (!activeRange) {
      return { wpa: current, wpaTrend: undefined, wpaSeries: series };
    }

    const spanMs = activeRange.to.getTime() - activeRange.from.getTime();
    const previous = mean(
      daily.filter(
        (d) =>
          d.time >= activeRange.from.getTime() - spanMs &&
          d.time < activeRange.from.getTime(),
      ),
    );

    if (previous === null) {
      return { wpa: current, wpaTrend: undefined, wpaSeries: series };
    }

    const delta = current - previous;
    return {
      wpa: current,
      wpaTrend: {
        direction:
          Math.abs(delta) < 0.005
            ? ("flat" as const)
            : delta > 0
              ? ("up" as const)
              : ("down" as const),
        value: Math.abs(delta).toFixed(2),
      },
      wpaSeries: series,
    };
  }, [dailyStats, activeRange]);

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
      <div className="space-y-8">
        <PageHeading />
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
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Heading + timeframe filter ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <PageHeading />
        <TimeframeFilter
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          activeRange={activeRange}
        />
      </motion.div>

      {/* ── Section: Key Stats ───────────────────────────────────────────── */}
      <section>
        {/* Mobile: profile, then the two stat cards side by side, then the
            latest session. Desktop: profile spans both rows on the left, with
            the stats above the latest session on the right. */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:grid-rows-[auto_1fr]">
          <div className="col-span-2 lg:col-span-1 lg:row-span-2">
            <DashboardProfileCard
              firstName={profile.firstName}
              lastName={profile.lastName}
              username={profile.username}
              image={profile.image}
              memberSince={profile.memberSince}
              gamesPlayed={lifetimeGamesPlayed}
              gamesWon={lifetimeGamesWon}
              recentActivity={recentActivity}
              favouriteGames={profile.favouriteGames}
              showcaseSlots={profile.showcaseSlots}
            />
          </div>

          <DashboardStatCard
            title="Win Rate"
            value={winRate !== null ? winRate.toFixed(0) : "—"}
            suffix={winRate !== null ? "%" : ""}
            trend={winRateTrend}
            trendLabel="vs. previous period"
            series={winRateSeries}
            icon={<Trophy className="w-4 h-4" />}
            variant="a"
            delay={0.15}
          />
          <DashboardStatCard
            title="WPA"
            value={wpa !== null ? wpa.toFixed(2) : "—"}
            trend={wpaTrend}
            trendLabel="vs. previous period"
            series={wpaSeries}
            icon={<Swords className="w-4 h-4" />}
            variant="b"
            delay={0.2}
          />

          <div className="col-span-2">
            <LatestSessionCard
              userId={userId}
              session={latestSession}
              delay={0.25}
            />
          </div>
        </div>
      </section>

      {/* ── Section: Detailed Stats ──────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardDetailedStats
            userId={userId}
            sessions={recentActivity}
            favouriteGames={profile.favouriteGames}
            gameMeta={gameMeta}
            delay={0.3}
          />
        </div>
        {/* Genre overview fills whatever height the summary leaves it */}
        <div className="flex flex-col gap-4">
          <div className="flex min-h-0 flex-1 flex-col">
            <GenreOverview
              userId={userId}
              sessions={filteredActivities}
              gameMeta={gameMeta}
              delay={0.35}
            />
          </div>
          <PlayerSummary
            userId={userId}
            sessions={recentActivity}
            delay={0.4}
          />
        </div>
      </section>

      {/* ── Section: Tribes + Players ────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <DashboardTribes
          userId={userId}
          sessions={filteredActivities}
          activeRange={activeRange}
          delay={0.45}
        />
        <DashboardPlayers
          userId={userId}
          sessions={filteredActivities}
          delay={0.5}
        />
      </section>
    </div>
  );
};

export default TimeFilteredPerformance;
