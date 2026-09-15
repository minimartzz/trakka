"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  ChevronDown,
  Dices,
  Info,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Tooltip as ChartTooltip,
  type BaseTickContentProps,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GroupedSession } from "@/lib/interfaces";
import type { GameMeta } from "@/app/(account)/dashboard/action";
import { useContainerSize } from "@/hooks/useContainerSize";

interface GenreOverviewProps {
  userId: number;
  /** Sessions already narrowed to the active timeframe */
  sessions: GroupedSession[];
  gameMeta: GameMeta;
  delay?: number;
}

type Axis = "category" | "mechanic";
type Stat = "winRate" | "avgWpa";

const AXIS_LABEL: Record<Axis, string> = {
  category: "Category",
  mechanic: "Mechanic",
};

const STAT_OPTIONS: { value: Stat; label: string }[] = [
  { value: "winRate", label: "Win Rate" },
  { value: "avgWpa", label: "Avg WPA" },
];

// The radar always shows this many axes (or every option, if fewer exist)
const POINT_COUNT = 5;

interface OptionStats {
  label: string;
  games: number;
  wins: number;
  scoreSum: number;
  scoreCount: number;
}

interface RadarPoint {
  label: string;
  value: number;
  /** null when the stat can't be computed (e.g. no WPA recorded) */
  display: number | null;
  games: number;
}

const formatValue = (value: number | null, stat: Stat) =>
  value === null
    ? "—"
    : stat === "winRate"
      ? `${Math.round(value)}%`
      : value.toFixed(2);

// Win rate chips use the same tones as the W/T/L outcome circles. WPA has no
// fixed scale so its chips stay neutral.
const chipClass = (value: number | null, stat: Stat) => {
  if (value === null || stat !== "winRate")
    return "bg-foreground/10 text-foreground";
  if (value >= 60)
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
  if (value >= 40) return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
  return "bg-destructive/15 text-destructive";
};

// ─── Axis tick: label + value chip ───────────────────────────────────────────

// Label box: wrapped label on top, value chip beneath. The box is taller than
// its content so long labels can take three lines; the content hugs the edge
// nearest the vertex.
const TICK_W = 96;
const TICK_H = 76;
// Space from the vertex to where the label box starts
const TICK_GAP = 6;

// How far a label's content actually reaches from its vertex. The box is
// taller (TICK_H) but the content hugs the vertex-facing edge, so a two-line
// label plus chip is what the fit reserves; a rare three-liner spills into
// the card padding.
const TICK_REACH = 56;

// Wheel / pinch zoom. 1 is the fitted size, where the whole chart including
// its labels sits inside the box; above that the chart scales around its
// centre, labels riding on their vertices, and the box clips the overflow.
const ZOOM_MAX = 3;
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(1, z));

// Rendered as a foreignObject so the chip can use the same Tailwind tokens as
// the rest of the dashboard. Anchored on the side facing away from the chart
// (right-hand ticks grow rightwards, etc.).
const AxisTick: React.FC<
  BaseTickContentProps & {
    points: Map<string, RadarPoint>;
    stat: Stat;
  }
> = ({ x, y, textAnchor, verticalAnchor, payload, points, stat }) => {
  const px = Number(x);
  const py = Number(y);
  const point = points.get(String(payload.value));
  if (!point) return null;

  // verticalAnchor follows SVG text semantics: "end" means the text ends at
  // the vertex (top sector, box hangs above it), "start" means it starts
  // there (bottom sector, box drops below it).
  const left =
    textAnchor === "start"
      ? px + TICK_GAP
      : textAnchor === "end"
        ? px - TICK_GAP - TICK_W
        : px - TICK_W / 2;
  const top =
    verticalAnchor === "end"
      ? py - TICK_GAP - TICK_H
      : verticalAnchor === "start"
        ? py + TICK_GAP
        : py - TICK_H / 2;

  return (
    <foreignObject x={left} y={top} width={TICK_W} height={TICK_H}>
      <div
        className={cn(
          "flex h-full flex-col gap-1",
          // Horizontal: content sits on the edge facing the vertex
          textAnchor === "start"
            ? "items-start text-left"
            : textAnchor === "end"
              ? "items-end text-right"
              : "items-center text-center",
          // Vertical: top-sector boxes hang from their bottom edge, bottom-
          // sector boxes from their top, side boxes are centred
          verticalAnchor === "end"
            ? "justify-end"
            : verticalAnchor === "start"
              ? "justify-start"
              : "justify-center",
        )}
      >
        <span className="text-[13px] font-medium leading-4 text-muted-foreground wrap-break-word">
          {point.label}
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-sm font-bold tabular-nums leading-none",
            chipClass(point.display, stat),
          )}
        >
          {formatValue(point.display, stat)}
        </span>
      </div>
    </foreignObject>
  );
};

// ─── Hover tooltip ────────────────────────────────────────────────────────────

const RadarTooltip = ({
  active,
  payload,
  stat,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarPoint }>;
  stat: Stat;
}) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-popover border rounded-lg shadow-lg p-2.5 min-w-35">
      <p className="font-medium text-sm mb-1">{d.label}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">
            {STAT_OPTIONS.find((o) => o.value === stat)?.label}
          </span>
          <span className="font-semibold">{formatValue(d.display, stat)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sessions</span>
          <span>{d.games}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GenreOverview: React.FC<GenreOverviewProps> = ({
  userId,
  sessions,
  gameMeta,
  delay = 0,
}) => {
  const [axis, setAxis] = useState<Axis>("category");
  const [stat, setStat] = useState<Stat>("winRate");
  // null = fall back to the most-played options for the current data
  const [picked, setPicked] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [containerRef, { width, height }] = useContainerSize();

  // ── Zoom ──────────────────────────────────────────────────────────────────
  // zoomRef mirrors the state so native listeners can read the latest value
  // synchronously, which preventDefault needs.
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const applyZoom = (next: number) => {
    zoomRef.current = next;
    setZoom(next);
  };

  // React registers wheel listeners as passive, so the page-scroll block has
  // to be a native listener. It is attached via the same callback ref that
  // measures the box, so it follows the box in and out of the tree.
  const wheelCleanup = useRef<(() => void) | null>(null);
  const boxRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef(node);
      wheelCleanup.current?.();
      wheelCleanup.current = null;
      if (!node) return;

      const onWheel = (e: WheelEvent) => {
        // Line-mode deltas (Firefox) are ~1/16 the size of pixel-mode ones
        const step = e.deltaMode === 1 ? 0.05 : 0.003;
        const next = clampZoom(zoomRef.current * Math.exp(-e.deltaY * step));
        // At a bound in the scrolled direction, let the page scroll instead
        if (next === zoomRef.current) return;
        e.preventDefault();
        zoomRef.current = next;
        setZoom(next);
      };
      node.addEventListener("wheel", onWheel, { passive: false });
      wheelCleanup.current = () => node.removeEventListener("wheel", onWheel);
    },
    [containerRef],
  );

  // Two-finger pinch via pointer events; touch-action pan-y keeps one-finger
  // page scrolling working while leaving the pinch to us.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const pinchDistance = () => {
    const [a, b] = [...pointers.current.values()];
    if (!a || !b) return 0;
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "touch") return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinch.current = { dist: pinchDistance(), zoom: zoomRef.current };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (
      pointers.current.size === 2 &&
      pinch.current &&
      pinch.current.dist > 0
    ) {
      applyZoom(
        clampZoom((pinch.current.zoom * pinchDistance()) / pinch.current.dist),
      );
    }
  };
  const onPointerEnd = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  // Per-option tallies over the timeframe. A game can carry several labels, so
  // one session contributes to each of them.
  const options = useMemo(() => {
    const byGame =
      axis === "category" ? gameMeta.categories : gameMeta.mechanics;
    const tallies = new Map<string, OptionStats>();

    for (const session of sessions) {
      if (!session.isPlayer) continue;
      const labels = byGame[session.gameId];
      if (!labels) continue;
      const me = session.players.find((p) => p.profileId === userId);

      for (const label of labels) {
        const entry = tallies.get(label) ?? {
          label,
          games: 0,
          wins: 0,
          scoreSum: 0,
          scoreCount: 0,
        };
        entry.games += 1;
        if (session.isWinner) entry.wins += 1;
        if (me?.score !== null && me?.score !== undefined) {
          entry.scoreSum += me.score;
          entry.scoreCount += 1;
        }
        tallies.set(label, entry);
      }
    }

    // Most played first so the top of the list is the default selection
    return [...tallies.values()].sort(
      (a, b) => b.games - a.games || a.label.localeCompare(b.label),
    );
  }, [sessions, gameMeta, axis, userId]);

  const required = Math.min(POINT_COUNT, options.length);

  const active = useMemo(() => {
    const available = new Set(options.map((o) => o.label));
    // A manual pick survives timeframe changes only while every option still
    // has data; otherwise revert to the most-played set
    if (
      picked &&
      picked.length === required &&
      picked.every((l) => available.has(l))
    ) {
      return picked;
    }
    return options.slice(0, required).map((o) => o.label);
  }, [options, picked, required]);

  const points = useMemo(() => {
    const byLabel = new Map(options.map((o) => [o.label, o]));
    return active.map<RadarPoint>((label) => {
      const o = byLabel.get(label)!;
      const display =
        stat === "winRate"
          ? (o.wins / o.games) * 100
          : o.scoreCount > 0
            ? o.scoreSum / o.scoreCount
            : null;
      return { label, value: display ?? 0, display, games: o.games };
    });
  }, [options, active, stat]);

  const pointsByLabel = useMemo(
    () => new Map(points.map((p) => [p.label, p])),
    [points],
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAxisChange = (value: string) => {
    setAxis(value as Axis);
    setPicked(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(active);
      setSearch("");
    }
    setOpen(next);
  };

  // The chart only follows the draft once it holds a full set again, so
  // swapping an option is: untick one, tick another.
  const toggle = (label: string) => {
    const next = draft.includes(label)
      ? draft.filter((l) => l !== label)
      : draft.length >= required
        ? draft
        : [...draft, label];
    setDraft(next);
    if (next.length === required) setPicked(next);
  };

  const isFull = draft.length >= required;

  // Largest radius (at zoom 1) that keeps the labels inside the SVG. Vertices
  // sit at 90° + k·360/n. Horizontally only half a box needs to clear the
  // widest vertex — the polygon is allowed to run under the inner half of a
  // side label on narrow screens, which buys a much bigger chart. Vertically
  // the top vertex and the lowest one each carry a label reaching TICK_REACH
  // beyond the vertex, and that whole extent is centred in the SVG.
  const { outerRadius, cy } = useMemo(() => {
    const n = points.length;
    if (n === 0 || width === 0 || height === 0)
      return { outerRadius: 0, cy: 0 };
    let maxCos = 0;
    let maxDown = 0;
    for (let k = 0; k < n; k++) {
      const angle = ((90 + (k * 360) / n) * Math.PI) / 180;
      maxCos = Math.max(maxCos, Math.abs(Math.cos(angle)));
      maxDown = Math.max(maxDown, -Math.sin(angle));
    }
    const reach = TICK_GAP + TICK_REACH;
    const byWidth =
      maxCos > 0
        ? (width / 2 - TICK_GAP - TICK_W / 2) / maxCos
        : Number.POSITIVE_INFINITY;
    const byHeight = (height - 2 * reach) / (1 + maxDown);
    const r = Math.floor(Math.max(0, Math.min(byWidth, byHeight)));
    const extent = r * (1 + maxDown) + 2 * reach;
    return { outerRadius: r, cy: (height - extent) / 2 + reach + r };
  }, [points.length, width, height]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="h-full"
    >
      <Card className="h-full gap-0 py-0">
        <CardContent className="flex h-full flex-col p-0">
          {/* ── Header: axis dropdown inside the title + info ─────────────── */}
          <div className="flex items-center justify-between border-b px-5 py-3">
            <div className="flex items-center gap-1 font-bold">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Choose category or mechanic"
                    className="-mx-1 inline-flex items-center gap-0.5 rounded-md px-1 text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {AXIS_LABEL[axis]}
                    <ChevronDown className="size-4 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuRadioGroup
                    value={axis}
                    onValueChange={handleAxisChange}
                  >
                    {(Object.keys(AXIS_LABEL) as Axis[]).map((a) => (
                      <DropdownMenuRadioItem key={a} value={a}>
                        {AXIS_LABEL[a]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <span>Overview</span>
            </div>

            <Tooltip open={infoOpen} onOpenChange={setInfoOpen}>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex text-muted-foreground"
                  onClick={(e) => {
                    // Radix skips touch for hover-open and force-closes on
                    // click, so tapping never showed this on mobile.
                    e.preventDefault();
                    setInfoOpen((o) => !o);
                  }}
                >
                  <Info className="size-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-60">
                Stats across tags associated with a game. A game can have
                several, so a session counts towards each of them.
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-1 flex-col px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
            {/* ── Controls: stat + options ──────────────────────────────── */}
            <div className="mb-2 flex items-center justify-between gap-3">
              <Select value={stat} onValueChange={(v) => setStat(v as Stat)}>
                <SelectTrigger size="sm" aria-label="Statistic to chart">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={open} onOpenChange={handleOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5"
                    disabled={options.length === 0}
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Options
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-72 p-0"
                  onOpenAutoFocus={(e) => {
                    // Keep the soft keyboard down on touch devices
                    if (
                      typeof window !== "undefined" &&
                      !window.matchMedia("(pointer: fine)").matches
                    ) {
                      e.preventDefault();
                    }
                  }}
                >
                  <div className="flex items-center gap-2 border-b px-3">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={`Search ${AXIS_LABEL[axis].toLowerCase()}`}
                      aria-label={`Search ${AXIS_LABEL[axis].toLowerCase()}`}
                      className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
                    />
                    <span
                      className={cn(
                        "shrink-0 text-xs tabular-nums",
                        isFull
                          ? "text-muted-foreground"
                          : "text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {draft.length}/{required}
                    </span>
                  </div>

                  <ScrollArea className="h-64">
                    <ul className="p-1">
                      {filteredOptions.length === 0 ? (
                        <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                          No {AXIS_LABEL[axis].toLowerCase()} found
                        </li>
                      ) : (
                        filteredOptions.map((option) => {
                          const checked = draft.includes(option.label);
                          // Untick something before another can be added
                          const blocked = !checked && isFull;
                          return (
                            <li key={option.label}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                aria-disabled={blocked}
                                onClick={() => toggle(option.label)}
                                className={cn(
                                  "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                                  blocked
                                    ? "cursor-not-allowed opacity-50"
                                    : "hover:bg-accent",
                                  checked && "bg-accent/60",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex size-4 shrink-0 items-center justify-center rounded-lg border transition-colors",
                                    checked
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-input",
                                  )}
                                >
                                  {checked && <Check className="size-3" />}
                                </span>
                                <span className="min-w-0 flex-1 truncate">
                                  {option.label}
                                </span>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                  {option.games}
                                </span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            {/* ── Radar ─────────────────────────────────────────────────── */}
            {points.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-muted-foreground">
                <Dices className="mb-2 size-10 opacity-50" />
                <p className="text-sm">
                  No {AXIS_LABEL[axis].toLowerCase()} data for this timeframe
                </p>
              </div>
            ) : (
              // Stacked on mobile the card has no height to flex into, so
              // the box sets its own. On desktop it takes whatever the card
              // has left, so this card plus the summary beneath it match the
              // sessions table; the floor only matters when that table is
              // short.
              <div
                ref={boxRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onPointerLeave={onPointerEnd}
                onDoubleClick={() => applyZoom(1)}
                className={cn(
                  "relative min-h-100 w-full flex-1 touch-pan-y lg:min-h-45 [&_svg]:overflow-visible",
                  zoom > 1 && "overflow-hidden",
                )}
              >
                {outerRadius > 0 && (
                  <RadarChart
                    width={width}
                    height={height}
                    data={points}
                    cy={cy}
                    outerRadius={outerRadius * zoom}
                    margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  >
                    <PolarGrid stroke="var(--border)" strokeOpacity={0.8} />
                    <PolarRadiusAxis
                      domain={stat === "winRate" ? [0, 100] : [0, "auto"]}
                      tick={false}
                      axisLine={false}
                    />
                    {/* Before the angle axis so a zoomed polygon draws under
                        the labels rather than over them */}
                    <Radar
                      dataKey="value"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="var(--primary)"
                      fillOpacity={0.25}
                      dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                      activeDot={{
                        r: 5,
                        stroke: "var(--primary)",
                        strokeWidth: 2,
                        fill: "var(--background)",
                      }}
                      isAnimationActive={false}
                    />
                    <PolarAngleAxis
                      dataKey="label"
                      tickLine={false}
                      /* Ticks land exactly on the vertex; AxisTick adds its own gap */
                      tickSize={0}
                      tick={(props: BaseTickContentProps) => (
                        <AxisTick
                          {...props}
                          points={pointsByLabel}
                          stat={stat}
                        />
                      )}
                    />
                    <ChartTooltip
                      content={<RadarTooltip stat={stat} />}
                      cursor={false}
                    />
                  </RadarChart>
                )}

                {zoom > 1 && (
                  <button
                    type="button"
                    onClick={() => applyZoom(1)}
                    className="absolute top-0 right-0 rounded-md bg-background/80 px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground shadow-xs backdrop-blur-sm transition-colors hover:text-foreground"
                    aria-label="Reset zoom"
                  >
                    {zoom.toFixed(1)}× · reset
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default GenreOverview;
