"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { TrendingUp, Flame, ChevronRight, Dices } from "lucide-react";

// Shared types
export interface LeaderboardPlayer {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  /** Primary value used for sorting and display */
  value: number;
  /** Optional secondary info shown below the name */
  secondaryText?: string;
}

export interface LeaderboardGame {
  gameId: string;
  gameTitle: string;
  playCount: number;
  uniquePlayers: number;
}

interface BaseLeaderboardProps {
  title: string;
  icon: React.ReactNode;
  emptyMessage?: string;
  delay?: number;
  onShowMore?: () => void;
}

interface PlayerLeaderboardProps extends BaseLeaderboardProps {
  type: "player";
  items: LeaderboardPlayer[];
  /** Suffix shown after the value (e.g., "games", "%", "wins") */
  valueSuffix: string;
}

interface GameLeaderboardProps extends BaseLeaderboardProps {
  type: "game";
  items: LeaderboardGame[];
}

type LeaderboardProps = PlayerLeaderboardProps | GameLeaderboardProps;

/**
 * Leaderboard - Podium-style leaderboard with top 3 highlighted
 *
 * Design decisions:
 * - Podium layout for top 3 (1st in center, elevated)
 * - 2nd and 3rd flanking 1st place with different heights
 * - Positions 4-6 shown in a simple list below
 * - Empty slots show dashes when fewer than 3 players
 * - "Show more" button for navigation to full leaderboard
 * - Gradient backgrounds for podium positions
 */
const Leaderboard: React.FC<LeaderboardProps> = (props) => {
  const {
    title,
    icon,
    emptyMessage = "No data available",
    delay = 0,
    onShowMore,
  } = props;

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-gray-400/30";
      case 3:
        return "bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-amber-700/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1:
        return "h-20";
      case 2:
        return "h-14";
      case 3:
        return "h-10";
      default:
        return "h-8";
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-t from-amber-500 to-amber-400";
      case 2:
        return "bg-gradient-to-t from-gray-400 to-gray-300";
      case 3:
        return "bg-gradient-to-t from-amber-700 to-amber-600";
      default:
        return "bg-muted";
    }
  };

  // Render a single podium player (for top 3)
  const renderPodiumPlayer = (
    player: LeaderboardPlayer | undefined,
    position: number,
  ) => {
    const hasPlayer = !!player;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay + position * 0.1 }}
        className={cn(
          "flex flex-col items-center",
          position === 1 ? "order-2" : position === 2 ? "order-1" : "order-3",
        )}
      >
        {/* Avatar and info */}
        <div className="flex flex-col items-center mb-2">
          {hasPlayer ? (
            <>
              <div className="relative">
                <Avatar
                  className={cn(
                    "ring-2 ring-background shadow-lg",
                    position === 1 ? "w-16 h-16" : "w-12 h-12",
                  )}
                >
                  <AvatarImage
                    src={player.image || ""}
                    alt={player.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {player.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                {/* Position badge on avatar */}
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md",
                    getPositionStyle(position),
                  )}
                >
                  {position}
                </div>
              </div>
              <p
                className={cn(
                  "font-semibold mt-2 text-center truncate max-w-[80px]",
                  position === 1 ? "text-sm" : "text-xs",
                )}
              >
                {player.firstName}
              </p>
              <p className="text-xs text-muted-foreground">
                {`${player.value}${(props as PlayerLeaderboardProps).valueSuffix}` ||
                  player.secondaryText}
              </p>
            </>
          ) : (
            <>
              {/* Empty placeholder */}
              <div
                className={cn(
                  "rounded-full bg-muted flex items-center justify-center",
                  position === 1 ? "w-16 h-16" : "w-12 h-12",
                )}
              >
                <span className="text-muted-foreground text-lg">—</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">—</p>
              <p className="text-xs text-muted-foreground">—</p>
            </>
          )}
        </div>

        {/* Podium block */}
        <div
          className={cn(
            "w-20 rounded-t-lg flex items-start justify-center pt-2",
            getPodiumHeight(position),
            getPodiumColor(position),
          )}
        >
          <span className="text-white font-bold text-lg">{position}</span>
        </div>
      </motion.div>
    );
  };

  // Render players 4-6 in a list
  const renderRunnerUpItem = (player: LeaderboardPlayer, index: number) => {
    const position = index + 4;

    return (
      <motion.div
        key={player.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: delay + 0.4 + index * 0.05 }}
        className="flex items-center gap-3 py-2 px-1"
      >
        {/* Position number */}
        <div
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
            getPositionStyle(position),
          )}
        >
          {position}
        </div>

        {/* Avatar */}
        <Avatar className="w-8 h-8">
          <AvatarImage
            src={player.image || ""}
            alt={player.username}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {player.firstName[0]}
          </AvatarFallback>
        </Avatar>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{player.firstName}</p>
        </div>

        {/* Stats */}
        <p className="text-sm text-muted-foreground">
          {`${player.value}${(props as PlayerLeaderboardProps).valueSuffix}` ||
            player.secondaryText}
        </p>
      </motion.div>
    );
  };

  // Render game item (unchanged for games leaderboard)
  const renderGameItem = (game: LeaderboardGame, index: number) => {
    const position = index + 1;
    const maxPlays =
      props.type === "game"
        ? Math.max(...props.items.map((g) => g.playCount))
        : 1;
    const percentage = (game.playCount / maxPlays) * 100;

    return (
      <motion.div
        key={game.gameId}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: delay + index * 0.05 }}
        className={cn(
          "p-3 rounded-xl transition-colors",
          "hover:bg-muted/50",
          position <= 3 && "bg-muted/30",
        )}
      >
        <div className="flex items-center gap-3 mb-2">
          {/* Position badge */}
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-lg shrink-0",
              getPositionStyle(position),
            )}
          >
            {position}
          </div>

          {/* Game icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Dices className="w-5 h-5 text-primary" />
          </div>

          {/* Game info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{game.gameTitle}</p>
              {position === 1 && <Flame className="w-4 h-4 text-orange-500" />}
            </div>
            <p className="text-xs text-muted-foreground">
              {game.uniquePlayers} players
            </p>
          </div>

          {/* Play count */}
          <Badge variant="secondary" className="shrink-0">
            {game.playCount} plays
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-muted rounded-full overflow-hidden ml-11">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, delay: delay + index * 0.05 + 0.2 }}
          />
        </div>
      </motion.div>
    );
  };

  const isEmpty = props.items.length === 0;

  // For player leaderboards, render podium style
  if (props.type === "player") {
    // Sort items by value descending before slicing
    const sortedItems = [...props.items].sort((a, b) => b.value - a.value);
    const top3 = sortedItems.slice(0, 3);
    const runnerUps = sortedItems.slice(3, 6);

    // Pad top3 to always have 3 slots
    const player1 = top3[0];
    const player2 = top3[1];
    const player3 = top3[2];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
      >
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  {icon}
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
              {onShowMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={onShowMore}
                >
                  Show more
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
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
                {/* Podium section */}
                <div className="flex items-end justify-center gap-2 mb-4 pt-4">
                  {renderPodiumPlayer(player2, 2)}
                  {renderPodiumPlayer(player1, 1)}
                  {renderPodiumPlayer(player3, 3)}
                </div>

                {/* Runners up (4-6) */}
                {runnerUps.length > 0 && (
                  <div className="border-t pt-3 mt-2">
                    {runnerUps.map((player, index) =>
                      renderRunnerUpItem(player, index),
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // For game leaderboards, keep the original list style
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                {icon}
              </div>
              <CardTitle className="text-lg">{title}</CardTitle>
            </div>
            {onShowMore && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={onShowMore}
              >
                Show more
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {props.items.map((game, index) => renderGameItem(game, index))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Leaderboard;
