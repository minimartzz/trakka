"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PlayerCountBreakdown } from "@/utils/playerStatsCalculations";
import { getCssVar } from "@/utils/chartHelpers";

interface WinsByPlayerCountChartProps {
  data: PlayerCountBreakdown[];
  className?: string;
}

const DEFAULT_COLORS: Record<string, string> = {
  "2p": "#3b82f6",
  "3p": "#06b6d4",
  "4p": "#10b981",
  "5p+": "#ec4899",
};

const WinsByPlayerCountChart: React.FC<WinsByPlayerCountChartProps> = ({
  data,
  className,
}) => {
  const [colors, setColors] = useState(DEFAULT_COLORS);

  useEffect(() => {
    const c2 = getCssVar("--accent-2");
    const c3 = getCssVar("--accent-3");
    const c4 = getCssVar("--accent-4");
    const c5 = getCssVar("--accent-5");
    if (c2 && c3 && c4 && c5) {
      setColors({ "2p": c2, "3p": c3, "4p": c4, "5p+": c5 });
    }
  }, []);

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
        const color = colors[d.label as keyof typeof colors] ?? "#888";
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

export default WinsByPlayerCountChart;
