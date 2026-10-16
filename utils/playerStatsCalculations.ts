import {
  type GameSession,
  type MemberElo,
  type TribeMember,
} from "@/types/tribes";
import { SelectRollingPlayerStats } from "@/db/schema/rollingPlayerStats";
import { SelectHistDailyPlayerStats } from "@/db/schema/histDailyPlayerStats";
import { isCalibrated } from "@/utils/elo";

// ── Badge Types ──────────────────────────────────────────────────────

export type BadgeType =
  | "champ"
  | "brainiac"
  | "underdog"
  | "marathoner"
  | "elo_king"
  | "extrovert";

export interface BadgeInfo {
  type: BadgeType;
  label: string;
  description: string;
  value: string;
  image: string;
}

const BADGE_META: Record<
  BadgeType,
  { label: string; description: string; image: string }
> = {
  champ: {
    label: "Champ",
    description: "Highest win rate in the tribe",
    image: "/badges/champ.png",
  },
  brainiac: {
    label: "Brainiac",
    description: "Plays the most complex games",
    image: "/badges/brainiac.png",
  },
  underdog: {
    label: "Underdog",
    description: "Most upsets caused against higher-rated players",
    image: "/badges/underdog.png",
  },
  marathoner: {
    label: "Marathoner",
    description: "Plays the longest games",
    image: "/badges/marathoner.png",
  },
  elo_king: {
    label: "Elo King",
    description: "Highest Elo in any game",
    image: "/badges/elo_king.png",
  },
  extrovert: {
    label: "Extrovert",
    description: "Has played with the most tribe members",
    image: "/badges/extrovert.png",
  },
};

const MIN_GAMES_FOR_BADGE = 4;

// ── Badge Calculations ───────────────────────────────────────────────

export function calculateBadges(
  sessions: GameSession[],
  members: TribeMember[],
  memberElos: MemberElo[],
): Map<number, BadgeInfo[]> {
  const badgeMap = new Map<number, BadgeInfo[]>();

  const eligible = members.filter((m) => m.gamesPlayed >= MIN_GAMES_FOR_BADGE);
  if (eligible.length === 0) return badgeMap;

  const addBadge = (profileId: number, type: BadgeType, value: string) => {
    const existing = badgeMap.get(profileId) || [];
    existing.push({ type, value, ...BADGE_META[type] });
    badgeMap.set(profileId, existing);
  };

  // 1. Champ: Highest win rate
  const champ = [...eligible].sort((a, b) => b.winRate - a.winRate)[0];
  if (champ) addBadge(champ.profileId, "champ", `${champ.winRate}% win rate`);

  // 2. Brainiac: Highest avg game weight
  const avgWeights = calculateAvgGameWeight(sessions, eligible);
  const brainiac = avgWeights[0];
  if (brainiac)
    addBadge(
      brainiac.profileId,
      "brainiac",
      `${brainiac.value.toFixed(1)} avg weight`,
    );

  // 3. Underdog: Most upsets
  const upsets = calculateUpsets(sessions, eligible);
  const underdog = upsets[0];
  if (underdog)
    addBadge(underdog.profileId, "underdog", `${underdog.value} upsets`);

  // 4. Marathoner: Highest avg playing time
  const avgTimes = calculateAvgPlayingTime(sessions, eligible);
  const marathoner = avgTimes[0];
  if (marathoner)
    addBadge(
      marathoner.profileId,
      "marathoner",
      `${Math.round(marathoner.value)} min avg`,
    );

  // 5. Elo King: Highest Calibrated Elo in any single game
  const eligibleIds = new Set(eligible.map((m) => m.profileId));
  const eloKing = memberElos
    .filter(
      (e) =>
        eligibleIds.has(e.profileId) && isCalibrated(e.sessionsPlayed),
    )
    .sort((a, b) => b.elo - a.elo || b.sessionsPlayed - a.sessionsPlayed)[0];
  if (eloKing) addBadge(eloKing.profileId, "elo_king", "");

  // 6. Extrovert: Most unique co-players
  const coPlayers = calculateUniqueCoPlayers(sessions, eligible);
  const extrovert = coPlayers[0];
  if (extrovert)
    addBadge(extrovert.profileId, "extrovert", `${extrovert.value} co-players`);

  return badgeMap;
}

function calculateAvgGameWeight(
  sessions: GameSession[],
  eligible: TribeMember[],
): { profileId: number; value: number }[] {
  const playerWeights: Record<number, { total: number; count: number }> = {};

  sessions.forEach((session) => {
    if (session.gameWeight === null) return;
    session.players.forEach((p) => {
      if (!playerWeights[p.profileId])
        playerWeights[p.profileId] = { total: 0, count: 0 };
      playerWeights[p.profileId].total += session.gameWeight!;
      playerWeights[p.profileId].count++;
    });
  });

  const eligibleIds = new Set(eligible.map((m) => m.profileId));
  return Object.entries(playerWeights)
    .filter(([id]) => eligibleIds.has(Number(id)))
    .map(([id, data]) => ({
      profileId: Number(id),
      value: data.total / data.count,
    }))
    .sort((a, b) => b.value - a.value);
}

function calculateUpsets(
  sessions: GameSession[],
  eligible: TribeMember[],
): { profileId: number; value: number }[] {
  // Elo going into the session, only for players who were Calibrated then
  const calibratedElo = (player: GameSession["players"][number]) =>
    player.eloBefore !== null &&
    player.eloSessionsBefore !== null &&
    isCalibrated(player.eloSessionsBefore)
      ? player.eloBefore
      : null;

  const upsetCounts: Record<number, number> = {};
  const eligibleIds = new Set(eligible.map((m) => m.profileId));

  sessions.forEach((session) => {
    const winners = session.players.filter((p) => p.isWinner);
    const losers = session.players.filter((p) => !p.isWinner);

    winners.forEach((winner) => {
      const winnerElo = calibratedElo(winner);
      if (winnerElo === null) return;
      const causedUpset = losers.some((loser) => {
        const loserElo = calibratedElo(loser);
        return loserElo !== null && winnerElo < loserElo;
      });
      if (causedUpset) {
        upsetCounts[winner.profileId] =
          (upsetCounts[winner.profileId] || 0) + 1;
      }
    });
  });

  return Object.entries(upsetCounts)
    .filter(([id]) => eligibleIds.has(Number(id)))
    .map(([id, count]) => ({ profileId: Number(id), value: count }))
    .sort((a, b) => b.value - a.value);
}

function calculateAvgPlayingTime(
  sessions: GameSession[],
  eligible: TribeMember[],
): { profileId: number; value: number }[] {
  const playerTimes: Record<number, { total: number; count: number }> = {};

  sessions.forEach((session) => {
    if (session.playingTime === null) return;
    session.players.forEach((p) => {
      if (!playerTimes[p.profileId])
        playerTimes[p.profileId] = { total: 0, count: 0 };
      playerTimes[p.profileId].total += session.playingTime!;
      playerTimes[p.profileId].count++;
    });
  });

  const eligibleIds = new Set(eligible.map((m) => m.profileId));
  return Object.entries(playerTimes)
    .filter(([id]) => eligibleIds.has(Number(id)))
    .map(([id, data]) => ({
      profileId: Number(id),
      value: data.total / data.count,
    }))
    .sort((a, b) => b.value - a.value);
}

function calculateUniqueCoPlayers(
  sessions: GameSession[],
  eligible: TribeMember[],
): { profileId: number; value: number }[] {
  const coPlayerSets: Record<number, Set<number>> = {};

  sessions.forEach((session) => {
    const playerIds = session.players.map((p) => p.profileId);
    playerIds.forEach((id) => {
      if (!coPlayerSets[id]) coPlayerSets[id] = new Set();
      playerIds.forEach((otherId) => {
        if (otherId !== id) coPlayerSets[id].add(otherId);
      });
    });
  });

  const eligibleIds = new Set(eligible.map((m) => m.profileId));
  return Object.entries(coPlayerSets)
    .filter(([id]) => eligibleIds.has(Number(id)))
    .map(([id, set]) => ({ profileId: Number(id), value: set.size }))
    .sort((a, b) => b.value - a.value);
}

// ── Individual Player Stat Calculations ──────────────────────────────

// A player's competitive stats in one game (used by individual player view)
export interface PlayerGameStat {
  gameId: number;
  gameTitle: string;
  gameImageUrl: string | null;
  timesPlayed: number;
  wins: number;
  winRate: number;
  bgaWinRate: number; // BGA formula: sum(isWinner ? numPlayers : 0) / (played * 2) * 100
  gameWpa: number | null; // avg score over Rated Sessions (null if none)
  lastPlayed: string | null; // YYYY-MM-DD of most recent session
}

export function calculatePlayerGameStatsDetailed(
  sessions: GameSession[],
  profileId: number,
): {
  allGames: PlayerGameStat[];
  bestGame: PlayerGameStat | null;
  worstGame: PlayerGameStat | null;
} {
  const gameMap: Record<
    number,
    {
      title: string;
      imageUrl: string | null;
      played: number;
      wins: number;
      bgaNumerator: number;
      wpaSum: number;
      wpaCount: number;
      lastPlayed: string | null;
    }
  > = {};

  sessions.forEach((session) => {
    // Competitive only: co-op and solo results aren't wins over other players
    if (session.coop || session.players.length < 2) return;
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    if (!gameMap[session.gameId]) {
      gameMap[session.gameId] = {
        title: session.gameTitle,
        imageUrl: session.gameImageUrl,
        played: 0,
        wins: 0,
        bgaNumerator: 0,
        wpaSum: 0,
        wpaCount: 0,
        lastPlayed: null,
      };
    }

    const g = gameMap[session.gameId];
    g.played++;
    if (player.isWinner) {
      g.wins++;
      g.bgaNumerator += session.players.length;
    }
    // WPA only counts Rated Sessions, as in rolling_player_stats
    if (session.isVp && player.score !== null) {
      g.wpaSum += player.score;
      g.wpaCount++;
    }
    if (!g.lastPlayed || session.datePlayed > g.lastPlayed) {
      g.lastPlayed = session.datePlayed;
    }
  });

  const allGames: PlayerGameStat[] = Object.entries(gameMap)
    .map(([id, data]) => ({
      gameId: Number(id),
      gameTitle: data.title,
      gameImageUrl: data.imageUrl,
      timesPlayed: data.played,
      wins: data.wins,
      winRate:
        data.played > 0 ? Math.round((data.wins / data.played) * 100) : 0,
      bgaWinRate:
        data.played > 0
          ? Math.round((data.bgaNumerator / (data.played * 2)) * 100)
          : 0,
      gameWpa: data.wpaCount > 0 ? data.wpaSum / data.wpaCount : null,
      lastPlayed: data.lastPlayed,
    }))
    .sort((a, b) => b.timesPlayed - a.timesPlayed);

  // Ranked by win rate weighted by plays; ties go to the most played game
  const eligible = allGames.filter((g) => g.timesPlayed >= MIN_RANKED_PLAYS);
  const losses = (g: PlayerGameStat) => g.timesPlayed - g.wins;

  const bestGame =
    eligible
      .filter((g) => g.wins > 0)
      .sort(
        (a, b) =>
          wilsonLowerBound(b.wins, b.timesPlayed) -
          wilsonLowerBound(a.wins, a.timesPlayed),
      )[0] ?? null;

  const worstGame =
    eligible
      .filter((g) => losses(g) > 0 && g.gameId !== bestGame?.gameId)
      .sort(
        (a, b) =>
          wilsonLowerBound(losses(b), b.timesPlayed) -
          wilsonLowerBound(losses(a), a.timesPlayed),
      )[0] ?? null;

  return { allGames, bestGame, worstGame };
}

// Fewest plays of a game before it can be the best or worst game
const MIN_RANKED_PLAYS = 3;

// Lower bound of the 95% Wilson score interval: a rate discounted for a small
// sample, so 19 wins in 20 plays ranks above 3 in 3
export const wilsonLowerBound = (successes: number, trials: number): number => {
  const z = 1.96;
  const p = successes / trials;
  const z2n = (z * z) / trials;
  return (
    (p + z2n / 2 - z * Math.sqrt((p * (1 - p) + z2n / 4) / trials)) / (1 + z2n)
  );
};

export interface WeightBreakdown {
  label: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export function calculateWinsByWeight(
  sessions: GameSession[],
  profileId: number,
): WeightBreakdown[] {
  const bins: Record<string, { wins: number; losses: number }> = {
    Light: { wins: 0, losses: 0 },
    Medium: { wins: 0, losses: 0 },
    Heavy: { wins: 0, losses: 0 },
  };

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    const weight = session.gameWeight;
    let bin: string;
    if (weight === null || (weight >= 2.5 && weight <= 3.5)) bin = "Medium";
    else if (weight < 2.5) bin = "Light";
    else bin = "Heavy";

    if (player.isWinner) bins[bin].wins++;
    else bins[bin].losses++;
  });

  return Object.entries(bins).map(([label, data]) => ({
    label,
    wins: data.wins,
    losses: data.losses,
    total: data.wins + data.losses,
    winRate:
      data.wins + data.losses > 0
        ? Math.round((data.wins / (data.wins + data.losses)) * 100)
        : 0,
  }));
}

export interface PlayerCountBreakdown {
  label: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export function calculateWinsByPlayerCount(
  sessions: GameSession[],
  profileId: number,
): PlayerCountBreakdown[] {
  const bins: Record<string, { wins: number; losses: number }> = {
    "2p": { wins: 0, losses: 0 },
    "3p": { wins: 0, losses: 0 },
    "4p": { wins: 0, losses: 0 },
    "5p+": { wins: 0, losses: 0 },
  };

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    const count = session.players.length;
    let bin: string;
    if (count <= 2) bin = "2p";
    else if (count === 3) bin = "3p";
    else if (count === 4) bin = "4p";
    else bin = "5p+";

    if (player.isWinner) bins[bin].wins++;
    else bins[bin].losses++;
  });

  return Object.entries(bins).map(([label, data]) => ({
    label,
    wins: data.wins,
    losses: data.losses,
    total: data.wins + data.losses,
    winRate:
      data.wins + data.losses > 0
        ? Math.round((data.wins / (data.wins + data.losses)) * 100)
        : 0,
  }));
}

// ── Comparative Stats ────────────────────────────────────────────────

// The player's record with one other player
export interface ComparativeStat {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  // Sessions of any type played together
  sessionsTogether: number;
  // Head-to-heads: competitive sessions where the player finished ahead of
  // them (a win) or behind them (a loss). A shared position, a draw or
  // teammates, counts as neither.
  wins: number;
  losses: number;
  // The most recent head-to-heads, newest first
  recent: {
    sessionId: string;
    datePlayed: string;
    position: number;
    theirPosition: number;
  }[];
}

const MIN_GAMES_COMPARATIVE = 3;
const RECENT_HEAD_TO_HEADS = 3;

export function calculateComparativeStats(
  sessions: GameSession[],
  profileId: number,
): {
  nemesis: ComparativeStat | null;
  dominating: ComparativeStat | null;
  bestBuddy: ComparativeStat | null;
} {
  const newestFirst = [...sessions].sort(
    (a, b) =>
      b.datePlayed.localeCompare(a.datePlayed) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Insertion order follows the most recent session together
  const records = new Map<number, ComparativeStat>();
  for (const session of newestFirst) {
    const me = session.players.find((p) => p.profileId === profileId);
    if (!me) continue;
    const competitive = !session.coop && session.players.length > 1;

    for (const other of session.players) {
      if (other.profileId === profileId) continue;

      let record = records.get(other.profileId);
      if (!record) {
        record = {
          profileId: other.profileId,
          username: other.username,
          firstName: other.firstName,
          lastName: other.lastName,
          image: other.image,
          sessionsTogether: 0,
          wins: 0,
          losses: 0,
          recent: [],
        };
        records.set(other.profileId, record);
      }
      record.sessionsTogether++;

      if (!competitive || me.position === other.position) continue;
      if (me.position < other.position) record.wins++;
      else record.losses++;
      if (record.recent.length < RECENT_HEAD_TO_HEADS) {
        record.recent.push({
          sessionId: session.sessionId,
          datePlayed: session.datePlayed,
          position: me.position,
          theirPosition: other.position,
        });
      }
    }
  }

  const all = [...records.values()];
  const headToHeads = (r: ComparativeStat) => r.wins + r.losses;
  // Most head-to-heads first, so ranking ties go to the bigger record
  const rivals = all
    .filter((r) => headToHeads(r) >= MIN_GAMES_COMPARATIVE)
    .sort((a, b) => headToHeads(b) - headToHeads(a));

  // Nemesis: the worst record against them, weighted by games
  const nemesis =
    rivals
      .filter((r) => r.losses > 0)
      .sort(
        (a, b) =>
          wilsonLowerBound(b.losses, headToHeads(b)) -
          wilsonLowerBound(a.losses, headToHeads(a)),
      )[0] ?? null;

  // Dominating: the best record against them, never also the Nemesis
  const dominating =
    rivals
      .filter((r) => r.wins > 0 && r !== nemesis)
      .sort(
        (a, b) =>
          wilsonLowerBound(b.wins, headToHeads(b)) -
          wilsonLowerBound(a.wins, headToHeads(a)),
      )[0] ?? null;

  // Best buddy: the most sessions of any type together; ties go to whoever
  // they played with most recently
  const bestBuddy =
    all
      .filter((r) => r.sessionsTogether >= MIN_GAMES_COMPARATIVE)
      .sort((a, b) => b.sessionsTogether - a.sessionsTogether)[0] ?? null;

  return { nemesis, dominating, bestBuddy };
}

// ── Time-Based Metrics ───────────────────────────────────────────────

export interface MonthlyWinRate {
  month: string;
  winRate: number;
  gamesPlayed: number;
  wins: number;
}

export function calculateWinRateOverTime(
  sessions: GameSession[],
  profileId: number,
): MonthlyWinRate[] {
  const monthMap: Record<string, { wins: number; played: number }> = {};

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    const date = new Date(session.datePlayed);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthMap[key]) monthMap[key] = { wins: 0, played: 0 };
    monthMap[key].played++;
    if (player.isWinner) monthMap[key].wins++;
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      winRate: Math.round((data.wins / data.played) * 100),
      gamesPlayed: data.played,
      wins: data.wins,
    }));
}

// ── Daily Win Rate ────────────────────────────────────────────────────

export interface DailyWinRate {
  date: string; // YYYY-MM-DD
  winRate: number; // cumulative win rate up to this date
  wins: number; // cumulative wins
  gamesPlayed: number; // cumulative games
}

export function calculateWinRateDaily(
  sessions: GameSession[],
  profileId: number,
): DailyWinRate[] {
  // Gather sessions for this player grouped by date
  const dayMap = new Map<string, { wins: number; games: number }>();

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;
    const dateKey = session.datePlayed.split("T")[0];
    const existing = dayMap.get(dateKey) ?? { wins: 0, games: 0 };
    dayMap.set(dateKey, {
      wins: existing.wins + (player.isWinner ? 1 : 0),
      games: existing.games + 1,
    });
  });

  let cumulativeWins = 0;
  let cumulativeGames = 0;

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayData]) => {
      cumulativeWins += dayData.wins;
      cumulativeGames += dayData.games;
      return {
        date,
        winRate: Math.round((cumulativeWins / cumulativeGames) * 100),
        wins: cumulativeWins,
        gamesPlayed: cumulativeGames,
      };
    });
}

// ── Heatmap ───────────────────────────────────────────────────────────

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
}

export function calculateHeatmapData(
  sessions: GameSession[],
  profileId: number,
): HeatmapDay[] {
  const dayMap: Record<string, number> = {};

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    const date = new Date(session.datePlayed);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    dayMap[key] = (dayMap[key] || 0) + 1;
  });

  return Object.entries(dayMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Banner & Stat Card Helpers ────────────────────────────────────────

export function getPlayerFirstGameDate(
  sessions: GameSession[],
  profileId: number,
): string | null {
  const dates = sessions
    .filter((s) => s.players.some((p) => p.profileId === profileId))
    .map((s) => s.datePlayed)
    .sort((a, b) => a.localeCompare(b));
  return dates[0] ?? null;
}

export function getRoleLabel(roleId: number): string {
  if (roleId === 1) return "SuperAdmin";
  if (roleId === 2) return "Admin";
  return "Member";
}

// BGA Win Rate = sum(isWinner ? numPlayers : 0) / (totalSessions × 2) × 100
export function calculateBgaWinRate(
  sessions: GameSession[],
  profileId: number,
): number {
  let numerator = 0;
  let totalSessions = 0;

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;
    totalSessions++;
    if (player.isWinner) numerator += session.players.length;
  });

  if (totalSessions === 0) return 0;
  return Math.round((numerator / (totalSessions * 2)) * 100);
}

// Monthly sparkline for conventional win rate (last 8 months)
export function calculateWinRateSparkline(
  sessions: GameSession[],
  profileId: number,
): number[] {
  const monthly = calculateWinRateOverTime(sessions, profileId);
  return monthly.slice(-8).map((m) => m.winRate);
}

// Monthly sparkline for BGA win rate (last 8 months)
export function calculateBgaWinRateSparkline(
  sessions: GameSession[],
  profileId: number,
): number[] {
  const monthMap: Record<string, { numerator: number; total: number }> = {};

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    const d = new Date(session.datePlayed);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthMap[key]) monthMap[key] = { numerator: 0, total: 0 };
    monthMap[key].total++;
    if (player.isWinner) monthMap[key].numerator += session.players.length;
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, d]) =>
      d.total > 0 ? Math.round((d.numerator / (d.total * 2)) * 100) : 0,
    );
}

// Monthly WPA sparkline from daily snapshot data (last 8 months)
export function calculateWpaSparkline(
  dailyStats: SelectHistDailyPlayerStats[],
  profileId: number,
  groupId: string,
): number[] {
  const playerStats = dailyStats.filter(
    (s) =>
      s.profileId === profileId &&
      s.groupId === groupId &&
      s.sessionsPlayed > 0,
  );

  // Take the last entry per month (highest day wins)
  const monthMap: Record<
    string,
    { score: number; sessionsPlayed: number; day: number }
  > = {};
  playerStats.forEach((s) => {
    const key = `${s.year}-${String(s.month).padStart(2, "0")}`;
    if (!monthMap[key] || s.day > monthMap[key].day) {
      monthMap[key] = {
        score: s.score,
        sessionsPlayed: s.sessionsPlayed,
        day: s.day,
      };
    }
  });

  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([, d]) => (d.sessionsPlayed > 0 ? d.score / d.sessionsPlayed : 0));
}

// 30-day win rate delta: (last 30d rate) - (previous 30d rate)
export function calculateWinRateDelta(
  sessions: GameSession[],
  profileId: number,
): { current: number | null; delta: number | null } {
  const now = Date.now();
  const ms30 = 30 * 24 * 60 * 60 * 1000;

  let curWins = 0,
    curGames = 0;
  let prevWins = 0,
    prevGames = 0;

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    const age = now - new Date(session.datePlayed).getTime();
    if (age <= ms30) {
      curGames++;
      if (player.isWinner) curWins++;
    } else if (age <= 2 * ms30) {
      prevGames++;
      if (player.isWinner) prevWins++;
    }
  });

  const current = curGames > 0 ? Math.round((curWins / curGames) * 100) : null;
  const prev = prevGames > 0 ? Math.round((prevWins / prevGames) * 100) : null;

  return {
    current,
    delta: current !== null && prev !== null ? current - prev : null,
  };
}

// 30-day WPA delta: current WPA minus WPA from ~30 days ago
export function calculateWpaDelta(
  dailyStats: SelectHistDailyPlayerStats[],
  rollingStats: SelectRollingPlayerStats[],
  profileId: number,
  groupId: string,
): { current: number; delta: number | null } {
  const rolling = rollingStats.find(
    (s) => s.profileId === profileId && s.groupId === groupId,
  );
  const current =
    rolling && rolling.sessionsPlayed > 0
      ? rolling.rollingScore / rolling.sessionsPlayed
      : 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  // Last daily snapshot before the cutoff
  const prevStat = dailyStats
    .filter(
      (s) =>
        s.profileId === profileId &&
        s.groupId === groupId &&
        s.sessionsPlayed > 0 &&
        s.snapshotDate <= cutoffStr,
    )
    .sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate))[0];

  const prev =
    prevStat && prevStat.sessionsPlayed > 0
      ? prevStat.score / prevStat.sessionsPlayed
      : null;

  return { current, delta: prev !== null ? current - prev : null };
}

// ── Head-to-Head ────────────────────────────────────────────────────

export interface H2HGameResult {
  session: GameSession;
  p1Won: boolean;
  p2Won: boolean;
  tie: boolean;
}

export interface H2HBreakdown {
  label: string;
  p1Wins: number;
  p2Wins: number;
  ties: number;
  total: number;
}

export interface H2HMostPlayedGame {
  gameId: number;
  gameTitle: string;
  gameImageUrl: string | null;
  timesPlayed: number;
  p1Wins: number;
  p2Wins: number;
  ties: number;
  recentSessions: H2HGameResult[];
}

export interface HeadToHeadResult {
  // Every session together, of any type
  sharedSessions: GameSession[];

  // H2H record, competitive sessions only (position-based: lower position =
  // better; a shared position is a tie)
  p1H2HWins: number;
  p2H2HWins: number;
  h2hTies: number;

  // H2H breakdowns
  h2hByPlayerCount: H2HBreakdown[];
  h2hByWeight: H2HBreakdown[];

  // Most played game together
  mostPlayedGame: H2HMostPlayedGame | null;

  // Current win streak (position-based, most recent run)
  currentStreak: { profileId: number; streak: number } | null;

  // Past completed streaks, most recent first (up to 3)
  pastStreaks: { profileId: number; streak: number }[];
}

export function calculateHeadToHead(
  sessions: GameSession[],
  p1Id: number,
  p2Id: number,
): HeadToHeadResult {
  // Oldest first: by date played, then by when they were logged
  const sharedSessions = sessions
    .filter(
      (s) =>
        s.players.some((p) => p.profileId === p1Id) &&
        s.players.some((p) => p.profileId === p2Id),
    )
    .sort(
      (a, b) =>
        a.datePlayed.localeCompare(b.datePlayed) ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  let p1H2HWins = 0;
  let p2H2HWins = 0;
  let h2hTies = 0;

  const pcBins: Record<
    string,
    { p1: number; p2: number; ties: number; total: number }
  > = {
    "2p": { p1: 0, p2: 0, ties: 0, total: 0 },
    "3p": { p1: 0, p2: 0, ties: 0, total: 0 },
    "4p": { p1: 0, p2: 0, ties: 0, total: 0 },
    "5p+": { p1: 0, p2: 0, ties: 0, total: 0 },
  };

  const wBins: Record<
    string,
    { p1: number; p2: number; ties: number; total: number }
  > = {
    Light: { p1: 0, p2: 0, ties: 0, total: 0 },
    Medium: { p1: 0, p2: 0, ties: 0, total: 0 },
    Heavy: { p1: 0, p2: 0, ties: 0, total: 0 },
  };

  const gameMap: Record<
    number,
    {
      title: string;
      imageUrl: string | null;
      played: number;
      p1Wins: number;
      p2Wins: number;
      ties: number;
      sessions: H2HGameResult[];
    }
  > = {};

  // profileId of who finished ahead in each competitive session, oldest first
  const results: number[] = [];

  sharedSessions.forEach((session) => {
    const p1 = session.players.find((p) => p.profileId === p1Id)!;
    const p2 = session.players.find((p) => p.profileId === p2Id)!;

    // Finishing ahead wins. A shared position is a tie: a draw, teammates,
    // or a co-op session
    const p1Won = p1.position < p2.position;
    const p2Won = p2.position < p1.position;
    const tie = !p1Won && !p2Won;

    // The head-to-head record, breakdowns and streaks are competitive only
    if (!session.coop) {
      if (p1Won) p1H2HWins++;
      else if (p2Won) p2H2HWins++;
      else h2hTies++;

      // Player count bin
      const count = session.players.length;
      const pcBin =
        count <= 2 ? "2p" : count === 3 ? "3p" : count === 4 ? "4p" : "5p+";
      pcBins[pcBin].total++;
      if (p1Won) pcBins[pcBin].p1++;
      else if (p2Won) pcBins[pcBin].p2++;
      else pcBins[pcBin].ties++;

      // Weight bin
      const weight = session.gameWeight;
      const wBin =
        weight === null || (weight >= 2.5 && weight <= 3.5)
          ? "Medium"
          : weight < 2.5
            ? "Light"
            : "Heavy";
      wBins[wBin].total++;
      if (p1Won) wBins[wBin].p1++;
      else if (p2Won) wBins[wBin].p2++;
      else wBins[wBin].ties++;

      // Ties neither extend nor end a streak
      if (!tie) results.push(p1Won ? p1Id : p2Id);
    }

    // Game tracking
    if (!gameMap[session.gameId]) {
      gameMap[session.gameId] = {
        title: session.gameTitle,
        imageUrl: session.gameImageUrl,
        played: 0,
        p1Wins: 0,
        p2Wins: 0,
        ties: 0,
        sessions: [],
      };
    }
    const g = gameMap[session.gameId];
    g.played++;
    if (p1Won) g.p1Wins++;
    else if (p2Won) g.p2Wins++;
    else g.ties++;
    g.sessions.push({ session, p1Won, p2Won, tie });
  });

  // Most played game
  const topGame = Object.entries(gameMap).sort(
    (a, b) => b[1].played - a[1].played,
  )[0];
  const mostPlayedGame: H2HMostPlayedGame | null = topGame
    ? {
        gameId: Number(topGame[0]),
        gameTitle: topGame[1].title,
        gameImageUrl: topGame[1].imageUrl,
        timesPlayed: topGame[1].played,
        p1Wins: topGame[1].p1Wins,
        p2Wins: topGame[1].p2Wins,
        ties: topGame[1].ties,
        recentSessions: topGame[1].sessions.slice(-3).reverse(),
      }
    : null;

  // Compute all streak segments (forward pass)
  const completedStreaks: { profileId: number; streak: number }[] = [];
  let runPlayer: number | null = null;
  let runCount = 0;

  for (const winner of results) {
    if (winner === runPlayer) {
      runCount++;
    } else {
      if (runPlayer !== null) {
        completedStreaks.push({ profileId: runPlayer, streak: runCount });
      }
      runPlayer = winner;
      runCount = 1;
    }
  }
  // The in-progress run at the end is the current streak
  const currentStreak: { profileId: number; streak: number } | null =
    runPlayer !== null ? { profileId: runPlayer, streak: runCount } : null;
  // Past streaks = completed segments before the current run, most recent first
  const pastStreaks = completedStreaks.reverse().slice(0, 3);

  return {
    sharedSessions,
    p1H2HWins,
    p2H2HWins,
    h2hTies,
    h2hByPlayerCount: Object.entries(pcBins).map(([label, d]) => ({
      label,
      p1Wins: d.p1,
      p2Wins: d.p2,
      ties: d.ties,
      total: d.total,
    })),
    h2hByWeight: Object.entries(wBins).map(([label, d]) => ({
      label,
      p1Wins: d.p1,
      p2Wins: d.p2,
      ties: d.ties,
      total: d.total,
    })),
    mostPlayedGame,
    currentStreak,
    pastStreaks,
  };
}
