"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  type ScoreCardKey,
  type ScoreStatData,
  type scoreColorMap,
} from "./types";
import { getScoreIcon, formatVp } from "./utils";

export function CompactScoreCard({
  cardKey,
  data,
  color,
  label,
  onClick,
}: {
  cardKey: ScoreCardKey;
  data: ScoreStatData | null;
  color: (typeof scoreColorMap)[keyof typeof scoreColorMap];
  label: string;
  onClick: () => void;
}) {
  const isAvgCard = cardKey === "avgWinning" || cardKey === "tribeAverage";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "bg-muted/50 rounded-xl border border-t-[3px] cursor-pointer transition-shadow hover:shadow-md h-full",
        color.cardBorder,
        color.topBorder,
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="p-3 flex flex-col gap-2.5 h-full">
        {/* Header */}
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-4 h-4 rounded-full flex items-center justify-center shrink-0",
              color.dot,
            )}
          >
            {getScoreIcon(cardKey, "w-2.5 h-2.5")}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider truncate">
            {label}
          </span>
        </div>

        {/* Score box */}
        {data ? (
          <div
            className={cn(
              "bg-card rounded-lg border p-3 flex flex-1 items-center justify-center",
              color.scoreBorder,
            )}
          >
            <div className="flex items-baseline gap-1">
              <span className="text-3xl sm:text-5xl font-black tabular-nums leading-none tracking-tight text-foreground">
                {isAvgCard ? data.value.toFixed(1) : formatVp(data.value)}
              </span>
              <span className="text-base font-bold text-muted-foreground">
                VP
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border p-3 flex-1 text-center">
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
