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
  isWinner: boolean
): number => {
  return isWinner ? numPlayers * 50 : 0;
};

export const getScore = (
  position: number,
  numPlayers: number,
  gameLength: number,
  gameWeight: number
): number => {
  return Number(
    (
      (1 / position ** 2) *
      numPlayers ** (1 / 3) *
      gameLength ** (1 / 4) *
      gameWeight ** (1 / 4)
    ).toFixed(5)
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
export const getHighScore = async (
  gameId: string,
  score: number
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
  datePlayed: Date
): { quarter: number; month: number; year: number } => {
  return {
    quarter: Math.floor((datePlayed.getMonth() + 3) / 3),
    month: datePlayed.getMonth(),
    year: datePlayed.getFullYear(),
  };
};
