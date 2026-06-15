import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { GroupedSession } from "@/lib/interfaces";
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
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React from "react";

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
  },
  canEdit = false,
}) => {
  const playerDetails = players.find((player) => player.profileId === userId);
  const position = playerDetails?.position;
  const positionWithSuffix =
    position !== undefined ? positionOrdinalSuffix(position) : null;

  // The user's headline result chip: outcome color + a non-color icon/label so
  // win/loss/tie never relies on hue alone (Color-Vision Safe Rule).
  const getResultBadge = () => {
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

  return (
    <Card className="overflow-hidden py-0 transition-colors hover:border-primary/40">
      <CardContent className="p-0">
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
            </div>
          </div>

          {/* Headline result */}
          <div className="shrink-0">{getResultBadge()}</div>
        </div>

        {/* ── Standings ────────────────────────────────────────────────── */}
        <ul className="divide-y divide-border/60">
          {players.map((player) => {
            const isCurrentUser = player.profileId === userId;
            return (
              <li
                key={player.profileId}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-2.5 text-sm sm:gap-3 sm:px-5",
                  isCurrentUser && "bg-primary/8 dark:bg-primary/12",
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

                {/* Avatar */}
                <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-muted sm:size-8">
                  {player.profilePic ? (
                    <Image
                      src={player.profilePic}
                      alt={`${player.firstName}'s avatar`}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs font-semibold text-muted-foreground">
                      {player.firstName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + username */}
                <div className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate font-medium text-foreground",
                      isCurrentUser && "font-semibold text-primary",
                    )}
                  >
                    {player.firstName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    @{player.username}
                  </span>
                </div>

                {/* Winner / tie marker — icon-backed, color-vision safe, same
                    vocabulary on mobile and desktop. */}
                <div className="flex w-12 shrink-0 items-center justify-end gap-1 sm:w-24">
                  {player.isWinner && (
                    <span
                      title="Winner"
                      className="inline-flex items-center gap-1 rounded-full bg-accent-1/25 px-1.5 py-0.5 text-[oklch(40%_0.09_156)] dark:text-accent-1"
                    >
                      <Crown className="size-3.5" />
                      <span className="hidden text-xs font-semibold sm:inline">
                        Winner
                      </span>
                    </span>
                  )}
                  {player.isTie && (
                    <span
                      title="Tied"
                      className="inline-flex items-center gap-1 rounded-full bg-accent-2/25 px-1.5 py-0.5 text-[oklch(45%_0.08_203)] dark:text-accent-2"
                    >
                      <Handshake className="size-3.5" />
                      <span className="hidden text-xs font-semibold sm:inline">
                        Tied
                      </span>
                    </span>
                  )}
                </div>

                {/* Victory points */}
                <span className="font-display w-12 shrink-0 text-right text-lg font-bold tabular-nums sm:w-16">
                  {player.victoryPoints ?? "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};

export default GameSessionCard;
