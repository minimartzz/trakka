// Functions for session statistics for competitive and cooperative games
// Competitive Functions
// Inputs: date_played, game_id (from bgg), num_players, profile_id, is_vp, victory_points, is_winner
import { v4 as uuidv4 } from "uuid";

export const generateSessionId = (): string => {
  const uuid = uuidv4();
  return uuid.replace(/-/g, "").substring(0, 12);
};

export const getWinContrib = (
  numPlayers: number,
  isWinner: boolean,
): number => {
  return isWinner ? numPlayers * 50 : 0;
};

export const getScore = (
  position: number,
  numPlayers: number,
  gameLength: number,
  gameWeight: number,
): number => {
  return Number(
    (
      (1 / position ** 2) *
      numPlayers ** (1 / 3) *
      gameLength ** (1 / 4) *
      gameWeight ** (1 / 4)
    ).toFixed(5),
  );
};

export const getFirstPlay = async (gameId: string, profileId: number) => {
  try {
    const response = await fetch("/api/check/firstplay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId, profileId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check high score");
    }
    return data.isFirstPlay;
  } catch (error) {
    console.error(error);
  }
};

// TODO: This function needs reworking
// CONSIDER: How to update the latest highscore if there is another highscore that exists
// Maybe change it to true, sort by date played and take the first instance
// Also global and group high score?
export const getHighScore = async (
  gameId: string,
  score: number,
): Promise<boolean | undefined> => {
  try {
    const response = await fetch("/api/check/highscore", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameId, score }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to check high score");
    }
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const getDateInfo = (
  datePlayed: Date,
): { quarter: number; month: number; year: number } => {
  return {
    quarter: Math.floor((datePlayed.getMonth() + 3) / 3),
    month: datePlayed.getMonth(),
    year: datePlayed.getFullYear(),
  };
};

// In team mode, teammates share a teamId and carry identical score/isTie
// In regular mode teamId is absent and each player is a "team of one",
// Same algorithm applied to both team games and individual's just based on final positions
interface RankablePlayer {
  id: string;
  teamId?: string | null;
  score: number | null;
  isTie: boolean;
}

// Assigns each player a position and their shared team victory points.
export const computePositions = <T extends RankablePlayer>(
  players: T[],
): (T & { position: number; teamVictoryPoints: number | null })[] => {
  // Group by team, preserving first-appearance order. A regular row (no teamId)
  // keys on its unique id, making it a team of one.
  const order: string[] = [];
  const teams = new Map<string, T[]>();
  for (const player of players) {
    const key = player.teamId ?? player.id;
    if (!teams.has(key)) {
      teams.set(key, []);
      order.push(key);
    }
    teams.get(key)!.push(player);
  }

  // The top-most row of each team drives its score/isTie for ranking.
  const teamReps = order.map((key) => {
    const rep = teams.get(key)![0];
    return { key, score: rep.score, isTie: rep.isTie };
  });

  const teamPositions = new Map<string, number>();
  teamReps.forEach((team, idx, arr) => {
    let position: number;
    if (idx === 0) {
      position = 1;
    } else if (
      team.score === arr[idx - 1].score &&
      team.isTie &&
      team.isTie === arr[idx - 1].isTie
    ) {
      const firstMatch = arr.findIndex((t) => t.score === team.score);
      position = firstMatch + 1;
    } else {
      position = idx + 1;
    }
    teamPositions.set(team.key, position);
  });

  return players.map((player) => ({
    ...player,
    position: teamPositions.get(player.teamId ?? player.id)!,
    teamVictoryPoints: player.score,
  }));
};
