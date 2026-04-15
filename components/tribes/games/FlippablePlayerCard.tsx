"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { type LeadingPlayer } from "@/types/tribes";
import { accentMap } from "./types";
import { getOrdinalSuffix } from "./utils";

export function FlippablePlayerCard({
  label,
  labelIcon,
  accentColor,
  player,
  statLabel,
  flipped,
  onFlip,
}: {
  label: string;
  labelIcon: ReactNode;
  accentColor: keyof typeof accentMap;
  player: LeadingPlayer | null;
  statLabel: string;
  flipped: boolean;
  onFlip: () => void;
}) {
  const accent = accentMap[accentColor];
  const CARD_HEIGHT = "min-h-[300px]";

  if (!player) {
    return (
      <Card
        className={cn(
          "relative overflow-hidden opacity-60 py-0",
          CARD_HEIGHT,
          accent.border,
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center gap-2 px-3 py-2.5",
            accent.headerBg,
            accent.headerText,
          )}
        >
          {labelIcon}
          <span className="text-sm font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
        <CardContent className="p-5 flex flex-col items-center justify-center flex-1">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className={cn("perspective-[1000px] cursor-pointer", CARD_HEIGHT)}
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFlip()}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{
          duration: 0.5,
          type: "spring",
          stiffness: 260,
          damping: 25,
        }}
        style={{ transformStyle: "preserve-3d" }}
        className={cn("relative h-full", CARD_HEIGHT)}
      >
        {/* ── Front Face ──────────────────────────────────────────────── */}
        <Card
          className={cn(
            "absolute inset-0 overflow-hidden border flex flex-col py-0 gap-0",
            accent.border,
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div
            className={cn(
              "flex items-center justify-between px-4 py-2.5 shrink-0",
              accent.headerBg,
              accent.headerText,
            )}
          >
            <div className="flex items-center gap-2">
              {labelIcon}
              <span className="text-sm font-bold uppercase tracking-wider">
                {label}
              </span>
            </div>
            <RotateCcw className="w-3.5 h-3.5 opacity-70" />
          </div>

          <CardContent
            className={cn(
              "relative p-4 flex flex-col flex-1 gap-3",
              accent.bodyTint,
            )}
          >
            <div className="flex items-center gap-2.5">
              <Avatar className={cn("w-11 h-11 ring-2", accent.ring)}>
                <AvatarImage
                  src={player.image || ""}
                  alt={player.firstName}
                  className="object-cover"
                />
                <AvatarFallback className="text-sm font-bold">
                  {player.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-tight truncate">
                  {player.firstName} {player.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  @{player.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl p-2",
                  accent.statBg,
                )}
              >
                <p
                  className={cn(
                    "text-5xl font-black tabular-nums leading-none tracking-tight",
                    accent.numberText,
                  )}
                >
                  {player.count}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5">
                  {statLabel}
                </p>
              </div>
              <div
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl p-2",
                  accent.statBg,
                )}
              >
                <p
                  className={cn(
                    "text-5xl font-black tabular-nums leading-none tracking-tight",
                    accent.numberText,
                  )}
                >
                  {player.avgVp !== null ? player.avgVp : "—"}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-1.5">
                  Avg VP
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Back Face ───────────────────────────────────────────────── */}
        <Card
          className={cn(
            "absolute inset-0 overflow-hidden border flex flex-col py-0 gap-0",
            accent.border,
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div
            className={cn(
              "flex items-center justify-between px-4 py-2.5 shrink-0",
              accent.headerBg,
              accent.headerText,
            )}
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wider">
                Recent Games
              </span>
            </div>
            <span className="text-[10px] font-semibold opacity-80 truncate max-w-[50%]">
              {player.firstName}
            </span>
          </div>

          <CardContent
            className={cn(
              "relative p-3 flex flex-col flex-1 gap-2",
              accent.bodyTint,
            )}
          >
            {player.recentGames.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4 flex-1 flex items-center justify-center">
                No recent games
              </p>
            ) : (
              player.recentGames.map((game) => (
                <div
                  key={game.sessionId}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-background/80 border flex-1"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex flex-col items-center justify-center shrink-0 leading-none",
                      game.isWinner
                        ? cn(accent.headerBg, accent.headerText)
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span className="text-sm font-black">{game.position}</span>
                    <span className="text-[8px] font-semibold uppercase opacity-80">
                      {getOrdinalSuffix(game.position)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">
                      {format(new Date(game.datePlayed), "MMM d, yyyy")}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {game.isWinner ? "Winner" : "Did not win"}
                    </p>
                  </div>

                  {game.victoryPoints !== null ? (
                    <div className="flex flex-col items-end leading-none shrink-0">
                      <span
                        className={cn(
                          "text-lg font-black tabular-nums",
                          accent.numberText,
                        )}
                      >
                        {game.victoryPoints}
                      </span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground mt-0.5">
                        VP
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
