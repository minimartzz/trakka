import {
  type GameSession,
  type GameListItem,
  type LeadingPlayer,
  type MemberElo,
  type TribeMember,
} from "@/types/tribes";
import { cn } from "@/lib/utils";
import { isCalibrated } from "@/utils/elo";
import {
  Crown,
  TrendingUp,
  Target,
  Zap,
  Star,
  TrendingDown,
} from "lucide-react";
import {
  type PlayerSnapshot,
  type ScoreStatData,
  type ScoreCardKey,
} from "./types";
import { wilsonLowerBound } from "@/utils/playerStatsCalculations";

// ─── Game list ────────────────────────────────────────────────────────────────

export function buildGameList(sessions: GameSession[]): GameListItem[] {
  const map = new Map<
    number,
    {
      gameTitle: string;
      playCount: number;
      imageUrl: string | null;
      thumbnail: string | null;
    }
  >();
  sessions.forEach((s) => {
    const existing = map.get(s.gameId);
    if (existing) {
      existing.playCount++;
    } else {
      map.set(s.gameId, {
        gameTitle: s.gameTitle,
        playCount: 1,
        imageUrl: s.gameImageUrl,
        thumbnail: s.thumbnail,
      });
    }
  });
  return Array.from(map.entries())
    .map(([gameId, data]) => ({ gameId, ...data }))
    .sort((a, b) => a.gameTitle.localeCompare(b.gameTitle));
}

export function getDefaultGame(games: GameListItem[]): GameListItem | null {
  if (games.length === 0) return null;
  return [...games].sort((a, b) => b.playCount - a.playCount)[0];
}

// ─── Leading players ──────────────────────────────────────────────────────────

// Fewest plays of the game before someone can be Best Player or Biggest Loser
const MIN_LEADING_PLAYS = 3;
const RECENT_GAMES = 3;

// A running total of VP over some of a player's sessions
interface VpTally {
  total: number;
  games: number;
}

const addVp = (tally: VpTally, vp: number | null) => {
  if (vp === null) return;
  tally.total += vp;
  tally.games++;
};

const avgVp = (tally: VpTally) =>
  tally.games > 0 ? tally.total / tally.games : null;

// Best Player, Biggest Loser and Most Plays for one game, from competitive
// sessions only. Best Player and Biggest Loser are ranked by rate weighted by
// plays, so 19 wins in 20 beats 3 in 3. A loss is finishing last.
export function computeLeadingPlayers(
  sessions: GameSession[],
  gameId: number,
): {
  best: LeadingPlayer | null;
  loser: LeadingPlayer | null;
  mostPlays: LeadingPlayer | null;
} {
  // Newest first: by date played, then by when they were logged
  const gameSessions = sessions
    .filter((s) => s.gameId === gameId && !s.coop && s.players.length > 1)
    .sort(
      (a, b) =>
        b.datePlayed.localeCompare(a.datePlayed) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  // Insertion order follows each player's most recent play
  const playerMap = new Map<
    number,
    {
      profileId: number;
      username: string;
      firstName: string;
      lastName: string;
      image: string | null;
      plays: number;
      wins: number;
      lasts: number;
      vp: VpTally;
      winVp: VpTally;
      lastVp: VpTally;
      recentGames: LeadingPlayer["recentGames"];
    }
  >();

  for (const session of gameSessions) {
    const positions = session.players.map((p) => p.position);
    const lastPosition = Math.max(...positions);
    // Nobody is last in a draw between everyone
    const hasLast = lastPosition > Math.min(...positions);

    for (const p of session.players) {
      let entry = playerMap.get(p.profileId);
      if (!entry) {
        entry = {
          profileId: p.profileId,
          username: p.username,
          firstName: p.firstName,
          lastName: p.lastName,
          image: p.image,
          plays: 0,
          wins: 0,
          lasts: 0,
          vp: { total: 0, games: 0 },
          winVp: { total: 0, games: 0 },
          lastVp: { total: 0, games: 0 },
          recentGames: [],
        };
        playerMap.set(p.profileId, entry);
      }

      entry.plays++;
      addVp(entry.vp, p.victoryPoints);
      if (p.isWinner) {
        entry.wins++;
        addVp(entry.winVp, p.victoryPoints);
      }
      if (hasLast && p.position === lastPosition) {
        entry.lasts++;
        addVp(entry.lastVp, p.victoryPoints);
      }
      if (entry.recentGames.length < RECENT_GAMES) {
        entry.recentGames.push({
          sessionId: session.sessionId,
          datePlayed: session.datePlayed,
          position: p.position,
          victoryPoints: p.victoryPoints,
          isWinner: p.isWinner,
        });
      }
    }
  }

  const players = [...playerMap.values()];
  const eligible = players.filter((p) => p.plays >= MIN_LEADING_PLAYS);

  // Ties go to the higher average VP in their wins
  const best =
    eligible
      .filter((p) => p.wins > 0)
      .sort(
        (a, b) =>
          wilsonLowerBound(b.wins, b.plays) -
            wilsonLowerBound(a.wins, a.plays) ||
          (avgVp(b.winVp) ?? 0) - (avgVp(a.winVp) ?? 0),
      )[0] ?? null;

  // Never the Best Player; ties go to the lower average VP when last
  const loser =
    eligible
      .filter((p) => p.lasts > 0 && p !== best)
      .sort(
        (a, b) =>
          wilsonLowerBound(b.lasts, b.plays) -
            wilsonLowerBound(a.lasts, a.plays) ||
          (avgVp(a.lastVp) ?? 0) - (avgVp(b.lastVp) ?? 0),
      )[0] ?? null;

  // Ties go to whoever played most recently (Map order)
  const mostPlays = [...players].sort((a, b) => b.plays - a.plays)[0] ?? null;

  const toLeading = (
    p: (typeof players)[number],
    count: number,
    vp: VpTally,
  ): LeadingPlayer => {
    const average = avgVp(vp);
    return {
      profileId: p.profileId,
      username: p.username,
      firstName: p.firstName,
      lastName: p.lastName,
      image: p.image,
      count,
      plays: p.plays,
      avgVp: average === null ? null : Math.round(average * 10) / 10,
      recentGames: p.recentGames,
    };
  };

  return {
    best: best && toLeading(best, best.wins, best.winVp),
    loser: loser && toLeading(loser, loser.lasts, loser.lastVp),
    mostPlays: mostPlays && toLeading(mostPlays, mostPlays.plays, mostPlays.vp),
  };
}

// ─── Elo ranking ──────────────────────────────────────────────────────────────

export interface EloRankRow {
  rank: number;
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  // Rounded, as displayed
  elo: number;
  sessionsPlayed: number;
  calibrating: boolean;
}

// The tribe's members ranked by their Elo in this game, highest first. A tie
// goes to the member with more Rated Sessions of it.
export function rankByElo(
  memberElos: MemberElo[],
  members: TribeMember[],
  gameId: number,
): EloRankRow[] {
  const byId = new Map(members.map((m) => [m.profileId, m]));
  return memberElos
    .filter((e) => e.gameId === gameId && byId.has(e.profileId))
    .sort((a, b) => b.elo - a.elo || b.sessionsPlayed - a.sessionsPlayed)
    .map((e, i) => {
      const m = byId.get(e.profileId)!;
      return {
        rank: i + 1,
        profileId: m.profileId,
        username: m.username,
        firstName: m.firstName,
        lastName: m.lastName,
        image: m.image,
        elo: Math.round(e.elo),
        sessionsPlayed: e.sessionsPlayed,
        calibrating: !isCalibrated(e.sessionsPlayed),
      };
    });
}

const ALWAYS_SHOWN = 4;

// The collapsed ranking: the top 4, then the current user after a gap (null)
// when they rank lower than 5th; otherwise simply the top 5
export function collapseEloRanking(
  rows: EloRankRow[],
  currentUserId: number | undefined,
): (EloRankRow | null)[] {
  const userIndex = rows.findIndex((r) => r.profileId === currentUserId);
  if (userIndex <= ALWAYS_SHOWN) return rows.slice(0, ALWAYS_SHOWN + 1);
  return [...rows.slice(0, ALWAYS_SHOWN), null, rows[userIndex]];
}

// ─── Score stats ──────────────────────────────────────────────────────────────

export function computeScoreStats(
  sessions: GameSession[],
  gameId: number,
): Record<ScoreCardKey, ScoreStatData | null> {
  const gameSessions = sessions.filter((s) => s.gameId === gameId);

  type TrackedEntry = {
    value: number;
    player: PlayerSnapshot;
    session: GameSession;
  };

  const tracked = {
    highest: null as TrackedEntry | null,
    lowest: null as TrackedEntry | null,
    lowestWinning: null as TrackedEntry | null,
    highestLosing: null as TrackedEntry | null,
  };

  let totalWinVp = 0;
  let winCount = 0;
  let totalVp = 0;
  let allCount = 0;

  const vpWinPairs: { vp: number; isWinner: boolean }[] = [];

  gameSessions.forEach((session) => {
    session.players.forEach((p) => {
      if (p.victoryPoints === null) return;

      const snapshot: PlayerSnapshot = {
        profileId: p.profileId,
        username: p.username,
        firstName: p.firstName,
        lastName: p.lastName,
        image: p.image,
      };

      vpWinPairs.push({ vp: p.victoryPoints, isWinner: p.isWinner });

      if (!tracked.highest || p.victoryPoints > tracked.highest.value) {
        tracked.highest = { value: p.victoryPoints, player: snapshot, session };
      }
      if (!tracked.lowest || p.victoryPoints < tracked.lowest.value) {
        tracked.lowest = { value: p.victoryPoints, player: snapshot, session };
      }

      totalVp += p.victoryPoints;
      allCount++;

      if (p.isWinner) {
        totalWinVp += p.victoryPoints;
        winCount++;
        if (
          !tracked.lowestWinning ||
          p.victoryPoints < tracked.lowestWinning.value
        ) {
          tracked.lowestWinning = {
            value: p.victoryPoints,
            player: snapshot,
            session,
          };
        }
      } else {
        const maxPosition = Math.max(
          ...session.players.map((sp) => sp.position),
        );
        if (p.position === maxPosition) {
          if (
            !tracked.highestLosing ||
            p.victoryPoints > tracked.highestLosing.value
          ) {
            tracked.highestLosing = {
              value: p.victoryPoints,
              player: snapshot,
              session,
            };
          }
        }
      }
    });
  });

  const sessionMeta = (session: GameSession) => ({
    datePlayed: session.datePlayed,
    sessionPlayerCount: session.players.length,
  });

  // ── Dominance (highest): gap to 2nd place VP in that session
  let dominance: number | null = null;
  if (tracked.highest) {
    const vps = tracked.highest.session.players
      .filter((p: GameSession["players"][number]) => p.victoryPoints !== null)
      .map((p: GameSession["players"][number]) => p.victoryPoints!)
      .sort((a: number, b: number) => b - a);
    if (vps.length >= 2) {
      dominance = vps[0] - vps[1];
    }
  }

  // ── Golden Threshold (avgWinning): VP at which 80% win probability
  let goldenThreshold: number | null = null;
  if (vpWinPairs.length > 0) {
    const sorted = [...vpWinPairs].sort((a, b) => b.vp - a.vp);
    let cumWins = 0;
    let cumTotal = 0;
    for (const pair of sorted) {
      cumTotal++;
      if (pair.isWinner) cumWins++;
      if (cumWins / cumTotal >= 0.8) {
        goldenThreshold = pair.vp;
      }
    }
  }

  // ── Spread (tribeAverage): mean absolute deviation of all VPs
  let spread: number | null = null;
  if (allCount > 0) {
    const mean = totalVp / allCount;
    let totalDev = 0;
    gameSessions.forEach((session) => {
      session.players.forEach((p) => {
        if (p.victoryPoints !== null) {
          totalDev += Math.abs(p.victoryPoints - mean);
        }
      });
    });
    spread = Math.round((totalDev / allCount) * 10) / 10;
  }

  // ── Efficiency (lowestWinning): winning score / total session VP
  let efficiency: number | null = null;
  if (tracked.lowestWinning) {
    const sessionTotal = tracked.lowestWinning.session.players
      .filter((p: GameSession["players"][number]) => p.victoryPoints !== null)
      .reduce(
        (sum: number, p: GameSession["players"][number]) =>
          sum + (p.victoryPoints ?? 0),
        0,
      );
    if (sessionTotal > 0) {
      efficiency =
        Math.round((tracked.lowestWinning.value / sessionTotal) * 1000) / 10;
    }
  }

  // ── Spoiler (highestLosing): sessions this score would've won
  let spoiler: number | null = null;
  if (tracked.highestLosing) {
    let count = 0;
    const srcSession = tracked.highestLosing.session;
    gameSessions.forEach((session) => {
      if (session.sessionId === srcSession.sessionId) return;
      const winVps = session.players
        .filter(
          (p: GameSession["players"][number]) =>
            p.isWinner && p.victoryPoints !== null,
        )
        .map((p: GameSession["players"][number]) => p.victoryPoints!);
      if (
        winVps.length > 0 &&
        tracked.highestLosing!.value >= Math.max(...winVps)
      ) {
        count++;
      }
    });
    spoiler = count;
  }

  // ── Gapped (lowest): VP below the average of per-session minimums
  let gapped: number | null = null;
  if (tracked.lowest) {
    const sessionLows: number[] = [];
    gameSessions.forEach((session) => {
      const vps = session.players
        .filter((p: GameSession["players"][number]) => p.victoryPoints !== null)
        .map((p: GameSession["players"][number]) => p.victoryPoints!);
      if (vps.length > 0) sessionLows.push(Math.min(...vps));
    });
    if (sessionLows.length > 0) {
      const losingAvg =
        sessionLows.reduce((a, b) => a + b, 0) / sessionLows.length;
      gapped = Math.round((losingAvg - tracked.lowest.value) * 10) / 10;
    }
  }

  return {
    highest: tracked.highest
      ? {
          value: tracked.highest.value,
          player: tracked.highest.player,
          ...sessionMeta(tracked.highest.session),
          dominance,
        }
      : null,
    avgWinning:
      winCount > 0
        ? {
            value: Math.round((totalWinVp / winCount) * 10) / 10,
            count: winCount,
            goldenThreshold,
          }
        : null,
    tribeAverage:
      allCount > 0
        ? {
            value: Math.round((totalVp / allCount) * 10) / 10,
            count: allCount,
            spread,
          }
        : null,
    lowestWinning: tracked.lowestWinning
      ? {
          value: tracked.lowestWinning.value,
          player: tracked.lowestWinning.player,
          ...sessionMeta(tracked.lowestWinning.session),
          efficiency,
        }
      : null,
    highestLosing: tracked.highestLosing
      ? {
          value: tracked.highestLosing.value,
          player: tracked.highestLosing.player,
          ...sessionMeta(tracked.highestLosing.session),
          spoiler,
        }
      : null,
    lowest: tracked.lowest
      ? {
          value: tracked.lowest.value,
          player: tracked.lowest.player,
          ...sessionMeta(tracked.lowest.session),
          gapped,
        }
      : null,
  };
}

// ─── Players who've played a game ─────────────────────────────────────────────

export interface GamePlayerOption {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  plays: number;
}

export function buildGamePlayerOptions(
  sessions: GameSession[],
  gameId: number,
  members: TribeMember[],
): GamePlayerOption[] {
  const gameSessions = sessions.filter((s) => s.gameId === gameId);
  const counts = new Map<
    number,
    { plays: number; p: GameSession["players"][number] }
  >();

  gameSessions.forEach((s) =>
    s.players.forEach((p) => {
      const existing = counts.get(p.profileId);
      if (existing) existing.plays++;
      else counts.set(p.profileId, { plays: 1, p });
    }),
  );

  return Array.from(counts.values())
    .map(({ plays, p }) => {
      const member = members.find((m) => m.profileId === p.profileId);
      return {
        profileId: p.profileId,
        username: member?.username ?? p.username,
        firstName: member?.firstName ?? p.firstName,
        lastName: member?.lastName ?? p.lastName,
        image: member?.image ?? p.image,
        plays,
      };
    })
    .sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(
        `${b.firstName} ${b.lastName}`,
      ),
    );
}

export function pickDefaultPlayer(
  players: GamePlayerOption[],
  currentUserId: number | null,
): GamePlayerOption | null {
  if (players.length === 0) return null;
  if (currentUserId !== null) {
    const self = players.find((p) => p.profileId === currentUserId);
    if (self) return self;
  }
  return players[0];
}

// ─── Per-player stats for a game ──────────────────────────────────────────────

export interface PlayerGameStats {
  plays: number;
  wins: number;
  winRate: number; // 0..1
  lastPlayed: string | null;
  lastWon: string | null;
  daysSinceLastPlay: number | null;
  highestVp: { value: number; date: string } | null;
  lowestVp: { value: number; date: string } | null;
  avgVp: number | null;
  wpa: number | null; // avg winContrib for sessions where recorded
  wpaSessions: number;
  playDates: string[]; // YYYY-MM-DD sorted ascending
  winDates: string[]; // YYYY-MM-DD sorted ascending
}

export interface TribeGameStats {
  highestVp: number | null;
  lowestVp: number | null;
  avgVp: number | null;
  tribeWinRate: number | null;
  tribeWpa: number | null;
}

export function computePlayerGameStats(
  sessions: GameSession[],
  gameId: number,
  profileId: number,
): PlayerGameStats {
  const gameSessions = sessions.filter((s) => s.gameId === gameId);

  let plays = 0;
  let wins = 0;
  let totalVp = 0;
  let vpGames = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  let highest: { value: number; date: string } | null = null;
  let lowest: { value: number; date: string } | null = null;
  let lastPlayed: string | null = null;
  let lastWon: string | null = null;
  const playDates: string[] = [];
  const winDates: string[] = [];

  gameSessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    plays++;
    playDates.push(session.datePlayed);
    if (!lastPlayed || session.datePlayed > lastPlayed)
      lastPlayed = session.datePlayed;

    if (player.isWinner) {
      wins++;
      winDates.push(session.datePlayed);
      if (!lastWon || session.datePlayed > lastWon)
        lastWon = session.datePlayed;
    }

    if (player.victoryPoints !== null) {
      totalVp += player.victoryPoints;
      vpGames++;
      if (!highest || player.victoryPoints > highest.value) {
        highest = { value: player.victoryPoints, date: session.datePlayed };
      }
      if (!lowest || player.victoryPoints < lowest.value) {
        lowest = { value: player.victoryPoints, date: session.datePlayed };
      }
    }

    if (player.score !== null) {
      scoreSum += player.score;
      scoreCount++;
    }
  });

  const daysSinceLastPlay = lastPlayed
    ? Math.floor(
        (Date.now() - new Date(lastPlayed).getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return {
    plays,
    wins,
    winRate: plays > 0 ? wins / plays : 0,
    lastPlayed,
    lastWon,
    daysSinceLastPlay,
    highestVp: highest,
    lowestVp: lowest,
    avgVp: vpGames > 0 ? Math.round((totalVp / vpGames) * 10) / 10 : null,
    wpa: scoreCount > 0 ? scoreSum / scoreCount : null,
    wpaSessions: scoreCount,
    playDates: playDates.sort(),
    winDates: winDates.sort(),
  };
}

export function computeTribeGameStats(
  sessions: GameSession[],
  gameId: number,
): TribeGameStats {
  const gameSessions = sessions.filter((s) => s.gameId === gameId);
  let highest: number | null = null;
  let lowest: number | null = null;
  let totalVp = 0;
  let vpCount = 0;
  let winCount = 0;
  let totalPlayers = 0;

  // Per-player score aggregates for WPA (avg of each player's avg score)
  const perPlayerScore = new Map<number, { sum: number; count: number }>();

  gameSessions.forEach((session) =>
    session.players.forEach((p) => {
      totalPlayers++;
      if (p.isWinner) winCount++;
      if (p.victoryPoints !== null) {
        totalVp += p.victoryPoints;
        vpCount++;
        if (highest === null || p.victoryPoints > highest)
          highest = p.victoryPoints;
        if (lowest === null || p.victoryPoints < lowest)
          lowest = p.victoryPoints;
      }
      if (p.score !== null) {
        const existing = perPlayerScore.get(p.profileId);
        if (existing) {
          existing.sum += p.score;
          existing.count++;
        } else {
          perPlayerScore.set(p.profileId, { sum: p.score, count: 1 });
        }
      }
    }),
  );

  const playerAverages = Array.from(perPlayerScore.values()).map(
    (v) => v.sum / v.count,
  );
  const tribeWpa =
    playerAverages.length > 0
      ? playerAverages.reduce((a, b) => a + b, 0) / playerAverages.length
      : null;

  return {
    highestVp: highest,
    lowestVp: lowest,
    avgVp: vpCount > 0 ? Math.round((totalVp / vpCount) * 10) / 10 : null,
    tribeWinRate: totalPlayers > 0 ? winCount / totalPlayers : null,
    tribeWpa,
  };
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatVp(value: number): string {
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1);
}

// ─── Rating / weight helpers ──────────────────────────────────────────────────

export function getRatingBg(rating: number): string {
  if (rating < 5) return "bg-red-500";
  if (rating < 7.5) return "bg-amber-500";
  return "bg-emerald-500";
}

export function getWeightColor(weight: number): string {
  if (weight <= 2.5) return "text-emerald-500";
  if (weight <= 3.5) return "text-amber-500";
  return "text-red-500";
}

export function getWeightBg(weight: number): string {
  if (weight <= 2.5) return "bg-emerald-500/10 border-emerald-500/20";
  if (weight <= 3.5) return "bg-amber-500/10 border-amber-500/20";
  return "bg-red-500/10 border-red-500/20";
}

export function getWeightLabel(weight: number): string {
  if (weight <= 2.5) return "Light";
  if (weight <= 3.5) return "Medium";
  if (weight <= 4.5) return "Heavy";
  return "Very Heavy";
}

export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ─── Score icon ───────────────────────────────────────────────────────────────

export function getScoreIcon(key: ScoreCardKey, sizeClass: string) {
  const cls = cn(sizeClass, "text-white");
  switch (key) {
    case "highest":
      return <Crown className={cls} />;
    case "avgWinning":
      return <TrendingUp className={cls} />;
    case "tribeAverage":
      return <Target className={cls} />;
    case "lowestWinning":
      return <Zap className={cls} />;
    case "highestLosing":
      return <Star className={cls} />;
    case "lowest":
      return <TrendingDown className={cls} />;
  }
}
