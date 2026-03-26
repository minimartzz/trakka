"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
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
