"use client";

import { useMemo, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { DailyWinRate } from "@/utils/playerStatsCalculations";
import { getCssVar } from "@/utils/chartHelpers";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WinRateChartProps {
  data: DailyWinRate[];
  className?: string;
}

type Period = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "ALL";
const PERIODS: Period[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "ALL"];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Filter data to last N calendar days from the most recent data point
function filterByDays(data: DailyWinRate[], days: number): DailyWinRate[] {
  if (data.length === 0) return data;
  const latest = new Date(data[data.length - 1].date);
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

// Format date label based on how much data we're showing
function formatLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr);
  if (period === "1D" || period === "5D") {
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
  }
  if (period === "1M" || period === "3M") {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  }
  return `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DailyWinRate & { label: string } }>;
}) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const dateObj = new Date(d.date);
  const label = dateObj.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-2.5 min-w-[140px]">
      <p className="font-medium text-sm mb-1">{label}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Win Rate</span>
          <span className="font-semibold">{d.winRate}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Record</span>
          <span>
            {d.wins}W / {d.gamesPlayed}G
          </span>
        </div>
      </div>
    </div>
  );
};

const WinRateChart: React.FC<WinRateChartProps> = ({ data, className }) => {
  const [lineColor, setLineColor] = useState("#22c55e");
  const [period, setPeriod] = useState<Period>("1M");

  useEffect(() => {
    const color = getCssVar("--accent-1");
    if (color) setLineColor(color);
  }, []);

  const filteredData = useMemo(() => {
    const periodDays: Record<Period, number | null> = {
      "1D": 1,
      "5D": 5,
      "1M": 30,
      "3M": 90,
      "6M": 180,
      "1Y": 365,
      ALL: null,
    };
    const days = periodDays[period];
    const filtered = days ? filterByDays(data, days) : data;
    return filtered.map((d) => ({ ...d, label: formatLabel(d.date, period) }));
  }, [data, period]);

  const latestValue = filteredData[filteredData.length - 1]?.winRate ?? null;
  const firstValue = filteredData[0]?.winRate ?? null;
  const change =
    latestValue !== null && firstValue !== null && filteredData.length > 1
      ? latestValue - firstValue
      : null;

  if (data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[300px]">
          <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3 pt-5 px-5">
        {/* Top row: label + period filters */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pt-0.5">
            Win Rate Over Time
          </p>
          <div className="flex items-center gap-0.5 shrink-0">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "text-[14px] font-semibold px-1.5 py-1 rounded transition-colors",
                  period === p
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Latest value box + delta */}
        <div className="flex items-center gap-3 mt-3">
          <div
            className="px-3 py-1.5 rounded-lg border-2 font-black text-2xl tabular-nums"
            style={{ borderColor: lineColor, color: lineColor }}
          >
            {latestValue !== null ? `${latestValue}%` : "—"}
          </div>
          {change !== null && change !== 0 && (
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-sm font-semibold leading-tight",
                  change > 0 ? "text-emerald-500" : "text-destructive",
                )}
              >
                {change > 0 ? "+" : ""}
                {change}pp
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                vs period start
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-2 px-2 pb-5">
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 16, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient
                  id="winRateGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
                strokeOpacity={0.6}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.max(0, Math.floor(dataMin - 10)),
                  (dataMax: number) => Math.min(100, Math.ceil(dataMax + 10)),
                ]}
                tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={46}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: lineColor,
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              {latestValue !== null && (
                <ReferenceLine
                  y={latestValue}
                  stroke={lineColor}
                  strokeDasharray="4 4"
                  strokeOpacity={0.4}
                />
              )}
              <Area
                type="monotone"
                dataKey="winRate"
                stroke={lineColor}
                strokeWidth={2.5}
                fill="url(#winRateGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  stroke: lineColor,
                  strokeWidth: 2,
                  fill: "var(--background)",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinRateChart;
