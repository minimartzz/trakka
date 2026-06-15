"use server";

import { gameTable } from "@/db/schema/game";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { histDailyPlayerStatsTable } from "@/db/schema/histDailyPlayerStats";
import { histMonthlyPlayerStatsTable } from "@/db/schema/histMonthlyPlayerStats";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import { requireAuth, requireTribeMembership } from "@/utils/auth";
import { eq } from "drizzle-orm";
import {
  getTribeMembersCached,
  getTribeDetailsCached,
  getTribeGameSessionsCached,
  getRollingPlayerStatsByGroupCached,
  getDailyPlayerStatsByGroupCached,
  getMonthlyPlayerStatsByGroupCached,
} from "./data";

export async function getTribeMembers(groupId: string) {
  await requireTribeMembership(groupId);
  return getTribeMembersCached(groupId);
}

export async function getTribeDetails(groupId: string) {
  await requireTribeMembership(groupId);
  return getTribeDetailsCached(groupId);
}

export async function getTribeGameSessions(groupId: string) {
  await requireTribeMembership(groupId);
  return getTribeGameSessionsCached(groupId);
}

// ========================================
// HISTORICAL PLAYER STATS
// ========================================
export async function getRollingPlayerStats(params?: {
  groupId?: string;
  profileId?: number;
}) {
  if (params?.groupId) {
    await requireTribeMembership(params.groupId);
    return getRollingPlayerStatsByGroupCached(params.groupId);
  }

  await requireAuth();
  return db
    .select()
    .from(rollingPlayerStatsTable)
    .where(
      params?.profileId
        ? eq(rollingPlayerStatsTable.profileId, params.profileId)
        : undefined,
    );
}

export async function getDailyPlayerStats(params?: {
  groupId?: string;
  profileId?: number;
}) {
  if (params?.groupId) {
    await requireTribeMembership(params.groupId);
    return getDailyPlayerStatsByGroupCached(params.groupId);
  }

  await requireAuth();
  return db
    .select()
    .from(histDailyPlayerStatsTable)
    .where(
      params?.profileId
        ? eq(histDailyPlayerStatsTable.profileId, params.profileId)
        : undefined,
    );
}

export async function getMonthlyPlayerStats(params?: {
  groupId?: string;
  profileId?: number;
}) {
  if (params?.groupId) {
    await requireTribeMembership(params.groupId);
    return getMonthlyPlayerStatsByGroupCached(params.groupId);
  }

  await requireAuth();
  return db
    .select()
    .from(histMonthlyPlayerStatsTable)
    .where(
      params?.profileId
        ? eq(histMonthlyPlayerStatsTable.profileId, params.profileId)
        : undefined,
    );
}

// ========================================
// GAME DETAILS WITH CATEGORIES & MECHANICS
// ========================================
export async function getGameDetailsWithMeta(gameId: number) {
  await requireAuth();

  const [gameRows, categoryRows, mechanicRows] = await Promise.all([
    db.select().from(gameTable).where(eq(gameTable.id, gameId)),
    db
      .select({ category: gameCategoryTable.category })
      .from(juncGameCategoryTable)
      .leftJoin(
        gameCategoryTable,
        eq(juncGameCategoryTable.categoryId, gameCategoryTable.id),
      )
      .where(eq(juncGameCategoryTable.gameId, gameId)),
    db
      .select({ mechanic: gameMechanicTable.mechanic })
      .from(juncGameMechanicTable)
      .leftJoin(
        gameMechanicTable,
        eq(juncGameMechanicTable.mechanicId, gameMechanicTable.id),
      )
      .where(eq(juncGameMechanicTable.gameId, gameId)),
  ]);

  const game = gameRows[0] ?? null;
  const categories = categoryRows
    .map((r) => r.category)
    .filter((c): c is string => c !== null);
  const mechanics = mechanicRows
    .map((r) => r.mechanic)
    .filter((m): m is string => m !== null);

  return { game, categories, mechanics };
}
