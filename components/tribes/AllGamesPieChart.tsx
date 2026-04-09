"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "motion/react";
import { PieChart as PieChartIcon } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  type PieLabelRenderProps,
} from "recharts";
import { useContainerSize } from "@/hooks/useContainerSize";
import { type GameSession } from "@/types/tribes";
import {
  COMPLEXITY_COLORS,
  getCssVar,
  getComplexityBin,
  getPlayerCountBin,
} from "@/utils/chartHelpers";

interface AllGamesPieChartProps {
  sessions: GameSession[];
  delay?: number;
}

type ViewType = "complexity" | "playerCount";

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// Custom label renderer for pie slices
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}: PieLabelRenderProps) => {
  const RADIAN = Math.PI / 180;
  const radius =
    (innerRadius as number) +
    ((outerRadius as number) - (innerRadius as number)) * 0.5;
  const x = (cx as number) + radius * Math.cos(-(midAngle as number) * RADIAN);
  const y = (cy as number) + radius * Math.sin(-(midAngle as number) * RADIAN);

  if (!percent || percent < 0.05) return null; // Don't show label for very small slices

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PieDataPoint }>;
}) => {
  if (!active || !payload || !payload[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-2 min-w-[120px]">
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: data.color }}
        />
        <span className="font-medium text-sm">{data.name}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {data.value} games ({data.percentage.toFixed(1)}%)
      </div>
    </div>
  );
};

const AllGamesPieChart: React.FC<AllGamesPieChartProps> = ({
  sessions,
  delay = 0,
}) => {
  const [containerRef, { width, height }] = useContainerSize();
  const [viewType, setViewType] = useState<ViewType>("complexity");

  // Get computed accent colors for player count view
  const [playerCountColors, setPlayerCountColors] = useState({
    p1: "#8b5cf6",
    p2: "#3b82f6",
    p3: "#06b6d4",
    p4: "#10b981",
    p5plus: "#ec4899",
  });

  // Update colors when component mounts
  useEffect(() => {
    const p1 = getCssVar("--accent-1");
    const p2 = getCssVar("--accent-2");
    const p3 = getCssVar("--accent-3");
    const p4 = getCssVar("--accent-4");
    const p5plus = getCssVar("--accent-5");
    if (p1 && p2 && p3 && p4 && p5plus) {
      setPlayerCountColors({ p1, p2, p3, p4, p5plus });
    }
  }, []);

  // Process sessions into pie chart data
  const pieData = useMemo(() => {
    const total = sessions.length;
    if (total === 0) return [];

    if (viewType === "complexity") {
      const counts = { light: 0, medium: 0, heavy: 0 };
      sessions.forEach((session) => {
        const bin = getComplexityBin(session.gameWeight);
        counts[bin]++;
      });

      return [
        {
          name: "Light",
          value: counts.light,
          color: COMPLEXITY_COLORS.light,
          percentage: (counts.light / total) * 100,
        },
        {
          name: "Medium",
          value: counts.medium,
          color: COMPLEXITY_COLORS.medium,
          percentage: (counts.medium / total) * 100,
        },
        {
          name: "Heavy",
          value: counts.heavy,
          color: COMPLEXITY_COLORS.heavy,
          percentage: (counts.heavy / total) * 100,
        },
      ].filter((d) => d.value > 0);
    } else {
      const counts = { p1: 0, p2: 0, p3: 0, p4: 0, p5plus: 0 };
      sessions.forEach((session) => {
        const bin = getPlayerCountBin(session.players.length);
        counts[bin]++;
      });

      return [
        {
          name: "1p",
          value: counts.p1,
          color: playerCountColors.p1,
          percentage: (counts.p1 / total) * 100,
        },
        {
          name: "2p",
          value: counts.p2,
          color: playerCountColors.p2,
          percentage: (counts.p2 / total) * 100,
        },
        {
          name: "3p",
          value: counts.p3,
          color: playerCountColors.p3,
          percentage: (counts.p3 / total) * 100,
        },
        {
          name: "4p",
          value: counts.p4,
          color: playerCountColors.p4,
          percentage: (counts.p4 / total) * 100,
        },
        {
          name: "5p+",
          value: counts.p5plus,
          color: playerCountColors.p5plus,
          percentage: (counts.p5plus / total) * 100,
        },
      ].filter((d) => d.value > 0);
    }
  }, [sessions, viewType, playerCountColors]);

  const isEmpty = pieData.length === 0;
  const totalGames = sessions.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <PieChartIcon className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-lg">All Games</CardTitle>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Filter</span>
              <Select
                value={viewType}
                onValueChange={(v) => setViewType(v as ViewType)}
              >
                <SelectTrigger size="sm" className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complexity">Complexity</SelectItem>
                  <SelectItem value="playerCount">Player Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 px-2">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[250px]">
              <PieChartIcon className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No game data available</p>
            </div>
          ) : (
            <div ref={containerRef} className="h-[250px] w-full relative">
              <PieChart width={width} height={height}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="var(--background)"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>

              {/* Center label showing total */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalGames}</div>
                  <div className="text-xs text-muted-foreground">games</div>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          {!isEmpty && (
            <div className="flex flex-wrap justify-center gap-3 pb-4">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.name}: {entry.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AllGamesPieChart;
