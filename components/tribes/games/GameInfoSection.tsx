"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dices,
  Weight,
  Users,
  Clock,
  Hourglass,
  CalendarDays,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { type GameSession, type GameListItem } from "@/types/tribes";
import { type SelectGame } from "@/db/schema/game";
import { getGameDetailsWithMeta } from "@/app/(account)/tribe/[id]/action";
import {
  getRatingBg,
  getWeightColor,
  getWeightBg,
  getWeightLabel,
} from "./utils";
import { TribeMetric } from "./TribeMetric";

export function GameInfoSection({
  sessions,
  selectedGameId,
  selectedGame,
}: {
  sessions: GameSession[];
  selectedGameId: number;
  selectedGame: GameListItem;
}) {
  const [gameDetails, setGameDetails] = useState<SelectGame | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [mechanics, setMechanics] = useState<string[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllMechanics, setShowAllMechanics] = useState(false);

  const gameSessions = useMemo(
    () => sessions.filter((s) => s.gameId === selectedGameId),
    [sessions, selectedGameId],
  );

  const lastPlayedDate = useMemo(() => {
    if (gameSessions.length === 0) return null;
    const sorted = [...gameSessions].sort(
      (a, b) =>
        new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime(),
    );
    return sorted[0].datePlayed;
  }, [gameSessions]);

  const fetchDetails = useCallback(async () => {
    setLoadingDetails(true);
    try {
      const result = await getGameDetailsWithMeta(selectedGameId);
      setGameDetails(result.game);
      setCategories(result.categories);
      setMechanics(result.mechanics);
    } catch {
      setGameDetails(null);
      setCategories([]);
      setMechanics([]);
    } finally {
      setLoadingDetails(false);
    }
  }, [selectedGameId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="space-y-5"
    >
      {/* Top row: image + core details + rating box */}
      <div className="flex gap-5">
        {/* Square game image */}
        <div className="shrink-0">
          {loadingDetails ? (
            <Skeleton className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl" />
          ) : gameDetails?.imageUrl ? (
            <img
              src={gameDetails.imageUrl}
              alt={selectedGame.gameTitle}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl object-cover"
            />
          ) : (
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-muted flex items-center justify-center">
              <Dices className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Name, complexity, stats (desktop only) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2.5">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
            {selectedGame.gameTitle}
          </h3>

          {loadingDetails ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            gameDetails && (
              <>
                {/* Complexity (weight) */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "flex items-baseline gap-2 px-3 py-1.5 rounded-lg border",
                      getWeightBg(gameDetails.weight),
                    )}
                  >
                    <Weight
                      className={cn(
                        "w-4 h-4",
                        getWeightColor(gameDetails.weight),
                      )}
                    />
                    <div className="flex items-baseline gap-1">
                      <span
                        className={cn(
                          "text-base font-bold",
                          getWeightColor(gameDetails.weight),
                        )}
                      >
                        {gameDetails.weight.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">/ 5</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        getWeightColor(gameDetails.weight),
                      )}
                    >
                      {getWeightLabel(gameDetails.weight)}
                    </span>
                  </div>
                </div>

                {/* Quick stats — desktop only (mobile version is full-width below) */}
                <div className="hidden sm:grid grid-cols-4 gap-x-3 gap-y-2.5">
                  {gameDetails.maxPlayers && (
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Users className="w-3 h-3" />
                        Max Players
                      </span>
                      <span className="text-sm font-bold tabular-nums leading-tight">
                        {gameDetails.maxPlayers}{" "}
                        <span className="text-xs font-medium text-muted-foreground">
                          players
                        </span>
                      </span>
                    </div>
                  )}
                  {gameDetails.recPlayers && (
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Users className="w-3 h-3 text-primary" />
                        Best At
                      </span>
                      <span className="text-sm font-bold tabular-nums leading-tight">
                        {gameDetails.recPlayers}{" "}
                        <span className="text-xs font-medium text-muted-foreground">
                          players
                        </span>
                      </span>
                    </div>
                  )}
                  {gameDetails.playingTime && (
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Play Time
                      </span>
                      <span className="text-sm font-bold tabular-nums leading-tight">
                        {gameDetails.playingTime}{" "}
                        <span className="text-xs font-medium text-muted-foreground">
                          min
                        </span>
                      </span>
                    </div>
                  )}
                  {gameDetails.yearPublished && (
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <Hourglass className="w-3 h-3" />
                        Published
                      </span>
                      <span className="text-sm font-bold tabular-nums leading-tight">
                        {gameDetails.yearPublished}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </div>

        {/* Rating box — far right */}
        {loadingDetails ? (
          <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0" />
        ) : (
          gameDetails && (
            <div
              className={cn(
                "shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center self-start",
                getRatingBg(gameDetails.rating),
              )}
            >
              <span className="text-xl sm:text-2xl font-bold text-white">
                {gameDetails.rating.toFixed(1)}
              </span>
            </div>
          )
        )}
      </div>

      {/* Quick stats — mobile only, full width below image/title/rating row */}
      {!loadingDetails && gameDetails && (
        <div className="grid sm:hidden grid-cols-2 gap-x-3 gap-y-2.5">
          {gameDetails.maxPlayers && (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="w-3 h-3" />
                Max Players
              </span>
              <span className="text-sm font-bold tabular-nums leading-tight">
                {gameDetails.maxPlayers}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  players
                </span>
              </span>
            </div>
          )}
          {gameDetails.recPlayers && (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="w-3 h-3 text-primary" />
                Best At
              </span>
              <span className="text-sm font-bold tabular-nums leading-tight">
                {gameDetails.recPlayers}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  players
                </span>
              </span>
            </div>
          )}
          {gameDetails.playingTime && (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Clock className="w-3 h-3" />
                Play Time
              </span>
              <span className="text-sm font-bold tabular-nums leading-tight">
                {gameDetails.playingTime}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  min
                </span>
              </span>
            </div>
          )}
          {gameDetails.yearPublished && (
            <div className="flex flex-col gap-0.5">
              <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <Hourglass className="w-3 h-3" />
                Published
              </span>
              <span className="text-sm font-bold tabular-nums leading-tight">
                {gameDetails.yearPublished}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Categories & Mechanics */}
      {loadingDetails ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-64" />
        </div>
      ) : (
        <div className="space-y-3">
          {categories.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Categories
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {(showAllCategories ? categories : categories.slice(0, 10)).map(
                  (cat) => (
                    <Badge key={cat} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ),
                )}
                {categories.length > 10 && (
                  <button
                    onClick={() => setShowAllCategories((v) => !v)}
                    className="text-xs font-medium text-primary hover:underline ml-1"
                  >
                    {showAllCategories
                      ? "Show less"
                      : `+${categories.length - 10} more`}
                  </button>
                )}
              </div>
            </div>
          )}
          {mechanics.length > 0 && (
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mechanics
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {(showAllMechanics ? mechanics : mechanics.slice(0, 10)).map(
                  (mech) => (
                    <Badge key={mech} variant="outline" className="text-xs">
                      {mech}
                    </Badge>
                  ),
                )}
                {mechanics.length > 10 && (
                  <button
                    onClick={() => setShowAllMechanics((v) => !v)}
                    className="text-xs font-medium text-primary hover:underline ml-1"
                  >
                    {showAllMechanics
                      ? "Show less"
                      : `+${mechanics.length - 10} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tribe metrics */}
      <div className="pt-3 border-t">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Tribe Stats
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <TribeMetric
            icon={<Hash className="w-4 h-4 text-primary" />}
            label="Times Played"
            value={`${gameSessions.length}`}
          />
          <TribeMetric
            icon={<CalendarDays className="w-4 h-4 text-primary" />}
            label="Last Played"
            value={
              lastPlayedDate
                ? format(new Date(lastPlayedDate), "MMM d, yyyy")
                : "—"
            }
          />
          <TribeMetric
            icon={<Hourglass className="w-4 h-4 text-primary" />}
            label="Days Since Last Play"
            value={
              lastPlayedDate
                ? formatDistanceToNow(new Date(lastPlayedDate), {
                    addSuffix: false,
                  })
                : "—"
            }
          />
        </div>
      </div>
    </motion.section>
  );
}
