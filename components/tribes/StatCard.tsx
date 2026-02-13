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
  color?: string;
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
  color = "default",
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
      : "text-white";
  const Icon = isPositive ? MoveUp : isNegative ? MoveDown : CircleSlash;

  // Animated counter effect for numeric values
  useEffect(() => {
    if (!animate || typeof value !== "number") {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplayValue(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, animate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4 }}
    >
      <Card
        className={cn(
          "relative overflow-hidden transition-shadow duration-300",
          "hover:shadow-lg p-2",
          color,
        )}
      >
        <CardContent className="relative p-2 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-md text-white font-bold mb-1 gap-2 truncate">
                <div className="sm:hidden">{icon}</div>
                {title}
              </div>
              <p className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                {displayValue}
                {suffix && (
                  <span className="text-lg sm:text-xl font-medium text-white ml-1">
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
            <div className="flex items-center mt-2">
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
              <span className="ml-2 text-gray-300 text-sm">
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
