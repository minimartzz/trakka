"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type ScoreCardKey, type ScoreStatData, type scoreColorMap } from "./types";
import { getScoreIcon, formatVp } from "./utils";

export function ExpandedScoreCard({
  cardKey,
  data,
  color,
  label,
}: {
  cardKey: ScoreCardKey;
  data: ScoreStatData | null;
  color: (typeof scoreColorMap)[keyof typeof scoreColorMap];
  label: string;
}) {
  const isAvgCard = cardKey === "avgWinning" || cardKey === "tribeAverage";

  function renderMetric() {
    if (!data) return null;
    const hl = (v: string | number) => (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded-md font-bold not-italic tabular-nums",
          color.highlightBg,
        )}
      >
        {v}
      </span>
    );
    const bold = (t: string) => (
      <span className="font-bold not-italic">{t}</span>
    );

    switch (cardKey) {
      case "highest":
        if (data.dominance == null) return null;
        return (
          <>
            {bold("Dominance")} &mdash; +{hl(data.dominance)} VP over 2nd place
          </>
        );
      case "avgWinning":
        if (data.goldenThreshold == null) return null;
        return (
          <>
            {bold("Golden Threshold")} &mdash; winners score{" "}
            {hl(data.goldenThreshold)}+ VP ≥80% of the time
          </>
        );
      case "tribeAverage":
        if (data.spread == null) return null;
        return (
          <>
            {bold("Spread")} &mdash; scores deviate by {hl(data.spread)} VP on
            average
          </>
        );
      case "lowestWinning":
        if (data.efficiency == null) return null;
        return (
          <>
            {bold("Efficiency")} &mdash; won with just{" "}
            {hl(`${data.efficiency}%`)} of total VP
          </>
        );
      case "highestLosing":
        if (data.spoiler == null) return null;
        return (
          <>
            {bold("Spoiler")} &mdash; would have won {hl(data.spoiler)}{" "}
            {data.spoiler === 1 ? "other game" : "other games"}
          </>
        );
      case "lowest":
        if (data.gapped == null) return null;
        return (
          <>
            {bold("Gapped")} &mdash; {hl(data.gapped)} VP below the average low
          </>
        );
    }
  }

  if (!data) {
    return (
      <div className="relative overflow-hidden bg-card rounded-2xl border shadow-sm h-full flex flex-col items-center justify-center p-8 opacity-60">
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r pointer-events-none",
            color.gradient,
          )}
        />
        <p className="relative text-sm text-muted-foreground">No data yet</p>
      </div>
    );
  }

  const metric = renderMetric();

  return (
    <div className="relative overflow-hidden bg-card rounded-2xl border shadow-sm h-full">
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r pointer-events-none",
          color.gradient,
        )}
      />

      <div className="relative p-5 flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
              color.dot,
            )}
          >
            {getScoreIcon(cardKey, "w-3.5 h-3.5")}
          </div>
          <span className="text-base font-black uppercase tracking-wider">
            {label}
          </span>
        </div>

        {/* Score box with metric description */}
        <div
          className={cn(
            "rounded-xl border-2 p-5 flex flex-col items-center gap-2.5 bg-muted/50",
            color.scoreBorder,
            (cardKey === "highest" || cardKey === "lowest") && "min-h-[152px]",
          )}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-7xl font-black tabular-nums leading-none tracking-tighter text-foreground">
              {isAvgCard ? data.value.toFixed(1) : formatVp(data.value)}
            </span>
            <span className="text-2xl font-bold text-muted-foreground">VP</span>
          </div>
          {metric && (
            <p className="text-xs italic text-muted-foreground text-center leading-relaxed">
              {metric}
            </p>
          )}
        </div>

        {/* Player info (for non-avg cards) */}
        {data.player && (
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={data.player.image || ""}
                alt={data.player.firstName}
                className="object-cover"
              />
              <AvatarFallback className="text-xs font-bold">
                {data.player.firstName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {data.player.firstName} {data.player.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{data.player.username}
              </p>
            </div>
          </div>
        )}

        {/* Subtitle for avg cards */}
        {isAvgCard && data.count != null && (
          <p className="text-sm text-muted-foreground">
            {cardKey === "avgWinning"
              ? `averaged over ${data.count} ${data.count === 1 ? "game" : "games"}`
              : `average over ${data.count} ${data.count === 1 ? "player" : "players"}`}
          </p>
        )}

        {/* Additional info for non-avg cards */}
        {!isAvgCard && (
          <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
            {data.datePlayed && (
              <p className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                {format(new Date(data.datePlayed), "MMM d, yyyy")}
              </p>
            )}
            {data.sessionPlayerCount != null && (
              <p className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 shrink-0" />
                {data.sessionPlayerCount}-player game
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
