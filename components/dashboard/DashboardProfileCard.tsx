"use client";

import React from "react";
import { motion } from "motion/react";
import { Search, Share2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import type { FavouriteGame } from "@/db/schema/profile";
import {
  updateShowcaseSlots,
  type GameElo,
} from "@/app/(account)/dashboard/action";
import { CalibratingMark, ELO_TIER_CLASS } from "@/components/GameSessionCard";
import { eloTier, isCalibrated } from "@/utils/elo";

interface DashboardProfileCardProps {
  firstName: string;
  lastName: string;
  username: string;
  image: string;
  memberSince: string;
  gamesPlayed: number;
  gamesWon: number;
  // Most recent sessions - only on desktop
  recentActivity?: GroupedSession[];
  favouriteGames?: FavouriteGame[];
  // Persisted showcase game ids - null if none are selected
  showcaseSlots?: (number | null)[];
  // The user's current Elo in each game they've played
  gameElos?: GameElo[];
}

const MAX_RECENT_SESSIONS = 10;
const NUM_SHOWCASE_SLOTS = 2;
const LONG_PRESS_MS = 500;

const sessionDotColor = (session: GroupedSession): string => {
  if (session.isWinner) return "bg-emerald-500";
  if (session.isLoser) return "bg-destructive";
  if (session.isTied) return "bg-amber-500";
  return "bg-sky-500";
};

// A game the user can showcase: their Elo in it, with its details
interface ShowcaseGame {
  gameId: number;
  title: string;
  image: string | null;
  plays: number;
  // Rounded, as displayed
  elo: number;
  calibrating: boolean;
}

type CalibrationFilter = "all" | "calibrated" | "calibrating";

const CALIBRATION_FILTERS: { value: CalibrationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "calibrated", label: "Calibrated" },
  { value: "calibrating", label: "Calibrating" },
];

const playsLabel = (plays: number) =>
  `${plays} ${plays === 1 ? "play" : "plays"}`;

const GameThumbnail: React.FC<{
  game: ShowcaseGame;
  size: number;
}> = ({ game, size }) => (
  <span
    className="relative shrink-0 overflow-hidden rounded-md bg-black/10"
    style={{ width: size, height: size }}
  >
    {game.image && (
      <Image
        src={game.image}
        alt={game.title}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    )}
  </span>
);

// Fires onLongPress after holding for LONG_PRESS_MS; cancelled by an early
// release or by the pointer moving off the element (a scroll, not a tap).
const useLongPress = (onLongPress: () => void) => {
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  return {
    onPointerDown: () => {
      clear();
      timeoutRef.current = setTimeout(onLongPress, LONG_PRESS_MS);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
  };
};

const MiniStat: React.FC<{ label: string; value: number | string }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col items-stretch overflow-hidden rounded-xl border border-border bg-muted/40">
    <span className="border-b border-border px-2 py-1 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <span className="px-2 py-1.5 text-center text-xl font-bold leading-none font-display text-foreground lg:py-2 lg:text-2xl">
      {value}
    </span>
  </div>
);

// Showcased game, coloured by the tier of the user's Elo in it
const ShowcaseSlotCard: React.FC<{
  game: ShowcaseGame | undefined;
  triggerProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
}> = ({ game, triggerProps }) => {
  if (!game) {
    return (
      <button
        type="button"
        {...triggerProps}
        className="flex min-h-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-2 text-center transition-colors hover:bg-muted/40"
      >
        <span className="text-xs text-muted-foreground">
          Tap here to showcase a game
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      {...triggerProps}
      className={cn(
        "flex min-h-16 min-w-0 flex-col gap-2 overflow-hidden rounded-xl p-2.5 text-left transition-transform hover:scale-[1.02]",
        ELO_TIER_CLASS[eloTier(game.elo)],
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <GameThumbnail game={game} size={36} />
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold leading-tight">
            {game.title}
          </span>
          <span className="block text-[10px] leading-tight opacity-80">
            {playsLabel(game.plays)}
          </span>
        </span>
      </span>
      <span className="flex items-end justify-between gap-1">
        <span className="text-[10px] font-medium uppercase leading-tight tracking-wide opacity-80">
          Elo
        </span>
        <span className="font-display text-4xl font-bold leading-none tabular-nums">
          {game.elo}
          {game.calibrating && <CalibratingMark />}
        </span>
      </span>
    </button>
  );
};

const DashboardProfileCard: React.FC<DashboardProfileCardProps> = ({
  firstName,
  lastName,
  username,
  image,
  memberSince,
  gamesPlayed,
  gamesWon,
  recentActivity = [],
  favouriteGames = [],
  showcaseSlots,
  gameElos = [],
}) => {
  const [openShowcase, setOpenShowcase] = React.useState<number | null>(null);
  const [slotGameIds, setSlotGameIds] = React.useState<(number | null)[]>(
    () => {
      const initial = showcaseSlots ?? [];
      // Slots saved before the Elo showcase hold stat-card ids; treat them as empty
      return Array.from({ length: NUM_SHOWCASE_SLOTS }, (_, i) => {
        const id = initial[i];
        return typeof id === "number" ? id : null;
      });
    },
  );
  const [search, setSearch] = React.useState("");
  const [calibrationFilter, setCalibrationFilter] =
    React.useState<CalibrationFilter>("all");

  // Every game the user has an Elo in, highest Elo first. Title, image and
  // play count come from their sessions, which include every game played.
  const showcaseGames = React.useMemo(() => {
    const byGame = new Map<
      number,
      { title: string; image: string | null; plays: number }
    >();
    for (const session of recentActivity) {
      const game = byGame.get(session.gameId);
      if (game) game.plays += 1;
      else
        byGame.set(session.gameId, {
          title: session.gameTitle,
          image: session.gameImage,
          plays: 1,
        });
    }

    return gameElos
      .flatMap(({ gameId, elo, sessionsPlayed }): ShowcaseGame[] => {
        const game = byGame.get(gameId);
        if (!game) return [];
        return [
          {
            gameId,
            ...game,
            elo: Math.round(elo),
            calibrating: !isCalibrated(sessionsPlayed),
          },
        ];
      })
      .sort((a, b) => b.elo - a.elo || a.title.localeCompare(b.title));
  }, [recentActivity, gameElos]);

  const query = search.trim().toLowerCase();
  const pickerGames = showcaseGames.filter(
    (game) =>
      game.title.toLowerCase().includes(query) &&
      (calibrationFilter === "all" ||
        game.calibrating === (calibrationFilter === "calibrating")),
  );

  const openPicker = (slot: number) => {
    setSearch("");
    setCalibrationFilter("all");
    setOpenShowcase(slot);
  };

  const handleSelectGame = (gameId: number) => {
    if (openShowcase === null) return;
    // Picking the game already in the other slot swaps the two
    const next = slotGameIds.map((id) =>
      id === gameId ? slotGameIds[openShowcase] : id,
    );
    next[openShowcase] = gameId;
    setSlotGameIds(next);
    setOpenShowcase(null);
    updateShowcaseSlots(next).catch((error) => {
      console.error("Failed to save showcase selection:", error);
    });
  };

  // Fixed two slots — long-press props built per slot rather than in a loop,
  // since NUM_SHOWCASE_SLOTS is a compile-time constant.
  const longPressSlot0 = useLongPress(() => openPicker(0));
  const longPressSlot1 = useLongPress(() => openPicker(1));
  const longPressBySlot = [longPressSlot0, longPressSlot1];

  // Total time spent playing — game length (playingTime) stands in for
  // actual session duration, which isn't tracked.
  const timeSpent = React.useMemo(() => {
    const totalMinutes = recentActivity.reduce(
      (sum, s) => sum + (s.playingTime ?? 0),
      0,
    );
    const hours = totalMinutes / 60;
    return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
  }, [recentActivity]);

  const stats = (
    <div className="grid grid-cols-3 gap-2">
      <MiniStat label="Played" value={gamesPlayed} />
      <MiniStat label="Won" value={gamesWon} />
      <MiniStat label="Time Spent" value={timeSpent} />
    </div>
  );

  const last10Sessions = [...recentActivity]
    .sort(
      (a, b) =>
        new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime(),
    )
    .slice(0, MAX_RECENT_SESSIONS);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="h-full"
    >
      <Card className="h-full gap-0 py-0">
        {/* ── Mobile ───────────────────────────────────────────────────── */}
        <CardContent className="flex flex-col gap-4 p-4 lg:hidden">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 shrink-0">
              <AvatarImage
                src={image}
                alt={`${firstName} ${lastName}'s profile picture`}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {firstName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {firstName} {lastName}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    @{username}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mt-1"
                  aria-label="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              {stats}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* ── Showcase ─────────────────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                Showcase
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap and hold to change
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {slotGameIds.map((gameId, slot) => (
                <ShowcaseSlotCard
                  key={slot}
                  game={showcaseGames.find((g) => g.gameId === gameId)}
                  triggerProps={longPressBySlot[slot]}
                />
              ))}
            </div>
          </div>
        </CardContent>

        {/* ── Desktop ──────────────────────────────────────────────────── */}
        <CardContent className="hidden lg:flex h-full flex-col gap-4 p-5">
          {/* ── Profile section: avatar to the left of name/username ───── */}
          <div className="flex shrink-0 items-center gap-3">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage
                src={image}
                alt={`${firstName} ${lastName}'s profile picture`}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {firstName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold truncate">
                {firstName} {lastName}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                @{username}
              </p>
              <p className="text-xs text-muted-foreground">
                Member since {memberSince}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 -mr-2"
              aria-label="Share profile"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="h-px shrink-0 bg-border" />

          {/* ── Mini stats ───────────────────────────────────────────── */}
          <div className="shrink-0">{stats}</div>

          {/* ── Last 10 sessions ─────────────────────────────────────── */}
          <div className="flex shrink-0 items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              Last 10 Sessions
            </h3>
            {last10Sessions.length > 0 ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {last10Sessions.map((session) => (
                  <span
                    key={session.sessionId}
                    className={cn(
                      "h-3.5 w-3.5 rounded-full",
                      sessionDotColor(session),
                    )}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No sessions recorded yet
              </p>
            )}
          </div>

          {/* ── Favourite games ──────────────────────────────────────── */}
          <div className="flex shrink-0 items-center gap-3">
            <h3 className="shrink-0 text-base font-semibold text-foreground">
              Favourite Games
            </h3>
            {favouriteGames.length > 0 ? (
              <div className="flex flex-1 justify-end gap-2">
                {favouriteGames.map((game) => (
                  <div
                    key={game.bggId}
                    className="relative aspect-square w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    {game.image && (
                      <Image
                        src={game.image}
                        alt={game.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex-1 text-right text-xs text-muted-foreground">
                No favourite games
              </p>
            )}
          </div>

          <div className="h-px shrink-0 bg-border" />

          {/* ── Showcase ─────────────────────────────────────────────── */}
          <div className="shrink-0">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                Showcase
              </h3>
              <p className="text-xs text-muted-foreground">
                Tap card to change
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {slotGameIds.map((gameId, slot) => (
                <ShowcaseSlotCard
                  key={slot}
                  game={showcaseGames.find((g) => g.gameId === gameId)}
                  triggerProps={{ onClick: () => openPicker(slot) }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Game picker ──────────────────────────────────────────────── */}
      <Sheet
        open={openShowcase !== null}
        onOpenChange={(open) => !open && setOpenShowcase(null)}
      >
        <SheetContent side="right">
          <SheetHeader className="pb-0">
            <SheetTitle>Choose a game</SheetTitle>
            <SheetDescription>Your games, highest Elo first</SheetDescription>
          </SheetHeader>

          {/* Filters stay put while the list scrolls */}
          <div className="flex flex-col gap-2 px-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search games"
                aria-label="Search games"
                className="pl-8"
              />
            </div>
            <div
              className="flex gap-1.5"
              role="group"
              aria-label="Filter by calibration"
            >
              {CALIBRATION_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  type="button"
                  size="sm"
                  variant={
                    calibrationFilter === filter.value ? "default" : "outline"
                  }
                  aria-pressed={calibrationFilter === filter.value}
                  onClick={() => setCalibrationFilter(filter.value)}
                  className="flex-1"
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-4">
            {pickerGames.map((game) => (
              <button
                key={game.gameId}
                type="button"
                onClick={() => handleSelectGame(game.gameId)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border p-2.5 text-left transition-colors hover:bg-muted/50",
                  openShowcase !== null &&
                    slotGameIds[openShowcase] === game.gameId &&
                    "border-primary bg-muted/40",
                )}
              >
                <GameThumbnail game={game} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {game.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {playsLabel(game.plays)} ·{" "}
                    {game.calibrating ? "Calibrating" : "Calibrated"}
                  </span>
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center px-2 py-1 text-sm font-bold tabular-nums",
                    ELO_TIER_CLASS[eloTier(game.elo)],
                  )}
                >
                  ELO {game.elo}
                  {game.calibrating && <CalibratingMark />}
                </span>
              </button>
            ))}
            {pickerGames.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {showcaseGames.length === 0
                  ? "No Elo yet. Play a rated session to earn one."
                  : "No games match your filters."}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default DashboardProfileCard;
