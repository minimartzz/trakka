"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  format,
  formatDistanceToNowStrict,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
} from "date-fns";
import { ArrowUpRight, ChevronDown, Dices, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";

interface DashboardTribesProps {
  userId: number;
  // Sessions filtered to active timeframe
  sessions: GroupedSession[];
  /** Resolved window the dashboard is showing, or null for all time */
  activeRange: { from: Date; to: Date } | null;
  delay?: number;
}

// Rows shown before the "+N more" footer
const ROW_LIMIT = 5;

// ─── Activity strip buckets ───────────────────────────────────────────────────

type Unit = "day" | "week" | "month" | "quarter";

// Coarsest unit that still gives the window a readable number of cells: a
// month of days, half a year of weeks, three years of months.
const unitFor = (days: number): Unit =>
  days <= 31
    ? "day"
    : days <= 200
      ? "week"
      : days <= 1100
        ? "month"
        : "quarter";

interface Bucket {
  start: Date;
  end: Date;
  label: string;
}

const buildBuckets = (from: Date, to: Date): Bucket[] => {
  const unit = unitFor(differenceInCalendarDays(to, from) + 1);
  const buckets: Bucket[] = [];

  let cursor =
    unit === "day"
      ? startOfDay(from)
      : unit === "week"
        ? startOfWeek(from, { weekStartsOn: 1 })
        : unit === "month"
          ? startOfMonth(from)
          : startOfQuarter(from);

  while (cursor <= to) {
    const end =
      unit === "day"
        ? endOfDay(cursor)
        : unit === "week"
          ? endOfWeek(cursor, { weekStartsOn: 1 })
          : unit === "month"
            ? endOfMonth(cursor)
            : endOfQuarter(cursor);

    const label =
      unit === "day"
        ? format(cursor, "EEE d MMM")
        : unit === "week"
          ? `${format(cursor, "d MMM")} – ${format(end, "d MMM")}`
          : unit === "month"
            ? format(cursor, "MMM yyyy")
            : format(cursor, "QQQ yyyy");

    buckets.push({ start: cursor, end, label });

    cursor =
      unit === "day"
        ? addDays(cursor, 1)
        : unit === "week"
          ? addWeeks(cursor, 1)
          : unit === "month"
            ? addMonths(cursor, 1)
            : addQuarters(cursor, 1);
  }

  return buckets;
};

// Sequential single-hue scale, empty → busiest. Level 0 is the "no play" cell.
const HEAT_CLASSES = [
  "bg-foreground/8",
  "bg-primary/25",
  "bg-primary/50",
  "bg-primary/75",
  "bg-primary",
];

const heatLevel = (count: number, max: number) =>
  count === 0
    ? 0
    : Math.max(1, Math.ceil((count / max) * (HEAT_CLASSES.length - 1)));

// ─── Per-tribe tallies ────────────────────────────────────────────────────────

interface Tally<T> {
  key: T;
  count: number;
}

interface TribeStats {
  tribeId: string;
  name: string;
  image: string;
  games: number;
  wins: number;
  ties: number;
  losses: number;
  scoreSum: number;
  scoreCount: number;
  lastPlayed: Date;
  /** Sessions in each activity bucket */
  activity: { count: number; wins: number }[];
  topGame: { title: string; image: string | null } | null;
  topPlayer: { firstName: string; profilePic: string } | null;
}

const winRateClass = (rate: number) =>
  rate >= 60
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
    : rate >= 40
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-destructive/15 text-destructive";

// ─── Main Component ───────────────────────────────────────────────────────────

const DashboardTribes: React.FC<DashboardTribesProps> = ({
  userId,
  sessions,
  activeRange,
  delay = 0,
}) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);

  const played = useMemo(() => sessions.filter((s) => s.isPlayer), [sessions]);

  // "All time" has no window of its own, so it spans from the first session
  const buckets = useMemo(() => {
    if (played.length === 0) return [];
    const from =
      activeRange?.from ??
      new Date(
        Math.min(...played.map((s) => new Date(s.datePlayed).getTime())),
      );
    const to = activeRange?.to ?? endOfDay(new Date());
    return buildBuckets(from, to);
  }, [played, activeRange]);

  const { tribes, hidden, maxCell } = useMemo(() => {
    const byTribe = new Map<
      string,
      TribeStats & {
        games_: Map<number, Tally<{ title: string; image: string | null }>>;
        players_: Map<number, Tally<{ firstName: string; profilePic: string }>>;
      }
    >();

    for (const session of played) {
      const date = new Date(session.datePlayed);
      const entry = byTribe.get(session.tribeId) ?? {
        tribeId: session.tribeId,
        name: session.tribe,
        image: session.tribeImage,
        games: 0,
        wins: 0,
        ties: 0,
        losses: 0,
        scoreSum: 0,
        scoreCount: 0,
        lastPlayed: date,
        activity: buckets.map(() => ({ count: 0, wins: 0 })),
        topGame: null,
        topPlayer: null,
        games_: new Map(),
        players_: new Map(),
      };

      entry.games += 1;
      // Tie takes precedence, matching the outcome circle in the sessions table
      if (session.isTied) entry.ties += 1;
      else if (session.isWinner) entry.wins += 1;
      else entry.losses += 1;
      if (date > entry.lastPlayed) entry.lastPlayed = date;

      const me = session.players.find((p) => p.profileId === userId);
      if (me?.score !== null && me?.score !== undefined) {
        entry.scoreSum += me.score;
        entry.scoreCount += 1;
      }

      const bucketIdx = buckets.findIndex(
        (b) => date >= b.start && date <= b.end,
      );
      if (bucketIdx >= 0) {
        entry.activity[bucketIdx].count += 1;
        if (session.isWinner) entry.activity[bucketIdx].wins += 1;
      }

      const game = entry.games_.get(session.gameId) ?? {
        key: { title: session.gameTitle, image: session.gameImage },
        count: 0,
      };
      game.count += 1;
      entry.games_.set(session.gameId, game);

      for (const p of session.players) {
        if (p.profileId === userId) continue;
        const tally = entry.players_.get(p.profileId) ?? {
          key: { firstName: p.firstName, profilePic: p.profilePic },
          count: 0,
        };
        tally.count += 1;
        entry.players_.set(p.profileId, tally);
      }

      byTribe.set(session.tribeId, entry);
    }

    const top = <T,>(tallies: Map<number, Tally<T>>): T | null =>
      [...tallies.values()].sort((a, b) => b.count - a.count)[0]?.key ?? null;

    const all = [...byTribe.values()]
      .map<TribeStats>(({ games_, players_, ...rest }) => ({
        ...rest,
        topGame: top(games_),
        topPlayer: top(players_),
      }))
      // Most recently played first: this card is about recent interaction
      .sort((a, b) => b.lastPlayed.getTime() - a.lastPlayed.getTime());

    const shown = all.slice(0, ROW_LIMIT);
    return {
      tribes: shown,
      hidden: all.length - shown.length,
      // Shared ceiling so the same shade means the same amount in every row
      maxCell: Math.max(
        1,
        ...shown.flatMap((t) => t.activity.map((a) => a.count)),
      ),
    };
  }, [played, buckets, userId]);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full gap-0 py-0">
        <CardContent className="flex h-full flex-col p-0">
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="font-bold">Tribes</span>
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
                Tribes you played in during this timeframe, most recent first.
                The strip shows how often you played across the period. Tap a
                tribe for details.
              </TooltipContent>
            </Tooltip>
          </div>

          {tribes.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground">
              <Dices className="mb-2 size-10 opacity-50" />
              <p className="text-sm">No tribe activity for this timeframe</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y">
              {tribes.map((tribe) => {
                const open = openId === tribe.tribeId;
                const winRate = (tribe.wins / tribe.games) * 100;
                const wpa =
                  tribe.scoreCount > 0
                    ? tribe.scoreSum / tribe.scoreCount
                    : null;

                return (
                  <li key={tribe.tribeId}>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-expanded={open}
                      onClick={() => toggle(tribe.tribeId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(tribe.tribeId);
                        }
                      }}
                      className={cn(
                        "grid cursor-pointer select-none grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2.5 px-4 py-3 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:px-5",
                        "md:grid-cols-[auto_minmax(0,11rem)_minmax(0,1fr)_auto_auto]",
                      )}
                    >
                      {/* ── Avatar ─────────────────────────────────────── */}
                      <Avatar className="size-10 rounded-lg">
                        <AvatarImage
                          src={tribe.image || undefined}
                          alt=""
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-lg bg-muted text-xs font-semibold">
                          {tribe.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      {/* ── Name + meta ────────────────────────────────── */}
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={tribe.name}>
                          {tribe.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="tabular-nums">{tribe.games}</span>{" "}
                          {tribe.games === 1 ? "session" : "sessions"}
                          <span className="text-muted-foreground/60"> · </span>
                          {formatDistanceToNowStrict(tribe.lastPlayed, {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {/* ── Activity strip. Own row on mobile, inline on
                             desktop ────────────────────────────────────── */}
                      <div
                        className="col-span-4 row-start-2 grid gap-0.5 md:col-span-1 md:col-start-3 md:row-start-1"
                        style={{
                          gridTemplateColumns: `repeat(${buckets.length}, minmax(0, 1fr))`,
                        }}
                        aria-label={`Sessions per period in ${tribe.name}`}
                      >
                        {tribe.activity.map((cell, i) => {
                          const className = cn(
                            "h-3.5 rounded-[2px]",
                            HEAT_CLASSES[heatLevel(cell.count, maxCell)],
                          );
                          // Silent cells carry nothing worth a tooltip
                          if (cell.count === 0) {
                            return <span key={i} className={className} />;
                          }
                          return (
                            <Tooltip key={i}>
                              <TooltipTrigger asChild>
                                <span
                                  className={cn(className, "cursor-help")}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                {buckets[i].label}
                                <span className="text-muted-foreground/70">
                                  {" · "}
                                </span>
                                {cell.count}{" "}
                                {cell.count === 1 ? "session" : "sessions"}
                                {cell.wins > 0 && `, ${cell.wins} won`}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>

                      {/* ── Win rate chip ──────────────────────────────── */}
                      <span
                        className={cn(
                          "col-start-3 row-start-1 rounded px-2 py-0.5 text-sm font-bold tabular-nums leading-none md:col-start-4",
                          winRateClass(winRate),
                        )}
                        title="Win rate"
                      >
                        {Math.round(winRate)}%
                      </span>

                      <ChevronDown
                        className={cn(
                          "col-start-4 row-start-1 size-4 text-muted-foreground transition-transform md:col-start-5",
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
                                Record
                              </p>
                              <p className="mt-0.5 font-display text-xl font-bold leading-none tabular-nums">
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  {tribe.wins}W
                                </span>{" "}
                                <span className="text-amber-600 dark:text-amber-400">
                                  {tribe.ties}T
                                </span>{" "}
                                <span className="text-destructive">
                                  {tribe.losses}L
                                </span>
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground">
                                Avg WPA
                              </p>
                              <p className="mt-0.5 font-display text-xl font-bold leading-none tabular-nums text-accent-4">
                                {wpa !== null ? wpa.toFixed(2) : "—"}
                              </p>
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Most played
                              </p>
                              {tribe.topGame ? (
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="relative size-6 shrink-0 overflow-hidden rounded bg-muted">
                                    {tribe.topGame.image ? (
                                      <Image
                                        src={tribe.topGame.image}
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
                                    title={tribe.topGame.title}
                                  >
                                    {tribe.topGame.title}
                                  </span>
                                </div>
                              ) : (
                                <p className="mt-1">—</p>
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                Played most with
                              </p>
                              {tribe.topPlayer ? (
                                <div className="mt-1 flex items-center gap-2">
                                  <Avatar className="size-6">
                                    <AvatarImage
                                      src={tribe.topPlayer.profilePic}
                                      className="object-cover"
                                    />
                                    <AvatarFallback className="bg-muted text-[10px]">
                                      {tribe.topPlayer.firstName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="truncate font-medium">
                                    {tribe.topPlayer.firstName}
                                  </span>
                                </div>
                              ) : (
                                <p className="mt-1">Solo only</p>
                              )}
                            </div>

                            <Link
                              href={`/tribe/${tribe.tribeId}`}
                              className="col-span-2 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline sm:col-span-4"
                            >
                              Open tribe
                              <ArrowUpRight className="size-3.5" />
                            </Link>
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
              +{hidden} more {hidden === 1 ? "tribe" : "tribes"} in this
              timeframe
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DashboardTribes;
