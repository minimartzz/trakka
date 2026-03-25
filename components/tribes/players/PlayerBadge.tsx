"use client";

import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);
  const sizeConfig = SIZES[size];

  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <button
        type="button"
        className={cn(
          sizeConfig.container,
          "rounded-full flex items-center justify-center",
          "hover:scale-110 active:scale-95 transition-transform cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
        )}
        onMouseEnter={() => {
          if (!isTouchRef.current) setShowTooltip(true);
        }}
        onMouseLeave={() => {
          if (!isTouchRef.current) setShowTooltip(false);
        }}
        onTouchStart={() => {
          isTouchRef.current = true;
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          setShowTooltip((v) => !v);
        }}
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

      {/* Popover — to the left */}
      {showTooltip && (
        <div
          className={cn(
            "absolute z-50 right-full top-1/2 -translate-y-1/2 mr-2",
            "bg-popover border rounded-lg shadow-lg px-3 py-2",
            "whitespace-nowrap",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
        >
          <p className="text-sm font-semibold">{badge.label}</p>
          <p className="text-xs text-muted-foreground">{badge.description}</p>
          {badge.value && (
            <p className="text-xs text-primary font-medium mt-0.5">
              {badge.value}
            </p>
          )}
          {/* Arrow pointing right */}
          <div className="absolute left-full top-1/2 -translate-y-1/2 -ml-px">
            <div className="w-2 h-2 bg-popover border-t border-r rotate-45 translate-x-[-5px]" />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerBadge;
