// Elo engine. Pure: no DB access. The rules and constants are documented in
// docs/ELO.md; terms (Elo, Calibration, Matchup, Rated Session) in CONTEXT.md.

export const START = 0;
export const FLOOR = 100;
export const CALIBRATION_SESSIONS = 5;
export const K_CALIBRATION = 70;
export const K_START = 70;
export const K_MIN = 12;
export const TAU = 30;
export const SCALE = 400;

// How far a player can move, given the Rated Sessions of this game they've
// already played. Flat through the Calibration period, then tapers from
// K_START towards K_MIN.
export const kFactor = (sessionsPlayed: number): number =>
  sessionsPlayed < CALIBRATION_SESSIONS
    ? K_CALIBRATION
    : K_MIN +
      (K_START - K_MIN) *
        Math.exp(-(sessionsPlayed - CALIBRATION_SESSIONS) / TAU);

// Calibrated: past the Calibration period, whatever their Elo
export const isCalibrated = (sessionsPlayed: number): boolean =>
  sessionsPlayed >= CALIBRATION_SESSIONS;

// One player's row in a session (a comp_game_log row)
export interface EloRowInput {
  rowId: number;
  sessionId: string;
  profileId: number;
  position: number;
  teamId: number | null;
  isVp: boolean;
  coop: boolean;
  datePlayed: string;
  createdAt: Date;
}

export interface PlayerEloState {
  elo: number;
  sessionsPlayed: number;
}

export interface EloRowResult {
  rowId: number;
  eloBefore: number | null;
  eloAfter: number | null;
  eloSessionsBefore: number | null;
}

export interface EloReplayResult {
  rows: EloRowResult[];
  players: Map<number, PlayerEloState>;
}

interface Member {
  row: EloRowInput;
  before: PlayerEloState;
}

const mean = (values: number[]): number =>
  values.reduce((sum, v) => sum + v, 0) / values.length;

const expectedScore = (rating: number, opponentRating: number): number =>
  1 / (1 + 10 ** ((opponentRating - rating) / SCALE));

const actualScore = (position: number, opponentPosition: number): number =>
  position < opponentPosition ? 1 : position === opponentPosition ? 0.5 : 0;

// Replay order: (datePlayed, createdAt, sessionId). Plain code-unit
// comparison, not localeCompare, so the DB can reproduce it.
export const compareReplayOrder = (
  a: { datePlayed: string; createdAt: Date; sessionId: string },
  b: { datePlayed: string; createdAt: Date; sessionId: string },
): number => {
  const compare = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
  return (
    compare(a.datePlayed, b.datePlayed) ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    compare(a.sessionId, b.sessionId)
  );
};

// Replays one game's sessions. `start` holds each player's state from before
// the first row; players not in it start at START with no sessions played.
export function replayElo(
  rows: EloRowInput[],
  start: Map<number, PlayerEloState>,
): EloReplayResult {
  const players = new Map(start);
  const results: EloRowResult[] = [];

  // Rows of one session share the whole replay order, so sorting rows also
  // keeps sessions contiguous
  const ordered = [...rows].sort(compareReplayOrder);

  const sessions = new Map<string, EloRowInput[]>();
  for (const r of ordered) {
    const session = sessions.get(r.sessionId) ?? [];
    session.push(r);
    sessions.set(r.sessionId, session);
  }

  for (const sessionRows of sessions.values()) {
    // isVp and coop are session-level, identical on every row
    const rated = sessionRows[0].isVp && !sessionRows[0].coop;

    // A side is a team, or a single player in an individual session
    const sideMap = new Map<string, { position: number; members: Member[] }>();
    for (const r of sessionRows) {
      const key = r.teamId !== null ? `t${r.teamId}` : `p${r.profileId}`;
      const side = sideMap.get(key) ?? { position: r.position, members: [] };
      const before = players.get(r.profileId) ?? {
        elo: START,
        sessionsPlayed: 0,
      };
      side.members.push({ row: r, before });
      sideMap.set(key, side);
    }

    const sides = [...sideMap.values()].map((side) => ({
      ...side,
      elo: mean(side.members.map((m) => m.before.elo)),
    }));

    if (!rated || sides.length < 2) {
      for (const r of sessionRows) {
        results.push({
          rowId: r.rowId,
          eloBefore: null,
          eloAfter: null,
          eloSessionsBefore: null,
        });
      }
      continue;
    }

    for (const side of sides) {
      for (const member of side.members) {
        const { elo, sessionsPlayed } = member.before;
        let matchups = 0;
        for (const other of sides) {
          if (other === side) continue;
          matchups +=
            actualScore(side.position, other.position) -
            expectedScore(side.elo, other.elo);
        }
        const delta = kFactor(sessionsPlayed) * matchups;
        // Below FLOOR Elo can't go down; from FLOOR up it can't drop below it
        const eloAfter = Math.max(elo + delta, Math.min(elo, FLOOR));
        results.push({
          rowId: member.row.rowId,
          eloBefore: member.before.elo,
          eloAfter,
          eloSessionsBefore: member.before.sessionsPlayed,
        });
        players.set(member.row.profileId, {
          elo: eloAfter,
          sessionsPlayed: member.before.sessionsPlayed + 1,
        });
      }
    }
  }

  return { rows: results, players };
}

// What a session card shows for one player's row
export interface EloDisplay {
  delta: number;
  // The player's Elo after this session
  elo: number;
  // Still in Calibration after this session
  calibrating: boolean;
}

export function eloDisplay(row: {
  eloBefore: number | null;
  eloAfter: number | null;
  eloSessionsBefore: number | null;
}): EloDisplay | null {
  const { eloBefore, eloAfter, eloSessionsBefore } = row;
  if (eloBefore === null || eloAfter === null || eloSessionsBefore === null) {
    return null;
  }

  // Rounded separately so the change always matches the numbers shown
  const elo = Math.round(eloAfter);
  return {
    delta: elo - Math.round(eloBefore),
    elo,
    calibrating: !isCalibrated(eloSessionsBefore + 1),
  };
}

// Colour band for an Elo, each 100 wide from 0; purple has no upper limit
export type EloTier =
  "iron" | "bronze" | "silver" | "gold" | "emerald" | "purple";

const ELO_TIERS: EloTier[] = ["iron", "bronze", "silver", "gold", "emerald"];

export const eloTier = (elo: number): EloTier =>
  ELO_TIERS[Math.floor(elo / 100)] ?? "purple";
