"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  Trophy,
} from "lucide-react";
import { useState, useMemo } from "react";

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

export interface LeaderboardPlayer {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  gamesPlayed: number;
  wins: number;
}

export type ViewType = "active" | "winners";
export type TimeFilter =
  | "today"
  | "past_week"
  | "past_month"
  | "past_year"
  | "all_time";

interface PlayerLeaderboardProps {
  sessions: GameSession[];
  emptyMessage?: string;
  delay?: number;
}

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: "Today",
  past_week: "Past week",
  past_month: "Past month",
  past_year: "Past year",
  all_time: "All time",
};

const VIEW_CONFIG: Record<
  ViewType,
  { title: string; icon: React.ReactNode; valueSuffix: string }
> = {
  active: {
    title: "Most Active Players",
    icon: <Users className="w-4 h-4 text-primary" />,
    valueSuffix: " games",
  },
  winners: {
    title: "Biggest Winners",
    icon: <Trophy className="w-4 h-4 text-amber-500" />,
    valueSuffix: "%",
  },
};

const DEFAULT_VISIBLE_COUNT = 5;

const getTimeFilterDate = (filter: TimeFilter): Date | null => {
  const now = new Date();
  switch (filter) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "past_week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case "past_month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    case "past_year":
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return yearAgo;
    case "all_time":
      return null;
  }
};

const PlayerLeaderboard: React.FC<PlayerLeaderboardProps> = ({
  sessions,
  emptyMessage = "No data available",
  delay = 0,
}) => {
  const [viewType, setViewType] = useState<ViewType>("active");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("past_month");
  const [isExpanded, setIsExpanded] = useState(false);

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return {
          badge:
            "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30",
          text: "text-amber-600 dark:text-amber-400",
          avatar: "ring-2 ring-amber-400",
        };
      case 2:
        return {
          badge:
            "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-gray-400/30",
          text: "text-gray-600 dark:text-gray-400",
          avatar: "ring-2 ring-gray-400",
        };
      case 3:
        return {
          badge:
            "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-700/30",
          text: "text-amber-700 dark:text-amber-500",
          avatar: "ring-2 ring-amber-600",
        };
      default:
        return {
          badge: "bg-muted text-muted-foreground",
          text: "",
          avatar: "",
        };
    }
  };

  // Filter sessions by time and compute player stats
  const filteredPlayers = useMemo(() => {
    const filterDate = getTimeFilterDate(timeFilter);

    // Filter sessions by date
    const filteredSessions = filterDate
      ? sessions.filter((session) => new Date(session.datePlayed) >= filterDate)
      : sessions;

    // Compute player stats from filtered sessions
    const playerStats: Record<
      number,
      {
        username: string;
        firstName: string;
        lastName: string;
        image: string | null;
        gamesPlayed: number;
        wins: number;
      }
    > = {};

    filteredSessions.forEach((session) => {
      session.players.forEach((player) => {
        if (!playerStats[player.profileId]) {
          playerStats[player.profileId] = {
            username: player.username,
            firstName: player.firstName,
            lastName: player.lastName,
            image: player.image,
            gamesPlayed: 0,
            wins: 0,
          };
        }
        playerStats[player.profileId].gamesPlayed++;
        if (player.isWinner) {
          playerStats[player.profileId].wins++;
        }
      });
    });

    return Object.entries(playerStats).map(([id, data]) => ({
      id: parseInt(id),
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      image: data.image,
      gamesPlayed: data.gamesPlayed,
      wins: data.wins,
    }));
  }, [sessions, timeFilter]);

  // Sort and process players based on view type
  const sortedPlayers = useMemo(() => {
    return [...filteredPlayers]
      .map((player) => ({
        ...player,
        value:
          viewType === "active"
            ? player.gamesPlayed
            : player.gamesPlayed > 0
              ? Math.round((player.wins / player.gamesPlayed) * 100)
              : 0,
        secondaryText:
          viewType === "active"
            ? `${player.wins} wins`
            : `${player.gamesPlayed} games`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredPlayers, viewType]);

  const visiblePlayers = isExpanded
    ? sortedPlayers
    : sortedPlayers.slice(0, DEFAULT_VISIBLE_COUNT);

  const hasMorePlayers = sortedPlayers.length > DEFAULT_VISIBLE_COUNT;
  const isEmpty = filteredPlayers.length === 0;
  const config = VIEW_CONFIG[viewType];

  const renderPlayerItem = (
    player: (typeof sortedPlayers)[0],
    index: number,
  ) => {
    const position = index + 1;
    const isTopThree = position <= 3;
    const styles = getPositionStyle(position);

    return (
      <motion.div
        key={player.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, delay: delay + index * 0.03 }}
        className={cn(
          "flex items-center gap-3 py-2.5 px-2 rounded-lg transition-colors",
          isTopThree && "bg-muted/40",
        )}
      >
        {/* Position number */}
        <div
          className={cn(
            "flex items-center justify-center rounded-full text-xs font-bold shadow-sm shrink-0",
            isTopThree ? "w-7 h-7" : "w-6 h-6",
            styles.badge,
          )}
        >
          {position}
        </div>

        {/* Avatar */}
        <Avatar
          className={cn(
            isTopThree ? "w-10 h-10" : "w-8 h-8",
            isTopThree && styles.avatar,
          )}
        >
          <AvatarImage
            src={player.image || ""}
            alt={player.username}
            className="object-cover"
          />
          <AvatarFallback
            className={cn(
              "bg-primary/10 text-primary font-medium",
              isTopThree ? "text-sm" : "text-xs",
            )}
          >
            {player.firstName[0]}
          </AvatarFallback>
        </Avatar>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "truncate",
              isTopThree ? "font-semibold text-sm" : "font-medium text-sm",
              isTopThree && styles.text,
            )}
          >
            {player.firstName} {player.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {player.secondaryText}
          </p>
        </div>

        {/* Value */}
        <div className="text-right shrink-0">
          <p
            className={cn(
              isTopThree
                ? "font-bold text-base"
                : "font-medium text-sm text-muted-foreground",
              isTopThree && styles.text,
            )}
          >
            {player.value}
            {config.valueSuffix}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full">
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between gap-2">
            {/* View Type Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 hover:bg-muted/50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    {config.icon}
                  </div>
                  <CardTitle className="text-lg">{config.title}</CardTitle>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setViewType("active")}>
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  Most Active Players
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewType("winners")}>
                  <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                  Biggest Winners
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Time Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {TIME_FILTER_LABELS[timeFilter]}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Calendar className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map(
                    (filter) => (
                      <DropdownMenuItem
                        key={filter}
                        onClick={() => setTimeFilter(filter)}
                        className={cn(
                          timeFilter === filter && "bg-muted font-medium",
                        )}
                      >
                        {TIME_FILTER_LABELS[filter]}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <>
              {/* Player list with scroll when expanded */}
              <div
                className={cn(
                  "space-y-1",
                  isExpanded && "max-h-80 overflow-y-auto pr-1",
                )}
              >
                <AnimatePresence mode="popLayout">
                  {visiblePlayers.map((player, index) =>
                    renderPlayerItem(player, index),
                  )}
                </AnimatePresence>
              </div>

              {/* Show more/less button */}
              {hasMorePlayers && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.3 }}
                  className="mt-3 pt-3 border-t"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        Show less
                        <ChevronUp className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Show {sortedPlayers.length - DEFAULT_VISIBLE_COUNT} more
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerLeaderboard;
