"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "motion/react";
import { BarChart3 } from "lucide-react";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { type GameSession } from "@/types/tribes";
import {
  COMPLEXITY_COLORS,
  getCssVar,
  getComplexityBin,
  getPlayerCountBin,
} from "@/utils/chartHelpers";

interface HistoricalSessionsChartProps {
  sessions: GameSession[];
  delay?: number;
}

type TimeframeType = "daily" | "monthly" | "quarterly" | "yearly";
type ViewType = "complexity" | "playerCount";

interface SessionGroup {
  sessions: GameSession[];
  light: number;
  medium: number;
  heavy: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5plus: number;
}

interface BarDataPoint {
  label: string;
  sortKey: string;
  light: number;
  medium: number;
  heavy: number;
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  p5plus: number;
  // Metadata for tooltip
  lightSessions: GameSession[];
  mediumSessions: GameSession[];
  heavySessions: GameSession[];
  p1Sessions: GameSession[];
  p2Sessions: GameSession[];
  p3Sessions: GameSession[];
  p4Sessions: GameSession[];
  p5plusSessions: GameSession[];
}

interface TooltipData {
  label: string;
  category: string;
  categoryKey: string;
  count: number;
  sessions: GameSession[];
  color: string;
  x: number;
  y: number;
}

const formatDateLabel = (date: Date, timeframe: TimeframeType): string => {
  switch (timeframe) {
    case "daily":
      return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
    case "monthly":
      const months = [
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
      return `${months[date.getMonth()]}-${String(date.getFullYear()).slice(2)}`;
    case "quarterly":
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter}-${date.getFullYear()}`;
    case "yearly":
      return `${date.getFullYear()}`;
  }
};

const getDateKey = (date: Date, timeframe: TimeframeType): string => {
  switch (timeframe) {
    case "daily":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    case "monthly":
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    case "quarterly":
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `${date.getFullYear()}-Q${quarter}`;
    case "yearly":
      return `${date.getFullYear()}`;
  }
};

// Custom tooltip component for desktop hover
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{
    payload: BarDataPoint;
    dataKey: string;
    color: string;
    value: number;
  }>;
  label?: string;
  viewType: ViewType;
}> = ({ active, payload, label, viewType }) => {
  if (!active || !payload || payload.length === 0) return null;

  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  // Get all sessions for this time period
  const allSessions =
    viewType === "complexity"
      ? [
          ...dataPoint.lightSessions,
          ...dataPoint.mediumSessions,
          ...dataPoint.heavySessions,
        ]
      : [
          ...dataPoint.p1Sessions,
          ...dataPoint.p2Sessions,
          ...dataPoint.p3Sessions,
          ...dataPoint.p4Sessions,
          ...dataPoint.p5plusSessions,
        ];

  if (allSessions.length === 0) return null;

  // Calculate win rates and find top player across all sessions
  const playerWins: Record<
    number,
    { wins: number; games: number; player: GameSession["players"][0] }
  > = {};
  allSessions.forEach((session) => {
    session.players.forEach((player) => {
      if (!playerWins[player.profileId]) {
        playerWins[player.profileId] = { wins: 0, games: 0, player };
      }
      playerWins[player.profileId].games++;
      if (player.isWinner) {
        playerWins[player.profileId].wins++;
      }
    });
  });

  const topPlayer = Object.values(playerWins)
    .filter((p) => p.games >= 1)
    .sort((a, b) => {
      const aRate = a.wins / a.games;
      const bRate = b.wins / b.games;
      return bRate - aRate || b.games - a.games;
    })[0];

  // Get up to 3 unique games
  const uniqueGames = new Map<
    number,
    { title: string; imageUrl: string | null }
  >();
  allSessions.forEach((session) => {
    if (!uniqueGames.has(session.gameId)) {
      uniqueGames.set(session.gameId, {
        title: session.gameTitle,
        imageUrl: session.gameImageUrl,
      });
    }
  });
  const exampleGames = Array.from(uniqueGames.values()).slice(0, 3);

  // Filter to only show bars with values > 0
  const barsWithData = payload.filter((p) => p.value > 0);

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[220px] max-w-[300px]">
      <div className="mb-2">
        <span className="font-semibold text-sm">{label}</span>
      </div>

      {/* Session breakdown by category */}
      <div className="space-y-1.5 mb-3">
        {barsWithData.map((bar) => {
          const categoryName =
            viewType === "complexity"
              ? bar.dataKey === "light"
                ? "Light"
                : bar.dataKey === "medium"
                  ? "Medium"
                  : "Heavy"
              : bar.dataKey === "p1"
                ? "1p"
                : bar.dataKey === "p2"
                  ? "2p"
                  : bar.dataKey === "p3"
                    ? "3p"
                    : bar.dataKey === "p4"
                      ? "4p"
                      : "5p+";

          return (
            <div
              key={bar.dataKey}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: bar.color }}
                />
                <span className="text-muted-foreground">{categoryName}:</span>
              </div>
              <span className="font-medium">{bar.value} sessions</span>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-2 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Sessions:</span>
          <span className="font-medium">{allSessions.length}</span>
        </div>

        {topPlayer && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Top Player:</span>
            <div className="flex items-center gap-1.5">
              <Avatar className="w-5 h-5">
                <AvatarImage src={topPlayer.player.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                  {topPlayer.player.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">
                {topPlayer.player.firstName} (
                {Math.round((topPlayer.wins / topPlayer.games) * 100)}%)
              </span>
            </div>
          </div>
        )}

        {exampleGames.length > 0 && (
          <div>
            <span className="text-muted-foreground block mb-1">
              Games Played:
            </span>
            <div className="flex flex-wrap gap-1">
              {exampleGames.map((game, idx) => (
                <span
                  key={idx}
                  className="bg-muted px-1.5 py-0.5 rounded text-[10px] truncate max-w-[100px]"
                  title={game.title}
                >
                  {game.title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HistoricalSessionsChart: React.FC<HistoricalSessionsChartProps> = ({
  sessions,
  delay = 0,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeType>("monthly");
  const [viewType, setViewType] = useState<ViewType>("complexity");
  const [activeBar, setActiveBar] = useState<TooltipData | null>(null);
  const [isTouchInteraction, setIsTouchInteraction] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Get computed accent colors for player count view
  const [playerCountColors, setPlayerCountColors] = useState({
    p1: "#8b5cf6",
    p2: "#3b82f6",
    p3: "#06b6d4",
    p4: "#10b981",
    p5plus: "#ec4899",
  });

  // Update colors when component mounts (to get CSS variable values)
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

  // Process sessions into chart data
  const chartData = useMemo(() => {
    const groupedData: Record<string, SessionGroup> = {};

    sessions.forEach((session) => {
      const date = new Date(session.datePlayed);
      const key = getDateKey(date, timeframe);
      const label = formatDateLabel(date, timeframe);

      if (!groupedData[key]) {
        groupedData[key] = {
          sessions: [],
          light: 0,
          medium: 0,
          heavy: 0,
          p1: 0,
          p2: 0,
          p3: 0,
          p4: 0,
          p5plus: 0,
        };
      }

      groupedData[key].sessions.push(session);

      // Categorize by complexity
      const complexityBin = getComplexityBin(session.gameWeight);
      groupedData[key][complexityBin]++;

      // Categorize by player count
      const playerCountBin = getPlayerCountBin(session.players.length);
      groupedData[key][playerCountBin]++;
    });

    // Convert to array and sort by date
    const dataPoints: BarDataPoint[] = Object.entries(groupedData)
      .map(([sortKey, group]) => {
        const lightSessions = group.sessions.filter(
          (s) => getComplexityBin(s.gameWeight) === "light",
        );
        const mediumSessions = group.sessions.filter(
          (s) => getComplexityBin(s.gameWeight) === "medium",
        );
        const heavySessions = group.sessions.filter(
          (s) => getComplexityBin(s.gameWeight) === "heavy",
        );
        const p1Sessions = group.sessions.filter(
          (s) => getPlayerCountBin(s.players.length) === "p1",
        );
        const p2Sessions = group.sessions.filter(
          (s) => getPlayerCountBin(s.players.length) === "p2",
        );
        const p3Sessions = group.sessions.filter(
          (s) => getPlayerCountBin(s.players.length) === "p3",
        );
        const p4Sessions = group.sessions.filter(
          (s) => getPlayerCountBin(s.players.length) === "p4",
        );
        const p5plusSessions = group.sessions.filter(
          (s) => getPlayerCountBin(s.players.length) === "p5plus",
        );

        return {
          label: formatDateLabel(
            new Date(group.sessions[0].datePlayed),
            timeframe,
          ),
          sortKey,
          light: group.light,
          medium: group.medium,
          heavy: group.heavy,
          p1: group.p1,
          p2: group.p2,
          p3: group.p3,
          p4: group.p4,
          p5plus: group.p5plus,
          lightSessions,
          mediumSessions,
          heavySessions,
          p1Sessions,
          p2Sessions,
          p3Sessions,
          p4Sessions,
          p5plusSessions,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    // Limit to reasonable number of data points based on timeframe
    const maxPoints =
      timeframe === "daily" ? 14 : timeframe === "monthly" ? 12 : 8;
    return dataPoints.slice(-maxPoints);
  }, [sessions, timeframe]);

  const handleChartClick = useCallback(() => {
    setActiveBar(null);
    setIsTouchInteraction(false);
  }, []);

  const isEmpty = chartData.length === 0;

  // Get bars based on view type
  const getBars = () => {
    if (viewType === "complexity") {
      return (
        <>
          <Bar
            dataKey="light"
            name="Light"
            fill={COMPLEXITY_COLORS.light}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="medium"
            name="Medium"
            fill={COMPLEXITY_COLORS.medium}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="heavy"
            name="Heavy"
            fill={COMPLEXITY_COLORS.heavy}
            radius={[4, 4, 0, 0]}
          />
        </>
      );
    } else {
      return (
        <>
          <Bar
            dataKey="p1"
            name="1p"
            fill={playerCountColors.p1}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="p2"
            name="2p"
            fill={playerCountColors.p2}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="p3"
            name="3p"
            fill={playerCountColors.p3}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="p4"
            name="4p"
            fill={playerCountColors.p4}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="p5plus"
            name="5p+"
            fill={playerCountColors.p5plus}
            radius={[4, 4, 0, 0]}
          />
        </>
      );
    }
  };

  // Get category breakdown for mobile tooltip
  const getCategoryBreakdown = (dataPoint: BarDataPoint) => {
    if (viewType === "complexity") {
      return [
        {
          key: "light",
          name: "Light",
          count: dataPoint.light,
          color: COMPLEXITY_COLORS.light,
        },
        {
          key: "medium",
          name: "Medium",
          count: dataPoint.medium,
          color: COMPLEXITY_COLORS.medium,
        },
        {
          key: "heavy",
          name: "Heavy",
          count: dataPoint.heavy,
          color: COMPLEXITY_COLORS.heavy,
        },
      ].filter((c) => c.count > 0);
    } else {
      return [
        {
          key: "p1",
          name: "1p",
          count: dataPoint.p1,
          color: playerCountColors.p1,
        },
        {
          key: "p2",
          name: "2p",
          count: dataPoint.p2,
          color: playerCountColors.p2,
        },
        {
          key: "p3",
          name: "3p",
          count: dataPoint.p3,
          color: playerCountColors.p3,
        },
        {
          key: "p4",
          name: "4p",
          count: dataPoint.p4,
          color: playerCountColors.p4,
        },
        {
          key: "p5plus",
          name: "5p+",
          count: dataPoint.p5plus,
          color: playerCountColors.p5plus,
        },
      ].filter((c) => c.count > 0);
    }
  };

  // Mobile tooltip (rendered manually based on activeBar state)
  const renderMobileTooltip = () => {
    if (!isTouchInteraction || !activeBar) return null;

    const { sessions: barSessions, label, x, y } = activeBar;

    // Calculate win rates and find top player
    const playerWins: Record<
      number,
      { wins: number; games: number; player: GameSession["players"][0] }
    > = {};
    barSessions.forEach((session) => {
      session.players.forEach((player) => {
        if (!playerWins[player.profileId]) {
          playerWins[player.profileId] = { wins: 0, games: 0, player };
        }
        playerWins[player.profileId].games++;
        if (player.isWinner) {
          playerWins[player.profileId].wins++;
        }
      });
    });

    const topPlayer = Object.values(playerWins)
      .filter((p) => p.games >= 1)
      .sort((a, b) => {
        const aRate = a.wins / a.games;
        const bRate = b.wins / b.games;
        return bRate - aRate || b.games - a.games;
      })[0];

    // Get up to 3 unique games
    const uniqueGames = new Map<
      number,
      { title: string; imageUrl: string | null }
    >();
    barSessions.forEach((session) => {
      if (!uniqueGames.has(session.gameId)) {
        uniqueGames.set(session.gameId, {
          title: session.gameTitle,
          imageUrl: session.gameImageUrl,
        });
      }
    });
    const exampleGames = Array.from(uniqueGames.values()).slice(0, 3);

    // Find the data point for category breakdown
    const dataPoint = chartData.find((d) => d.label === label);
    const categoryBreakdown = dataPoint ? getCategoryBreakdown(dataPoint) : [];

    return (
      <div
        className="absolute z-50 pointer-events-none"
        style={{
          left: Math.min(
            Math.max(x, 110),
            (chartContainerRef.current?.clientWidth ?? 300) - 110,
          ),
          top: Math.max(y - 10, 20),
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[220px] max-w-[300px]">
          <div className="mb-2">
            <span className="font-semibold text-sm">{label}</span>
          </div>

          {/* Session breakdown by category */}
          <div className="space-y-1.5 mb-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.key}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-muted-foreground">{cat.name}:</span>
                </div>
                <span className="font-medium">{cat.count} sessions</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-2 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Sessions:</span>
              <span className="font-medium">{barSessions.length}</span>
            </div>

            {topPlayer && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Top Player:</span>
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={topPlayer.player.image || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {topPlayer.player.firstName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">
                    {topPlayer.player.firstName} (
                    {Math.round((topPlayer.wins / topPlayer.games) * 100)}%)
                  </span>
                </div>
              </div>
            )}

            {exampleGames.length > 0 && (
              <div>
                <span className="text-muted-foreground block mb-1">
                  Games Played:
                </span>
                <div className="flex flex-wrap gap-1">
                  {exampleGames.map((game, idx) => (
                    <span
                      key={idx}
                      className="bg-muted px-1.5 py-0.5 rounded text-[10px] truncate max-w-[100px]"
                      title={game.title}
                    >
                      {game.title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
              <CardTitle className="text-lg">Sessions Breakdown</CardTitle>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Timeframe</span>
                <Select
                  value={timeframe}
                  onValueChange={(v) => setTimeframe(v as TimeframeType)}
                >
                  <SelectTrigger size="sm" className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
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
          </div>
        </CardHeader>

        <CardContent className="p-0 pr-2">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[300px]">
              <BarChart3 className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No session data available</p>
            </div>
          ) : (
            <div
              ref={chartContainerRef}
              className="h-[300px] w-full relative"
              onClick={handleChartClick}
            >
              {/* Mobile tooltip overlay */}
              {renderMobileTooltip()}

              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  onMouseDown={(e) => {
                    // Detect touch interaction
                    if (e && "nativeEvent" in e) {
                      const nativeEvent = (
                        e as unknown as { nativeEvent: Event }
                      ).nativeEvent;
                      if (nativeEvent instanceof TouchEvent) {
                        setIsTouchInteraction(true);
                      }
                    }
                  }}
                  onClick={(state: unknown) => {
                    const chartState = state as {
                      activePayload?: Array<{ payload: BarDataPoint }>;
                      chartX?: number;
                      chartY?: number;
                    } | null;
                    if (
                      chartState &&
                      chartState.activePayload &&
                      chartState.activePayload[0] &&
                      isTouchInteraction
                    ) {
                      const payload = chartState.activePayload[0].payload;

                      // Get all sessions for this time period
                      const allSessions =
                        viewType === "complexity"
                          ? [
                              ...payload.lightSessions,
                              ...payload.mediumSessions,
                              ...payload.heavySessions,
                            ]
                          : [
                              ...payload.p1Sessions,
                              ...payload.p2Sessions,
                              ...payload.p3Sessions,
                              ...payload.p4Sessions,
                              ...payload.p5plusSessions,
                            ];

                      if (allSessions.length > 0) {
                        setActiveBar({
                          label: payload.label,
                          category: "",
                          categoryKey: "",
                          count: allSessions.length,
                          sessions: allSessions,
                          color: "",
                          x: chartState.chartX ?? 150,
                          y: chartState.chartY ?? 100,
                        });
                      }
                    }
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--accent)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--foreground)" }}
                    axisLine={{ stroke: "var(--foreground)", strokeWidth: 1 }}
                    tickLine={{ stroke: "var(--foreground)" }}
                    interval="preserveStartEnd"
                    angle={timeframe === "daily" ? -35 : 0}
                    textAnchor={timeframe === "daily" ? "end" : "middle"}
                    height={timeframe === "daily" ? 80 : 30}
                    dy={timeframe === "daily" ? 15 : 0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--foreground)" }}
                    axisLine={{ stroke: "var(--foreground)", strokeWidth: 1 }}
                    tickLine={{ stroke: "var(--foreground)" }}
                    allowDecimals={false}
                    label={{
                      value: "Sessions",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                      style: {
                        fontSize: 11,
                        fontWeight: 600,
                        fill: "var(--foreground)",
                        textAnchor: "middle",
                      },
                    }}
                  />
                  <Tooltip
                    content={<CustomTooltip viewType={viewType} />}
                    cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                    wrapperStyle={{ zIndex: 100 }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 10 }}
                    iconType="square"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{value}</span>
                    )}
                  />
                  {getBars()}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HistoricalSessionsChart;
