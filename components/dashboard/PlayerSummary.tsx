"use client";

import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";

interface PlayerSummaryProps {
  userId: number;
  /** All of the user's sessions; the last 12 months are picked out here */
  sessions: GroupedSession[];
  delay?: number;
}

type Stat = "byPlayers" | "byComplexity" | "winRate" | "avgWpa";
type StackStat = Extract<Stat, "byPlayers" | "byComplexity">;

// Clicking the card walks through these in order
const STAT_CYCLE: Stat[] = ["byPlayers", "byComplexity", "winRate", "avgWpa"];

const STAT_LABEL: Record<Stat, string> = {
  byPlayers: "Sessions per month by player count",
  byComplexity: "Sessions per month by complexity",
  winRate: "Monthly win rate (%)",
  avgWpa: "Monthly average WPA",
};

const MONTH_COUNT = 12;

// Segments for the stacked sessions bars, bottom to top; also the legend order
const STACKS: Record<StackStat, { labels: string[]; classes: string[] }> = {
  byPlayers: {
    labels: ["1", "2", "3", "4", "5", ">5"],
    classes: [
      "bg-accent-1",
      "bg-accent-2",
      "bg-accent-3",
      "bg-accent-4",
      "bg-accent-5",
      "bg-primary",
    ],
  },
  // Light ≤ 2.5, medium ≤ 3.5, heavy above; unknown is a game with no weight
  byComplexity: {
    labels: ["Light", "Medium", "Heavy", "Unknown"],
    classes: [
      "bg-accent-1",
      "bg-accent-3",
      "bg-accent-5",
      "bg-muted-foreground/40",
    ],
  },
};

const playerBucket = (numPlayers: number) =>
  Math.max(0, Math.min(numPlayers, STACKS.byPlayers.labels.length) - 1);

// BGG reports an unrated weight as 0, so that counts as unknown too
const complexityBucket = (weight: number | null) =>
  weight === null || weight <= 0
    ? 3
    : weight <= 2.5
      ? 0
      : weight <= 3.5
        ? 1
        : 2;

// Win rate bands share the W/T/L outcome tones used across the dashboard
const WIN_RATE_BANDS = [
  { from: 0, to: 40, className: "bg-destructive" },
  { from: 40, to: 60, className: "bg-amber-500" },
  { from: 60, to: 100, className: "bg-emerald-500" },
];

const winRateClass = (value: number) =>
  WIN_RATE_BANDS.find((b) => value < b.to)?.className ??
  WIN_RATE_BANDS[WIN_RATE_BANDS.length - 1].className;

interface MonthBucket {
  key: string;
  label: string;
  byPlayers: number[];
  byComplexity: number[];
  games: number;
  wins: number;
  scoreSum: number;
  scoreCount: number;
}

const PlayerSummary: React.FC<PlayerSummaryProps> = ({
  userId,
  sessions,
  delay = 0,
}) => {
  const [stat, setStat] = useState<Stat>("byPlayers");
  const stack = stat === "byPlayers" || stat === "byComplexity" ? stat : null;

  // One bucket per calendar month, oldest first, ending with this month
  const months = useMemo(() => {
    const start = startOfMonth(subMonths(new Date(), MONTH_COUNT - 1));
    const buckets = new Map<string, MonthBucket>();
    for (let i = 0; i < MONTH_COUNT; i++) {
      const date = addMonths(start, i);
      buckets.set(format(date, "yyyy-MM"), {
        key: format(date, "yyyy-MM"),
        label: format(date, "MMM"),
        byPlayers: STACKS.byPlayers.labels.map(() => 0),
        byComplexity: STACKS.byComplexity.labels.map(() => 0),
        games: 0,
        wins: 0,
        scoreSum: 0,
        scoreCount: 0,
      });
    }

    for (const session of sessions) {
      if (!session.isPlayer) continue;
      const bucket = buckets.get(
        format(new Date(session.datePlayed), "yyyy-MM"),
      );
      if (!bucket) continue;

      bucket.byPlayers[playerBucket(session.numPlayers)] += 1;
      bucket.byComplexity[complexityBucket(session.gameWeight)] += 1;
      bucket.games += 1;
      if (session.isWinner) bucket.wins += 1;

      const me = session.players.find((p) => p.profileId === userId);
      if (me?.score !== null && me?.score !== undefined) {
        bucket.scoreSum += me.score;
        bucket.scoreCount += 1;
      }
    }

    return [...buckets.values()];
  }, [sessions, userId]);

  // Per-month value for the active stat (null = nothing to show), the scale
  // ceiling, and the year-wide average the dashed line sits on
  const { values, max, average } = useMemo(() => {
    if (stat === "byPlayers" || stat === "byComplexity") {
      const values = months.map((m) => m.games);
      const total = values.reduce((sum, v) => sum + v, 0);
      return {
        values,
        max: Math.max(1, ...values),
        average: total / MONTH_COUNT,
      };
    }

    if (stat === "winRate") {
      const games = months.reduce((sum, m) => sum + m.games, 0);
      const wins = months.reduce((sum, m) => sum + m.wins, 0);
      return {
        values: months.map((m) =>
          m.games > 0 ? (m.wins / m.games) * 100 : null,
        ),
        max: 100,
        average: games > 0 ? (wins / games) * 100 : null,
      };
    }

    const scored = months.filter((m) => m.scoreCount > 0);
    const values = months.map((m) =>
      m.scoreCount > 0 ? m.scoreSum / m.scoreCount : null,
    );
    const scoreSum = scored.reduce((sum, m) => sum + m.scoreSum, 0);
    const scoreCount = scored.reduce((sum, m) => sum + m.scoreCount, 0);
    return {
      values,
      max: Math.max(
        1,
        Math.ceil(
          Math.max(0, ...values.filter((v): v is number => v !== null)),
        ),
      ),
      average: scoreCount > 0 ? scoreSum / scoreCount : null,
    };
  }, [months, stat]);

  const formatValue = (value: number | null) =>
    value === null
      ? "—"
      : stat === "avgWpa"
        ? value.toFixed(1)
        : Math.round(value).toString();

  const cycleStat = () =>
    setStat((s) => STAT_CYCLE[(STAT_CYCLE.indexOf(s) + 1) % STAT_CYCLE.length]);

  // ── Right-hand scale ───────────────────────────────────────────────────────
  // Stacked sessions: a session-count axis (the legend at the foot of the
  // card carries the categories). Win rate: the three outcome bands. WPA has
  // no fixed scale, so a plain gradient with min/mid/max ticks.
  const scale = (() => {
    if (stack) {
      return {
        segments: [
          {
            className: "bg-linear-to-t from-primary/20 to-primary",
            size: 1,
          },
        ],
        // Whole sessions only; a Set drops the duplicate when max is 1
        ticks: [...new Set([0, Math.round(max / 2), max])].map((v) => ({
          label: String(v),
          pct: (v / max) * 100,
        })),
      };
    }
    if (stat === "winRate") {
      return {
        segments: WIN_RATE_BANDS.map((b) => ({
          className: b.className,
          size: b.to - b.from,
        })),
        ticks: [0, 40, 60, 100].map((v) => ({ label: String(v), pct: v })),
      };
    }
    return {
      segments: [
        {
          className: "bg-linear-to-t from-accent-4/20 to-accent-4",
          size: 1,
        },
      ],
      ticks: [0, max / 2, max].map((v) => ({
        label: String(Math.round(v * 10) / 10),
        pct: (v / max) * 100,
      })),
    };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card
        role="button"
        tabIndex={0}
        aria-label="Summary of the last 12 months; click to change statistic"
        onClick={cycleStat}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cycleStat();
          }
        }}
        className="cursor-pointer select-none gap-0 py-0 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <CardContent className="p-0">
          {/* ── Header: title + stat position ────────────────────────────── */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <span className="font-bold">Summary (last 12 months)</span>
            <div className="flex items-center gap-1" aria-hidden>
              {STAT_CYCLE.map((s) => (
                <span
                  key={s}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    s === stat ? "bg-primary" : "bg-foreground/20",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5">
            {/* Chart on the left, scale on the right. Every row splits the
                same way so the month labels, bars and values line up. */}
            {/* Fixed bar height: the genre overview above absorbs whatever
                height the sessions table sets for the column */}
            <div className="grid grid-cols-[minmax(0,1fr)_2.25rem] grid-rows-[auto_9rem_auto] gap-x-3 gap-y-2">
              {/* ── Month labels: every second month, ending on this one ── */}
              <div className="grid grid-cols-12 gap-1 text-center text-xs text-muted-foreground">
                {months.map((m, i) => (
                  <span key={m.key} className="truncate">
                    {i % 2 === 1 ? m.label : ""}
                  </span>
                ))}
              </div>
              <div />

              {/* ── Bars + year average line ─────────────────────────────── */}
              <div className="relative">
                <div className="grid h-full grid-cols-12 items-end gap-1">
                  {months.map((m, i) => {
                    const value = values[i];
                    if (value === null || value === 0) {
                      return <div key={m.key} />;
                    }
                    const height = `${(value / max) * 100}%`;

                    if (stack) {
                      const { labels, classes } = STACKS[stack];
                      return (
                        <div
                          key={m.key}
                          className="flex flex-col-reverse overflow-hidden rounded-t-sm"
                          style={{ height }}
                        >
                          {m[stack].map((count, b) =>
                            count > 0 ? (
                              <div
                                key={labels[b]}
                                className={classes[b]}
                                style={{ flex: count }}
                              />
                            ) : null,
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.key}
                        className={cn(
                          "rounded-t-sm",
                          stat === "winRate"
                            ? winRateClass(value)
                            : "bg-accent-4",
                        )}
                        style={{ height }}
                      />
                    );
                  })}
                </div>

                {average !== null && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 border-t border-dashed border-foreground/50"
                    style={{
                      bottom: `${Math.min(100, (average / max) * 100)}%`,
                    }}
                  />
                )}
              </div>

              {/* ── Scale band + ticks ───────────────────────────────────── */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex w-1.5 flex-col-reverse overflow-hidden rounded-full">
                  {scale.segments.map((seg, i) => (
                    <div
                      key={i}
                      className={seg.className}
                      style={{ flex: seg.size }}
                    />
                  ))}
                </div>
                {scale.ticks.map((tick) => (
                  <span
                    key={tick.label}
                    className="absolute left-3 text-[10px] leading-none tabular-nums text-muted-foreground"
                    style={{
                      bottom: `${tick.pct}%`,
                      transform: "translateY(50%)",
                    }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>

              {/* ── Values under each bar ────────────────────────────────── */}
              <div className="grid grid-cols-12 gap-1 text-center text-[10px] font-medium tabular-nums sm:text-xs">
                {months.map((m, i) => (
                  <span key={m.key} className="truncate">
                    {formatValue(values[i])}
                  </span>
                ))}
              </div>
              <div />
            </div>

            {/* ── Stat description + year average ──────────────────────── */}
            <p className="mt-3 text-xs text-muted-foreground">
              {STAT_LABEL[stat]}
            </p>

            {/* ── Legend for the stacked views. The row keeps its height on
                the other views so the card (and the column it shares with
                the genre overview) doesn't resize on every click ────────── */}
            <div className="mt-2 flex min-h-4 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {stack &&
                STACKS[stack].labels.map((label, i) => (
                  <span key={label} className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className={cn(
                        "size-2.5 rounded-sm",
                        STACKS[stack].classes[i],
                      )}
                    />
                    {label}
                  </span>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerSummary;
