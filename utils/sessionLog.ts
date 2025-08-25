// Functions for session statistics for competitive and cooperative games
// Competitive Functions
// Inputs: date_played, game_id (from bgg), num_players, profile_id, is_vp, victory_points, is_winner
import { v4 as uuidv4 } from "uuid";
import { DrizzleDbType } from "./db";
import { and, count, eq, max } from "drizzle-orm";
import { compGameLogTable } from "@/db/schema/compGameLog";

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

export const getFirstPlay = async (
  gameId: string,
  profileId: number,
  db: DrizzleDbType
): Promise<boolean> => {
  const results = await db
    .select({
      count: count(),
    })
    .from(compGameLogTable)
    .where(
      and(
        eq(compGameLogTable.gameId, gameId),
        eq(compGameLogTable.profileId, profileId)
      )
    );
  return results[0].count == 0;
};

export const getGroupHighScore = async (
  gameId: string,
  groupId: string,
  score: number,
  db: DrizzleDbType
): Promise<boolean> => {
  const results = await db
    .select({
      high_score: max(compGameLogTable.victoryPoints),
    })
    .from(compGameLogTable)
    .where(
      and(
        eq(compGameLogTable.gameId, gameId),
        eq(compGameLogTable.groupId, groupId)
      )
    );

  return results[0].high_score != null ? score >= results[0].high_score! : true;
};

export const getDateInfo = (
  datePlayed: string
): { quarter: number; month: number; year: number } => {
  const dateObj = new Date(datePlayed);
  return {
    quarter: Math.floor((dateObj.getMonth() + 3) / 3),
    month: dateObj.getMonth(),
    year: dateObj.getFullYear(),
  };
};
