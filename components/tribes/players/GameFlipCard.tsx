"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Dices, ThumbsUp, ThumbsDown, RotateCcw } from "lucide-react";
import { PlayerGameStatDetailed } from "@/utils/playerStatsCalculations";

interface GameFlipCardProps {
  game: PlayerGameStatDetailed | null;
  variant: "best" | "worst";
}

const formatLastPlayed = (dateStr: string | null): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const StatRow: React.FC<{ label: string; value: string | number }> = ({
  label,
  value,
}) => (
  <div className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
    <span className="text-xs text-muted-foreground">{label}</span>
    <span className="text-xs font-semibold tabular-nums">{value}</span>
  </div>
);

const GameFlipCard: React.FC<GameFlipCardProps> = ({ game, variant }) => {
  const [flipped, setFlipped] = useState(false);

  const isBest = variant === "best";
  const accentClass = isBest ? "bg-emerald-500/80" : "bg-rose-500/80";
  const label = isBest ? "Best Game" : "Worst Game";
  const EmptyIcon = isBest ? ThumbsUp : ThumbsDown;
  const emptyIconClass = isBest ? "text-emerald-400" : "text-rose-400";

  if (!game) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <EmptyIcon className={cn("w-8 h-8 opacity-40", emptyIconClass)} />
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] opacity-60">Not enough data</p>
      </div>
    );
  }

  return (
    <div
      className="relative cursor-pointer select-none h-52"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      aria-label={`${label}: ${game.gameTitle} — tap to see detailed stats`}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front: image + win rate ───────────────────────── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Background image */}
          {game.gameImageUrl ? (
            <Image
              src={game.gameImageUrl}
              alt={game.gameTitle}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 300px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <Dices className="w-12 h-12 text-white/20" />
            </div>
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          {/* Best/Worst badge */}
          <div className="absolute top-0 left-0 right-0">
            <div
              className={cn(
                "w-full py-1.5 flex items-center justify-center gap-1.5 text-white",
                accentClass,
              )}
            >
              {isBest ? (
                <ThumbsUp className="w-3 h-3" />
              ) : (
                <ThumbsDown className="w-3 h-3" />
              )}
              <span className="text-[11px] font-black uppercase tracking-widest">
                {label}
              </span>
            </div>
          </div>

          {/* Win rate — centered */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-black text-white leading-none">
              {game.winRate}
              <span className="text-xl font-bold text-white/70">%</span>
            </p>
            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">
              win rate
            </p>
          </div>

          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-semibold text-xs truncate leading-snug">
              {game.gameTitle}
            </p>
          </div>

          {/* Flip hint */}
          {!flipped && (
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-0.5 text-white/30">
              <RotateCcw className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* ── Back: detailed stats ──────────────────────────── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-card border"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="p-3 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
              {game.gameImageUrl ? (
                <Image
                  src={game.gameImageUrl}
                  alt={game.gameTitle}
                  width={32}
                  height={32}
                  className="rounded object-cover w-8 h-8 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Dices className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <p className="text-xs font-semibold truncate leading-tight">
                {game.gameTitle}
              </p>
            </div>

            {/* Stats list */}
            <div className="flex-1">
              <StatRow label="Plays" value={game.timesPlayed} />
              <StatRow label="Win Rate" value={`${game.winRate}%`} />
              <StatRow label="BGA Rate" value={`${game.bgaWinRate}%`} />
              <StatRow
                label="Game WPA"
                value={game.gameWpa !== null ? game.gameWpa.toFixed(2) : "—"}
              />
              <StatRow
                label="Last Played"
                value={formatLastPlayed(game.lastPlayed)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameFlipCard;
