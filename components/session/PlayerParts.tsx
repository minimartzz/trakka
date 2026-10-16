"use client";

import Image from "next/image";
import { Ghost, Sparkles, Trophy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CalibratingMark,
  EloArrow,
  eloTrendClass,
} from "@/components/GameSessionCard";
import type { SessionPagePlayer } from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import { CALIBRATION_SESSIONS, eloDisplay } from "@/utils/elo";

const PlayerAvatar: React.FC<{ player: SessionPagePlayer }> = ({ player }) => (
  <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
    {player.profilePic ? (
      <Image
        src={player.profilePic}
        alt=""
        fill
        sizes="40px"
        className="object-cover"
      />
    ) : (
      <span className="flex size-full items-center justify-center text-sm font-semibold text-muted-foreground">
        {player.firstName.charAt(0).toUpperCase()}
      </span>
    )}
  </div>
);

// Neutral pills: these mark facts about the play, not outcomes, so they stay
// out of the outcome colours. The icon and label carry the meaning.
const BADGE =
  "inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/6 px-1.5 py-0.5 text-xs font-semibold text-foreground";

const PlayerBadges: React.FC<{ player: SessionPagePlayer }> = ({ player }) => (
  <>
    {player.isAnonymous && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Ghost
            aria-label="Anonymous player"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </TooltipTrigger>
        <TooltipContent>Anonymous player</TooltipContent>
      </Tooltip>
    )}
    {player.isFirstPlay && (
      <span className={BADGE}>
        <Sparkles className="size-3" />
        First play
      </span>
    )}
    {player.isHighScore && (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={BADGE}>
            <Trophy className="size-3" />
            High score
          </span>
        </TooltipTrigger>
        <TooltipContent>Highest VP for this game</TooltipContent>
      </Tooltip>
    )}
  </>
);

/**
 * Avatar, name, "You" tag and badges, then @username and whatever line the
 * caller adds underneath. `markers` sit beside the badges (e.g. Winner).
 */
export const PlayerIdentity: React.FC<{
  player: SessionPagePlayer;
  isViewer: boolean;
  markers?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ player, isViewer, markers, children }) => (
  <div className="flex min-w-0 items-center gap-3">
    <PlayerAvatar player={player} />
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        <span
          className={cn("truncate font-semibold", isViewer && "text-primary")}
        >
          {player.firstName} {player.lastName}
        </span>
        {isViewer && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
            You
          </span>
        )}
        {markers}
        <PlayerBadges player={player} />
      </div>
      <p className="truncate text-xs text-muted-foreground">
        @{player.username}
      </p>
      {children}
    </div>
  </div>
);

// Elo Change for this session (docs/ELO.md → Display), asterisked while the
// player is still in Calibration
export const EloChangePill: React.FC<{
  player: SessionPagePlayer;
  className?: string;
}> = ({ player, className }) => {
  const display = eloDisplay(player);
  if (!display) return <span className="text-muted-foreground">—</span>;

  const { delta, calibrating } = display;
  const pill = (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 text-sm font-bold tabular-nums",
        eloTrendClass(delta),
        className,
      )}
    >
      <EloArrow delta={delta} className="size-3.5" />
      {delta === 0 ? "±0" : Math.abs(delta)}
      {calibrating && <CalibratingMark />}
    </span>
  );
  if (!calibrating) return pill;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {pill}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-60">
        Calibrating: {player.firstName} hasn&apos;t finished their first{" "}
        {CALIBRATION_SESSIONS} Rated Sessions of this game, where Elo moves
        fastest. Below 100, Elo can&apos;t drop.
      </TooltipContent>
    </Tooltip>
  );
};

// "212 → 230", the Elo either side of this session
export const EloBeforeAfter: React.FC<{ player: SessionPagePlayer }> = ({
  player,
}) => {
  const display = eloDisplay(player);
  if (!display || player.eloBefore === null) return null;
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {Math.round(player.eloBefore)} → {display.elo}
      {display.calibrating && <CalibratingMark />}
    </span>
  );
};
