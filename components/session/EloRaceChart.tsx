"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useContainerSize } from "@/hooks/useContainerSize";
import { CalibratingMark } from "@/components/GameSessionCard";
import { CALIBRATION_SESSIONS } from "@/utils/elo";
import type { SessionPagePlayer } from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import type { EloRacePoint } from "@/utils/sessionPage";

// The viewer is drawn in the brand blue they're highlighted with everywhere
// else; everyone else takes a chart colour in finishing order, then a neutral
// once those run out (the avatar on the line still says whose it is)
const OTHER_COLOURS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function lineColours(
  players: SessionPagePlayer[],
  viewerId: number,
): Map<number, string> {
  const colours = new Map<number, string>();
  let next = 0;
  for (const player of players) {
    if (player.profileId === viewerId) {
      colours.set(player.profileId, "var(--primary)");
    } else {
      colours.set(
        player.profileId,
        OTHER_COLOURS[next++] ?? "var(--muted-foreground)",
      );
    }
  }
  return colours;
}

// The chart data's field holding a player's Elo
const seriesKey = (profileId: number) => `p${profileId}`;

const indexLabel = (index: number) =>
  index === 0
    ? "This session"
    : `${-index} ${index === -1 ? "session" : "sessions"} before`;

interface RaceTooltipProps {
  active?: boolean;
  label?: number;
  race: Record<number, EloRacePoint[]>;
  players: SessionPagePlayer[];
  colours: Map<number, string>;
}

// Every player's point at the hovered index: Elo, date and whose Tribe it was
// played in. Other Tribes are never named.
const RaceTooltip: React.FC<RaceTooltipProps> = ({
  active,
  label,
  race,
  players,
  colours,
}) => {
  if (!active || label === undefined) return null;
  const rows = players
    .map((player) => ({
      player,
      point: race[player.profileId]?.find((p) => p.index === label),
    }))
    .filter((r): r is { player: SessionPagePlayer; point: EloRacePoint } =>
      Boolean(r.point),
    )
    .sort((a, b) => b.point.elo - a.point.elo);

  return (
    <div className="min-w-52 rounded-lg border bg-popover p-2.5 text-popover-foreground shadow-lg">
      <p className="mb-1.5 text-sm font-medium">{indexLabel(label)}</p>
      <ul className="space-y-1 text-xs">
        {rows.map(({ player, point }) => (
          <li key={player.profileId} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: colours.get(player.profileId) }}
            />
            <span className="min-w-0 flex-1 truncate">{player.firstName}</span>
            <span className="font-semibold tabular-nums">
              {point.elo}
              {point.calibrating && <CalibratingMark />}
            </span>
            <span className="w-20 text-right tabular-nums text-muted-foreground">
              {format(new Date(point.datePlayed), "d MMM yy")}
            </span>
            <span className="w-20 text-right text-muted-foreground">
              {point.sameTribe ? "This tribe" : "Another tribe"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: { index: number };
}

// Which player's line stands out: the one under the mouse, else the one
// tapped (or clicked) to pin it
export interface Highlight {
  id: number | null;
  hover: (profileId: number | null) => void;
  togglePin: (profileId: number) => void;
}

// Mouse hover only: a tap also fires pointer enter, which would undo the pin
export const hoverHandlers = (highlight: Highlight, profileId: number) => ({
  onPointerEnter: (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") highlight.hover(profileId);
  },
  onPointerLeave: (e: React.PointerEvent) => {
    if (e.pointerType === "mouse") highlight.hover(null);
  },
});

interface EloRaceChartProps {
  race: Record<number, EloRacePoint[]>;
  // In finishing order
  players: SessionPagePlayer[];
  viewerId: number;
  highlight: Highlight;
}

/**
 * Each player's Elo over their last Rated Sessions of the game, lined up so
 * every line ends at this session, where their avatar sits.
 */
export default function EloRaceChart({
  race,
  players,
  viewerId,
  highlight,
}: EloRaceChartProps) {
  const highlightedId = highlight.id;
  const [containerRef, { width, height }] = useContainerSize();
  const colours = useMemo(
    () => lineColours(players, viewerId),
    [players, viewerId],
  );

  const charted = useMemo(
    () => players.filter((p) => (race[p.profileId]?.length ?? 0) > 0),
    [players, race],
  );

  // One row per index, oldest first, holding each player's Elo there
  const data = useMemo(() => {
    const first = Math.min(
      0,
      ...charted.map((p) => race[p.profileId][0].index),
    );
    return Array.from({ length: 1 - first }, (_, i) => {
      const index = first + i;
      const row: Record<string, number> = { index };
      for (const player of charted) {
        const point = race[player.profileId].find((p) => p.index === index);
        if (point) row[seriesKey(player.profileId)] = point.elo;
      }
      return row;
    });
  }, [charted, race]);

  // The highlighted line, then the viewer's, are drawn last so they sit on top
  const drawOrder = useMemo(
    () =>
      [...charted].sort((a, b) => {
        const rank = (p: SessionPagePlayer) =>
          p.profileId === highlightedId
            ? 2
            : p.profileId === viewerId
              ? 1
              : 0;
        return rank(a) - rank(b);
      }),
    [charted, highlightedId, viewerId],
  );

  if (charted.length === 0) return null;

  // The viewer's line stays fully opaque; others fade back while one is
  // highlighted
  const opacity = (profileId: number) =>
    profileId === viewerId || profileId === highlightedId
      ? 1
      : highlightedId === null
        ? 0.55
        : 0.15;

  return (
    <div>
      <div
        ref={containerRef}
        role="img"
        aria-label="Each player's Elo over their last Rated Sessions of this game"
        className="h-56 w-full sm:h-72"
      >
        {width > 0 && (
          <LineChart
            width={width}
            height={height}
            data={data}
            margin={{ top: 16, right: 22, bottom: 4, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="index"
              type="number"
              domain={["dataMin", 0]}
              ticks={data.map((d) => d.index)}
              tickFormatter={(v: number) =>
                v === 0 ? "Now" : `−${Math.abs(v)}`
              }
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              domain={[
                (min: number) => Math.max(0, Math.floor((min - 10) / 50) * 50),
                (max: number) => Math.ceil((max + 10) / 50) * 50,
              ]}
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={40}
            />
            <Tooltip
              content={
                <RaceTooltip
                  race={race}
                  players={players}
                  colours={colours}
                />
              }
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            />
            {drawOrder.map((player) => {
              const id = player.profileId;
              const colour = colours.get(id)!;
              const isViewer = id === viewerId;
              const emphasised = isViewer || id === highlightedId;
              const points = race[id];
              return (
                <Line
                  key={id}
                  dataKey={seriesKey(id)}
                  name={player.firstName}
                  type="linear"
                  stroke={colour}
                  strokeWidth={emphasised ? 3.5 : 1.75}
                  strokeOpacity={opacity(id)}
                  isAnimationActive={false}
                  activeDot={false}
                  className="transition-[stroke-opacity,stroke-width] duration-150 motion-reduce:transition-none"
                  dot={(props: DotProps) => {
                    const { cx, cy, payload } = props;
                    const dotKey = `${id}-${payload?.index}`;
                    if (cx == null || cy == null || !payload) {
                      return <g key={dotKey} />;
                    }
                    const point = points.find((p) => p.index === payload.index);
                    if (!point) return <g key={dotKey} />;

                    // This session: the player's avatar ends the line
                    if (point.index === 0) {
                      return (
                        <EndAvatar
                          key={dotKey}
                          cx={cx}
                          cy={cy}
                          player={player}
                          colour={colour}
                          large={emphasised}
                          opacity={opacity(id) === 1 ? 1 : 0.7}
                          highlight={highlight}
                        />
                      );
                    }
                    // Calibrating sessions are hollow
                    return (
                      <circle
                        key={dotKey}
                        cx={cx}
                        cy={cy}
                        r={emphasised ? 4 : 3}
                        stroke={colour}
                        strokeWidth={1.75}
                        strokeOpacity={opacity(id)}
                        fill={point.calibrating ? "var(--card)" : colour}
                        fillOpacity={point.calibrating ? 1 : opacity(id)}
                      />
                    );
                  }}
                />
              );
            })}
          </LineChart>
        )}
      </div>

      {/* Legend doubles as the touch control for highlighting a line */}
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {charted.map((player) => {
          const id = player.profileId;
          const active = highlightedId === id;
          return (
            <li key={id}>
              <button
                type="button"
                {...hoverHandlers(highlight, id)}
                onFocus={() => highlight.hover(id)}
                onBlur={() => highlight.hover(null)}
                onClick={() => highlight.togglePin(id)}
                aria-pressed={active}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-8",
                  active ? "bg-muted text-foreground" : "text-muted-foreground",
                  id === viewerId && "font-semibold text-foreground",
                )}
              >
                <span
                  className="h-0.5 w-3 rounded-full"
                  style={{ background: colours.get(id) }}
                />
                {player.firstName}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Hollow points are still in Calibration: the player hadn&apos;t yet
        finished {CALIBRATION_SESSIONS} Rated Sessions of the game.
      </p>
    </div>
  );
}

// A player's avatar at the end of their line, ringed in the line's colour
const EndAvatar: React.FC<{
  cx: number;
  cy: number;
  player: SessionPagePlayer;
  colour: string;
  large: boolean;
  opacity: number;
  highlight: Highlight;
}> = ({ cx, cy, player, colour, large, opacity, highlight }) => {
  const r = large ? 13 : 11;
  const clipId = `elo-race-avatar-${player.profileId}`;
  return (
    <g opacity={opacity} {...hoverHandlers(highlight, player.profileId)}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r + 2} fill={colour} />
      {player.profilePic ? (
        <image
          href={player.profilePic}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <circle cx={cx} cy={cy} r={r} fill="var(--muted)" />
          <text
            x={cx}
            y={cy}
            dy="0.35em"
            textAnchor="middle"
            fontSize={r}
            fontWeight={600}
            fill="var(--muted-foreground)"
          >
            {player.firstName.charAt(0).toUpperCase()}
          </text>
        </>
      )}
    </g>
  );
};
