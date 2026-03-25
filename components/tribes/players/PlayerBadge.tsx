"use client";

import { useState } from "react";
import Image from "next/image";
import { BadgeInfo } from "@/utils/playerStatsCalculations";
import { cn } from "@/lib/utils";

interface PlayerBadgeProps {
  badge: BadgeInfo;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { container: "w-8 h-8", image: 28 },
  md: { container: "w-10 h-10", image: 36 },
  lg: { container: "w-14 h-14", image: 48 },
};

const PlayerBadge: React.FC<PlayerBadgeProps> = ({
  badge,
  size = "md",
  className,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const sizeConfig = SIZES[size];

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        className={cn(
          sizeConfig.container,
          "rounded-full flex items-center justify-center",
          "hover:scale-110 active:scale-95 transition-transform cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
        )}
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`${badge.label} badge: ${badge.description}`}
      >
        <Image
          src={badge.image}
          alt={badge.label}
          width={sizeConfig.image}
          height={sizeConfig.image}
          className="object-contain drop-shadow-md"
        />
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2",
            "bg-popover border rounded-lg shadow-lg px-3 py-2",
            "whitespace-nowrap pointer-events-none",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
        >
          <p className="text-sm font-semibold">{badge.label}</p>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
          {badge.value && (
            <p className="text-xs text-primary font-medium mt-0.5">{badge.value}</p>
          )}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-popover border-r border-b rotate-45 -translate-y-1" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerBadge;
