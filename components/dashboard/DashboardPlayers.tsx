"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { ChevronDown, Dices, Info, Skull, Swords } from "lucide-react";
import { HandshakeIcon } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";

interface DashboardPlayersProps {
  userId: number;
  // Sessions narrowed to active timeframe
  sessions: GroupedSession[];
  delay?: number;
}

// Rows shown before the "+N more" footer
const ROW_LIMIT = 6;

// Head-to-head games needed before Rival/ Nemesis can be awarded, and
// shared wins before Ally can
const MIN_H2H = 4;
const MIN_ALLY_WINS = 4;

interface Tally<T> {
  key: T;
  count: number;
}

interface PlayerStats {
  profileId: number;
  firstName: string;
  lastName: string;
  profilePic: string;
  games: number;
  // Competitive games against opposing player
  h2h: { wins: number; ties: number; losses: number };
  // Coop games from same-team games
  together: { games: number; wins: number };
  lastPlayed: Date;
  tribes: string[];
  topGame: { title: string; image: string | null } | null;
}

type Title = "rival" | "nemesis" | "ally";

const TITLES: Record<
  Title,
  { label: string; hint: string; icon: React.ReactNode; className: string }
> = {
  rival: {
    label: "Rival",
    hint: "Your most frequent head-to-head opponent",
    icon: <Swords className="size-3" />,
    className: "bg-accent-3/15 text-accent-3",
  },
  nemesis: {
    label: "Nemesis",
    hint: "Beats you more than anyone else",
    icon: <Skull className="size-3" />,
    className: "bg-destructive/15 text-destructive",
  },
  ally: {
    label: "Ally",
    hint: "Most wins alongside you",
    icon: <HandshakeIcon weight="fill" className="size-3" />,
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  },
};

const h2hGames = (p: PlayerStats) => p.h2h.wins + p.h2h.ties + p.h2h.losses;

// Component
const DashboardPlayers: React.FC<DashboardPlayersProps> = ({
  userId,
  sessions,
  delay = 0,
}) => {
  const [openId, setOpenId] = useState<number | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const { players, hidden, titles } = useMemo(() => {
    const byPlayer = new Map<
      number,
      PlayerStats & {
        tribes_: Map<string, string>;
        games_: Map<number, Tally<{ title: string; image: string | null }>>;
      }
    >();

    for (const session of sessions) {
      if (!session.isPlayer) continue;
      const me = session.players.find((p) => p.profileId === userId);
      if (!me) continue;
      const date = new Date(session.datePlayed);

      for (const p of session.players) {
        if (p.profileId === userId) continue;

        const entry = byPlayer.get(p.profileId) ?? {
          profileId: p.profileId,
          firstName: p.firstName,
          lastName: p.lastName,
          profilePic: p.profilePic,
          games: 0,
          h2h: { wins: 0, ties: 0, losses: 0 },
          together: { games: 0, wins: 0 },
          lastPlayed: date,
          tribes: [],
          topGame: null,
          tribes_: new Map(),
          games_: new Map(),
        };

        entry.games += 1;
        if (date > entry.lastPlayed) entry.lastPlayed = date;
        entry.tribes_.set(session.tribeId, session.tribe);

        const game = entry.games_.get(session.gameId) ?? {
          key: { title: session.gameTitle, image: session.gameImage },
          count: 0,
        };
        game.count += 1;
        entry.games_.set(session.gameId, game);

        // Same side: co-op, or the same team in a team game
        const sameSide =
          session.coop || (me.teamId !== null && me.teamId === p.teamId);
        if (sameSide) {
          entry.together.games += 1;
          if (session.isWinner) entry.together.wins += 1;
        } else if (me.position < p.position) {
          entry.h2h.wins += 1;
        } else if (me.position > p.position) {
          entry.h2h.losses += 1;
        } else {
          entry.h2h.ties += 1;
        }

        byPlayer.set(p.profileId, entry);
      }
    }

    const all = [...byPlayer.values()]
      .map<PlayerStats>(({ tribes_, games_, ...rest }) => ({
        ...rest,
        tribes: [...tribes_.values()].sort((a, b) => a.localeCompare(b)),
        topGame:
          [...games_.values()].sort((a, b) => b.count - a.count)[0]?.key ??
          null,
      }))
      .sort(
        (a, b) =>
          b.games - a.games || b.lastPlayed.getTime() - a.lastPlayed.getTime(),
      );

    // Titles are judged across everyone in the timeframe, not just the rows shown
    const titles = new Map<number, Title[]>();
    const award = (id: number | undefined, title: Title) => {
      if (id === undefined) return;
      titles.set(id, [...(titles.get(id) ?? []), title]);
    };

    const contested = all.filter((p) => h2hGames(p) >= MIN_H2H);
    award(
      [...contested].sort((a, b) => h2hGames(b) - h2hGames(a))[0]?.profileId,
      "rival",
    );
    award(
      [...contested]
        .filter((p) => p.h2h.losses > p.h2h.wins)
        .sort(
          (a, b) => b.h2h.losses - b.h2h.wins - (a.h2h.losses - a.h2h.wins),
        )[0]?.profileId,
      "nemesis",
    );
    award(
      [...all]
        .filter((p) => p.together.wins >= MIN_ALLY_WINS)
        .sort((a, b) => b.together.wins - a.together.wins)[0]?.profileId,
      "ally",
    );

    const shown = all.slice(0, ROW_LIMIT);
    return { players: shown, hidden: all.length - shown.length, titles };
  }, [sessions, userId]);

  const toggle = (id: number) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full gap-0 py-0">
        <CardContent className="flex h-full flex-col p-0">
          {/* ---- Header ---------------------------------------- */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="font-bold">Players</span>
            <Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex text-muted-foreground"
                  onClick={(e) => {
                    e.preventDefault();
                    setInfoOpen((o) => !o);
                  }}
                >
                  <Info className="size-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">
                Players you challenged within this timeframe. Bar represents
                your head-to-head record against them. Co-op and team games
                count as played together.
              </TooltipContent>
            </Tooltip>
          </div>

          {players.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground">
              <Dices className="mb-2 size-10 opacity-50" />
              <p className="text-sm">No other players for this timeframe</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y">
              {players.map((player) => {
                const open = openId === player.profileId;
                const contested = h2hGames(player);
                const held = titles.get(player.profileId) ?? [];

                return (
                  <li key={player.profileId}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={open}
                      onClick={() => toggle(player.profileId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(player.profileId);
                        }
                      }}
                      className={cn(
                        "grid cursor-pointer select-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-5",
                        "md:grid-cols-[auto_minmax(0,11rem)_minmax(0,1fr)_auto]",
                      )}
                    >
                      {/* ── Avatar ─────────────────────────────────────── */}
                      <Avatar className="col-start-1 row-start-1 size-10">
                        <AvatarImage
                          src={player.profilePic}
                          alt=""
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                          {player.firstName[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* ── Name, titles, meta ─────────────────────────── */}
                      <div className="col-start-2 row-start-1 min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p
                            className="truncate font-medium"
                            title={`${player.firstName} ${player.lastName}`}
                          >
                            {player.firstName}
                          </p>
                          {held.map((t) => (
                            <Tooltip key={t}>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(
                                    "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                                    TITLES[t].className,
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {TITLES[t].icon}
                                  {TITLES[t].label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{TITLES[t].hint}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="tabular-nums">{player.games}</span>{" "}
                          {player.games === 1 ? "game" : "games"}
                          <span className="text-muted-foreground/60"> · </span>
                          {formatDistanceToNowStrict(player.lastPlayed, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* ── Head-to-head bar. Own row on mobile, inline on
                             desktop ────────────────────────────────────── */}
                      <div className="col-span-3 row-start-2 flex items-center gap-2 md:col-span-1 md:col-start-3 md:row-start-1">
                        {contested === 0 ? (
                          <div className="flex h-2.5 flex-1 items-center">
                            <div className="h-1 flex-1 rounded-full bg-foreground/8" />
                            <span className="ml-2 text-xs text-muted-foreground">
                              Same side only
                            </span>
                          </div>
                        ) : (
                          <>
                            <span className="w-5 text-right text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                              {player.h2h.wins}
                            </span>
                            <div className="relative flex-1">
                              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                                {(
                                  [
                                    [
                                      player.h2h.wins,
                                      "bg-emerald-500",
                                      `You beat ${player.firstName} ${player.h2h.wins} of ${contested} times`,
                                    ],
                                    [
                                      player.h2h.ties,
                                      "bg-amber-500",
                                      `${player.h2h.ties} of ${contested} tied`,
                                    ],
                                    [
                                      player.h2h.losses,
                                      "bg-destructive",
                                      `${player.firstName} beat you ${player.h2h.losses} of ${contested} times`,
                                    ],
                                  ] as const
                                ).map(([count, className, hint]) =>
                                  count > 0 ? (
                                    <Tooltip key={className}>
                                      <TooltipTrigger asChild>
                                        <span
                                          className={cn(
                                            "h-full cursor-help",
                                            className,
                                          )}
                                          style={{ flex: count }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>{hint}</TooltipContent>
                                    </Tooltip>
                                  ) : null,
                                )}
                              </div>
                              {/* Centre tick: green past it means you lead */}
                              <span
                                aria-hidden
                                className="pointer-events-none absolute -top-1 left-1/2 h-[calc(100%+0.5rem)] w-px -translate-x-1/2 bg-foreground/50"
                              />
                            </div>
                            <span className="w-5 text-xs font-semibold tabular-nums text-destructive">
                              {player.h2h.losses}
                            </span>
                          </>
                        )}
                      </div>

                      <ChevronDown
                        className={cn(
                          "col-start-3 row-start-1 size-4 text-muted-foreground transition-transform md:col-start-4",
                          open && "rotate-180",
                        )}
                      />
                    </div>

                    {/* ── Expanded detail ────────────────────────────────── */}
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          key="detail"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-muted/30 px-4 pt-3 pb-4 text-sm sm:grid-cols-4 sm:px-5">
                            <div>
                              <p className="text-xs text-muted-foreground">
                                Head-to-head
                              </p>
                              <p className="mt-0.5 font-display text-xl font-bold leading-none tabular-nums">
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  {player.h2h.wins}W
                                </span>{" "}
                                <span className="text-amber-600 dark:text-amber-400">
                                  {player.h2h.ties}T
                                </span>{" "}
                                <span className="text-destructive">
                                  {player.h2h.losses}L
                                </span>
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Same side
                              </p>
                              <p className="mt-0.5 font-display text-xl font-bold leading-none tabular-nums">
                                {player.together.games > 0 ? (
                                  <>
                                    {player.together.wins}
                                    <span className="text-muted-foreground">
                                      /{player.together.games} won
                                    </span>
                                  </>
                                ) : (
                                  "—"
                                )}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Most played together
                              </p>
                              {player.topGame ? (
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="relative size-6 shrink-0 overflow-hidden rounded bg-muted">
                                    {player.topGame.image ? (
                                      <Image
                                        src={player.topGame.image}
                                        alt=""
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                      />
                                    ) : (
                                      <Dices className="m-1 size-4 text-muted-foreground opacity-50" />
                                    )}
                                  </div>
                                  <span
                                    className="truncate font-medium"
                                    title={player.topGame.title}
                                  >
                                    {player.topGame.title}
                                  </span>
                                </div>
                              ) : (
                                <p className="mt-1">—</p>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {player.tribes.length === 1
                                  ? "Tribe"
                                  : "Tribes"}
                              </p>
                              <p
                                className="mt-1 truncate font-medium"
                                title={player.tribes.join(", ")}
                              >
                                {player.tribes.join(", ")}
                              </p>
                            </div>

                            <p className="col-span-2 text-xs text-muted-foreground sm:col-span-4">
                              Last played together{" "}
                              {format(player.lastPlayed, "d MMM yyyy")}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}

          {hidden > 0 && (
            <p className="border-t px-5 py-2.5 text-xs text-muted-foreground">
              +{hidden} more {hidden === 1 ? "player" : "players"} in this
              timeframe
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardPlayers;
