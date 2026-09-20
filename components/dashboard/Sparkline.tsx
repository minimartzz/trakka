"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  /** Chronologically ordered values; fewer than 2 points renders nothing */
  data: number[];
  /** Drives the stroke colour so it matches the trend chip */
  direction?: "up" | "down" | "flat";
  className?: string;
}

// Internal coordinate space only — the SVG stretches to fill its container,
// so these set the curve's proportions rather than its rendered size.
const WIDTH = 160;
const HEIGHT = 56;

/**
 * Sparkline - Minimal trend line for the dashboard stat cards.
 *
 * Inline SVG rather than a chart library: there are no axes, ticks or
 * interactions to justify the weight, and these render at 64x24.
 */
const Sparkline: React.FC<SparklineProps> = ({
  data,
  direction = "flat",
  className,
}) => {
  const gradientId = useId();

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min;

  // A flat series would divide by zero — pin it to the vertical centre
  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * WIDTH;
    const y =
      span === 0 ? HEIGHT / 2 : HEIGHT - ((value - min) / span) * (HEIGHT - 2) - 1;
    return [x, y] as const;
  });

  const line = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} ${WIDTH},${HEIGHT} 0,${HEIGHT}`;

  const stroke =
    direction === "up"
      ? "var(--color-emerald-600, #059669)"
      : direction === "down"
        ? "var(--destructive)"
        : "currentColor";

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className={cn("w-full overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default Sparkline;
