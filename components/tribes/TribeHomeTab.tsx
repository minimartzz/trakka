"use client";

import { Trophy, Target, TrendingUp, Flame, Dices } from "lucide-react";
import StatCard from "./StatCard";
import PlayerLeaderboard from "./PlayerLeaderboard";
import RecentSessions from "./RecentSessions";
import PopularGamesCarousel, { PopularGame } from "./PopularGamesCarousel";
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
  // Calculate statistics from sessions data
  const totalGamesPlayed = sessions.length;

  // Get increase in games in past week
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const pastWeeksGames = sessions.filter((s) => {
    const itemDate = new Date(s.datePlayed);
    return itemDate >= lastWeek && itemDate <= new Date();
  }).length;
  const pastWeekGamesDir =
    pastWeeksGames > 0 ? "positive" : pastWeeksGames < 0 ? "negative" : "none";

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
    <div className="p-4 sm:p-6 space-y-8">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatCard
            title="Games Played"
            value={totalGamesPlayed}
            trend={{
              direction: pastWeekGamesDir,
              value: `${pastWeeksGames}`,
              content: "Since last week",
            }}
            icon={<MeepleIcon className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-4 to-accent-3"
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
            color="bg-linear-to-bl from-accent-2 to-accent-3"
            delay={0.15}
          />
          {/* <StatCard
            title="Overall Win %"
            value={overallWinPct}
            suffix="%"
            icon={<Trophy className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-3 to-accent-5"
            delay={0.2}
          /> */}
        </div>
      </section>

      {/* Section: Leaderboard */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex items-center gap-2 mb-4"
        >
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Leaderboard</h2>
        </motion.div>

        <PlayerLeaderboard
          sessions={sessions}
          emptyMessage="No games played yet"
          delay={0.3}
        />
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
