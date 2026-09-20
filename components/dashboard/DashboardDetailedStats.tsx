"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { Crown, Dices, Medal, Swords, Trophy, User, Users } from "lucide-react";
import { HandshakeIcon, SwordIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GroupedSession } from "@/lib/interfaces";
import type { FavouriteGame } from "@/db/schema/profile";
import type { GameMeta } from "@/app/(account)/dashboard/action";
import { useIsMobile } from "@/hooks/use-mobile";
import DotsIcon from "@/components/icons/DotsIcon";
import {
  GameThumb,
  HeaderIcon,
  OutcomeCircle,
  Pager,
  SessionResult,
  SessionType,
  sessionResult,
  sessionType,
} from "./stats/shared";
import GamesTab from "./stats/GamesTab";
import RecordsTab from "./stats/RecordsTab";

interface DashboardDetailedStatsProps {
  userId: number;
  sessions: GroupedSession[];
  favouriteGames?: FavouriteGame[];
  gameMeta: GameMeta;
  delay?: number;
}

const TAB_TRIGGER =
  "flex-none rounded-none border-0 border-b-2 border-transparent px-4 py-3 font-bold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary dark:data-[state=active]:text-primary data-[state=active]:shadow-none sm:px-5";

const TYPE_OPTIONS: { value: SessionType; label: string }[] = [
  { value: "all", label: "All Types" },
  { value: "competitive", label: "Competitive" },
  { value: "cooperative", label: "Cooperative" },
  { value: "solo", label: "Solo" },
];

const RESULT_OPTIONS: { value: SessionResult; label: string }[] = [
  { value: "all", label: "All Results" },
  { value: "win", label: "Win" },
  { value: "loss", label: "Loss" },
  { value: "tied", label: "Tied" },
];

const TypeIcon: React.FC<{ session: GroupedSession }> = ({ session }) => {
  const type = sessionType(session);
  const icon =
    type === "solo" ? (
      <User className="size-4" />
    ) : type === "cooperative" ? (
      <HandshakeIcon weight="fill" className="size-4" />
    ) : (
      <SwordIcon weight="fill" className="size-4" />
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex text-muted-foreground">{icon}</span>
      </TooltipTrigger>
      <TooltipContent className="capitalize">{type}</TooltipContent>
    </Tooltip>
  );
};

const sessionStats = (session: GroupedSession, userId: number) => {
  const me = session.players.find((p) => p.profileId === userId);
  const vps = session.players
    .map((p) => p.victoryPoints)
    .filter((v): v is number => v !== null);

  return {
    myVp:
      session.isVp &&
      me?.victoryPoints !== null &&
      me?.victoryPoints !== undefined
        ? String(me.victoryPoints)
        : "—",
    winningVp: session.isVp && vps.length > 0 ? String(Math.max(...vps)) : "—",
    wpa:
      me?.score !== null && me?.score !== undefined ? me.score.toFixed(2) : "—",
  };
};

const PlayersDice: React.FC<{ session: GroupedSession }> = ({ session }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="inline-flex text-muted-foreground">
        <DotsIcon
          value={session.players.length}
          className="mr-0 **:data-dot:bg-current"
        />
      </div>
    </TooltipTrigger>
    <TooltipContent>{session.players.length} players</TooltipContent>
  </Tooltip>
);

const HighScoreMark: React.FC<{ session: GroupedSession }> = ({ session }) =>
  session.isHighScore ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Trophy className="size-4 shrink-0 text-amber-500" />
      </TooltipTrigger>
      <TooltipContent>Highest VP for this game</TooltipContent>
    </Tooltip>
  ) : null;

const DashboardDetailedStats: React.FC<DashboardDetailedStatsProps> = ({
  userId,
  sessions,
  favouriteGames = [],
  gameMeta,
  delay = 0,
}) => {
  const isMobile = useIsMobile();
  const pageSize = isMobile ? 5 : 10;

  const [type, setType] = useState<SessionType>("all");
  const [result, setResult] = useState<SessionResult>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (type === "all" || sessionType(s) === type) &&
          (result === "all" || (s.isPlayer && sessionResult(s) === result)),
      ),
    [sessions, type, result],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));

  // Changing the filter resets the pagination
  useEffect(() => {
    setPage(1);
  }, [type, result, pageSize]);

  const pageRows = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full gap-0 py-0">
        <CardContent className="flex h-full flex-col p-0">
          <Tabs defaultValue="sessions" className="flex flex-1 flex-col gap-0">
            <TabsList className="no-scrollbar h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
              <TabsTrigger value="sessions" className={TAB_TRIGGER}>
                Sessions
              </TabsTrigger>
              <TabsTrigger value="games" className={TAB_TRIGGER}>
                Games
              </TabsTrigger>
              <TabsTrigger value="records" className={TAB_TRIGGER}>
                Records
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as SessionType)}
                >
                  <SelectTrigger size="sm" aria-label="Filter by session type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={result}
                  onValueChange={(v) => setResult(v as SessionResult)}
                >
                  <SelectTrigger size="sm" aria-label="Filter by result">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESULT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Dices className="mb-2 size-10 opacity-50" />
                  <p className="text-sm">No sessions match these filters</p>
                </div>
              ) : (
                <>
                  {/* ---- Mobile: one card per session -------------------- */}
                  <div className="space-y-3 md:hidden">
                    {pageRows.map((session) => {
                      const stats = sessionStats(session, userId);
                      return (
                        <div
                          key={session.sessionId}
                          className="rounded-lg border bg-muted/30 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <GameThumb
                              image={session.gameImage}
                              title={session.gameTitle}
                              className="size-12"
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate font-medium"
                                title={session.gameTitle}
                              >
                                {session.gameTitle}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <TypeIcon session={session} />
                                {format(
                                  new Date(session.datePlayed),
                                  "d MMM yyyy",
                                )}
                              </p>
                            </div>
                            <HighScoreMark session={session} />
                            <OutcomeCircle session={session} />
                          </div>

                          <div className="mt-3 grid grid-cols-4 gap-2 border-t pt-3 text-center">
                            <div>
                              <HeaderIcon label="Players">
                                <Users className="size-3.5" />
                              </HeaderIcon>
                              <div className="mt-1 flex justify-center">
                                <PlayersDice session={session} />
                              </div>
                            </div>
                            <div>
                              <HeaderIcon label="Your VP">
                                <User className="size-3.5" />
                              </HeaderIcon>
                              <p className="mt-1 text-sm font-medium tabular-nums">
                                {stats.myVp}
                              </p>
                            </div>
                            <div>
                              <HeaderIcon label="Winning VP">
                                <Crown className="size-3.5" />
                              </HeaderIcon>
                              <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                                {stats.winningVp}
                              </p>
                            </div>
                            <div>
                              <HeaderIcon label="WPA">
                                <Swords className="size-3.5" />
                              </HeaderIcon>
                              <p className="mt-1 text-sm tabular-nums text-accent-4">
                                {stats.wpa}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ---- Desktop: table ------------------------------ */}
                  <div className="no-scrollbar hidden overflow-x-auto md:block">
                    <Table>
                      {/* Icon-only headers; tooltips carry the labels */}
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead className="w-24" />
                          <TableHead />
                          <TableHead className="w-10">
                            <HeaderIcon label="Players">
                              <Users className="size-4" />
                            </HeaderIcon>
                          </TableHead>
                          <TableHead className="w-12 text-center">
                            <HeaderIcon label="Result">
                              <Medal className="size-4" />
                            </HeaderIcon>
                          </TableHead>
                          <TableHead className="w-14 text-right">
                            <HeaderIcon label="Your VP">
                              <User className="size-4" />
                            </HeaderIcon>
                          </TableHead>
                          <TableHead className="w-14 text-right">
                            <HeaderIcon label="Winning VP">
                              <Crown className="size-4" />
                            </HeaderIcon>
                          </TableHead>
                          <TableHead className="w-16 text-right">
                            <HeaderIcon label="WPA">
                              <Swords className="size-4" />
                            </HeaderIcon>
                          </TableHead>
                          <TableHead className="w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageRows.map((session) => {
                          const stats = sessionStats(session, userId);

                          return (
                            <TableRow
                              key={session.sessionId}
                              className="transition-colors hover:bg-muted/50"
                            >
                              <TableCell className="w-8">
                                <TypeIcon session={session} />
                              </TableCell>
                              <TableCell className="w-24 whitespace-nowrap text-sm text-muted-foreground">
                                {format(
                                  new Date(session.datePlayed),
                                  "d MMM yyyy",
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <GameThumb
                                    image={session.gameImage}
                                    title={session.gameTitle}
                                    className="size-8"
                                  />
                                  <span
                                    className="block max-w-40 truncate font-medium sm:max-w-60"
                                    title={session.gameTitle}
                                  >
                                    {session.gameTitle}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="w-10">
                                <PlayersDice session={session} />
                              </TableCell>
                              <TableCell className="w-12 text-center">
                                <OutcomeCircle session={session} />
                              </TableCell>
                              <TableCell className="w-14 text-right font-medium tabular-nums">
                                {stats.myVp}
                              </TableCell>
                              <TableCell className="w-14 text-right tabular-nums text-muted-foreground">
                                {stats.winningVp}
                              </TableCell>
                              <TableCell className="w-16 text-right tabular-nums text-accent-4">
                                {stats.wpa}
                              </TableCell>
                              <TableCell className="w-8">
                                <HighScoreMark session={session} />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              <Pager page={page} pageCount={pageCount} onChange={setPage} />
            </TabsContent>

            <TabsContent value="games" className="p-4 sm:p-5">
              <GamesTab
                userId={userId}
                sessions={sessions}
                favouriteGames={favouriteGames}
              />
            </TabsContent>

            <TabsContent value="records" className="flex flex-col p-4 sm:p-5">
              <RecordsTab
                userId={userId}
                sessions={sessions}
                gameMeta={gameMeta}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardDetailedStats;
