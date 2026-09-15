"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Dices } from "lucide-react";
import type { FavouriteGame } from "@/db/schema/profile";
import AddFavouriteGameCard from "@/components/account/games/AddFavouriteGameCard";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import { sessionResult, winRateClass } from "./shared";

interface GamesTabProps {
  userId: number;
  sessions: GroupedSession[];
  favouriteGames: FavouriteGame[];
}

// Same favourite games as the accounts page
const MAX_FAVOURITE_GAMES = 5;

interface GameStats {
  plays: number;
  wins: number;
  ties: number;
  losses: number;
  scoreSum: number;
  scoreCount: number;
  bestVp: number | null;
  lastPlayed: string;
}

/**
 * GamesTab - The user's favourite games cards
 *
 * Front is the cover and title
 * Back carries the aggregated record for the game
 * Desktop: hover. Mobile: Tap to flip
 * Picks are kept in local state so a game added here shows up without a reload
 */
const GamesTab: React.FC<GamesTabProps> = ({
  userId,
  sessions,
  favouriteGames,
}) => {
  const [games, setGames] = useState(favouriteGames);
  const [flippedId, setFlippedId] = useState<number | null>(null);

  // Records are memoised by game_id. Newly added games are immediately memoised
  const statsByGame = useMemo(() => {
    const byGame = new Map<number, GameStats>();

    for (const session of sessions) {
      if (!session.isPlayer) continue;
      const me = session.players.find((p) => p.profileId === userId);
      const result = sessionResult(session);

      const stats = byGame.get(session.gameId) ?? {
        plays: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        scoreSum: 0,
        scoreCount: 0,
        bestVp: null,
        lastPlayed: session.datePlayed,
      };

      stats.plays += 1;
      if (result === "win") stats.wins += 1;
      else if (result === "tied") stats.ties += 1;
      else stats.losses += 1;
      if (session.datePlayed > stats.lastPlayed) {
        stats.lastPlayed = session.datePlayed;
      }
      if (me?.score !== null && me?.score !== undefined) {
        stats.scoreSum += me.score;
        stats.scoreCount += 1;
      }
      if (
        session.isVp &&
        me?.victoryPoints !== null &&
        me?.victoryPoints !== undefined
      ) {
        stats.bestVp = Math.max(stats.bestVp ?? -Infinity, me.victoryPoints);
      }

      byGame.set(session.gameId, stats);
    }

    return byGame;
  }, [sessions, userId]);

  const toggleFlipped = (bggId: number) =>
    setFlippedId((cur) => (cur === bggId ? null : bggId));

  return (
    <>
      {games.length === 0 && (
        <p className="mb-4 text-sm text-muted-foreground">
          No favourite games yet. Select up to {MAX_FAVOURITE_GAMES} games as
          your favourite.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {games.map((game) => (
          <FlipCard
            key={game.bggId}
            game={game}
            stats={statsByGame.get(game.bggId) ?? null}
            flipped={flippedId === game.bggId}
            onToggle={() => toggleFlipped(game.bggId)}
          />
        ))}
        {games.length < MAX_FAVOURITE_GAMES && (
          <AddFavouriteGameCard
            onAdded={(game) => setGames((prev) => [...prev, game])}
          />
        )}
      </div>
    </>
  );
};

// ---- Flip card --------------------------------------------------
const FlipCard: React.FC<{
  game: FavouriteGame;
  stats: GameStats | null;
  flipped: boolean;
  onToggle: () => void;
}> = ({ game, stats, flipped, onToggle }) => (
  <div
    role="button"
    tabIndex={0}
    aria-pressed={flipped}
    aria-label={`${game.title}: show stats`}
    onClick={onToggle}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    }}
    className="group/flip aspect-3/4 cursor-pointer rounded-lg perspective-[1000px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
  >
    <div
      className={cn(
        "relative size-full transition-transform duration-500 motion-reduce:transition-none transform-3d",
        // Pointer displays on hover. Tapping changes flip state.
        "[@media(hover:hover)_and_(pointer:fine)]:group-hover/flip:transform-[rotateY(180deg)]",
        flipped && "transform-[rotateY(180deg)]",
      )}
    >
      {/* ---- Front: cover + title ---------------------------------------- */}
      <div className="absolute inset-0 flex flex-col overflow-hidden rounded-lg border bg-card backface-hidden">
        <div className="relative flex-1 bg-muted">
          {game.image ? (
            <Image
              src={game.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 15vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <Dices className="size-8 text-muted-foreground opacity-50" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="truncate text-sm font-medium" title={game.title}>
            {game.title}
          </p>
        </div>
      </div>

      {/* ---- Back: aggregated record ---------------------------------------- */}
      <div className="absolute inset-0 flex flex-col overflow-hidden rounded-lg border bg-card p-2.5 backface-hidden transform-[rotateY(180deg)]">
        <p className="truncate text-xs font-medium" title={game.title}>
          {game.title}
        </p>

        {stats ? (
          <CardStats stats={stats} />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
            <Dices className="mb-1 size-6 opacity-50" />
            <p className="text-xs">Not played yet</p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const CardStats: React.FC<{ stats: GameStats }> = ({ stats }) => {
  const winRate = Math.round((stats.wins / stats.plays) * 100);
  const wpa =
    stats.scoreCount > 0 ? (stats.scoreSum / stats.scoreCount).toFixed(2) : "—";

  return (
    <>
      {/* Record is the headline; the rest sit in a tight 2×2 grid */}
      <p className="mt-2 font-display text-2xl font-bold leading-none tabular-nums">
        <span className="text-emerald-700 dark:text-emerald-400">
          {stats.wins}W
        </span>{" "}
        <span className="text-amber-600 dark:text-amber-400">
          {stats.ties}T
        </span>{" "}
        <span className="text-destructive">{stats.losses}L</span>
      </p>

      <dl className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <div>
          <dt className="text-[10px] text-muted-foreground">Plays</dt>
          <dd className="font-semibold tabular-nums">{stats.plays}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Win rate</dt>
          <dd>
            <span
              className={cn(
                "rounded px-1 py-px font-bold tabular-nums leading-none",
                winRateClass(winRate),
              )}
            >
              {winRate}%
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Avg WPA</dt>
          <dd className="font-semibold tabular-nums text-accent-4">{wpa}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-muted-foreground">Best VP</dt>
          <dd className="font-semibold tabular-nums">
            {stats.bestVp !== null ? stats.bestVp : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-2 truncate text-[10px] text-muted-foreground">
        Last played {format(new Date(stats.lastPlayed), "d MMM yyyy")}
      </p>
    </>
  );
};

export default GamesTab;
