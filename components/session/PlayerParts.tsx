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
  ELO_TIER_CLASS,
  EloArrow,
} from "@/components/GameSessionCard";
import type { SessionPagePlayer } from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import {
  CALIBRATION_SESSIONS,
  eloDisplay,
  eloTier,
  isCalibrated,
} from "@/utils/elo";
import { formatWpa } from "@/utils/sessionPage";

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
 * Avatar, name, "You" tag and badges, then @username and any `detail` after
 * it. `markers` sit beside the badges (e.g. Winner).
 */
export const PlayerIdentity: React.FC<{
  player: SessionPagePlayer;
  isViewer: boolean;
  markers?: React.ReactNode;
  detail?: React.ReactNode;
}> = ({ player, isViewer, markers, detail }) => (
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
      <p className="truncate text-xs tabular-nums text-muted-foreground">
        @{player.username}
        {detail && <> · {detail}</>}
      </p>
    </div>
  </div>
);

// Elo Change for this session (docs/ELO.md → Display) as text: green up, red
// down, muted when unchanged, as in the tribe's session lists. Asterisked,
// with an explanation, while the player is still in Calibration.
const EloChange: React.FC<{ player: SessionPagePlayer }> = ({ player }) => {
  const display = eloDisplay(player);
  if (!display) return null;

  const { delta, calibrating } = display;
  const change = (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-bold leading-none tabular-nums",
        delta > 0 && "text-emerald-600 dark:text-emerald-400",
        delta < 0 && "text-destructive",
        delta === 0 && "text-muted-foreground",
      )}
    >
      <EloArrow delta={delta} className="size-3" />
      {delta === 0 ? "±0" : Math.abs(delta)}
      {calibrating && <CalibratingMark />}
    </span>
  );
  if (!calibrating) return change;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {change}
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

// The session's WPA, styled as WPA is across the app
export const WpaValue: React.FC<{ wpa: number | null }> = ({ wpa }) => (
  <span
    className={cn(
      "text-base font-bold leading-none tabular-nums",
      wpa === null ? "text-muted-foreground" : "text-accent-4",
    )}
  >
    {formatWpa(wpa)}
  </span>
);

// An Elo in a box of its tier colour, as on the session card, asterisked
// while in Calibration
const TierElo: React.FC<{
  elo: number;
  calibrating: boolean;
  className?: string;
}> = ({ elo, calibrating, className }) => (
  <span
    className={cn(
      "inline-flex items-center px-1.5 py-0.5 text-sm font-bold tabular-nums",
      ELO_TIER_CLASS[eloTier(elo)],
      className,
    )}
  >
    {elo}
    {calibrating && <CalibratingMark />}
  </span>
);

// Wider than an icon arrow, so the Elo Change has room to sit above it
const LongArrow: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    aria-hidden
    viewBox="0 0 56 10"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("h-2.5 w-14 text-muted-foreground", className)}
  >
    <path d="M1 5h53M50 1l4 4-4 4" />
  </svg>
);

// "212 ⟶ 230" in tier boxes, the Elo Change resting on the arrow
export const EloMovement: React.FC<{ player: SessionPagePlayer }> = ({
  player,
}) => {
  const display = eloDisplay(player);
  if (!display || player.eloBefore === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const before = Math.round(player.eloBefore);
  return (
    // From sm the three parts sit in fixed-width tracks, so before boxes,
    // arrows and after boxes line up down the standings. Each box hugs the
    // arrow.
    <div className="inline-flex items-center gap-1.5 sm:grid sm:grid-cols-[3.5rem_auto_3.5rem]">
      <span className="sr-only">
        Elo {before} to {display.elo}
      </span>
      <TierElo
        elo={before}
        calibrating={!isCalibrated(player.eloSessionsBefore ?? 0)}
        className="sm:justify-self-end"
      />
      {/* The change sits just above the line, inside the boxes' height, so it
          adds nothing to the row */}
      <span className="relative flex">
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap">
          <EloChange player={player} />
        </span>
        <LongArrow />
      </span>
      <TierElo
        elo={display.elo}
        calibrating={display.calibrating}
        className="sm:justify-self-start"
      />
    </div>
  );
};
