"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CircleSlash, MoveDown, MoveUp } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  suffix?: string;
  trend?: {
    direction: "positive" | "negative" | "none";
    value: string;
    content: string;
  };
  icon: React.ReactNode;
  // Gradient design
  variant?: "a" | "b";
  delay?: number;
  animate?: boolean;
}

/**
 * StatCard - A visually striking metric card for key statistics
 *
 * Design decisions:
 * - Large, bold value draws immediate attention
 * - Animated number counting creates engagement
 * - Gradient icon background adds visual interest
 * - Color variants allow visual categorization
 * - Subtle hover animation provides interactivity feedback
 * - Compact design works well in grid layouts
 * - Responsive padding scales for mobile
 */
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  suffix = "",
  trend,
  icon,
  variant = "a",
  delay = 0,
  animate = true,
}) => {
  const [displayValue, setDisplayValue] = useState(
    animate && typeof value === "number" ? 0 : value,
  );

  const isPositive = trend?.direction === "positive";
  const isNegative = trend?.direction === "negative";
  const colorClass = isPositive
    ? "text-accent-1"
    : isNegative
      ? "text-destructive"
      : "text-muted-foreground";
  const Icon = isPositive ? MoveUp : isNegative ? MoveDown : CircleSlash;

  // Animated counter effect for numeric values
  const decimals =
    typeof value === "number" && value % 1 !== 0
      ? (String(value).split(".")[1]?.length ?? 0)
      : 0;

  useEffect(() => {
    if (!animate || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const raw = Math.min(increment * step, value);
      setDisplayValue(parseFloat(raw.toFixed(decimals)));

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate, decimals]);

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
          "relative overflow-hidden transition-shadow duration-300 h-full",
          "hover:shadow-lg p-2",
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

        <CardContent className="relative p-2 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-md text-foreground font-bold mb-1 gap-2 truncate">
                <div className="sm:hidden">{icon}</div>
                {title}
              </div>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {typeof displayValue === "number" && decimals > 0
                  ? displayValue.toFixed(decimals)
                  : displayValue}
                {suffix && (
                  <span className="text-lg sm:text-xl font-medium text-foreground ml-1">
                    {suffix}
                  </span>
                )}
              </p>
            </div>

            {/* Icon container with gradient background */}
            <div
              className={
                "hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary"
              }
            >
              <div>{icon}</div>
            </div>
          </div>

          {/* Trend Details */}
          {trend && (
            <div className="flex items-baseline mt-2">
              {trend && (
                <Icon
                  className={cn("w-4 h-4 text-md font-semibold", colorClass)}
                />
              )}
              {trend.value !== "0" && (
                <span className={cn("text-lg font-semibold", colorClass)}>
                  {trend.value}
                </span>
              )}
              <span className="ml-2 text-muted-foreground text-[10px] sm:text-sm">
                {trend?.content}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StatCard;
