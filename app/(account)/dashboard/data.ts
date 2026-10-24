// Per-profile reads for the dashboard and the public player page. Server-only
// on purpose: not a "use server" module, so none of these become actions a
// browser could call with someone else's profile id.
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { playerGameEloTable } from "@/db/schema/playerGameElo";
import { db } from "@/utils/db";
import { eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

// Gather category & mechanic labels by game_id - for Radar Chart
export interface GameMeta {
  categories: Record<number, string[]>;
  mechanics: Record<number, string[]>;
}

const groupByGame = (rows: { gameId: number; label: string }[]) => {
  const record: Record<number, string[]> = {};
  for (const row of rows) {
    const labels = record[row.gameId] ?? [];
    if (!labels.includes(row.label)) labels.push(row.label);
    record[row.gameId] = labels;
  }
  return record;
};

async function queryGameMetaByProfile(profileId: number): Promise<GameMeta> {
  "use cache";
  cacheLife("hours");
  cacheTag(`recent-games:${profileId}`);

  const playedGames = db
    .selectDistinct({ gameId: compGameLogTable.gameId })
    .from(compGameLogTable)
    .where(eq(compGameLogTable.profileId, profileId));

  const [categoryRows, mechanicRows] = await Promise.all([
    // Categories for each game
    db
      .select({
        gameId: juncGameCategoryTable.gameId,
        label: gameCategoryTable.category,
      })
      .from(juncGameCategoryTable)
      .innerJoin(
        gameCategoryTable,
        eq(juncGameCategoryTable.categoryId, gameCategoryTable.id),
      )
      .where(inArray(juncGameCategoryTable.gameId, playedGames)),
    // Mechanics for each game
    db
      .select({
        gameId: juncGameMechanicTable.gameId,
        label: gameMechanicTable.mechanic,
      })
      .from(juncGameMechanicTable)
      .innerJoin(
        gameMechanicTable,
        eq(juncGameMechanicTable.mechanicId, gameMechanicTable.id),
      )
      .where(inArray(juncGameMechanicTable.gameId, playedGames)),
  ]);

  return {
    categories: groupByGame(categoryRows),
    mechanics: groupByGame(mechanicRows),
  };
}

export async function fetchGameMeta(profileId: number): Promise<GameMeta> {
  try {
    return await queryGameMetaByProfile(profileId);
  } catch (error) {
    console.error("Failed to retrieve game categories/mechanics", error);
    return { categories: {}, mechanics: {} };
  }
}

// The user's current Elo in every game they've played - for the Showcase
export interface GameElo {
  gameId: number;
  elo: number;
  sessionsPlayed: number;
}

async function queryGameElosByProfile(profileId: number): Promise<GameElo[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(`recent-games:${profileId}`, "elo");

  return db
    .select({
      gameId: playerGameEloTable.gameId,
      elo: playerGameEloTable.elo,
      sessionsPlayed: playerGameEloTable.sessionsPlayed,
    })
    .from(playerGameEloTable)
    .where(eq(playerGameEloTable.profileId, profileId));
}

export async function fetchGameElos(profileId: number): Promise<GameElo[]> {
  try {
    return await queryGameElosByProfile(profileId);
  } catch (error) {
    console.error("Failed to retrieve game Elos", error);
    return [];
  }
}
