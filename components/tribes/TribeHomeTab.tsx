"use client";

import {
  Trophy,
  Target,
  TrendingUp,
  Flame,
  Dices,
  Clock,
  Library,
  History,
  Info,
} from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import StatCard from "./StatCard";
import PlayerLeaderboard from "./PlayerLeaderboard";
import PlayerComplexityChart from "./PlayerComplexityChart";
import RecentSessions from "./RecentSessions";
import PopularGamesCarousel, { PopularGame } from "./PopularGamesCarousel";
import HistoricalSessionsChart from "./HistoricalSessionsChart";
import AllGamesPieChart from "./AllGamesPieChart";
import MeepleIcon from "@/components/icons/MeepleIcon";
import { motion } from "motion/react";
import { HistStatsInterface } from "./TribePageClient";

// Types for the game data that will be passed to this component
export interface GameSession {
  sessionId: string;
  datePlayed: string;
  gameId: number;
  gameTitle: string;
  gameImageUrl: string | null;
  playingTime: number | null;
  gameWeight: number | null;
  players: {
    profileId: number;
    username: string;
    firstName: string;
    lastName: string;
    image: string | null;
    isWinner: boolean;
    position: number;
    score: number | null;
    victoryPoints: number | null;
    winContrib: number | null;
    isFirstPlay?: boolean;
  }[];
}

interface TribeHomeTabProps {
  sessions: GameSession[];
  memberCount: number;
  currentUserId?: number;
  histStats: HistStatsInterface;
}

/**
 * TribeHomeTab - The main dashboard view for a tribe
 *
 * Design decisions:
 * - Stats cards at top provide quick overview
 * - Leaderboards organized in a masonry-like grid for visual interest
 * - "Most Active" shows engagement, "Biggest Winners" shows performance
 * - "Popular Games" helps discover what the tribe enjoys
 * - Section titles with icons create visual rhythm
 * - Staggered animations on scroll create progressive reveal
 * - Empty states are handled gracefully with helpful messages
 */
const TribeHomeTab: React.FC<TribeHomeTabProps> = ({
  sessions,
  memberCount,
  currentUserId,
  histStats,
}) => {
  const [leaderboardInfoOpen, setLeaderboardInfoOpen] = useState(false);
  // Calculate statistics from sessions data
  const totalGamesPlayed = sessions.length;

  // Get increase in games in past week
  const now = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const pastWeeksGames = sessions.filter((s) => {
    const itemDate = new Date(s.datePlayed);
    return itemDate >= lastWeek && itemDate <= now;
  }).length;
  const pastWeekGamesDir =
    pastWeeksGames > 0 ? "positive" : pastWeeksGames < 0 ? "negative" : "none";

  // Calculate total time spent (in minutes from playingTime, converted to hours)
  const totalTimeMinutes = sessions.reduce(
    (acc, s) => acc + (s.playingTime || 0),
    0,
  );
  const totalTimeHours = Math.round((totalTimeMinutes / 60) * 10) / 10;

  // Calculate time spent in the past week vs previous week for trend
  const thisWeekTimeMinutes = sessions
    .filter((s) => {
      const itemDate = new Date(s.datePlayed);
      return itemDate >= lastWeek && itemDate <= now;
    })
    .reduce((acc, s) => acc + (s.playingTime || 0), 0);

  const prevWeekTimeMinutes = sessions
    .filter((s) => {
      const itemDate = new Date(s.datePlayed);
      return itemDate >= twoWeeksAgo && itemDate < lastWeek;
    })
    .reduce((acc, s) => acc + (s.playingTime || 0), 0);

  const timeTrendMinutes = thisWeekTimeMinutes - prevWeekTimeMinutes;
  const timeTrendHours = Math.round((timeTrendMinutes / 60) * 10) / 10;
  const timeTrendDir: "positive" | "negative" | "none" =
    timeTrendHours > 0 ? "positive" : timeTrendHours < 0 ? "negative" : "none";

  // Calculate unique games played
  const uniqueGameIds = new Set(sessions.map((s) => s.gameId));
  const totalUniqueGames = uniqueGameIds.size;

  // Unique games played this week (new games that weren't played before this week)
  const gamesBeforeThisWeek = new Set(
    sessions
      .filter((s) => new Date(s.datePlayed) < lastWeek)
      .map((s) => s.gameId),
  );
  const gamesThisWeek = new Set(
    sessions
      .filter((s) => {
        const itemDate = new Date(s.datePlayed);
        return itemDate >= lastWeek && itemDate <= now;
      })
      .map((s) => s.gameId),
  );
  // Count games played this week that weren't played before
  const newGamesThisWeek = [...gamesThisWeek].filter(
    (id) => !gamesBeforeThisWeek.has(id),
  ).length;
  const uniqueGamesTrendDir: "positive" | "negative" | "none" =
    newGamesThisWeek > 0 ? "positive" : "none";

  // Calculate average WPA from daily snapshot 7 days ago for players with >= 3 sessions
  const calculateLastWeekAverageWPA = (): number => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoDate = weekAgo.toISOString().split("T")[0]; // "YYYY-MM-DD"

    const weekAgoSnapshots = histStats.dailyPlayerStats.filter(
      (stat) => stat.snapshotDate === weekAgoDate && stat.sessionsPlayed >= 3,
    );

    if (weekAgoSnapshots.length === 0) return 0;

    const average =
      weekAgoSnapshots.reduce((acc, stat) => acc + stat.score, 0) /
      weekAgoSnapshots.length;

    return isNaN(average) ? 0 : parseFloat(average.toFixed(2));
  };

  const calculateAverageWPA = (): number => {
    if (histStats.rollingStats.length === 0) return 0;

    // Remove players who have <=3 sessions played
    const validPlayers = histStats.rollingStats.filter(
      (player) => player.sessionsPlayed > 3,
    );
    const averageWPA =
      validPlayers.reduce((acc, stat) => {
        return acc + stat.rollingScore / stat.sessionsPlayed;
      }, 0) / validPlayers.length;

    return isNaN(averageWPA) ? 0 : parseFloat(averageWPA.toFixed(2));
  };

  // TODO: Choose another stat
  const calculateOverallWinPercentage = (): number => {
    return calculateAverageWPA();
  };

  // Get most popular games
  const getPopularGames = (): PopularGame[] => {
    const gameCounts: Record<
      string,
      {
        gameTitle: string;
        playCount: number;
        lastPlayed: string;
        imageUrl: string | null;
      }
    > = {};

    sessions.forEach((session) => {
      if (!gameCounts[session.gameId]) {
        gameCounts[session.gameId] = {
          gameTitle: session.gameTitle,
          playCount: 0,
          lastPlayed: session.datePlayed,
          imageUrl: session.gameImageUrl,
        };
      }
      gameCounts[session.gameId].playCount++;
      // Update lastPlayed if this session is more recent
      if (session.datePlayed > gameCounts[session.gameId].lastPlayed) {
        gameCounts[session.gameId].lastPlayed = session.datePlayed;
      }
    });

    return Object.entries(gameCounts)
      .map(([gameId, data]) => ({
        gameId,
        gameTitle: data.gameTitle,
        playCount: data.playCount,
        lastPlayed: data.lastPlayed,
        imageUrl: data.imageUrl,
      }))
      .sort((a, b) => b.playCount - a.playCount)
      .slice(0, 5);
  };

  const wpa = calculateAverageWPA();
  const lastWeekWpa = calculateLastWeekAverageWPA();
  const wpaChange =
    lastWeekWpa === 0 ? 0 : parseFloat((wpa - lastWeekWpa).toFixed(2));
  const wpaChangeDir =
    wpaChange > 0 ? "positive" : wpaChange < 0 ? "negative" : "none";
  const overallWinPct = calculateOverallWinPercentage();
  const popularGames = getPopularGames();

  return (
    <div className="p-4 sm:p-6 space-y-8 mb-15">
      {/* Section: Key Stats */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-2 mb-4"
        >
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Tribe Overview</h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Sessions Held"
            value={totalGamesPlayed}
            trend={{
              direction: pastWeekGamesDir,
              value: `${pastWeeksGames}`,
              content: "Since last week",
            }}
            icon={<MeepleIcon className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-br from-accent-5 to-accent-3"
            delay={0.1}
          />
          <StatCard
            title="Avg WPA"
            value={wpa === 0 ? "-" : wpa}
            trend={{
              direction: wpaChangeDir,
              value: `${wpaChange}`,
              content: "Since last week",
            }}
            icon={<Target className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-5 to-accent-3"
            delay={0.15}
          />
          <StatCard
            title="Gaming Time"
            value={totalTimeHours}
            suffix="hrs"
            trend={{
              direction: timeTrendDir,
              value: `${timeTrendHours}`,
              content: "hrs since last week",
            }}
            icon={<Clock className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-3 to-accent-5"
            delay={0.2}
          />
          <StatCard
            title="Unique Games"
            value={totalUniqueGames}
            trend={{
              direction: uniqueGamesTrendDir,
              value: `${newGamesThisWeek}`,
              content: "new since last week",
            }}
            icon={<Library className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-br from-accent-3 to-accent-5"
            delay={0.25}
          />
        </div>
      </section>

      {/* Section: Leaderboard & Complexity Chart */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex items-center gap-2 mb-4"
        >
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Leaderboard</h2>
          <Tooltip
            open={leaderboardInfoOpen}
            onOpenChange={setLeaderboardInfoOpen}
          >
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setLeaderboardInfoOpen((v) => !v)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-[220px] text-center">
              Only players with a minimum of 4 games are included in the
              Leaderboard
            </TooltipContent>
          </Tooltip>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-1 lg:col-span-2">
            <PlayerLeaderboard
              sessions={sessions}
              emptyMessage="No games played yet"
              delay={0.3}
            />
          </div>
          <div className="col-span-1">
            <PlayerComplexityChart sessions={sessions} delay={0.35} />
          </div>
        </div>
      </section>

      {/* Section: Recent Sessions */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="flex items-center gap-2 mb-4"
        >
          <Dices className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Recent Sessions</h2>
        </motion.div>

        <RecentSessions
          sessions={sessions}
          currentUserId={currentUserId}
          emptyMessage="No sessions recorded yet"
          delay={0.4}
        />
      </section>

      {/* Section: Popular Games */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="flex items-center gap-2 mb-4"
        >
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Popular Games</h2>
        </motion.div>

        <PopularGamesCarousel games={popularGames} delay={0.5} />
      </section>

      {/* Section: Historical */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.55 }}
          className="flex items-center gap-2 mb-4"
        >
          <History className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Historical</h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <HistoricalSessionsChart sessions={sessions} delay={0.6} />
          </div>
          <div className="lg:col-span-1">
            <AllGamesPieChart sessions={sessions} delay={0.65} />
          </div>
        </div>
      </section>

      {/* Empty state for new tribes */}
      {sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Dices className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Games Recorded Yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Start logging game sessions to see statistics and leaderboards for
            your tribe.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default TribeHomeTab;
