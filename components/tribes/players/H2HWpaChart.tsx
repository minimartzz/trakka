"use client";

import { useMemo, useEffect, useState } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { SelectHistDailyPlayerStats } from "@/db/schema/histDailyPlayerStats";
import { SelectRollingPlayerStats } from "@/db/schema/rollingPlayerStats";
import { getCssVar } from "@/utils/chartHelpers";
import { Target } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface H2HWpaChartProps {
  dailyStats: SelectHistDailyPlayerStats[];
  rollingStats: SelectRollingPlayerStats[];
  p1Id: number;
  p2Id: number;
  p1Name: string;
  p2Name: string;
  groupId: string;
  className?: string;
}

interface DualWpaPoint {
  date: string;
  label: string;
  p1Wpa: number | null;
  p2Wpa: number | null;
}

type Period = "1D" | "5D" | "1M" | "3M" | "6M" | "1Y" | "ALL";
const PERIODS: Period[] = ["1D", "5D", "1M", "3M", "6M", "1Y", "ALL"];
const DAILY_PERIODS = new Set<Period>(["1D", "5D", "1M", "3M"]);

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

const periodDays: Record<Period, number | null> = {
  "1D": 1,
  "5D": 5,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  ALL: null,
};

function formatLabel(dateStr: string, period: Period): string {
  const d = new Date(dateStr + "T12:00:00");
  if (period === "1D" || period === "5D") {
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
  }
  if (period === "1M" || period === "3M") {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
  }
  return `${MONTH_NAMES[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

function filterByDays<T extends { date: string }>(
  data: T[],
  days: number,
): T[] {
  if (data.length === 0) return data;
  const latest = new Date(data[data.length - 1].date);
  const cutoff = new Date(latest);
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);
  return data.filter((d) => new Date(d.date) >= cutoff);
}

// For 6M/1Y/ALL: keep only the last snapshot per calendar month
function toMonthlyData(data: DualWpaPoint[]): DualWpaPoint[] {
  const monthMap = new Map<string, DualWpaPoint>();
  data.forEach((d) => {
    monthMap.set(d.date.slice(0, 7), d); // last entry per month wins
  });
  return Array.from(monthMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

// ── Custom dot: circle + label box showing this player's own WPA ─────

interface DotProps {
  cx?: number;
  cy?: number;
  wpaValue: number | null;
  color: string;
  showLabels: boolean;
}

const DotWithLabel: React.FC<DotProps> = ({
  cx,
  cy,
  wpaValue,
  color,
  showLabels,
}) => {
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  const BOX_W = 42;
  const BOX_H = 18;
  const GAP = 7;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={3.5}
        fill={color}
        stroke="var(--background)"
        strokeWidth={1.5}
      />
      {showLabels && wpaValue !== null && (
        <>
          <rect
            x={cx - BOX_W / 2}
            y={cy - GAP - BOX_H}
            width={BOX_W}
            height={BOX_H}
            rx={4}
            fill="var(--popover)"
            stroke={color}
            strokeWidth={0.8}
          />
          <text
            x={cx}
            y={cy - GAP - BOX_H + 12}
            fontSize={9}
            fill={color}
            fontWeight="700"
            textAnchor="middle"
          >
            {wpaValue.toFixed(2)}
          </text>
        </>
      )}
    </g>
  );
};

// ── Main component ────────────────────────────────────────────────────

const H2HWpaChart: React.FC<H2HWpaChartProps> = ({
  dailyStats,
  rollingStats,
  p1Id,
  p2Id,
  p1Name,
  p2Name,
  groupId,
  className,
}) => {
  const [p1Color, setP1Color] = useState("#22c55e");
  const [p2Color, setP2Color] = useState("#8b5cf6");
  const [period, setPeriod] = useState<Period>("1M");

  useEffect(() => {
    const c1 = getCssVar("--accent-2");
    const c2 = getCssVar("--accent-5");
    if (c1) setP1Color(c1);
    if (c2) setP2Color(c2);
  }, []);

  // Build per-player WPA maps from daily snapshots
  const allData = useMemo((): DualWpaPoint[] => {
    const p1Map = new Map<string, number>();
    const p2Map = new Map<string, number>();

    dailyStats.forEach((s) => {
      if (s.sessionsPlayed === 0 || s.groupId !== groupId) return;
      const wpa = s.score;
      if (s.profileId === p1Id) p1Map.set(s.snapshotDate, wpa);
      else if (s.profileId === p2Id) p2Map.set(s.snapshotDate, wpa);
    });

    // Append today's WPA from rolling stats if not already present
    const today = new Date().toISOString().slice(0, 10);
    const p1Rolling = rollingStats.find(
      (s) => s.profileId === p1Id && s.groupId === groupId,
    );
    const p2Rolling = rollingStats.find(
      (s) => s.profileId === p2Id && s.groupId === groupId,
    );
    if (p1Rolling && p1Rolling.sessionsPlayed > 0 && !p1Map.has(today)) {
      p1Map.set(today, p1Rolling.rollingScore / p1Rolling.sessionsPlayed);
    }
    if (p2Rolling && p2Rolling.sessionsPlayed > 0 && !p2Map.has(today)) {
      p2Map.set(today, p2Rolling.rollingScore / p2Rolling.sessionsPlayed);
    }

    const allDates = new Set([...p1Map.keys(), ...p2Map.keys()]);
    return Array.from(allDates)
      .sort()
      .map((date) => ({
        date,
        label: "",
        p1Wpa: p1Map.get(date) ?? null,
        p2Wpa: p2Map.get(date) ?? null,
      }));
  }, [dailyStats, rollingStats, p1Id, p2Id, groupId]);

  const filteredData = useMemo(() => {
    const days = periodDays[period];
    let filtered = days ? filterByDays(allData, days) : allData;
    // For longer periods: collapse to one point per month
    if (!DAILY_PERIODS.has(period)) {
      filtered = toMonthlyData(filtered);
    }
    return filtered.map((d) => ({ ...d, label: formatLabel(d.date, period) }));
  }, [allData, period]);

  // Show label boxes only when there are few enough points to stay readable
  const showLabels = filteredData.length <= 20;
  const chartTopMargin = showLabels ? 32 : 10;

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
      <CardHeader className="pb-1 pt-3 px-5">
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
        {/* Legend — HTML so WPA value boxes can never overlap it */}
        <div className="flex items-center gap-4 pt-1">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p1Color }} />
            {p1Name}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p2Color }} />
            {p2Name}
          </span>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-2 pb-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={filteredData}
              margin={{ top: chartTopMargin, right: 16, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="h2hP1Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={p1Color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={p1Color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="h2hP2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={p2Color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={p2Color} stopOpacity={0} />
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
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                padding={{ left: 12, right: 12 }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(1)}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0]?.payload as DualWpaPoint;
                  const dateLabel = new Date(
                    point.date + "T12:00:00",
                  ).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <div className="bg-popover border rounded-lg shadow-lg p-2.5 min-w-[140px]">
                      <p className="font-medium text-sm mb-1.5">{dateLabel}</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: p1Color }}
                            />
                            {p1Name}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {point.p1Wpa !== null
                              ? point.p1Wpa.toFixed(2)
                              : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: p2Color }}
                            />
                            {p2Name}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {point.p2Wpa !== null
                              ? point.p2Wpa.toFixed(2)
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
                cursor={{
                  stroke: "var(--muted-foreground)",
                  strokeWidth: 1,
                  strokeDasharray: "3 3",
                }}
              />
              <Area
                name={p1Name}
                type="monotone"
                dataKey="p1Wpa"
                stroke={p1Color}
                strokeWidth={2.5}
                fill="url(#h2hP1Gradient)"
                connectNulls
                dot={(dotProps) => (
                  <DotWithLabel
                    key={`p1-${dotProps.cx}-${dotProps.cy}`}
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    wpaValue={dotProps.payload?.p1Wpa ?? null}
                    color={p1Color}
                    showLabels={showLabels}
                  />
                )}
                activeDot={{
                  r: 5,
                  stroke: p1Color,
                  strokeWidth: 2,
                  fill: "var(--background)",
                }}
              />

              <Area
                name={p2Name}
                type="monotone"
                dataKey="p2Wpa"
                stroke={p2Color}
                strokeWidth={2.5}
                fill="url(#h2hP2Gradient)"
                connectNulls
                dot={(dotProps) => (
                  <DotWithLabel
                    key={`p2-${dotProps.cx}-${dotProps.cy}`}
                    cx={dotProps.cx}
                    cy={dotProps.cy}
                    wpaValue={dotProps.payload?.p2Wpa ?? null}
                    color={p2Color}
                    showLabels={showLabels}
                  />
                )}
                activeDot={{
                  r: 5,
                  stroke: p2Color,
                  strokeWidth: 2,
                  fill: "var(--background)",
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default H2HWpaChart;
