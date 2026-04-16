import { type GameSession, type GameListItem, type LeadingPlayer, type TribeMember } from "@/types/tribes";
import { cn } from "@/lib/utils";
import { Crown, TrendingUp, Target, Zap, Star, TrendingDown } from "lucide-react";
import { type PlayerSnapshot, type ScoreStatData, type ScoreCardKey } from "./types";

// ─── Game list ────────────────────────────────────────────────────────────────

export function buildGameList(sessions: GameSession[]): GameListItem[] {
  const map = new Map<
    number,
    { gameTitle: string; playCount: number; imageUrl: string | null }
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

// ─── Leading player ───────────────────────────────────────────────────────────

export function computeLeadingPlayer(
  sessions: GameSession[],
  gameId: number,
  mode: "winner" | "loser" | "most_plays",
): LeadingPlayer | null {
  const gameSessions = sessions.filter((s) => s.gameId === gameId);
  if (gameSessions.length === 0) return null;

  const playerMap = new Map<
    number,
    {
      profileId: number;
      username: string;
      firstName: string;
      lastName: string;
      image: string | null;
      wins: number;
      losses: number;
      totalPlays: number;
      totalWinVp: number;
      winVpGames: number;
      totalLossVp: number;
      lossVpGames: number;
      totalVp: number;
      vpGames: number;
      appearances: {
        sessionId: string;
        datePlayed: string;
        position: number;
        victoryPoints: number | null;
        isWinner: boolean;
      }[];
    }
  >();

  gameSessions.forEach((session) => {
    session.players.forEach((p) => {
      let entry = playerMap.get(p.profileId);
      if (!entry) {
        entry = {
          profileId: p.profileId,
          username: p.username,
          firstName: p.firstName,
          lastName: p.lastName,
          image: p.image,
          wins: 0,
          losses: 0,
          totalPlays: 0,
          totalWinVp: 0,
          winVpGames: 0,
          totalLossVp: 0,
          lossVpGames: 0,
          totalVp: 0,
          vpGames: 0,
          appearances: [],
        };
        playerMap.set(p.profileId, entry);
      }
      entry.totalPlays++;
      if (p.isWinner) {
        entry.wins++;
        if (p.victoryPoints !== null) {
          entry.totalWinVp += p.victoryPoints;
          entry.winVpGames++;
        }
      } else {
        entry.losses++;
        if (p.victoryPoints !== null) {
          entry.totalLossVp += p.victoryPoints;
          entry.lossVpGames++;
        }
      }
      if (p.victoryPoints !== null) {
        entry.totalVp += p.victoryPoints;
        entry.vpGames++;
      }
      entry.appearances.push({
        sessionId: session.sessionId,
        datePlayed: session.datePlayed,
        position: p.position,
        victoryPoints: p.victoryPoints,
        isWinner: p.isWinner,
      });
    });
  });

  const players = Array.from(playerMap.values());
  let selected: (typeof players)[number] | null = null;

  if (mode === "winner") {
    selected =
      players
        .filter((p) => p.wins > 0)
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          const avgA = a.winVpGames > 0 ? a.totalWinVp / a.winVpGames : 0;
          const avgB = b.winVpGames > 0 ? b.totalWinVp / b.winVpGames : 0;
          return avgB - avgA;
        })[0] ?? null;
  } else if (mode === "loser") {
    selected =
      players
        .filter((p) => p.losses > 0)
        .sort((a, b) => {
          if (b.losses !== a.losses) return b.losses - a.losses;
          const avgA = a.lossVpGames > 0 ? a.totalLossVp / a.lossVpGames : 0;
          const avgB = b.lossVpGames > 0 ? b.totalLossVp / b.lossVpGames : 0;
          return avgA - avgB;
        })[0] ?? null;
  } else {
    selected = players.sort((a, b) => b.totalPlays - a.totalPlays)[0] ?? null;
  }

  if (!selected) return null;

  const recentGames = [...selected.appearances]
    .sort(
      (a, b) =>
        new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime(),
    )
    .slice(0, 3);

  const count =
    mode === "winner"
      ? selected.wins
      : mode === "loser"
        ? selected.losses
        : selected.totalPlays;

  const avgVp =
    mode === "winner"
      ? selected.winVpGames > 0
        ? Math.round((selected.totalWinVp / selected.winVpGames) * 10) / 10
        : null
      : mode === "loser"
        ? selected.lossVpGames > 0
          ? Math.round((selected.totalLossVp / selected.lossVpGames) * 10) / 10
          : null
        : selected.vpGames > 0
          ? Math.round((selected.totalVp / selected.vpGames) * 10) / 10
          : null;

  return {
    profileId: selected.profileId,
    username: selected.username,
    firstName: selected.firstName,
    lastName: selected.lastName,
    image: selected.image,
    count,
    avgVp,
    recentGames,
  };
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
  const counts = new Map<number, { plays: number; p: GameSession["players"][number] }>();

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
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
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
    if (!lastPlayed || session.datePlayed > lastPlayed) lastPlayed = session.datePlayed;

    if (player.isWinner) {
      wins++;
      winDates.push(session.datePlayed);
      if (!lastWon || session.datePlayed > lastWon) lastWon = session.datePlayed;
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
        if (highest === null || p.victoryPoints > highest) highest = p.victoryPoints;
        if (lowest === null || p.victoryPoints < lowest) lowest = p.victoryPoints;
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
