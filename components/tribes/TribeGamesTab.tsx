"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Dices, Calendar, Users, Trophy } from "lucide-react";
import { format } from "date-fns";
import { GameSession } from "./TribeHomeTab";

interface TribeGamesTabProps {
  sessions: GameSession[];
}

/**
 * TribeGamesTab - Shows recent game sessions for the tribe
 *
 * Design decisions:
 * - Timeline-style layout shows game history chronologically
 * - Each session card shows game name, date, players, and winner
 * - Player avatars stacked horizontally for quick visual identification
 * - Winner highlighted with special badge and avatar ring
 * - Responsive design stacks info on mobile
 * - Infinite scroll potential for large histories
 * - Empty state encourages logging first game
 */
const TribeGamesTab: React.FC<TribeGamesTabProps> = ({ sessions }) => {
  // Sort by date, newest first
  const sortedSessions = [...sessions].sort(
    (a, b) =>
      new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime(),
  );

  const getWinner = (session: GameSession) => {
    return session.players.find((p) => p.isWinner);
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <Dices className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Game History</h2>
          <Badge variant="outline" className="ml-2">
            {sessions.length} sessions
          </Badge>
        </div>
      </motion.div>

      {/* Games List */}
      <div className="space-y-4">
        {sortedSessions.map((session, index) => {
          const winner = getWinner(session);
          const formattedDate = format(
            new Date(session.datePlayed),
            "MMM d, yyyy",
          );

          return (
            <motion.div
              key={session.sessionId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Game icon and info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
                        <Dices className="w-6 h-6 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base truncate">
                          {session.gameTitle}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formattedDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {session.players.length} players
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Players */}
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {session.players.slice(0, 5).map((player) => (
                          <Tooltip key={player.profileId}>
                            <TooltipTrigger asChild>
                              <Avatar
                                className={cn(
                                  "w-8 h-8 ring-2 ring-background cursor-pointer transition-transform hover:scale-110 hover:z-10",
                                  player.isWinner && "ring-amber-500",
                                )}
                              >
                                <AvatarImage
                                  src={player.image || ""}
                                  alt={player.username}
                                  className={cn(
                                    "object-cover",
                                    !player.isWinner && "grayscale-[30%]",
                                  )}
                                />
                                <AvatarFallback
                                  className={cn(
                                    "text-xs font-medium",
                                    player.isWinner
                                      ? "bg-amber-500/20 text-amber-600"
                                      : "bg-primary/10 text-primary",
                                  )}
                                >
                                  {player.firstName[0]}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {player.position === 1
                                  ? "Winner"
                                  : `${player.position}${getOrdinalSuffix(player.position)} place`}
                                {player.score !== null &&
                                  ` • ${player.score} pts`}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {session.players.length > 5 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-xs font-medium ring-2 ring-background">
                            +{session.players.length - 5}
                          </div>
                        )}
                      </div>

                      {/* Winner badge */}
                      {winner && (
                        <Badge
                          variant="default"
                          className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap"
                        >
                          <Trophy className="w-3 h-3 mr-1" />
                          {winner.firstName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Dices className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Games Recorded</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Start logging game sessions to build your tribe&apos;s history!
          </p>
        </motion.div>
      )}
    </div>
  );
};

// Helper function for ordinal suffixes
function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default TribeGamesTab;
