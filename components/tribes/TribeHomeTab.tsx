"use client";

import { Trophy, Target, TrendingUp, Flame, Dices } from "lucide-react";
import StatCard from "./StatCard";
import PlayerLeaderboard from "./PlayerLeaderboard";
import PopularGamesCarousel, { PopularGame } from "./PopularGamesCarousel";
import MeepleIcon from "@/components/icons/MeepleIcon";
import { motion } from "motion/react";

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
  }[];
}

interface TribeHomeTabProps {
  sessions: GameSession[];
  memberCount: number;
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

  // TODO: Calculate WPA (Wins Per Attempt) - Average win rate across all players
  // TODO: Calculate Change since last week
  const calculateWPA = (): number => {
    if (sessions.length === 0) return 0;
    const allPlayers = sessions.flatMap((s) => s.players);
    const totalWins = allPlayers.filter((p) => p.isWinner).length;
    const totalPlays = allPlayers.length;
    return totalPlays > 0 ? Math.round((totalWins / totalPlays) * 100) : 0;
  };

  // TODO: Choose another stat
  const calculateOverallWinPercentage = (): number => {
    return calculateWPA();
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

  const wpa = calculateWPA();
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
            title="Win Rate (WPA)"
            value={wpa}
            suffix="%"
            icon={<Target className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-2 to-accent-3"
            delay={0.15}
          />
          <StatCard
            title="Overall Win %"
            value={overallWinPct}
            suffix="%"
            icon={<Trophy className="sm:w-6 sm:h-6 w-4 h-4 text-white" />}
            color="bg-linear-to-bl from-accent-3 to-accent-5"
            delay={0.2}
          />
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

      {/* Section: Popular Games */}
      <section>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex items-center gap-2 mb-4"
        >
          <Flame className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Popular Games</h2>
        </motion.div>

        <PopularGamesCarousel games={popularGames} delay={0.45} />
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
