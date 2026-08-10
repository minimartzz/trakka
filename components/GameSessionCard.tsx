"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  GroupedSession,
  SessionExpansion,
  SessionPlayer,
} from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import { format } from "date-fns";
import {
  CalendarDays,
  Crown,
  Dices,
  Handshake,
  Medal,
  Pencil,
  Puzzle,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { HandshakeIcon, SwordIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

interface GameSessionsCardProps {
  userId: number;
  session: GroupedSession;
  canEdit?: boolean;
}

const GameSessionCard: React.FC<GameSessionsCardProps> = ({
  userId,
  session: {
    sessionId,
    datePlayed,
    gameTitle,
    gameImage,
    isPlayer,
    isWinner,
    isLoser,
    players,
    tribe,
    coop,
    isVp,
    isTeamGame,
    expansions,
    numPlayers,
  },
  canEdit = false,
}) => {
  const playerDetails = players.find((player) => player.profileId === userId);
  const position = playerDetails?.position;
  const positionWithSuffix =
    position !== undefined ? positionOrdinalSuffix(position) : null;
  const isSolo = numPlayers === 1;

  const getResultBadge = () => {
    // Coop + Solo: Won or Lost view only and a single score value
    if (coop || isSolo) {
      if (isPlayer && isWinner) {
        return (
          <Badge className="gap-1 rounded-full border-transparent bg-accent-1 px-2.5 py-1 font-semibold text-[oklch(25.3%_0.0321_265.95)]">
            <Trophy className="size-3.5" />
            Won
          </Badge>
        );
      }
      if (isPlayer) {
        return (
          <Badge className="gap-1 rounded-full border-transparent bg-destructive px-2.5 py-1 font-semibold text-white">
            <Medal className="size-3.5" />
            Lost
          </Badge>
        );
      }
      return (
        <Badge
          variant="outline"
          className="gap-1 rounded-full px-2.5 py-1 font-semibold text-muted-foreground"
        >
          Not involved
        </Badge>
      );
    }

    if (isPlayer && isWinner) {
      return (
        <Badge className="gap-1 rounded-full border-transparent bg-accent-1 px-2.5 py-1 font-semibold text-[oklch(25.3%_0.0321_265.95)]">
          <Trophy className="size-3.5" />
          {positionWithSuffix} place
        </Badge>
      );
    }
    if (isPlayer && isLoser) {
      return (
        <Badge className="gap-1 rounded-full border-transparent bg-destructive px-2.5 py-1 font-semibold text-white">
          <Medal className="size-3.5" />
          {positionWithSuffix} place
        </Badge>
      );
    }
    if (isPlayer) {
      return (
        <Badge className="gap-1 rounded-full border-transparent bg-accent-2 px-2.5 py-1 font-semibold text-[oklch(25.3%_0.0321_265.95)]">
          <Medal className="size-3.5" />
          {positionWithSuffix} place
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1 rounded-full px-2.5 py-1 font-semibold text-muted-foreground"
      >
        Not involved
      </Badge>
    );
  };

  const formatGameDate = (dateString: string) =>
    format(new Date(dateString), "dd MMM yyyy");

  // Expansion thumbnails
  const ExpansionThumb = ({ expansion }: { expansion: SessionExpansion }) => {
    const [open, setOpen] = useState(false);
    return (
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen((prev) => !prev);
            }}
            aria-label={expansion.name}
            className="relative size-6 shrink-0 overflow-hidden rounded-sm bg-muted ring-1 ring-border transition-transform hover:scale-105 sm:size-9"
          >
            {expansion.thumbnail ? (
              <Image
                src={expansion.thumbnail}
                alt=""
                fill
                sizes="(min-width: 640px) 48px, 36px"
                className="object-cover"
              />
            ) : (
              <Puzzle className="size-full p-1 text-muted-foreground sm:p-1.5" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{expansion.name}</TooltipContent>
      </Tooltip>
    );
  };

  // Winner and Tie markers
  const ResultMarker = ({
    isWinner,
    isTie,
  }: {
    isWinner: boolean;
    isTie: boolean;
  }) => (
    <div className="flex w-12 shrink-0 items-center justify-end gap-1 sm:w-24">
      {isWinner && (
        <span
          title="Winner"
          className="inline-flex items-center gap-1 rounded-full bg-accent-1/25 px-1.5 py-0.5 text-[oklch(40%_0.09_156)] dark:text-accent-1"
        >
          <Crown className="size-3.5" />
          <span className="hidden text-xs font-semibold sm:inline">Winner</span>
        </span>
      )}
      {isTie && (
        <span
          title="Tied"
          className="inline-flex items-center gap-1 rounded-full bg-accent-2/25 px-1.5 py-0.5 text-[oklch(45%_0.08_203)] dark:text-accent-2"
        >
          <Handshake className="size-3.5" />
          <span className="hidden text-xs font-semibold sm:inline">Tied</span>
        </span>
      )}
    </div>
  );

  const PlayerIdentity = ({
    player,
    highlight,
    compact = false,
  }: {
    player: SessionPlayer;
    highlight: boolean;
    // Compact = smaller avatar + name and username on a single line (team mode).
    compact?: boolean;
  }) => (
    <>
      {/* Avatar */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-muted",
          compact ? "size-6" : "size-7 sm:size-8",
        )}
      >
        {player.profilePic ? (
          <Image
            src={player.profilePic}
            alt={`${player.firstName}'s avatar`}
            fill
            sizes={compact ? "24px" : "32px"}
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
            {player.firstName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name + username */}
      {compact ? (
        <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span
            className={cn(
              "truncate font-medium text-foreground",
              highlight && "font-semibold text-primary",
            )}
          >
            {player.firstName}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            (@{player.username})
          </span>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate font-medium text-foreground",
              highlight && "font-semibold text-primary",
            )}
          >
            {player.firstName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            @{player.username}
          </span>
        </div>
      )}
    </>
  );

  // Team games: group players by teamId, preserving first-appearance (position)
  // order. Each team shares position / result / victory points, so those are
  // shown once per team
  const teams = (() => {
    if (!isTeamGame) return [];
    const order: number[] = [];
    const byTeam = new Map<number, SessionPlayer[]>();
    for (const player of players) {
      const key = player.teamId!;
      if (!byTeam.has(key)) {
        byTeam.set(key, []);
        order.push(key);
      }
      byTeam.get(key)!.push(player);
    }
    return order.map((key) => {
      const members = byTeam.get(key)!;
      const rep = members[0];
      return {
        teamId: key,
        members,
        position: rep.position,
        isWinner: rep.isWinner,
        isTie: rep.isTie,
        victoryPoints: rep.victoryPoints,
        hasCurrentUser: members.some((m) => m.profileId === userId),
      };
    });
  })();

  return (
    <Card
      className={cn(
        "relative overflow-hidden py-0 transition-colors",
        coop
          ? "border-accent bg-accent/50 hover:border-accent/80"
          : "bg-muted/50 hover:border-foreground/20",
      )}
    >
      {/* Coop vs Comp watermark in bottom right hand corner */}
      {coop ? (
        <HandshakeIcon
          aria-hidden
          weight="fill"
          className="pointer-events-none absolute -bottom-5 -right-4 z-0 size-28 text-foreground/5 sm:size-32"
        />
      ) : (
        <SwordIcon
          aria-hidden
          weight="fill"
          className="pointer-events-none absolute -bottom-5 -right-4 z-0 size-28 text-foreground/5 sm:size-32"
        />
      )}

      <CardContent className="relative z-10 p-0">
        {/* ── Header: game image + title + meta + result ───────────────── */}
        <div className="flex items-start gap-3 border-b p-4 sm:gap-4 sm:p-5">
          {/* Game thumbnail */}
          <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted sm:size-16">
            {gameImage ? (
              <Image
                src={gameImage}
                alt={gameTitle}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Dices className="size-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display truncate text-xl font-bold sm:text-2xl">
                {gameTitle}
              </h3>
              {canEdit && (
                <Link
                  href={`/session/edit/${sessionId}`}
                  aria-label={`Edit ${gameTitle} session`}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                </Link>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                <span className="truncate">{tribe}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatGameDate(datePlayed)}
              </span>
              {isTeamGame && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/6 px-2 py-0.5 text-xs font-medium">
                  <Users className="size-3.5" />
                  Teams
                </span>
              )}
              {isSolo && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/6 px-2 py-0.5 text-xs font-medium">
                  <User className="size-3.5" />
                  Solo
                </span>
              )}
            </div>
          </div>

          {/* Headline result + optional unrated marker + expansions played */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            {getResultBadge()}
            {/* Unrated games are marked with a tag */}
            {!isVp && (
              <span className="rounded-full border border-border px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                Unrated
              </span>
            )}
            {expansions.length > 0 && (
              <div className="mt-2 flex flex-col items-end gap-1">
                <span className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                  Expansions
                </span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {expansions.map((expansion) => (
                    <ExpansionThumb key={expansion.id} expansion={expansion} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Standings ────────────────────────────────────────────────── */}
        {isTeamGame ? (
          // Team mode
          <ul className="divide-y divide-border/60">
            {teams.map((team) => (
              <li
                key={team.teamId}
                className={cn(
                  "flex items-stretch",
                  team.hasCurrentUser && "bg-primary/12 dark:bg-primary/18",
                )}
              >
                {/* Shared position — vertically centered across the team */}
                <div className="flex w-11 shrink-0 items-center justify-center border-r border-border/60 sm:w-12">
                  <span
                    className={cn(
                      "font-display text-xl font-bold tabular-nums",
                      team.isWinner
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {team.position}
                  </span>
                </div>

                {/* Members: identity per row; result + score on the first row */}
                <ul className="min-w-0 flex-1">
                  {team.members.map((player, memberIdx) => (
                    <li
                      key={player.profileId}
                      className="flex items-center gap-2.5 py-2 pl-3 pr-4 text-sm sm:gap-3 sm:pr-5"
                    >
                      <PlayerIdentity
                        player={player}
                        highlight={player.profileId === userId}
                        compact
                      />
                      {/* Team-level result + score, only on the first member */}
                      {memberIdx === 0 ? (
                        <>
                          <ResultMarker
                            isWinner={team.isWinner}
                            isTie={team.isTie}
                          />
                          <span className="font-display w-12 shrink-0 text-right text-lg font-bold tabular-nums sm:w-16">
                            {team.victoryPoints ?? "—"}
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-12 shrink-0 sm:w-24" />
                          <span className="w-12 shrink-0 sm:w-16" />
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : coop ? (
          // Coop: Shared position (not shown) and score
          <>
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 sm:px-5">
              <span className="text-sm font-medium text-muted-foreground">
                Group Score
              </span>
              <span className="font-display text-lg font-bold tabular-nums">
                {players[0]?.victoryPoints ?? "—"}
              </span>
            </div>
            <ul className="divide-y divide-border/60">
              {players.map((player) => {
                const isCurrentUser = player.profileId === userId;
                return (
                  <li
                    key={player.profileId}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2.5 text-sm sm:gap-3 sm:px-5",
                      isCurrentUser && "bg-primary/12 dark:bg-primary/18",
                    )}
                  >
                    <PlayerIdentity player={player} highlight={isCurrentUser} />
                  </li>
                );
              })}
            </ul>
          </>
        ) : isSolo ? (
          // Solo: Single result outcome and score
          <ul className="divide-y divide-border/60">
            {players.map((player) => {
              const isCurrentUser = player.profileId === userId;
              return (
                <li
                  key={player.profileId}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 text-sm sm:gap-3 sm:px-5",
                    isCurrentUser && "bg-primary/12 dark:bg-primary/18",
                  )}
                >
                  <PlayerIdentity player={player} highlight={isCurrentUser} />

                  {/* Victory points */}
                  <span className="font-display w-12 shrink-0 text-right text-lg font-bold tabular-nums sm:w-16">
                    {player.victoryPoints ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="divide-y divide-border/60">
            {players.map((player) => {
              const isCurrentUser = player.profileId === userId;
              return (
                <li
                  key={player.profileId}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 text-sm sm:gap-3 sm:px-5",
                    isCurrentUser && "bg-primary/12 dark:bg-primary/18",
                  )}
                >
                  {/* Rank */}
                  <span
                    className={cn(
                      "font-display w-6 shrink-0 text-center text-lg font-bold tabular-nums",
                      player.isWinner
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {player.position}
                  </span>

                  <PlayerIdentity player={player} highlight={isCurrentUser} />

                  <ResultMarker
                    isWinner={player.isWinner}
                    isTie={player.isTie}
                  />

                  {/* Victory points */}
                  <span className="font-display w-12 shrink-0 text-right text-lg font-bold tabular-nums sm:w-16">
                    {player.victoryPoints ?? "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default GameSessionCard;
