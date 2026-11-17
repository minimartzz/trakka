"use client";

import React, { useId, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, Dices, Trophy } from "lucide-react";
import {
  CalibratingMark,
  ELO_TIER_CLASS,
  EloArrow,
} from "@/components/GameSessionCard";
import { GameSearchSection } from "@/components/tribes/games/GameSearchSection";
import { getDefaultGame } from "@/components/tribes/games/utils";
import { useContainerSize } from "@/hooks/useContainerSize";
import { sessionHref } from "@/hooks/use-row-link";
import { GroupedSession, SessionPlayer } from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import type { GameListItem } from "@/types/tribes";
import { eloDisplay, eloTier } from "@/utils/elo";
import {
  eloSeries,
  periodStart,
  PERIODS,
  vpBinLabel,
  vpHistogram,
  type EloPoint,
  type Period,
  type RatedPlay,
} from "@/utils/gamePerformance";
import { positionOrdinalSuffix } from "@/utils/recordsProcessing";
import { chronological } from "./shared";

interface GamePerformanceProps {
  userId: number;
  sessions: GroupedSession[];
}

// "All time" is shortened on phones so five buttons fit one row
const PERIOD_LABEL: Record<Period, React.ReactNode> = {
  "1W": "1W",
  "1M": "1M",
  "3M": "3M",
  "6M": "6M",
  ALL: (
    <>
      All<span className="hidden sm:inline"> time</span>
    </>
  ),
};

const PERIOD_SPAN: Record<Period, string> = {
  "1W": "in the past week",
  "1M": "in the past month",
  "3M": "in the past 3 months",
  "6M": "in the past 6 months",
  ALL: "all time",
};

// Past this many sessions the line drops its per-session dots
const MAX_DOTS = 40;
// Elo chart's plot area, needed to place the tier bands on the line
const ELO_MARGIN = { top: 36, right: 28, bottom: 0, left: 0 };
const X_AXIS_HEIGHT = 24;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const signed = (delta: number) => (delta === 0 ? "±0" : Math.abs(delta));

const deltaClass = (delta: number) =>
  cn(
    delta > 0 && "text-emerald-600 dark:text-emerald-400",
    delta < 0 && "text-destructive",
    delta === 0 && "text-muted-foreground",
  );

// An Elo's tier colour, for SVG strokes and fills
const tierColour = (elo: number) => `var(--elo-${eloTier(elo)})`;

// Hard-edged gradient stops colouring each stretch of the line by the tier
// it's in. Offsets run from yMax (top of the plot) down to yMin.
function tierStops(yMin: number, yMax: number) {
  const stops: { offset: number; colour: string }[] = [];
  const band = (from: number, to: number) => {
    const colour = tierColour(to);
    stops.push(
      { offset: (yMax - to) / (yMax - yMin), colour },
      { offset: (yMax - from) / (yMax - yMin), colour },
    );
  };
  let top = yMax;
  for (let v = yMax; v > yMin; v--) {
    // The tier changes between v - 1 and v
    if (eloTier(v) !== eloTier(v - 1)) {
      band(v - 1, top);
      top = v - 1;
    }
  }
  band(yMin, top);
  return stops;
}

// The picker's list: every game the user has played, by title
const buildGameList = (plays: GroupedSession[]): GameListItem[] => {
  const games = new Map<number, GameListItem>();
  for (const s of plays) {
    const game = games.get(s.gameId) ?? {
      gameId: s.gameId,
      gameTitle: s.gameTitle,
      playCount: 0,
      imageUrl: s.gameImage,
      thumbnail: s.gameImage,
    };
    game.playCount += 1;
    games.set(s.gameId, game);
  }
  return [...games.values()].sort((a, b) =>
    a.gameTitle.localeCompare(b.gameTitle),
  );
};

/**
 * GamePerformance - One game's Elo, latest session and VP spread, across every
 * tribe. The period buttons drive the Elo line and the histogram; the latest
 * session is always the most recent one.
 */
const GamePerformance: React.FC<GamePerformanceProps> = ({
  userId,
  sessions,
}) => {
  const plays = useMemo(
    () => chronological(sessions).filter((s) => s.isPlayer),
    [sessions],
  );
  const gameList = useMemo(() => buildGameList(plays), [plays]);
  const [gameId, setGameId] = useState<number | null>(
    () => getDefaultGame(gameList)?.gameId ?? null,
  );
  const [period, setPeriod] = useState<Period>("ALL");

  const view = useMemo(() => {
    const gamePlays = plays.filter((s) => s.gameId === gameId);
    const mine = (s: GroupedSession) =>
      s.players.find((p) => p.profileId === userId);
    const since = periodStart(period, new Date());

    const rated: RatedPlay[] = gamePlays.flatMap((s) => {
      const me = mine(s);
      return me &&
        me.eloBefore !== null &&
        me.eloAfter !== null &&
        me.eloSessionsBefore !== null
        ? [
          {
            sessionId: s.sessionId,
            datePlayed: s.datePlayed,
            tribe: s.tribe,
            eloBefore: me.eloBefore,
            eloAfter: me.eloAfter,
            eloSessionsBefore: me.eloSessionsBefore,
          },
        ]
        : [];
    });

    const inPeriod = since
      ? gamePlays.filter((s) => s.datePlayed >= since)
      : gamePlays;
    const vps = inPeriod.flatMap((s) => {
      const vp = mine(s)?.victoryPoints;
      return s.isVp && vp !== null && vp !== undefined ? [vp] : [];
    });

    const hasVp = gamePlays.some((s) => s.isVp);
    const latest = gamePlays.at(-1) ?? null;
    const latestMe = latest ? mine(latest) : undefined;
    // The latest session is in the period whenever any session is
    const latestVp =
      latest && inPeriod.length > 0 && latest.isVp
        ? (latestMe?.victoryPoints ?? null)
        : null;

    return {
      series: eloSeries(rated, since),
      hasRated: rated.length > 0,
      hasVp,
      vps,
      latest,
      latestMe,
      latestVp,
    };
  }, [plays, gameId, period, userId]);

  const selectedGame = gameList.find((g) => g.gameId === gameId) ?? null;

  if (gameList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
        <Dices className="mb-2 size-10 opacity-50" />
        <p className="text-sm">
          Play a game to see how you perform in it over time.
        </p>
      </div>
    );
  }

  return (
    <div className="@container flex flex-col gap-3">
      {/* ---- Controls: game + period ------------------------------------ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <GameSearchSection
            gameList={gameList}
            selectedGameId={gameId}
            selectedGame={selectedGame}
            onSelectGame={setGameId}
            showHeading={false}
          />
        </div>
        {/* Nothing to filter for a game with neither Elo nor VP */}
        {(view.hasRated || view.hasVp) && (
          <div
            role="group"
            aria-label="Period"
            className="grid w-full grid-cols-5 gap-1 sm:flex sm:w-auto"
          >
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "min-h-11 whitespace-nowrap rounded-md border px-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:min-h-8",
                  period === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wide: Elo beside the latest session and VP. Narrow: stacked */}
      <div className="grid grid-cols-1 gap-y-3 @2xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] @2xl:gap-x-5">
        <section
          aria-labelledby="game-elo-heading"
          className="flex min-h-0 flex-col"
        >
          <div className="mb-1 flex items-baseline gap-2">
            <h3 id="game-elo-heading" className="text-sm font-semibold">
              Elo
            </h3>
            {view.series.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {plural(view.series.length - 1, "rated session")}
              </p>
            )}
          </div>

          {view.series.length > 0 ? (
            <EloChart
              series={view.series}
              label={`Your Elo in ${selectedGame?.gameTitle ?? "this game"}, ${PERIOD_SPAN[period]}`}
            />
          ) : (
            <div className="flex min-h-44 flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
              {view.hasRated ? (
                <>
                  <p>No rated sessions {PERIOD_SPAN[period]}.</p>
                  <button
                    type="button"
                    onClick={() => setPeriod("ALL")}
                    className="min-h-11 rounded-sm px-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Show all time
                  </button>
                </>
              ) : (
                <p className="max-w-xs">
                  No rated sessions yet. Elo moves after competitive sessions
                  scored in VP.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Hairline-divided, not boxed: this already sits in a card */}
        <div className="flex flex-col divide-y border-t @2xl:border-t-0 @2xl:border-l @2xl:pl-5 [&>*]:py-3 @2xl:[&>*:first-child]:pt-0 [&>*:last-child]:pb-0">
          {view.latest && (
            <LatestSession session={view.latest} me={view.latestMe} />
          )}
          <VpHistogram
            vps={view.vps}
            latestVp={view.latestVp}
            period={period}
            hasVp={view.hasVp}
          />
        </div>
      </div>
    </div>
  );
};

// ---- Elo -------------------------------------------------------------------

const EloChart: React.FC<{ series: EloPoint[]; label: string }> = ({
  series,
  label,
}) => {
  const [containerRef, { width, height }] = useContainerSize();
  // Plain characters only: the id goes into url(#...)
  const gradientId = `elo-tiers-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const last = series[series.length - 1];
  const sessionCount = series.length - 1;

  const dateFormat =
    series[1].session!.datePlayed.slice(0, 4) ===
      last.session!.datePlayed.slice(0, 4)
      ? "d MMM"
      : "MMM ''yy";
  const tickLabel = (index: number) =>
    format(new Date(series[index].session!.datePlayed), dateFormat);

  // Up to 5 dates spread over the sessions, skipping repeats of a game night
  const tickCount = Math.min(sessionCount, 5);
  const spread =
    tickCount === 1
      ? [sessionCount]
      : Array.from({ length: tickCount }, (_, i) =>
        Math.round(1 + (i * (sessionCount - 1)) / (tickCount - 1)),
      );
  const ticks = spread.filter(
    (index, i) => i === 0 || tickLabel(index) !== tickLabel(spread[i - 1]),
  );

  // Evenly spaced gridlines: the smallest round step giving at most 5 gaps
  const elos = series.map((p) => p.elo);
  const bounds = (step: number) => [
    Math.max(0, Math.floor((Math.min(...elos) - 10) / step) * step),
    Math.ceil((Math.max(...elos) + 10) / step) * step,
  ];
  const yStep =
    [25, 50, 100, 200, 250, 500, 1000].find((step) => {
      const [lo, hi] = bounds(step);
      return (hi - lo) / step <= 5;
    }) ?? 2000;
  const [yMin, yMax] = bounds(yStep);
  const yTicks = Array.from(
    { length: (yMax - yMin) / yStep + 1 },
    (_, i) => yMin + i * yStep,
  );
  const plotBottom = height - ELO_MARGIN.bottom - X_AXIS_HEIGHT;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={`${label}: ${series[0].elo} to ${last.elo} over ${plural(sessionCount, "session")}`}
      className="min-h-44 w-full flex-1"
    >
      {width > 0 && (
        <LineChart
          width={width}
          height={height}
          data={series}
          margin={ELO_MARGIN}
        >
          <defs>
            {/* In pixels, so a flat line (no height to scale by) still shows */}
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={ELO_MARGIN.top}
              x2={0}
              y2={plotBottom}
            >
              {tierStops(yMin, yMax).map((stop, i) => (
                <stop key={i} offset={stop.offset} stopColor={stop.colour} />
              ))}
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="index"
            type="number"
            domain={[0, "dataMax"]}
            ticks={ticks}
            tickFormatter={tickLabel}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            height={X_AXIS_HEIGHT}
            padding={{ left: 8, right: 8 }}
          />
          <YAxis
            domain={[yMin, yMax]}
            ticks={yTicks}
            interval={0}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            content={<EloTooltip />}
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          />
          <Line
            dataKey="elo"
            type="linear"
            stroke={`url(#${gradientId})`}
            strokeWidth={2.5}
            isAnimationActive={false}
            activeDot={({ cx, cy, payload }: DotProps) =>
              cx == null || cy == null || !payload ? (
                <g key="active" />
              ) : (
                <circle
                  key="active"
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={tierColour(payload.elo)}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              )
            }
            dot={({ cx, cy, payload }: DotProps) => (
              <EloDot
                key={payload?.index}
                cx={cx}
                cy={cy}
                payload={payload}
                lastIndex={last.index}
                showSessions={sessionCount <= MAX_DOTS}
              />
            )}
          />
        </LineChart>
      )}
    </div>
  );
};

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: EloPoint;
}

// Dots take their tier's colour, calibrating ones hollow; the latest ends the
// line with its Elo in a tier chip
const EloDot: React.FC<
  DotProps & { lastIndex: number; showSessions: boolean }
> = ({ cx, cy, payload, lastIndex, showSessions }) => {
  if (cx == null || cy == null || !payload) return <g />;
  const colour = tierColour(payload.elo);

  if (payload.index === lastIndex) {
    return (
      <g>
        <foreignObject x={cx - 40} y={cy - 36} width={80} height={26}>
          <div className="flex justify-center">
            <span
              className={cn(
                "rounded-md px-1.5 font-display text-base font-bold leading-6",
                ELO_TIER_CLASS[eloTier(payload.elo)],
              )}
            >
              {payload.elo}
              {payload.calibrating && <CalibratingMark />}
            </span>
          </div>
        </foreignObject>
        <circle
          cx={cx}
          cy={cy}
          r={5.5}
          fill={colour}
          stroke="var(--card)"
          strokeWidth={2}
        />
      </g>
    );
  }

  // The starting point isn't a session of its own
  if (!showSessions || payload.index === 0) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      stroke={colour}
      strokeWidth={1.5}
      fill={payload.calibrating ? "var(--card)" : colour}
    />
  );
};

const EloTooltip: React.FC<{
  active?: boolean;
  payload?: { payload: EloPoint }[];
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const session = point.session;

  return (
    <div className="min-w-36 rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-lg">
      <p className="text-sm font-medium">
        {session
          ? format(new Date(session.datePlayed), "d MMM yyyy")
          : "Start of period"}
      </p>
      {session && (
        <p className="max-w-48 truncate text-xs text-muted-foreground">
          {session.tribe}
        </p>
      )}
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="font-display text-xl font-bold leading-none">
          {point.elo}
          {point.calibrating && <CalibratingMark />}
        </span>
        {session && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-bold tabular-nums",
              deltaClass(point.delta),
            )}
          >
            <EloArrow delta={point.delta} className="size-3" />
            {signed(point.delta)}
          </span>
        )}
      </p>
    </div>
  );
};

// ---- Latest session ----------------------------------------------------------

// An Elo in its tier's colour
const EloChip: React.FC<{ elo: number; calibrating?: boolean }> = ({
  elo,
  calibrating = false,
}) => (
  <span
    className={cn(
      "shrink-0 rounded-md px-1.5 py-0.5 font-display text-xl font-bold leading-none",
      ELO_TIER_CLASS[eloTier(elo)],
    )}
  >
    {elo}
    {calibrating && <CalibratingMark />}
  </span>
);

const LatestSession: React.FC<{
  session: GroupedSession;
  me: SessionPlayer | undefined;
}> = ({ session, me }) => {
  // Null when the session doesn't affect Elo
  const elo = me ? eloDisplay(me) : null;
  const vp =
    session.isVp && me?.victoryPoints !== null && me?.victoryPoints !== undefined
      ? me.victoryPoints
      : null;

  return (
    <section aria-labelledby="latest-session-heading" className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="latest-session-heading" className="text-sm font-semibold">
            Latest session
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {format(new Date(session.datePlayed), "d MMM yyyy")} ·{" "}
            {session.tribe}
          </p>
        </div>
        <Link
          href={sessionHref(session.sessionId)}
          aria-label={`Open your latest ${session.gameTitle} session`}
          className="-mr-2 -mt-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8"
        >
          View
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <dl className="mt-2 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">Position</dt>
          <dd className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-2xl font-bold leading-none">
              {me ? positionOrdinalSuffix(me.position) : "-"}
            </span>
            {me && (
              <span className="text-xs text-muted-foreground">
                of {session.numPlayers}
              </span>
            )}
            {session.isWinner && (
              <Trophy
                aria-label="Won"
                className="size-4 self-center text-emerald-600 dark:text-emerald-400"
              />
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">VP earned</dt>
          <dd className="mt-0.5 font-display text-2xl font-bold leading-none">
            {vp ?? "-"}
          </dd>
        </div>
      </dl>

      {elo ? (
        // Before ── change ── after, read left to right
        <p className="mt-5 flex items-center gap-2">
          <span className="sr-only">Elo before</span>
          <EloChip elo={elo.elo - elo.delta} />
          <span className="relative flex flex-1 items-center self-stretch">
            <span className="h-0.5 w-full rounded-full bg-border" />
            <span
              className={cn(
                "absolute inset-x-0 bottom-1/2 mb-1 flex items-center justify-center gap-0.5 font-display text-base font-bold leading-none",
                deltaClass(elo.delta),
              )}
            >
              <span className="sr-only">, change</span>
              <EloArrow delta={elo.delta} className="size-3.5" />
              {signed(elo.delta)}
            </span>
          </span>
          <span className="sr-only">, Elo after</span>
          <EloChip elo={elo.elo} calibrating={elo.calibrating} />
        </p>
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide">
            Unrated
          </span>
          This session didn&apos;t change your Elo.
        </p>
      )}
    </section>
  );
};

// ---- VP histogram ------------------------------------------------------------

const VpHistogram: React.FC<{
  vps: number[];
  latestVp: number | null;
  period: Period;
  // Whether the game is ever scored in VP
  hasVp: boolean;
}> = ({ vps, latestVp, period, hasVp }) => {
  const [containerRef, { width, height }] = useContainerSize();
  const bins = useMemo(
    () => vpHistogram(vps).map((bin) => ({ ...bin, label: vpBinLabel(bin) })),
    [vps],
  );
  const latestBin =
    latestVp === null
      ? -1
      : bins.findIndex((b) => latestVp >= b.from && latestVp <= b.to);

  return (
    <section aria-labelledby="vp-histogram-heading" className="flex flex-col">
      <h3 id="vp-histogram-heading" className="text-sm font-semibold">
        VP earned
      </h3>
      {vps.length > 0 ? (
        <div
          ref={containerRef}
          role="img"
          aria-label={`Your VP ${PERIOD_SPAN[period]}: ${bins
            .filter((b) => b.count > 0)
            .map((b) => `${b.label}: ${b.count}`)
            .join(", ")}${latestBin >= 0 ? `. Latest session: ${latestVp}` : ""}`}
          className="h-28 w-full"
        >
          {width > 0 && (
            <BarChart
              width={width}
              height={height}
              data={bins}
              margin={{ top: 26, right: 0, bottom: 0, left: 0 }}
              barCategoryGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={4}
                height={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={24}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const bin = payload[0].payload as (typeof bins)[number];
                  return (
                    <div className="rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-lg">
                      <p className="text-sm font-medium">{bin.label} VP</p>
                      <p className="text-xs text-muted-foreground">
                        {plural(bin.count, "session")}
                      </p>
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="count"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
                label={(props: BarLabelProps) =>
                  props.index === latestBin && latestVp !== null ? (
                    <LatestPill
                      key="latest"
                      x={Number(props.x) + Number(props.width) / 2}
                      y={Number(props.y)}
                      text={String(latestVp)}
                    />
                  ) : (
                    <g key={props.index} />
                  )
                }
              />
            </BarChart>
          )}
        </div>
      ) : (
        <p className="flex flex-1 items-center justify-center py-6 text-center text-sm text-muted-foreground">
          {!hasVp
            ? "This game isn't scored in VP."
            : period === "ALL"
              ? "No VP recorded yet."
              : `No VP recorded ${PERIOD_SPAN[period]}.`}
        </p>
      )}
    </section>
  );
};

interface BarLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  index?: number;
}

// The latest session's value above its bin, like the Elo line's end chip
const LatestPill: React.FC<{ x: number; y: number; text: string }> = ({
  x,
  y,
  text,
}) => {
  const pillWidth = text.length * 9 + 14;
  return (
    <g>
      <rect
        x={x - pillWidth / 2}
        y={y - 24}
        width={pillWidth}
        height={20}
        rx={5}
        fill="var(--primary)"
      />
      <text
        x={x}
        y={y - 14}
        dy="0.35em"
        textAnchor="middle"
        fill="var(--primary-foreground)"
        fontSize={14}
        fontWeight={700}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {text}
      </text>
    </g>
  );
};

export default GamePerformance;
