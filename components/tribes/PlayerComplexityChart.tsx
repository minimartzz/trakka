"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Crosshair, RotateCcw } from "lucide-react";
import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useId,
} from "react";
import * as d3 from "d3";
import { useContainerSize } from "@/hooks/useContainerSize";

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

const AVATAR_SIZE = 28;
const AVATAR_SIZE_ACTIVE = 36;
const LONG_PRESS_MS = 350;
const TOOLTIP_HEIGHT_ESTIMATE = 130;

const TooltipCard: React.FC<{ player: PlayerDataPoint }> = ({ player }) => (
  <div className="bg-popover border rounded-lg shadow-lg p-3 min-w-45">
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

const PlayerComplexityChart: React.FC<PlayerComplexityChartProps> = ({
  sessions,
  delay = 0,
}) => {
  const [containerRef, { width, height }] = useContainerSize();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [isTouchInteraction, setIsTouchInteraction] = useState(false);

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rawId = useId();
  const idBase = rawId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const chartClipId = `chart-clip-${idBase}`;

  // Calculate player stats: average complexity and win rate
  const playerData = useMemo<PlayerDataPoint[]>(() => {
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
      .filter(([, data]) => data.weightCount >= 4)
      .map(([id, data]) => ({
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
      }));
  }, [sessions]);

  const isEmpty = playerData.length === 0;

  const margin = { top: 16, right: 24, bottom: 36, left: 44 };
  const innerWidth = Math.max(0, width - margin.left - margin.right);
  const innerHeight = Math.max(0, height - margin.top - margin.bottom);

  // Base scales (fixed domains: 0-5 complexity, 0-100 win rate)
  const xScale = useMemo(
    () => d3.scaleLinear().domain([0, 5]).range([0, innerWidth]),
    [innerWidth],
  );
  const yScale = useMemo(
    () => d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]),
    [innerHeight],
  );

  // Zoom-aware scales — recomputed when transform or container size changes
  const xZoomed = useMemo(
    () => transform.rescaleX(xScale),
    [transform, xScale],
  );
  const yZoomed = useMemo(
    () => transform.rescaleY(yScale),
    [transform, yScale],
  );

  // Bind d3.zoom behavior to the SVG. Filter blocks single-pointer events
  // on player dots so long-press / hover handlers receive them instead.
  useEffect(() => {
    if (!svgRef.current || innerWidth <= 0 || innerHeight <= 0) return;

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .filter((event: Event) => {
        if (event.type === "dblclick") return false;
        if (event.type === "wheel") return true;

        // Allow multi-touch gestures (pinch zoom) even if a finger is on a dot
        const touchEvent = event as TouchEvent;
        if (touchEvent.touches && touchEvent.touches.length > 1) return true;

        const target = event.target as Element | null;
        if (target?.closest?.("[data-player-dot]")) return false;

        const mouseEvent = event as MouseEvent;
        return !mouseEvent.ctrlKey && !mouseEvent.button;
      })
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    svg.call(zoomBehavior);
    svg.on("dblclick.zoom", null);

    zoomRef.current = zoomBehavior;

    return () => {
      svg.on(".zoom", null);
    };
  }, [innerWidth, innerHeight]);

  const handleReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const isZoomed =
    transform.k !== 1 || transform.x !== 0 || transform.y !== 0;

  // While a touch-tooltip is showing, dismiss it on any pointer release —
  // even if the user's finger drifts off the dot.
  const touchTooltipShowing =
    isTouchInteraction && activePlayer !== null;

  useEffect(() => {
    if (!touchTooltipShowing) return;
    const end = () => {
      setActivePlayer(null);
      setIsTouchInteraction(false);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
    document.addEventListener("pointerup", end);
    document.addEventListener("pointercancel", end);
    return () => {
      document.removeEventListener("pointerup", end);
      document.removeEventListener("pointercancel", end);
    };
  }, [touchTooltipShowing]);

  // Cleanup any pending long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleDotPointerDown = useCallback(
    (e: React.PointerEvent, profileId: number) => {
      if (e.pointerType !== "touch") return;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        setIsTouchInteraction(true);
        setActivePlayer(profileId);
      }, LONG_PRESS_MS);
    },
    [],
  );

  const handleDotPointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    // Cancel pending long-press if the user moves before the timer fires.
    // Once the timer has fired we null out the ref, so this is a no-op then.
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleDotPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleDotMouseEnter = useCallback((profileId: number) => {
    setIsTouchInteraction(false);
    setActivePlayer(profileId);
  }, []);

  const handleDotMouseLeave = useCallback(() => {
    setActivePlayer(null);
  }, []);

  // Tick generation: keep the original fixed ticks at default zoom; let d3
  // pick sensible ticks once the user has zoomed in.
  const xTicks = useMemo(() => {
    if (transform.k === 1 && transform.x === 0)
      return [0, 1, 2, 2.5, 3, 4, 5];
    return xZoomed.ticks(7);
  }, [transform, xZoomed]);

  const yTicks = useMemo(() => {
    if (transform.k === 1 && transform.y === 0) return [0, 25, 50, 75, 100];
    return yZoomed.ticks(5);
  }, [transform, yZoomed]);

  const activeData =
    activePlayer !== null
      ? playerData.find((p) => p.profileId === activePlayer) ?? null
      : null;

  // Tooltip positioning relative to container — flips below if it would clip
  // the top of the chart area.
  const tooltipPos = useMemo(() => {
    if (!activeData) return null;
    const cx = xZoomed(activeData.avgComplexity);
    const cy = yZoomed(activeData.winRate);
    if (cx < 0 || cx > innerWidth || cy < 0 || cy > innerHeight) return null;

    const dotX = margin.left + cx;
    const dotY = margin.top + cy;
    const flipBelow = dotY - TOOLTIP_HEIGHT_ESTIMATE - 10 < 0;
    return {
      left: dotX,
      top: flipBelow
        ? dotY + AVATAR_SIZE_ACTIVE / 2 + 8
        : dotY - AVATAR_SIZE_ACTIVE / 2 - 8,
      transform: flipBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
    };
  }, [activeData, xZoomed, yZoomed, innerWidth, innerHeight, margin.left, margin.top]);

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
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-75">
              <Crosshair className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No game data available</p>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="h-75 w-full touch-none relative select-none"
            >
              {isZoomed && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                  className="absolute top-2 right-2 z-20 h-7 gap-1.5 px-2 text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </Button>
              )}

              {activeData && tooltipPos && (
                <div
                  className="absolute z-30 pointer-events-none"
                  style={{
                    left: tooltipPos.left,
                    top: tooltipPos.top,
                    transform: tooltipPos.transform,
                  }}
                >
                  <TooltipCard player={activeData} />
                </div>
              )}

              <svg
                ref={svgRef}
                width={width}
                height={height}
                className="block touch-none"
              >
                <defs>
                  <clipPath id={chartClipId}>
                    <rect
                      x={0}
                      y={0}
                      width={innerWidth}
                      height={innerHeight}
                    />
                  </clipPath>
                </defs>

                <g transform={`translate(${margin.left},${margin.top})`}>
                  {/* Background pan/zoom capture surface */}
                  <rect
                    width={innerWidth}
                    height={innerHeight}
                    fill="transparent"
                    style={{ cursor: isZoomed ? "grab" : "default" }}
                  />

                  {/* Clipped chart content */}
                  <g clipPath={`url(#${chartClipId})`}>
                    {/* Gridlines */}
                    {xTicks.map((t) => (
                      <line
                        key={`gx-${t}`}
                        x1={xZoomed(t)}
                        x2={xZoomed(t)}
                        y1={0}
                        y2={innerHeight}
                        stroke="var(--accent)"
                        strokeDasharray="3 3"
                      />
                    ))}
                    {yTicks.map((t) => (
                      <line
                        key={`gy-${t}`}
                        x1={0}
                        x2={innerWidth}
                        y1={yZoomed(t)}
                        y2={yZoomed(t)}
                        stroke="var(--accent)"
                        strokeDasharray="3 3"
                      />
                    ))}

                    {/* Bold center reference lines (clipped to visible area) */}
                    <line
                      x1={xZoomed(2.5)}
                      x2={xZoomed(2.5)}
                      y1={0}
                      y2={innerHeight}
                      stroke="var(--foreground)"
                      strokeWidth={2}
                      strokeOpacity={0.7}
                    />
                    <line
                      x1={0}
                      x2={innerWidth}
                      y1={yZoomed(50)}
                      y2={yZoomed(50)}
                      stroke="var(--foreground)"
                      strokeWidth={2}
                      strokeOpacity={0.7}
                    />

                    {/* Player dots — constant pixel size regardless of zoom */}
                    {playerData.map((p) => {
                      const cx = xZoomed(p.avgComplexity);
                      const cy = yZoomed(p.winRate);
                      const pad = AVATAR_SIZE_ACTIVE;
                      if (
                        cx < -pad ||
                        cx > innerWidth + pad ||
                        cy < -pad ||
                        cy > innerHeight + pad
                      ) {
                        return null;
                      }

                      const isActive = activePlayer === p.profileId;
                      const size = isActive
                        ? AVATAR_SIZE_ACTIVE
                        : AVATAR_SIZE;
                      const avatarClipId = `avatar-${idBase}-${p.profileId}`;

                      return (
                        <g
                          key={p.profileId}
                          data-player-dot=""
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => handleDotMouseEnter(p.profileId)}
                          onMouseLeave={handleDotMouseLeave}
                          onPointerDown={(e) =>
                            handleDotPointerDown(e, p.profileId)
                          }
                          onPointerMove={handleDotPointerMove}
                          onPointerUp={handleDotPointerUp}
                          onPointerCancel={handleDotPointerUp}
                        >
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
                          <clipPath id={avatarClipId}>
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
                          {p.image ? (
                            <image
                              href={p.image}
                              x={cx - size / 2}
                              y={cy - size / 2}
                              width={size}
                              height={size}
                              clipPath={`url(#${avatarClipId})`}
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
                              {p.firstName[0]}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* X axis */}
                  <g transform={`translate(0, ${innerHeight})`}>
                    <line
                      x1={0}
                      x2={innerWidth}
                      y1={0}
                      y2={0}
                      stroke="var(--foreground)"
                      strokeWidth={1}
                    />
                    {xTicks.map((t) => {
                      const xPos = xZoomed(t);
                      if (xPos < -1 || xPos > innerWidth + 1) return null;
                      return (
                        <g key={`xt-${t}`} transform={`translate(${xPos}, 0)`}>
                          <line
                            y1={0}
                            y2={4}
                            stroke="var(--foreground)"
                          />
                          <text
                            y={16}
                            textAnchor="middle"
                            fontSize={11}
                            fill="var(--foreground)"
                          >
                            {t}
                          </text>
                        </g>
                      );
                    })}
                    <text
                      x={innerWidth / 2}
                      y={32}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="var(--foreground)"
                    >
                      Avg Complexity
                    </text>
                  </g>

                  {/* Y axis */}
                  <g>
                    <line
                      x1={0}
                      x2={0}
                      y1={0}
                      y2={innerHeight}
                      stroke="var(--foreground)"
                      strokeWidth={1}
                    />
                    {yTicks.map((t) => {
                      const yPos = yZoomed(t);
                      if (yPos < -1 || yPos > innerHeight + 1) return null;
                      return (
                        <g key={`yt-${t}`} transform={`translate(0, ${yPos})`}>
                          <line
                            x1={0}
                            x2={-4}
                            stroke="var(--foreground)"
                          />
                          <text
                            x={-8}
                            dy="0.32em"
                            textAnchor="end"
                            fontSize={11}
                            fill="var(--foreground)"
                          >
                            {t}
                          </text>
                        </g>
                      );
                    })}
                    <text
                      transform={`translate(-32, ${innerHeight / 2}) rotate(-90)`}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      fill="var(--foreground)"
                    >
                      Win Rate %
                    </text>
                  </g>
                </g>
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PlayerComplexityChart;