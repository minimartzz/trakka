"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Sparkline from "./Sparkline";

export interface StatTrend {
  // Trend icon direction
  direction: "up" | "down" | "flat";
  // Formatted magnitude
  value: string;
}

interface DashboardStatCardProps {
  title: string;
  value: string;
  suffix?: string;
  trend?: StatTrend;
  // Label description
  trendLabel?: string;
  // Sparkline trend values
  series?: number[];
  icon: React.ReactNode;
  // Gradient design
  variant?: "a" | "b";
  delay?: number;
}

/**
 * DashboardStatCard - metric card.
 */
const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  suffix = "",
  trend,
  trendLabel,
  series,
  icon,
  variant = "a",
  delay = 0,
}) => {
  const TrendIcon =
    trend?.direction === "up"
      ? ArrowUpRight
      : trend?.direction === "down"
        ? ArrowDownRight
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card
        className={cn(
          "relative h-full overflow-hidden gap-0 py-0 border-0",
          "shadow-sm transition-shadow duration-300 hover:shadow-lg",
          "bg-background",
        )}
      >
        {/* Mesh gradient */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            variant === "a"
              ? "bg-[radial-gradient(120%_120%_at_85%_15%,var(--accent-2)_0%,transparent_55%),radial-gradient(110%_110%_at_15%_25%,var(--accent-5)_0%,transparent_50%),radial-gradient(130%_130%_at_50%_100%,var(--accent-1)_0%,transparent_60%)]"
              : "bg-[radial-gradient(120%_120%_at_15%_15%,var(--accent-3)_0%,transparent_55%),radial-gradient(110%_110%_at_90%_30%,var(--accent-1)_0%,transparent_50%),radial-gradient(130%_130%_at_60%_100%,var(--accent-4)_0%,transparent_60%)]",
            // Pastel in light mode
            "opacity-45 dark:opacity-35",
          )}
        />
        {/* Lifts the bottom-left corner so the big number always has contrast */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-tr from-background/85 via-background/25 to-transparent"
        />

        <div className="relative flex h-full flex-col justify-between p-5">
          {/* ── Title + icon ─────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold leading-tight text-foreground/80">
              {title}
            </p>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-foreground shadow-xs backdrop-blur-sm">
              {icon}
            </div>
          </div>

          {/* ── Value + trend ─────────────────────────── */}
          <div className="mt-8 flex items-end justify-between gap-4">
            <div className="flex shrink-0 items-end gap-2.5">
              <p className="text-6xl font-bold leading-none tracking-tight text-foreground font-display">
                {value}
                {suffix && (
                  <span className="ml-0.5 text-3xl font-semibold">
                    {suffix}
                  </span>
                )}
              </p>

              {trend && (
                <span
                  className={cn(
                    "mb-1 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold",
                    trend.direction === "up" &&
                      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                    trend.direction === "down" &&
                      "bg-destructive/15 text-destructive dark:text-red-300",
                    trend.direction === "flat" &&
                      "bg-foreground/10 text-muted-foreground",
                  )}
                  title={trendLabel}
                >
                  {TrendIcon && <TrendIcon className="h-3 w-3" />}
                  {trend.value}
                </span>
              )}
            </div>

            {series && series.length > 1 && (
              <Sparkline
                data={series}
                direction={trend?.direction}
                className="hidden lg:block min-w-0 flex-1 h-14 text-muted-foreground"
              />
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DashboardStatCard;
