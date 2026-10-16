"use client";

import { useMemo, useState } from "react";
import { Crown, Handshake } from "lucide-react";
import type {
  SessionPageData,
  SessionPagePlayer,
} from "@/app/(account)/session/[sessionId]/data";
import { cn } from "@/lib/utils";
import {
  ELO_RACE_LENGTH,
  standingGroups,
  type StandingGroup,
} from "@/utils/sessionPage";
import EloRaceChart, { hoverHandlers, type Highlight } from "./EloRaceChart";
import {
  EloBeforeAfter,
  EloChangePill,
  PlayerIdentity,
  formatWpa,
  playLabel,
} from "./PlayerParts";

// After the position: player, VP, then Elo when rated
const columns = (rated: boolean) =>
  rated
    ? "grid-cols-[minmax(0,1fr)_3.5rem_auto] sm:grid-cols-[minmax(0,1fr)_4.5rem_6.5rem]"
    : "grid-cols-[minmax(0,1fr)_3.5rem] sm:grid-cols-[minmax(0,1fr)_4.5rem]";

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
    {rated && <span />}
  </li>
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
        "grid items-center gap-x-3 px-3 py-3 sm:px-4",
        columns(rated),
        isViewer && "bg-primary/12 dark:bg-primary/18",
        highlighted && !isViewer && "bg-muted/60",
      )}
    >
      <PlayerIdentity
        player={player}
        isViewer={isViewer}
        markers={inTeam ? null : <ResultMarkers group={group} />}
      >
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
          WPA {formatWpa(player.wpa)} · {playLabel(player.playNumber)}
        </p>
      </PlayerIdentity>

      {/* Teammates share the VP shown in their team's header */}
      {inTeam ? <span /> : <Vp value={player.victoryPoints} />}

      {rated && (
        <div className="flex flex-col items-end gap-0.5">
          <EloChangePill player={player} />
          <EloBeforeAfter player={player} />
        </div>
      )}
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
  const [pinnedId, setPinnedId] = useState<number | null>(null);
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
          <div className="flex border-b text-xs font-medium text-muted-foreground">
            <span className="w-11 shrink-0 py-2 text-center sm:w-14">Pos</span>
            <div
              className={cn(
                "grid flex-1 gap-x-3 px-3 py-2 sm:px-4",
                columns(rated),
              )}
            >
              <span>Player</span>
              <span className="text-right">VP</span>
              {rated && <span className="text-right">Elo</span>}
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
          <h2 id="elo-race-heading" className="text-xl font-semibold">
            Elo race
          </h2>
          <p className="text-sm text-muted-foreground">
            Each player&apos;s last {ELO_RACE_LENGTH} Rated Sessions of{" "}
            {data.gameTitle}
          </p>
          <div className="mt-3 rounded-lg border bg-card p-3 sm:p-5">
            <EloRaceChart
              race={data.eloRace}
              players={data.players}
              viewerId={viewerId}
              highlight={highlight}
            />
          </div>
        </section>
      )}
    </>
  );
}
