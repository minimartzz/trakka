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
import { SelectHistDailyPlayerStats } from "@/db/schema/histDailyPlayerStats";
import { SelectRollingPlayerStats } from "@/db/schema/rollingPlayerStats";
import { getCssVar } from "@/utils/chartHelpers";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WpaChartProps {
  dailyStats: SelectHistDailyPlayerStats[];
  rollingStats: SelectRollingPlayerStats[];
  profileId: number;
  groupId: string;
  className?: string;
}

interface WpaDataPoint {
  date: string; // YYYY-MM-DD
  label: string;
  wpa: number;
  sessionsPlayed: number;
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

function filterByDays(data: WpaDataPoint[], days: number): WpaDataPoint[] {
  if (data.length === 0) return data;
  const latest = new Date(data[data.length - 1].date);
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

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
  payload?: Array<{ payload: WpaDataPoint }>;
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
    <div className="bg-popover border rounded-lg shadow-lg p-2.5 min-w-[130px]">
      <p className="font-medium text-sm mb-1">{label}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">WPA</span>
          <span className="font-semibold">{d.wpa.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sessions</span>
          <span>{d.sessionsPlayed}</span>
        </div>
      </div>
    </div>
  );
};

const WpaChart: React.FC<WpaChartProps> = ({
  dailyStats,
  rollingStats,
  profileId,
  groupId,
  className,
}) => {
  const [lineColor, setLineColor] = useState("#8b5cf6");
  const [period, setPeriod] = useState<Period>("1M");

  useEffect(() => {
    const color = getCssVar("--accent-2");
    if (color) setLineColor(color);
  }, []);

  // Build daily data points — one per snapshot date (no aggregation)
  const allData = useMemo((): WpaDataPoint[] => {
    const historical = dailyStats
      .filter(
        (s) =>
          s.profileId === profileId &&
          s.groupId === groupId &&
          s.sessionsPlayed > 0,
      )
      .sort((a, b) => a.snapshotDate.localeCompare(b.snapshotDate))
      .map((s) => ({
        date: s.snapshotDate,
        label: "",
        wpa: s.score,
        sessionsPlayed: s.sessionsPlayed,
      }));

    // Append today's WPA from rolling stats if not already present
    const today = new Date().toISOString().slice(0, 10);
    const rolling = rollingStats.find(
      (s) => s.profileId === profileId && s.groupId === groupId,
    );
    if (rolling && rolling.sessionsPlayed > 0) {
      const lastDate = historical[historical.length - 1]?.date ?? "";
      if (lastDate < today) {
        historical.push({
          date: today,
          label: "",
          wpa: rolling.rollingScore / rolling.sessionsPlayed,
          sessionsPlayed: rolling.sessionsPlayed,
        });
      }
    }

    return historical;
  }, [dailyStats, rollingStats, profileId, groupId]);

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
    const filtered = days ? filterByDays(allData, days) : allData;
    return filtered.map((d) => ({ ...d, label: formatLabel(d.date, period) }));
  }, [allData, period]);

  const latestValue = filteredData[filteredData.length - 1]?.wpa ?? null;
  const firstValue = filteredData[0]?.wpa ?? null;
  const change =
    latestValue !== null && firstValue !== null && filteredData.length > 1
      ? parseFloat((latestValue - firstValue).toFixed(2))
      : null;

  if (allData.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[300px]">
          <Target className="w-8 h-8 mb-2 opacity-50" />
          <p className="text-sm">No WPA data available</p>
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
            WPA Over Time
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
            {latestValue !== null ? latestValue.toFixed(2) : "—"}
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
                {change}
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
                <linearGradient id="wpaGradient" x1="0" y1="0" x2="0" y2="1">
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
                domain={["auto", "auto"]}
                tick={{ fontSize: 13, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1)}
                width={40}
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
                dataKey="wpa"
                stroke={lineColor}
                strokeWidth={2.5}
                fill="url(#wpaGradient)"
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

export default WpaChart;
