"use client";

import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Dices,
  Flame,
  Puzzle,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Tag,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import type { GameMeta } from "@/app/(account)/dashboard/action";
import { chronological, sessionResult, sessionType } from "./shared";

interface RecordsTabProps {
  userId: number;
  sessions: GroupedSession[];
  gameMeta: GameMeta;
}

// Games played together before someone can be your Dominating or Nemesis
const MIN_GAMES_TOGETHER = 4;
// Games listed on a rivalry card
const RECENT_GAMES = 3;

interface RecordTile {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Headline figure; null renders the empty state for this tile */
  value: string | null;
  /** Where or when it happened */
  context?: string;
}

interface Rivalry {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
  games: number;
  wins: number;
  ties: number;
  losses: number;
}

const day = (s: GroupedSession) => format(new Date(s.datePlayed), "d MMM yyyy");

// Head-to-head games and the user's win rate across them, 0–100
const contested = (r: Rivalry) => r.wins + r.ties + r.losses;
const h2hRate = (r: Rivalry) => (r.wins / contested(r)) * 100;

// Most frequent key in a tally, ties broken alphabetically
const mostFrequent = <T extends string | number>(
  tally: Map<T, number>,
): [T, number] | null =>
  [...tally.entries()].sort(
    (a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])),
  )[0] ?? null;

/**
 * RecordsTab - Personal bests and rivalries over the whole play history
 *
 * Records are moment in time bests or career bests
 * Ignores the timeframe filter
 */
const RecordsTab: React.FC<RecordsTabProps> = ({
  userId,
  sessions,
  gameMeta,
}) => {
  const { tiles, dominating, nemesis } = useMemo(() => {
    const played = chronological(sessions).filter((s) => s.isPlayer);
    const me = (s: GroupedSession) =>
      s.players.find((p) => p.profileId === userId);

    // Longest win streak
    let best = {
      length: 0,
      from: null as GroupedSession | null,
      to: null as GroupedSession | null,
    };
    let run = { length: 0, from: null as GroupedSession | null };
    // Biggest winning margin
    let topMargin: { value: number; session: GroupedSession } | null = null;
    // Highest single-session WPA
    let topWpa: { value: number; session: GroupedSession } | null = null;
    // Biggest table won
    let biggestTableWin: GroupedSession | null = null;
    // First play victories
    let firstPlays = 0;
    let firstPlayWins = 0;
    // Most played game/ mechanic/ category
    const playsByGame = new Map<number, number>();
    const titles = new Map<number, string>();
    const playsByMechanic = new Map<string, number>();
    const playsByCategory = new Map<string, number>();
    // Head-to-head per opponent
    const rivals = new Map<number, Rivalry>();

    for (const s of played) {
      const mine = me(s);
      const result = sessionResult(s);
      const competitive = sessionType(s) === "competitive";

      if (result === "win") {
        run = { length: run.length + 1, from: run.from ?? s };
        if (run.length > best.length) {
          best = { length: run.length, from: run.from, to: s };
        }
      } else {
        // Ties also end streaks
        run = { length: 0, from: null };
      }

      if (
        competitive &&
        result === "win" &&
        s.isVp &&
        mine?.victoryPoints !== null &&
        mine?.victoryPoints !== undefined
      ) {
        const others = s.players
          .filter((p) => p.profileId !== userId && p.victoryPoints !== null)
          .map((p) => p.victoryPoints as number);
        if (others.length > 0) {
          const margin = mine.victoryPoints - Math.max(...others);
          if (!topMargin || margin > topMargin.value) {
            topMargin = { value: margin, session: s };
          }
        }
      }

      if (mine?.score !== null && mine?.score !== undefined) {
        if (!topWpa || mine.score > topWpa.value) {
          topWpa = { value: mine.score, session: s };
        }
      }

      if (
        competitive &&
        result === "win" &&
        (!biggestTableWin || s.numPlayers > biggestTableWin.numPlayers)
      ) {
        biggestTableWin = s;
      }

      if (s.isFirstPlay) {
        firstPlays += 1;
        if (result === "win") firstPlayWins += 1;
      }

      playsByGame.set(s.gameId, (playsByGame.get(s.gameId) ?? 0) + 1);
      titles.set(s.gameId, s.gameTitle);
      for (const m of gameMeta.mechanics[s.gameId] ?? []) {
        playsByMechanic.set(m, (playsByMechanic.get(m) ?? 0) + 1);
      }
      for (const c of gameMeta.categories[s.gameId] ?? []) {
        playsByCategory.set(c, (playsByCategory.get(c) ?? 0) + 1);
      }

      // Same rules as the Players card: co-op and teammates aren't opponents
      if (mine) {
        for (const p of s.players) {
          if (p.profileId === userId) continue;
          const rival = rivals.get(p.profileId) ?? {
            profileId: p.profileId,
            firstName: p.firstName,
            lastName: p.lastName,
            username: p.username,
            profilePic: p.profilePic,
            games: 0,
            wins: 0,
            ties: 0,
            losses: 0,
          };
          rival.games += 1;
          const sameSide =
            s.coop || (mine.teamId !== null && mine.teamId === p.teamId);
          if (!sameSide) {
            if (mine.position < p.position) rival.wins += 1;
            else if (mine.position > p.position) rival.losses += 1;
            else rival.ties += 1;
          }
          rivals.set(p.profileId, rival);
        }
      }
    }

    const topGame = mostFrequent(playsByGame);
    const topMechanic = mostFrequent(playsByMechanic);
    const topCategory = mostFrequent(playsByCategory);

    const tiles: RecordTile[] = [
      {
        id: "streak",
        label: "Longest win streak",
        icon: <Flame className="size-4" />,
        value: best.length > 0 ? String(best.length) : null,
        context:
          best.from && best.to
            ? best.length === 1
              ? day(best.from)
              : `${day(best.from)} – ${day(best.to)}`
            : undefined,
      },
      {
        id: "margin",
        label: "Biggest winning margin",
        icon: <Zap className="size-4" />,
        value: topMargin ? `+${topMargin.value}` : null,
        context: topMargin
          ? `${topMargin.session.gameTitle} · ${day(topMargin.session)}`
          : undefined,
      },
      {
        id: "wpa",
        label: "Highest WPA",
        icon: <Swords className="size-4" />,
        value: topWpa ? topWpa.value.toFixed(2) : null,
        context: topWpa
          ? `${topWpa.session.gameTitle} · ${day(topWpa.session)}`
          : undefined,
      },
      {
        id: "game",
        label: "Most played game",
        icon: <Dices className="size-4" />,
        value: topGame ? String(topGame[1]) : null,
        context: topGame ? titles.get(topGame[0]) : undefined,
      },
      {
        id: "table",
        label: "Biggest table won",
        icon: <Users className="size-4" />,
        value: biggestTableWin ? `${biggestTableWin.numPlayers} players` : null,
        context: biggestTableWin ? biggestTableWin.gameTitle : undefined,
      },
      {
        id: "firstPlays",
        label: "First play victories",
        icon: <Sparkles className="size-4" />,
        value: firstPlays > 0 ? String(firstPlayWins) : null,
        context:
          firstPlays > 0
            ? `of ${firstPlays} first ${firstPlays === 1 ? "play" : "plays"}`
            : undefined,
      },
      {
        id: "mechanic",
        label: "Most played mechanic",
        icon: <Puzzle className="size-4" />,
        value: topMechanic ? String(topMechanic[1]) : null,
        context: topMechanic ? topMechanic[0] : undefined,
      },
      {
        id: "category",
        label: "Most played category",
        icon: <Tag className="size-4" />,
        value: topCategory ? String(topCategory[1]) : null,
        context: topCategory ? topCategory[0] : undefined,
      },
    ];

    // Considers head-to-head win rate: meaning another player must have
    // 1. enough games played together
    // 2. compares the win rate against the player
    // to qualify for this statistic
    const qualified = [...rivals.values()].filter(
      (r) => r.games >= MIN_GAMES_TOGETHER && contested(r) > 0,
    );
    const dominating =
      [...qualified].sort(
        (a, b) => h2hRate(b) - h2hRate(a) || contested(b) - contested(a),
      )[0] ?? null;
    const nemesis =
      [...qualified].sort(
        (a, b) => h2hRate(a) - h2hRate(b) || contested(b) - contested(a),
      )[0] ?? null;

    return { tiles, dominating, nemesis };
  }, [sessions, userId, gameMeta]);

  return (
    <div className="flex flex-1 flex-col gap-5">
      {/* Personal Bests */}
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.id}
            className="flex flex-col justify-between gap-3 rounded-lg border bg-muted/30 p-4"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-primary">{tile.icon}</span>
              {tile.label}
            </div>
            <p className="font-display text-4xl font-bold leading-none tabular-nums xl:text-5xl">
              {tile.value ?? <span className="text-muted-foreground">—</span>}
            </p>
            <p
              className="truncate text-xs text-muted-foreground"
              title={tile.context}
            >
              {tile.context ?? "Nothing recorded yet"}
            </p>
          </div>
        ))}
      </div>

      <Separator />

      {/* Rivalries */}
      <div className="grid gap-3 lg:grid-cols-2">
        <RivalryCard
          label="Dominating"
          icon={<Shield className="size-5 text-emerald-400" />}
          iconColor="bg-emerald-500/10"
          labelClass="text-emerald-400"
          rival={dominating}
          statLine={
            dominating
              ? `${Math.round(h2hRate(dominating))}% win rate · ${dominating.games} games`
              : ""
          }
          sessions={sessions}
          userId={userId}
        />
        <RivalryCard
          label="Nemesis"
          icon={<Flame className="size-5 text-red-400" />}
          iconColor="bg-red-500/10"
          labelClass="text-red-400"
          rival={nemesis}
          statLine={
            nemesis
              ? `${Math.round(h2hRate(nemesis))}% win rate · ${nemesis.games} games`
              : ""
          }
          sessions={sessions}
          userId={userId}
        />
      </div>
    </div>
  );
};

// ---- Rivalry card ------------------------------------------------------------
interface RivalryCardProps {
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  labelClass: string;
  rival: Rivalry | null;
  statLine: string;
  sessions: GroupedSession[];
  userId: number;
}

const RivalryCard: React.FC<RivalryCardProps> = ({
  label,
  icon,
  iconColor,
  labelClass,
  rival,
  statLine,
  sessions,
  userId,
}) => {
  const [flipped, setFlipped] = useState(false);

  const recentGames = useMemo(() => {
    if (!rival) return [];
    return sessions
      .filter(
        (s) =>
          s.isPlayer && s.players.some((p) => p.profileId === rival.profileId),
      )
      .sort((a, b) => b.datePlayed.localeCompare(a.datePlayed))
      .slice(0, RECENT_GAMES);
  }, [sessions, rival]);

  if (!rival) {
    return (
      <Card className="h-44 py-0">
        <CardContent className="flex h-full flex-col items-center justify-center p-4 text-center">
          <div
            className={cn(
              "mb-2 flex size-9 items-center justify-center rounded-full",
              iconColor,
            )}
          >
            {icon}
          </div>
          <p
            className={cn(
              "text-sm font-bold uppercase tracking-wider",
              labelClass,
            )}
          >
            {label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Needs {MIN_GAMES_TOGETHER} games together
          </p>
        </CardContent>
      </Card>
    );
  }

  const header = (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          "text-sm font-black uppercase tracking-wider",
          labelClass,
        )}
      >
        {label}
      </span>
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          iconColor,
        )}
      >
        {icon}
      </div>
    </div>
  );

  const avatar = (
    <Avatar className="size-16 shrink-0 rounded-xl">
      <AvatarImage
        src={rival.profilePic || ""}
        alt={rival.username}
        className="object-cover"
      />
      <AvatarFallback
        className={cn("rounded-xl text-2xl font-black", iconColor)}
      >
        {rival.firstName[0]}
      </AvatarFallback>
    </Avatar>
  );

  const games = (
    <div className="flex flex-1 flex-col justify-center gap-1.5">
      {recentGames.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          No games together yet
        </p>
      ) : (
        recentGames.map((session) => {
          const result = sessionResult(session);
          const winner = session.players.find((p) => p.isWinner);
          return (
            <div key={session.sessionId} className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-black",
                  result === "win"
                    ? "bg-emerald-500/15 text-emerald-500"
                    : result === "tied"
                      ? "bg-amber-500/15 text-amber-500"
                      : "bg-red-500/15 text-red-400",
                )}
              >
                {result === "win" ? "W" : result === "tied" ? "T" : "L"}
              </span>
              <span className="flex-1 truncate text-xs font-medium">
                {session.gameTitle}
              </span>
              <div className="flex shrink-0 flex-col items-end">
                <div className="flex items-center gap-0.5">
                  <Trophy className="size-2.5 text-amber-400" />
                  <span className="max-w-12 truncate text-[10px] font-semibold text-amber-500">
                    {winner?.firstName ?? "—"}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(session.datePlayed), "MMM d")}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const summary = `${rival.wins}W · ${rival.ties}T · ${rival.losses}L`;

  return (
    <>
      {/* ── Mobile: flip card ─────────────────────────────────────────────── */}
      <div className="h-44 perspective-[1000px] lg:hidden">
        <div
          role="button"
          tabIndex={0}
          aria-label={`${label} card, tap to ${flipped ? "show player" : "show recent games"}`}
          onClick={() => setFlipped((f) => !f)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          className={cn(
            "relative size-full cursor-pointer rounded-xl transition-transform duration-450 ease-in-out motion-reduce:transition-none transform-3d focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            flipped && "transform-[rotateY(180deg)]",
          )}
        >
          <div className="absolute inset-0 backface-hidden">
            <Card className="h-full py-4 transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-2 px-4">
                {header}
                <div className="flex flex-1 items-center gap-3">
                  {avatar}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-2xl font-black leading-tight">
                      {rival.firstName} {rival.lastName}
                    </p>
                    <p className="truncate text-base font-semibold leading-tight text-muted-foreground">
                      @{rival.username}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{statLine}</p>
                  <p className="text-[10px] text-muted-foreground/50">
                    tap for games
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="absolute inset-0 backface-hidden transform-[rotateY(180deg)]">
            <Card className="h-full py-2">
              <CardContent className="flex h-full flex-col gap-2 px-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Recent Games
                  </span>
                  <div className="flex items-center gap-1">
                    <span className={cn("text-xs font-semibold", labelClass)}>
                      {rival.firstName}
                    </span>
                    <RotateCcw className="size-3 text-muted-foreground" />
                  </div>
                </div>
                {games}
                <div className="border-t pt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {summary}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ---- Desktop: player and recent games side by side -------------------- */}
      <Card className="hidden py-4 lg:block">
        <CardContent className="flex gap-4 px-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {header}
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              {avatar}
              <div className="w-full min-w-0">
                <p className="truncate text-base font-black leading-tight">
                  {rival.firstName} {rival.lastName}
                </p>
                <p className="truncate text-xs font-semibold leading-tight text-muted-foreground">
                  @{rival.username}
                </p>
              </div>
            </div>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {statLine}
            </p>
          </div>

          <Separator orientation="vertical" className="h-auto self-stretch" />

          <div className="flex w-52 shrink-0 flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Games
            </span>
            {games}
            <div className="border-t pt-1">
              <span className="text-[10px] text-muted-foreground">
                {summary}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default RecordsTab;
