"use client";

import {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { cn } from "@/lib/utils";
import { HeatmapDay } from "@/utils/playerStatsCalculations";

interface PlayHeatmapProps {
  data: HeatmapDay[];
  className?: string;
}

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
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
const WEEKS_TO_SHOW = 52;
const GAP = 3;
const LABEL_WIDTH = 30; // px — day label column width

const getColor = (count: number, maxCount: number): string => {
  if (count === 0) return "bg-muted/60";
  const intensity = count / maxCount;
  if (intensity <= 0.25) return "bg-accent-1/30";
  if (intensity <= 0.5) return "bg-accent-1/55";
  if (intensity <= 0.75) return "bg-accent-1/80";
  return "bg-accent-1";
};

function formatTooltipDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface TooltipState {
  date: string;
  count: number;
  top: number;
  left: number;
}

const PlayHeatmap: React.FC<PlayHeatmapProps> = ({ data, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(14);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // ── Dynamically compute cell size from container width ────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const w = container.clientWidth;
      // available width = total - day-labels - all gaps between week columns
      const available = w - LABEL_WIDTH - (WEEKS_TO_SHOW - 1) * GAP;
      const computed = Math.floor(available / WEEKS_TO_SHOW);
      setCellSize(Math.max(10, Math.min(20, computed)));
    };

    const ro = new ResizeObserver(measure);
    ro.observe(container);
    measure();
    return () => ro.disconnect();
  }, []);

  // ── Scroll to current date (rightmost) after layout ───────────────
  useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [cellSize]);

  // ── Dismiss tooltip on outside touch ─────────────────────────────
  useEffect(() => {
    const dismiss = () => setTooltip(null);
    document.addEventListener("touchstart", dismiss, { passive: true });
    return () => document.removeEventListener("touchstart", dismiss);
  }, []);

  const showTooltip = useCallback(
    (
      e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
      date: string,
      count: number,
    ) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rawLeft = rect.left + rect.width / 2;
      // Clamp so tooltip doesn't overflow viewport edges
      const left = Math.max(80, Math.min(window.innerWidth - 80, rawLeft));
      setTooltip({ date, count, top: rect.top - 4, left });
    },
    [],
  );

  // ── Build heatmap grid ────────────────────────────────────────────
  const { grid, months, maxCount } = useMemo(() => {
    const countMap = new Map<string, number>();
    let max = 0;
    data.forEach((d) => {
      countMap.set(d.date, d.count);
      if (d.count > max) max = d.count;
    });

    const today = new Date();
    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + (6 - endDay.getDay()));

    const startDay = new Date(endDay);
    startDay.setDate(startDay.getDate() - WEEKS_TO_SHOW * 7 + 1);

    const weeks: { date: string; count: number; dayOfWeek: number }[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];

    const current = new Date(startDay);
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    let lastMonth = -1;

    while (current <= endDay) {
      const dow = current.getDay();
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      const count = countMap.get(dateStr) ?? 0;

      if (current.getMonth() !== lastMonth) {
        monthLabels.push({
          label: MONTH_NAMES[current.getMonth()],
          weekIndex: weeks.length,
        });
        lastMonth = current.getMonth();
      }

      currentWeek.push({ date: dateStr, count, dayOfWeek: dow });

      if (dow === 6 || current.getTime() === endDay.getTime()) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      current.setDate(current.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { grid: weeks, months: monthLabels, maxCount: max || 1 };
  }, [data]);

  const totalPlays = data.reduce((sum, d) => sum + d.count, 0);
  const stride = cellSize + GAP;

  return (
    <div ref={containerRef} className={cn("w-full relative", className)}>
      {/* Scrollable area — auto-scrolls to right (current date) on mount */}
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="inline-flex flex-col" style={{ gap: GAP }}>
          {/* Month labels row */}
          <div style={{ marginLeft: LABEL_WIDTH + 6, display: "flex" }}>
            {months.map((m, i) => {
              const nextWeekIdx = months[i + 1]?.weekIndex ?? grid.length;
              const width = (nextWeekIdx - m.weekIndex) * stride;
              return (
                <span
                  key={`${m.label}-${m.weekIndex}`}
                  className="text-[11px] text-muted-foreground"
                  style={{ width, display: "block", overflow: "hidden" }}
                >
                  {width > cellSize * 1.5 ? m.label : ""}
                </span>
              );
            })}
          </div>

          {/* Day labels + week columns */}
          <div className="flex">
            {/* Day-of-week labels */}
            <div
              className="flex flex-col mr-1.5"
              style={{ gap: GAP, width: LABEL_WIDTH }}
            >
              {DAY_LABELS.map((label, i) => (
                <span
                  key={i}
                  className="text-[11px] text-muted-foreground text-right pr-1 select-none"
                  style={{ height: cellSize, lineHeight: `${cellSize}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Week columns */}
            <div className="flex" style={{ gap: GAP }}>
              {grid.map((week, weekIdx) => (
                <div
                  key={weekIdx}
                  className="flex flex-col"
                  style={{ gap: GAP }}
                >
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const cell = week.find((c) => c.dayOfWeek === dayIdx);
                    if (!cell) {
                      return (
                        <div
                          key={dayIdx}
                          style={{ width: cellSize, height: cellSize }}
                        />
                      );
                    }
                    return (
                      <div
                        key={dayIdx}
                        style={{
                          width: cellSize,
                          height: cellSize,
                          borderRadius: Math.max(2, cellSize / 6),
                        }}
                        className={cn(
                          getColor(cell.count, maxCount),
                          "cursor-pointer transition-opacity hover:opacity-75",
                        )}
                        onMouseEnter={(e) =>
                          showTooltip(e, cell.date, cell.count)
                        }
                        onMouseLeave={() => setTooltip(null)}
                        onClick={(e) => showTooltip(e, cell.date, cell.count)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend row */}
          <div
            className="flex items-center justify-between mt-1"
            style={{ marginLeft: LABEL_WIDTH + 6 }}
          >
            <span className="text-xs text-muted-foreground">
              {totalPlays} game{totalPlays !== 1 ? "s" : ""} in the past year
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Less</span>
              {(
                [
                  "bg-muted/60",
                  "bg-accent-1/30",
                  "bg-accent-1/55",
                  "bg-accent-1/80",
                  "bg-accent-1",
                ] as const
              ).map((cls) => (
                <div
                  key={cls}
                  className={cn("rounded-[2px]", cls)}
                  style={{ width: cellSize * 0.8, height: cellSize * 0.8 }}
                />
              ))}
              <span className="text-[10px] text-muted-foreground">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip — fixed so it escapes scroll/overflow containers */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-popover border rounded-lg shadow-xl px-3 py-2 -translate-x-1/2 -translate-y-full"
          style={{ top: tooltip.top, left: tooltip.left }}
        >
          <p className="text-xs font-semibold whitespace-nowrap">
            {formatTooltipDate(tooltip.date)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tooltip.count === 0
              ? "No games played"
              : `${tooltip.count} game${tooltip.count !== 1 ? "s" : ""} played`}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayHeatmap;
