// Pure helpers for the individual session page. No DB access. Terms (Rated
// Session, Calibration, Elo Change) are defined in CONTEXT.md.

import { compareReplayOrder, isCalibrated } from "@/utils/elo";

export type SessionMode = "rated" | "unrated" | "coop" | "solo";

// Same derivation as GameSessionCard: a single player is solo regardless of
// the coop flag, then coop, then competitive split by whether it's rated
export const sessionMode = (session: {
  numPlayers: number;
  coop: boolean;
  isVp: boolean;
}): SessionMode =>
  session.numPlayers === 1
    ? "solo"
    : session.coop
      ? "coop"
      : session.isVp
        ? "rated"
        : "unrated";

// Where a session sits in a game's history
export interface SessionOrder {
  sessionId: string;
  datePlayed: string;
  createdAt: Date;
}

// One player's row of this game, from any Tribe and any session type
export interface PlayRow extends SessionOrder {
  profileId: number;
}

// Each player's "Nth play" of the game: the sessions of it they had played
// before this one, plus this one
export function playNumbers(
  history: PlayRow[],
  session: SessionOrder,
): Map<number, number> {
  const sessionsByPlayer = new Map<number, Set<string>>();
  for (const row of history) {
    if (compareReplayOrder(row, session) > 0) continue;
    const sessions = sessionsByPlayer.get(row.profileId) ?? new Set();
    sessions.add(row.sessionId);
    sessionsByPlayer.set(row.profileId, sessions);
  }

  return new Map(
    [...sessionsByPlayer].map(([profileId, sessions]) => [
      profileId,
      sessions.size,
    ]),
  );
}

// How many Rated Sessions the Elo race chart shows per player
export const ELO_RACE_LENGTH = 10;

export interface EloHistoryRow extends PlayRow {
  groupId: string;
  // Null when the row's session doesn't affect Elo
  eloAfter: number | null;
  eloSessionsBefore: number | null;
}

export interface EloRacePoint {
  // Sessions before this one: 0 is this session, -1 the one before, ...
  index: number;
  elo: number;
  datePlayed: string;
  // Played in this session's Tribe
  sameTribe: boolean;
  // Still in Calibration after that session, as the asterisk on Elo shows
  calibrating: boolean;
}

// Each player's last ELO_RACE_LENGTH Rated Sessions of the game, ending at
// this one, oldest first. Players whose Elo this session didn't change are
// left out, since their history doesn't reach it.
export function buildEloRace(
  history: EloHistoryRow[],
  session: SessionOrder & { groupId: string },
): Map<number, EloRacePoint[]> {
  const rowsByPlayer = new Map<number, EloHistoryRow[]>();
  for (const row of history) {
    if (row.eloAfter === null || compareReplayOrder(row, session) > 0) continue;
    const rows = rowsByPlayer.get(row.profileId) ?? [];
    rows.push(row);
    rowsByPlayer.set(row.profileId, rows);
  }

  const race = new Map<number, EloRacePoint[]>();
  for (const [profileId, rows] of rowsByPlayer) {
    const last = rows.sort(compareReplayOrder).slice(-ELO_RACE_LENGTH);
    if (last[last.length - 1].sessionId !== session.sessionId) continue;
    race.set(
      profileId,
      last.map((row, i) => ({
        index: i - (last.length - 1),
        elo: Math.round(row.eloAfter!),
        datePlayed: row.datePlayed,
        sameTribe: row.groupId === session.groupId,
        calibrating: !isCalibrated((row.eloSessionsBefore ?? 0) + 1),
      })),
    );
  }
  return race;
}

// One place in the standings: a team, or a single player when the session
// wasn't played in teams
export interface StandingGroup<P> {
  key: string;
  teamId: number | null;
  position: number;
  // Another place shares this position
  tied: boolean;
  members: P[];
}

// Standings in finishing order. Teammates share a position, so a team is one
// place; ties are places that share a position.
export function standingGroups<
  P extends { profileId: number; teamId: number | null; position: number },
>(players: P[]): StandingGroup<P>[] {
  const groups = new Map<string, StandingGroup<P>>();
  for (const player of players) {
    const key =
      player.teamId !== null ? `t${player.teamId}` : `p${player.profileId}`;
    const group = groups.get(key) ?? {
      key,
      teamId: player.teamId,
      position: player.position,
      tied: false,
      members: [],
    };
    group.members.push(player);
    groups.set(key, group);
  }

  // Stable sort keeps the given order within a shared position
  const ordered = [...groups.values()].sort((a, b) => a.position - b.position);
  return ordered.map((group) => ({
    ...group,
    tied: ordered.some((g) => g !== group && g.position === group.position),
  }));
}
