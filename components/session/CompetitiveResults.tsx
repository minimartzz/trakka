"use client";

import { useMemo, useState } from "react";
import { Crown, Gauge, Handshake, Info, Swords } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import type {
  SessionPageData,
  SessionPagePlayer,
} from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import { CALIBRATION_SESSIONS } from "@/utils/elo";
import {
  ELO_RACE_LENGTH,
  playLabel,
  standingGroups,
  type StandingGroup,
} from "@/utils/sessionPage";
import EloRaceChart, { hoverHandlers, type Highlight } from "./EloRaceChart";
import { EloMovement, PlayerIdentity, WpaValue } from "./PlayerParts";

// Phones only have room for each player's last few sessions
const MOBILE_RACE_LENGTH = 5;

// After the position: player and VP, then WPA and Elo (rated only). Phones
// keep the first two as columns and put WPA and Elo on a line underneath.
const columns = (rated: boolean) =>
  cn(
    "grid-cols-[minmax(0,1fr)_auto]",
    rated
      ? "sm:grid-cols-[minmax(0,1fr)_4rem_4.5rem_11.5rem]"
      : "sm:grid-cols-[minmax(0,1fr)_4rem_4.5rem]",
  );

// As on the session card: a tie for first shows both
const ResultMarkers: React.FC<{ group: StandingGroup<SessionPagePlayer> }> = ({
  group,
}) => (
  <>
    {group.members[0].isWinner && (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-1/25 px-1.5 py-0.5 text-xs font-semibold text-[oklch(40%_0.09_156)] dark:text-accent-1">
        <Crown className="size-3" />
        Winner
      </span>
    )}
    {group.tied && (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-2/25 px-1.5 py-0.5 text-xs font-semibold text-[oklch(45%_0.08_203)] dark:text-accent-2">
        <Handshake className="size-3" />
        Tied
      </span>
    )}
  </>
);

const Vp: React.FC<{ value: number | null }> = ({ value }) => (
  <span className="font-display text-right text-3xl font-bold leading-none tabular-nums">
    {value ?? "—"}
  </span>
);

// A team's shared place and VP, above its players
const TeamHeader: React.FC<{
  group: StandingGroup<SessionPagePlayer>;
  rated: boolean;
}> = ({ group, rated }) => (
  <li
    className={cn(
      "grid items-center gap-x-3 bg-muted/40 px-3 py-2 sm:px-4",
      columns(rated),
    )}
  >
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-sm font-semibold">Team {group.teamId}</span>
      <ResultMarkers group={group} />
    </div>
    <Vp value={group.members[0].victoryPoints} />
    {/* Empty WPA and Elo columns */}
    <span className="hidden sm:block" />
    {rated && <span className="hidden sm:block" />}
  </li>
);

// A WPA or Elo cell. On phones its label and value join the strip's grid, so
// labels share a row and values share the next; wider screens use the header.
const Stat: React.FC<{
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ label, icon: Icon, children }) => (
  <div className="contents sm:flex sm:flex-col sm:items-end">
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
      <Icon className="size-3.5" />
      {label}
    </span>
    {children}
  </div>
);

const PlayerRow: React.FC<{
  player: SessionPagePlayer;
  group: StandingGroup<SessionPagePlayer>;
  inTeam: boolean;
  rated: boolean;
  isViewer: boolean;
  highlighted: boolean;
  highlight: Highlight;
}> = ({ player, group, inTeam, rated, isViewer, highlighted, highlight }) => {
  // Hovering or tapping a row points at the player's line in the Elo race
  const linkToChart = rated
    ? {
        ...hoverHandlers(highlight, player.profileId),
        onClick: () => highlight.togglePin(player.profileId),
      }
    : {};

  return (
    <li
      {...linkToChart}
      className={cn(
        "grid items-center gap-x-3 gap-y-3 px-3 py-3 sm:gap-x-4 sm:px-4",
        columns(rated),
        isViewer && "bg-primary/12 dark:bg-primary/18",
        highlighted && !isViewer && "bg-muted/60",
      )}
    >
      <PlayerIdentity
        player={player}
        isViewer={isViewer}
        markers={inTeam ? null : <ResultMarkers group={group} />}
        detail={playLabel(player.playNumber)}
      />

      {/* Teammates share the VP shown in their team's header */}
      {inTeam ? <span /> : <Vp value={player.victoryPoints} />}

      {/* Phones: labels then values under the name, lined up past the
          avatar. Wider screens dissolve the wrapper so these become columns. */}
      <div className="col-span-2 grid auto-cols-max grid-flow-col grid-rows-[auto_auto] items-center justify-start gap-x-5 gap-y-2 pl-13 sm:contents">
        <Stat label="WPA" icon={Swords}>
          <WpaValue wpa={player.wpa} />
        </Stat>
        {rated && (
          <Stat label="Elo" icon={Gauge}>
            <EloMovement player={player} />
          </Stat>
        )}
      </div>
    </li>
  );
};

/**
 * Standings for a competitive session, plus the Elo race when this session
 * moved anyone's Elo. Hovering a player, or tapping them, highlights their
 * line in the chart.
 */
export default function CompetitiveResults({
  data,
  viewerId,
}: {
  data: SessionPageData;
  viewerId: number;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  // The viewer's own line starts out pinned, when they have one
  const [pinnedId, setPinnedId] = useState<number | null>(() =>
    data.eloRace?.[viewerId] ? viewerId : null,
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const raceLength = useIsMobile() ? MOBILE_RACE_LENGTH : ELO_RACE_LENGTH;
  const highlight: Highlight = {
    id: hoveredId ?? pinnedId,
    hover: setHoveredId,
    togglePin: (id) => setPinnedId((pinned) => (pinned === id ? null : id)),
  };

  const rated = data.mode === "rated";
  const groups = useMemo(() => standingGroups(data.players), [data.players]);

  return (
    <>
      <section aria-labelledby="standings-heading">
        <h2 id="standings-heading" className="text-xl font-semibold">
          Standings
        </h2>
        <div className="mt-3 overflow-hidden rounded-lg border bg-card">
          {/* Column labels; phones label each player's stats inline */}
          <div className="hidden border-b text-xs font-medium text-muted-foreground sm:flex">
            <span className="w-14 shrink-0 py-2 text-center">Pos</span>
            <div
              className={cn("grid flex-1 gap-x-4 px-4 py-2", columns(rated))}
            >
              <span>Player</span>
              <span className="text-right">VP</span>
              <span className="inline-flex items-center justify-end gap-1">
                <Swords className="size-3.5" />
                WPA
              </span>
              {rated && (
                <span className="inline-flex items-center justify-end gap-1">
                  <Gauge className="size-3.5" />
                  Elo
                </span>
              )}
            </div>
          </div>

          <ol className="divide-y">
            {groups.map((group) => {
              const inTeam = group.teamId !== null;
              return (
                <li key={group.key} className="flex items-stretch">
                  {/* Shared position, centred across a team */}
                  <div className="flex w-11 shrink-0 items-center justify-center border-r sm:w-14">
                    <span
                      className={cn(
                        "font-display text-2xl font-bold tabular-nums",
                        group.members[0].isWinner
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {group.position}
                    </span>
                  </div>
                  <ul className="min-w-0 flex-1 divide-y divide-border/60">
                    {inTeam && <TeamHeader group={group} rated={rated} />}
                    {group.members.map((player) => (
                      <PlayerRow
                        key={player.profileId}
                        player={player}
                        group={group}
                        inTeam={inTeam}
                        rated={rated}
                        isViewer={player.profileId === viewerId}
                        highlighted={player.profileId === highlight.id}
                        highlight={highlight}
                      />
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {data.eloRace && (
        <section aria-labelledby="elo-race-heading">
          <div className="flex items-center gap-1">
            <h2 id="elo-race-heading" className="text-xl font-semibold">
              ELO race
            </h2>
            {/* Opens on tap as well as hover, for phones */}
            <Tooltip open={aboutOpen} onOpenChange={setAboutOpen}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAboutOpen((open) => !open)}
                  aria-label="About hollow points"
                  className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-7"
                >
                  <Info className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-64">
                Hollow points are still in Calibration: the player hadn&apos;t
                yet finished {CALIBRATION_SESSIONS} Rated Sessions of the game.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-sm text-muted-foreground">
            Each player&apos;s last {raceLength} Rated Sessions of{" "}
            {data.gameTitle}
          </p>
          <div className="mt-3 rounded-lg border bg-card p-3 sm:p-5">
            <EloRaceChart
              race={data.eloRace}
              players={data.players}
              viewerId={viewerId}
              highlight={highlight}
              sessions={raceLength}
            />
          </div>
        </section>
      )}
    </>
  );
}
