"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag, revalidatePath } from "next/cache";

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

const VALID_SHOWCASE_CARD_IDS = [
  "unique-games",
  "avg-length",
  "heavyweight",
  "simple",
];

export async function updateShowcaseSlots(slotCardIds: (string | null)[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  if (
    !slotCardIds.every(
      (id) => id === null || VALID_SHOWCASE_CARD_IDS.includes(id),
    )
  ) {
    return { success: false, message: "Invalid showcase card selection" };
  }

  const [profile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!profile) return { success: false, message: "Unauthorized" };

  try {
    await db
      .update(profileTable)
      .set({ showcaseSlots: slotCardIds })
      .where(eq(profileTable.id, profile.id));

    revalidatePath("/dashboard");

    return { success: true, message: "Showcase updated" };
  } catch (error) {
    console.error("Failed to update showcase slots in Database:", error);
    return { success: false, message: "Failed to update showcase" };
  }
}
