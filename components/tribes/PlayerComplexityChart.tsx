"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Crosshair } from "lucide-react";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";

interface GameSession {
  sessionId: string;
  datePlayed: string;
  gameId: number;
  gameTitle: string;
  gameImageUrl: string | null;
  playingTime: number | null;
  gameWeight: number | null;
  players: {
    profileId: number;
    username: string;
    firstName: string;
    lastName: string;
    image: string | null;
    isWinner: boolean;
    position: number;
    score: number | null;
    victoryPoints: number | null;
    winContrib: number | null;
    isFirstPlay?: boolean;
  }[];
}

interface PlayerComplexityChartProps {
  sessions: GameSession[];
  delay?: number;
}

interface PlayerDataPoint {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  avgComplexity: number;
  winRate: number;
  gamesPlayed: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: PlayerDataPoint;
  }>;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload[0]) return null;

  const player = payload[0].payload;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <Avatar className="w-8 h-8">
          <AvatarImage src={player.image || ""} alt={player.username} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {player.firstName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">
            {player.firstName} {player.lastName}
          </p>
          <p className="text-xs text-muted-foreground">@{player.username}</p>
        </div>
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Win Rate:</span>
          <span className="font-medium">{player.winRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Avg Complexity:</span>
          <span className="font-medium">{player.avgComplexity.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Games Played:</span>
          <span className="font-medium">{player.gamesPlayed}</span>
        </div>
      </div>
    </div>
  );
};

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: PlayerDataPoint;
  activePlayer: number | null;
  onPlayerClick: (profileId: number | null, isTouch: boolean) => void;
  onPlayerHover: (profileId: number | null) => void;
  onPositionUpdate?: (profileId: number, x: number, y: number) => void;
}

const CustomDot: React.FC<CustomDotProps> = ({
  cx,
  cy,
  payload,
  activePlayer,
  onPlayerClick,
  onPlayerHover,
  onPositionUpdate,
}) => {
  const touchedRef = useRef(false);

  useEffect(() => {
    if (cx && cy && payload && onPositionUpdate) {
      onPositionUpdate(payload.profileId, cx, cy);
    }
  }, [cx, cy, payload, onPositionUpdate]);

  if (!cx || !cy || !payload) return null;

  const isActive = activePlayer === payload.profileId;
  const size = isActive ? 36 : 28;

  const handleTouchStart = () => {
    touchedRef.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Select the player (don't toggle on touch - let tapping elsewhere dismiss)
    onPlayerClick(payload.profileId, true);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ignore click if it came from a touch event
    if (touchedRef.current) {
      touchedRef.current = false;
      return;
    }
    e.stopPropagation();
    // Toggle: if already active, deselect; otherwise select
    onPlayerClick(isActive ? null : payload.profileId, false);
  };

  return (
    <g
      onMouseEnter={() => onPlayerHover(payload.profileId)}
      onMouseLeave={() => onPlayerHover(null)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      {/* Outer ring for active state */}
      {isActive && (
        <circle
          cx={cx}
          cy={cy}
          r={size / 2 + 3}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={2}
          className="animate-pulse"
        />
      )}
      {/* Profile image circle */}
      <clipPath id={`clip-${payload.profileId}`}>
        <circle cx={cx} cy={cy} r={size / 2} />
      </clipPath>
      <circle
        cx={cx}
        cy={cy}
        r={size / 2}
        fill="var(--muted)"
        stroke="var(--border)"
        strokeWidth={2}
      />
      {payload.image ? (
        <image
          href={payload.image}
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          clipPath={`url(#clip-${payload.profileId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-primary font-semibold"
          fontSize={12}
        >
          {payload.firstName[0]}
        </text>
      )}
    </g>
  );
};

const PlayerComplexityChart: React.FC<PlayerComplexityChartProps> = ({
  sessions,
  delay = 0,
}) => {
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [isTouchInteraction, setIsTouchInteraction] = useState(false);
  const [playerPositions, setPlayerPositions] = useState<
    Record<number, { x: number; y: number }>
  >({});
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handlePlayerHover = useCallback((profileId: number | null) => {
    // Only handle hover on non-touch devices
    setIsTouchInteraction(false);
    setActivePlayer(profileId);
  }, []);

  const handlePlayerClick = useCallback((profileId: number | null, isTouch: boolean) => {
    setIsTouchInteraction(isTouch);
    setActivePlayer(profileId);
  }, []);

  // Handle clicking outside to deselect on mobile
  const handleChartClick = useCallback(() => {
    setActivePlayer(null);
    setIsTouchInteraction(false);
  }, []);

  const handlePositionUpdate = useCallback(
    (profileId: number, x: number, y: number) => {
      setPlayerPositions((prev) => {
        if (prev[profileId]?.x === x && prev[profileId]?.y === y) return prev;
        return { ...prev, [profileId]: { x, y } };
      });
    },
    [],
  );

  // Calculate player stats: average complexity and win rate
  const playerData = useMemo(() => {
    const playerStats: Record<
      number,
      {
        username: string;
        firstName: string;
        lastName: string;
        image: string | null;
        totalWeight: number;
        weightCount: number;
        gamesPlayed: number;
        wins: number;
      }
    > = {};

    sessions.forEach((session) => {
      const weight = session.gameWeight;

      session.players.forEach((player) => {
        if (!playerStats[player.profileId]) {
          playerStats[player.profileId] = {
            username: player.username,
            firstName: player.firstName,
            lastName: player.lastName,
            image: player.image,
            totalWeight: 0,
            weightCount: 0,
            gamesPlayed: 0,
            wins: 0,
          };
        }

        playerStats[player.profileId].gamesPlayed++;

        if (weight !== null) {
          playerStats[player.profileId].totalWeight += weight;
          playerStats[player.profileId].weightCount++;
        }

        if (player.isWinner) {
          playerStats[player.profileId].wins++;
        }
      });
    });

    return Object.entries(playerStats)
      .filter(([, data]) => data.weightCount > 0 && data.gamesPlayed >= 4)
      .map(
        ([id, data]): PlayerDataPoint => ({
          profileId: parseInt(id),
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          image: data.image,
          avgComplexity:
            Math.round((data.totalWeight / data.weightCount) * 100) / 100,
          winRate:
            data.gamesPlayed > 0
              ? Math.round((data.wins / data.gamesPlayed) * 100)
              : 0,
          gamesPlayed: data.gamesPlayed,
        }),
      );
  }, [sessions]);

  const isEmpty = playerData.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Crosshair className="w-4 h-4 text-primary" />
            </div>
            <CardTitle className="text-lg">Complexity vs Win Rate</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-0 pr-2">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[300px]">
              <Crosshair className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No game data available</p>
            </div>
          ) : (
            <div
              ref={chartContainerRef}
              className="h-[300px] w-full touch-none relative"
              onClick={handleChartClick}
            >
              {/* Custom mobile tooltip overlay - only show for touch interactions */}
              {isTouchInteraction && activePlayer !== null && playerPositions[activePlayer] && (
                <div
                  className="absolute z-50 pointer-events-none"
                  style={{
                    left: playerPositions[activePlayer].x,
                    top: playerPositions[activePlayer].y - 10,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  {(() => {
                    const player = playerData.find(
                      (p) => p.profileId === activePlayer,
                    );
                    if (!player) return null;
                    return (
                      <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage
                              src={player.image || ""}
                              alt={player.username}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {player.firstName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {player.firstName} {player.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{player.username}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Win Rate:
                            </span>
                            <span className="font-medium">
                              {player.winRate}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Avg Complexity:
                            </span>
                            <span className="font-medium">
                              {player.avgComplexity.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Games Played:
                            </span>
                            <span className="font-medium">
                              {player.gamesPlayed}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  {/* Gridlines */}
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--accent)" />
                  <XAxis
                    type="number"
                    dataKey="avgComplexity"
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 2.5, 3, 4, 5]}
                    tick={{
                      fontSize: 11,
                      fill: "var(--foreground)",
                    }}
                    axisLine={{
                      stroke: "var(--foreground)",
                      strokeWidth: 1,
                    }}
                    tickLine={{ stroke: "var(--foreground)" }}
                    label={{
                      value: "Avg Complexity",
                      position: "bottom",
                      offset: 0,
                      style: {
                        fontSize: 11,
                        fontWeight: 600,
                        fill: "var(--foreground)",
                      },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="winRate"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{
                      fontSize: 11,
                      fill: "var(--foreground)",
                    }}
                    axisLine={{
                      stroke: "var(--foreground)",
                      strokeWidth: 1,
                    }}
                    tickLine={{ stroke: "var(--foreground)" }}
                    label={{
                      value: "Win Rate %",
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
                  {/* Bold center crosshair lines */}
                  <ReferenceLine
                    x={2.5}
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    strokeOpacity={0.7}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="var(--foreground)"
                    strokeWidth={2}
                    strokeOpacity={0.7}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={false}
                    wrapperStyle={{ zIndex: 100 }}
                    active={activePlayer !== null}
                  />
                  <Scatter
                    data={playerData}
                    shape={(props) => (
                      <CustomDot
                        {...props}
                        activePlayer={activePlayer}
                        onPlayerClick={handlePlayerClick}
                        onPlayerHover={handlePlayerHover}
                        onPositionUpdate={handlePositionUpdate}
                      />
                    )}
                  >
                    {playerData.map((entry) => (
                      <Cell key={entry.profileId} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerComplexityChart;
