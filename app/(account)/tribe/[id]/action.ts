"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { groupTable } from "@/db/schema/group";
import { histDailyPlayerStatsTable } from "@/db/schema/histDailyPlayerStats";
import { histMonthlyPlayerStatsTable } from "@/db/schema/histMonthlyPlayerStats";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { and, eq } from "drizzle-orm";

// Verifies the current session and returns the Supabase user. Throws if unauthenticated.
async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function getTribeMembers(groupId: string) {
  await requireAuth();

  const members = await db
    .select({
      profileGroup: profileGroupTable,
      profile: profileTable,
    })
    .from(profileGroupTable)
    .leftJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .where(eq(profileGroupTable.groupId, groupId));

  return members;
}

export async function getTribeDetails(groupId: string) {
  await requireAuth();

  const tribeDetails = await db
    .select()
    .from(groupTable)
    .leftJoin(profileTable, eq(groupTable.createdBy, profileTable.id))
    .where(eq(groupTable.id, groupId));

  return tribeDetails;
}

export async function getTribeGameSessions(groupId: string) {
  await requireAuth();

  const sessions = await db
    .select({
      compGameLog: compGameLogTable,
      profile: profileTable,
      gameDetails: gameTable,
    })
    .from(compGameLogTable)
    .leftJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(eq(compGameLogTable.groupId, groupId));

  return sessions;
}

// ========================================
// HISTORICAL PLAYER STATS
// ========================================
export async function getRollingPlayerStats(params?: {
  groupId?: string;
  profileId?: number;
}) {
  await requireAuth();

  const conditions = [];

  if (params?.profileId) {
    conditions.push(eq(rollingPlayerStatsTable.profileId, params.profileId));
  }
  if (params?.groupId) {
    conditions.push(eq(rollingPlayerStatsTable.groupId, params.groupId));
  }

  const rollingStats = await db
    .select()
    .from(rollingPlayerStatsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return rollingStats;
}

export async function getDailyPlayerStats(params?: {
  groupId?: string;
  profileId?: number;
}) {
  await requireAuth();

  const conditions = [];

  if (params?.profileId) {
    conditions.push(eq(histDailyPlayerStatsTable.profileId, params.profileId));
  }
  if (params?.groupId) {
    conditions.push(eq(histDailyPlayerStatsTable.groupId, params.groupId));
  }

  const dailyPlayerStats = await db
    .select()
    .from(histDailyPlayerStatsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return dailyPlayerStats;
}

export async function getMonthlyPlayerStats(params?: {
  groupId?: string;
  profileId?: number;
}) {
  await requireAuth();

  const conditions = [];

  if (params?.profileId) {
    conditions.push(
      eq(histMonthlyPlayerStatsTable.profileId, params.profileId),
    );
  }
  if (params?.groupId) {
    conditions.push(eq(histMonthlyPlayerStatsTable.groupId, params.groupId));
  }

  const monthlyPlayerStats = await db
    .select()
    .from(histMonthlyPlayerStatsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return monthlyPlayerStats;
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
