"use client";

// Session Frequency card on the public player page. Clicking the card cycles
// between sessions per week, the same split by complexity tier, and by player
// count. Shows as many months as fit without scrolling sideways.
import { getWeightColor } from "@/components/tribes/games/utils";
import { useContainerSize } from "@/hooks/useContainerSize";
import { cn } from "@/lib/utils";
import { COMPLEXITY_COLORS } from "@/utils/chartHelpers";
import type { lastMonthAverages, weeklySessions } from "@/utils/playerProfile";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

type Week = ReturnType<typeof weeklySessions>[number];
type SeriesKey = Exclude<keyof Week, "weekStart">;

const MODES = [
  {
    key: "sessions",
    stat: "sessions / week",
    series: [{ key: "count", name: "Sessions", fill: "var(--primary)" }],
  },
  {
    key: "complexity",
    stat: "avg complexity",
    series: [
      { key: "light", name: "Light", fill: COMPLEXITY_COLORS.light },
      { key: "medium", name: "Medium", fill: COMPLEXITY_COLORS.medium },
      { key: "heavy", name: "Heavy", fill: COMPLEXITY_COLORS.heavy },
    ],
  },
  {
    key: "players",
    stat: "avg players",
    series: [
      { key: "p1", name: "1p", fill: "var(--accent-1)" },
      { key: "p2", name: "2p", fill: "var(--accent-2)" },
      { key: "p3", name: "3p", fill: "var(--accent-3)" },
      { key: "p4", name: "4p", fill: "var(--accent-4)" },
      { key: "p5plus", name: "5p+", fill: "var(--accent-5)" },
    ],
  },
] as const satisfies readonly {
  key: string;
  stat: string;
  series: readonly { key: SeriesKey; name: string; fill: string }[];
}[];

// Widest range (in weeks: 12, 9, 6 or 3 months) that keeps bars 12px apart
const RANGES = [52, 39, 26, 13];
const BAR_PITCH = 12;
const HEIGHT = 200;

const SessionFrequencyChart: React.FC<{
  weeks: Week[];
  averages: ReturnType<typeof lastMonthAverages>;
}> = ({ weeks, averages }) => {
  const [modeIndex, setModeIndex] = useState(0);
  const [ref, { width }] = useContainerSize();
  const mode = MODES[modeIndex];

  const shown = RANGES.find((n) => width >= n * BAR_PITCH) ?? 13;
  const data = weeks.slice(-shown);
  // Month name under each month's first week
  const ticks = data
    .filter((w) => parseISO(w.weekStart).getDate() <= 7)
    .map((w) => w.weekStart);

  const average = {
    sessions: averages.sessionsPerWeek,
    complexity: averages.complexity,
    players: averages.players,
  }[mode.key];

  const next = () => setModeIndex((i) => (i + 1) % MODES.length);

  return (
    <section
      role="button"
      tabIndex={0}
      aria-label={`Session Frequency, showing ${mode.series.length > 1 ? `by ${mode.key}` : "sessions"}. Press to switch view.`}
      onClick={next}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          next();
        }
      }}
      className="cursor-pointer rounded-xl border bg-card p-4 transition-colors outline-none select-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg">Session Frequency</h2>
        <div className="text-right">
          <div
            className={cn(
              "font-display text-3xl font-bold leading-none tabular-nums",
              mode.key === "complexity" && average !== null && getWeightColor(average),
            )}
          >
            {average === null ? "—" : average.toFixed(1)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {mode.stat}, last month
          </div>
        </div>
      </div>

      <div ref={ref} className="mt-4 w-full" style={{ height: HEIGHT }}>
        {width > 0 && (
          <BarChart
            width={width}
            height={HEIGHT}
            data={data}
            margin={{ top: 4, right: 0, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="weekStart"
              ticks={ticks}
              tickFormatter={(w: string) => format(parseISO(w), "MMM")}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              width={24}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            {mode.series.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.name}
                stackId="week"
                fill={s.fill}
                radius={i === mode.series.length - 1 ? [2, 2, 0, 0] : 0}
              />
            ))}
          </BarChart>
        )}
      </div>

      {/* Legend for the stacked views; the row keeps its height so the card doesn't jump */}
      <div className="mt-3 flex h-4 items-center justify-between gap-4">
        <ul className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {mode.series.length > 1 &&
            mode.series.map((s) => (
              <li key={s.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-[2px]" style={{ background: s.fill }} />
                {s.name}
              </li>
            ))}
        </ul>
        {/* Which of the three views is showing */}
        <div aria-hidden className="flex gap-1.5">
          {MODES.map((m, i) => (
            <span
              key={m.key}
              className={cn(
                "size-1.5 rounded-full",
                i === modeIndex ? "bg-foreground" : "bg-foreground/25",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SessionFrequencyChart;
