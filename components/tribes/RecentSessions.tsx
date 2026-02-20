"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import {
  Dices,
  Calendar,
  Trophy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
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
    victoryPoints: number | null;
    winContrib: number | null;
    isFirstPlay?: boolean;
  }[];
}

export type TimeFilter =
  | "today"
  | "past_week"
  | "past_month"
  | "past_year"
  | "all_time";

interface RecentSessionsProps {
  sessions: GameSession[];
  currentUserId?: number;
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const GameImageCell: React.FC<{
  imageUrl?: string | null;
  gameTitle: string;
}> = ({ imageUrl, gameTitle }) => {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10 shrink-0">
        <Dices className="w-5 h-5 text-primary" />
      </div>
    );
  }

  return (
    <div className="hidden sm:block relative w-10 h-10 rounded-md overflow-hidden shrink-0">
      <Image
        src={imageUrl}
        alt={gameTitle}
        fill
        sizes="40px"
        className="object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions,
  currentUserId,
  emptyMessage = "No sessions found",
  delay = 0,
}) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("past_month");
  const [showOnlyMe, setShowOnlyMe] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter sessions by time and user
  const filteredSessions = useMemo(() => {
    const filterDate = getTimeFilterDate(timeFilter);

    let filtered = filterDate
      ? sessions.filter((session) => new Date(session.datePlayed) >= filterDate)
      : sessions;

    // Filter to only sessions where current user played
    if (showOnlyMe && currentUserId) {
      filtered = filtered.filter((session) =>
        session.players.some((p) => p.profileId === currentUserId),
      );
    }

    // Sort by date descending (most recent first)
    return [...filtered].sort(
      (a, b) =>
        new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime(),
    );
  }, [sessions, timeFilter, showOnlyMe, currentUserId]);

  const visibleSessions = isExpanded
    ? filteredSessions
    : filteredSessions.slice(0, DEFAULT_VISIBLE_COUNT);

  const hasMoreSessions = filteredSessions.length > DEFAULT_VISIBLE_COUNT;
  const isEmpty = filteredSessions.length === 0;

  const getWinner = (session: GameSession) => {
    return session.players.find((p) => p.isWinner);
  };

  const getCurrentUserInSession = (session: GameSession) => {
    if (!currentUserId) return null;
    return session.players.find((p) => p.profileId === currentUserId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Title */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <Dices className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-lg">Recent Sessions</CardTitle>
            </div>

            {/* Filters - User Toggle and Time Filter side by side */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              {/* User Toggle */}
              {currentUserId && (
                <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1.5 bg-muted/30">
                  <Label
                    htmlFor="user-filter"
                    className={cn(
                      "text-xs cursor-pointer transition-colors whitespace-nowrap",
                      !showOnlyMe
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    All Players
                  </Label>
                  <Switch
                    id="user-filter"
                    checked={showOnlyMe}
                    onCheckedChange={setShowOnlyMe}
                    size="sm"
                  />
                  <Label
                    htmlFor="user-filter"
                    className={cn(
                      "text-xs cursor-pointer transition-colors whitespace-nowrap",
                      showOnlyMe
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                    )}
                  >
                    Only Me
                  </Label>
                </div>
              )}

              {/* Time Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground inline">
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
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Dices className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <>
              {/* Sessions table with scroll when expanded */}
              <div
                className={cn(
                  "overflow-x-auto",
                  isExpanded && "max-h-96 overflow-y-auto",
                )}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Date</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Winner</TableHead>
                      {currentUserId && <TableHead>You</TableHead>}
                      <TableHead className="text-right">Winning VP</TableHead>
                      {currentUserId && (
                        <TableHead className="text-right">Your VP</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {visibleSessions.map((session, index) => {
                        const winner = getWinner(session);
                        const currentUser = getCurrentUserInSession(session);
                        const isCurrentUserWinner =
                          currentUser?.isWinner ?? false;

                        return (
                          <motion.tr
                            key={session.sessionId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{
                              duration: 0.3,
                              delay: delay + index * 0.03,
                            }}
                            className={cn(
                              "border-b transition-colors hover:bg-muted/50",
                              currentUser && "bg-primary/5",
                            )}
                          >
                            {/* Date */}
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(session.datePlayed)}
                            </TableCell>

                            {/* Game */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <GameImageCell
                                  imageUrl={session.gameImageUrl}
                                  gameTitle={session.gameTitle}
                                />
                                <span
                                  className="font-medium truncate max-w-[120px]"
                                  title={session.gameTitle}
                                >
                                  {session.gameTitle}
                                </span>
                              </div>
                            </TableCell>

                            {/* Winner */}
                            <TableCell>
                              {winner ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-7 h-7">
                                    <AvatarImage
                                      src={winner.image || ""}
                                      alt={winner.username}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-medium">
                                      {winner.firstName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex items-center gap-1.5">
                                    <Trophy className="w-3 h-3 text-amber-500" />
                                    <span
                                      className={cn(
                                        "text-sm font-medium truncate max-w-[80px]",
                                        winner.profileId === currentUserId &&
                                          "text-primary",
                                      )}
                                    >
                                      {winner.firstName}
                                    </span>
                                    {winner.isFirstPlay && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                      >
                                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                        1st
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>

                            {/* Current User Position */}
                            {currentUserId && (
                              <TableCell>
                                {currentUser ? (
                                  <div className="flex items-center gap-1.5">
                                    {isCurrentUserWinner && (
                                      <Trophy className="w-3 h-3 text-amber-500" />
                                    )}
                                    <span
                                      className={cn(
                                        "text-sm",
                                        isCurrentUserWinner
                                          ? "font-semibold text-amber-600 dark:text-amber-400"
                                          : "font-medium",
                                      )}
                                    >
                                      #{currentUser.position}
                                    </span>
                                    {currentUser.isFirstPlay && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] px-1 py-0 h-4 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                      >
                                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                                        1st
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            )}

                            {/* Winning VP */}
                            <TableCell className="text-right">
                              {winner?.victoryPoints !== null &&
                              winner?.victoryPoints !== undefined ? (
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                  {winner.victoryPoints} VP
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>

                            {/* Your VP */}
                            {currentUserId && (
                              <TableCell className="text-right">
                                {currentUser?.victoryPoints !== null &&
                                currentUser?.victoryPoints !== undefined ? (
                                  <span
                                    className={cn(
                                      "text-sm font-medium",
                                      isCurrentUserWinner
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-foreground",
                                    )}
                                  >
                                    {currentUser.victoryPoints} VP
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    —
                                  </span>
                                )}
                              </TableCell>
                            )}
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </div>

              {/* Show more/less button */}
              {hasMoreSessions && (
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
                        Show {filteredSessions.length - DEFAULT_VISIBLE_COUNT}{" "}
                        more
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

export default RecentSessions;
