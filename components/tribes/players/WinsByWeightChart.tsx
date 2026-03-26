"use client";

import { cn } from "@/lib/utils";
import { WeightBreakdown } from "@/utils/playerStatsCalculations";
import { COMPLEXITY_COLORS } from "@/utils/chartHelpers";

interface WinsByWeightChartProps {
  data: WeightBreakdown[];
  className?: string;
}

const COLORS: Record<string, string> = {
  Light: COMPLEXITY_COLORS.light,
  Medium: COMPLEXITY_COLORS.medium,
  Heavy: COMPLEXITY_COLORS.heavy,
};

const WinsByWeightChart: React.FC<WinsByWeightChartProps> = ({
  data,
  className,
}) => {
  const activeData = data.filter((d) => d.total > 0);
  const totalWins = data.reduce((s, d) => s + d.wins, 0);
  const totalGames = data.reduce((s, d) => s + d.total, 0);

  if (activeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
        No game data
      </div>
    );
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {data.map((d) => {
        if (d.total === 0) return null;
        const color = COLORS[d.label] ?? "#888";
        const winPct = (d.wins / d.total) * 100;

        return (
          <div key={d.label}>
            {/* Label + stats row */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-semibold truncate">{d.label}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {d.total}g
                </span>
              </div>
              <div className="flex items-baseline gap-1 shrink-0 ml-2">
                <span className="text-xs font-bold tabular-nums" style={{ color }}>
                  {d.winRate}%
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {d.wins}W
                </span>
              </div>
            </div>

            {/* Progress bar: wins (colored) + losses (muted) */}
            <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: `${winPct}%`,
                  backgroundColor: color,
                  transition: "width 600ms ease-out",
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-[10px] text-muted-foreground">{totalGames} games</span>
        <span className="text-xs font-semibold">{totalWins} wins</span>
      </div>
    </div>
  );
};

export default WinsByWeightChart;
