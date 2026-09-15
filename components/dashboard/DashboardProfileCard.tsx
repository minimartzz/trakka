"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Compass,
  Dumbbell,
  Feather,
  Hourglass,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import type { FavouriteGame } from "@/db/schema/profile";
import { updateShowcaseSlots } from "@/app/(account)/dashboard/action";

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
  // Persisted showcase card ids - null if none are selected
  showcaseSlots?: (string | null)[];
}

const MAX_RECENT_SESSIONS = 10;
const NUM_SHOWCASE_SLOTS = 2;
const HEAVYWEIGHT_THRESHOLD = 3.5;
const SIMPLE_THRESHOLD = 2;
const LONG_PRESS_MS = 500;

const sessionDotColor = (session: GroupedSession): string => {
  if (session.isWinner) return "bg-emerald-500";
  if (session.isLoser) return "bg-destructive";
  if (session.isTied) return "bg-amber-500";
  return "bg-sky-500";
};

interface ShowcaseCardDef {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  background: string;
  border: string;
  iconWrapClassName: string;
  compute: (sessions: GroupedSession[]) => string;
}

const SHOWCASE_CARD_DEFS: ShowcaseCardDef[] = [
  {
    id: "unique-games",
    icon: Compass,
    title: "Game-trotter",
    description: "Number of unique games",
    background: "bg-accent-1/15",
    border: "border-accent-2/50",
    iconWrapClassName: "rounded-full bg-accent-1/25 text-accent-1",
    compute: (sessions) => String(new Set(sessions.map((s) => s.gameId)).size),
  },
  {
    id: "avg-length",
    icon: Hourglass,
    title: "It's a Marathon",
    description: "Average length of games",
    background: "bg-accent-2/15",
    border: "border-accent-3/50",
    iconWrapClassName: "rounded-xl bg-accent-2/25 text-accent-2",
    compute: (sessions) => {
      const withLength = sessions.filter(
        (s): s is GroupedSession & { playingTime: number } =>
          s.playingTime !== null,
      );
      if (withLength.length === 0) return "—";
      const avg =
        withLength.reduce((sum, s) => sum + s.playingTime, 0) /
        withLength.length;
      return `${Math.round(avg)} min`;
    },
  },
  {
    id: "heavyweight",
    icon: Dumbbell,
    title: "Heavyweight",
    description: "Sessions played where complexity is >3.5",
    background: "bg-accent-4/15",
    border: "border-accent-5/50",
    iconWrapClassName: "rounded-2xl bg-accent-4/25 text-accent-4 rotate-3",
    compute: (sessions) =>
      String(
        sessions.filter(
          (s) => s.gameWeight !== null && s.gameWeight > HEAVYWEIGHT_THRESHOLD,
        ).length,
      ),
  },
  {
    id: "simple",
    icon: Feather,
    title: "Something easy?",
    description: "Sessions played where complexity is <2",
    background: "bg-accent-5/15",
    border: "border-accent-4/50",
    iconWrapClassName: "rounded-full bg-accent-5/25 text-accent-5 -rotate-6",
    compute: (sessions) =>
      String(
        sessions.filter(
          (s) => s.gameWeight !== null && s.gameWeight < SIMPLE_THRESHOLD,
        ).length,
      ),
  },
];

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

const ShowcaseSlotCard: React.FC<{
  cardDef: ShowcaseCardDef | undefined;
  recentActivity: GroupedSession[];
  triggerProps: React.ButtonHTMLAttributes<HTMLButtonElement>;
}> = ({ cardDef, recentActivity, triggerProps }) => {
  if (!cardDef) {
    return (
      <button
        type="button"
        {...triggerProps}
        className="flex min-h-16 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-2 text-center transition-colors hover:bg-muted/40"
      >
        <span className="text-xs text-muted-foreground">
          Tap here to add a custom stat
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      {...triggerProps}
      className={cn(
        "flex min-h-16 items-stretch overflow-hidden rounded-xl border-2 text-left transition-transform hover:scale-[1.02]",
        cardDef.background,
        cardDef.border,
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-2.5 py-2">
        <span className="text-sm font-bold leading-tight text-foreground">
          {cardDef.title}
        </span>
        <span className="text-[10px] leading-tight text-muted-foreground">
          {cardDef.description}
        </span>
      </span>
      <span className="flex w-14 shrink-0 items-center justify-center px-1.5 font-display text-xl font-bold leading-none text-foreground">
        {cardDef.compute(recentActivity)}
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
}) => {
  const [openShowcase, setOpenShowcase] = React.useState<number | null>(null);
  const [slotCardIds, setSlotCardIds] = React.useState<(string | null)[]>(
    () => {
      const initial = showcaseSlots ?? [];
      return Array.from(
        { length: NUM_SHOWCASE_SLOTS },
        (_, i) => initial[i] ?? null,
      );
    },
  );

  const handleSelectCard = (cardId: string) => {
    if (openShowcase === null) return;
    const next = [...slotCardIds];
    next[openShowcase] = cardId;
    setSlotCardIds(next);
    setOpenShowcase(null);
    updateShowcaseSlots(next).catch((error) => {
      console.error("Failed to save showcase selection:", error);
    });
  };

  // Fixed two slots — long-press props built per slot rather than in a loop,
  // since NUM_SHOWCASE_SLOTS is a compile-time constant.
  const longPressSlot0 = useLongPress(() => setOpenShowcase(0));
  const longPressSlot1 = useLongPress(() => setOpenShowcase(1));
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
              {slotCardIds.map((cardId, slot) => (
                <ShowcaseSlotCard
                  key={slot}
                  cardDef={SHOWCASE_CARD_DEFS.find((c) => c.id === cardId)}
                  recentActivity={recentActivity}
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
              {slotCardIds.map((cardId, slot) => (
                <ShowcaseSlotCard
                  key={slot}
                  cardDef={SHOWCASE_CARD_DEFS.find((c) => c.id === cardId)}
                  recentActivity={recentActivity}
                  triggerProps={{ onClick: () => setOpenShowcase(slot) }}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Card picker ──────────────────────────────────────────────── */}
      <Sheet
        open={openShowcase !== null}
        onOpenChange={(open) => !open && setOpenShowcase(null)}
      >
        <SheetContent side="right" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Choose a stat</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-3 px-4 pb-4">
            {SHOWCASE_CARD_DEFS.map((cardDef) => {
              const Icon = cardDef.icon;
              return (
                <button
                  key={cardDef.id}
                  type="button"
                  onClick={() => handleSelectCard(cardDef.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-3.5 text-left transition-transform hover:scale-[1.02]",
                    cardDef.background,
                    cardDef.border,
                  )}
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center",
                      cardDef.iconWrapClassName,
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {cardDef.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {cardDef.description}
                    </span>
                  </span>
                  <span className="shrink-0 font-display text-2xl font-bold leading-none text-foreground">
                    {cardDef.compute(recentActivity)}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default DashboardProfileCard;
