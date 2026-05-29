import {
  cacheLife,
  cacheTag,
} from "next/cache";
import { and, eq } from "drizzle-orm";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { groupTable } from "@/db/schema/group";
import { histDailyPlayerStatsTable } from "@/db/schema/histDailyPlayerStats";
import { histMonthlyPlayerStatsTable } from "@/db/schema/histMonthlyPlayerStats";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";

export async function getTribeMembersCached(groupId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:members`);
  return db
    .select({ profileGroup: profileGroupTable, profile: profileTable })
    .from(profileGroupTable)
    .leftJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .where(eq(profileGroupTable.groupId, groupId));
}

export async function getTribeDetailsCached(groupId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:details`);
  return db
    .select()
    .from(groupTable)
    .leftJoin(profileTable, eq(groupTable.createdBy, profileTable.id))
    .where(eq(groupTable.id, groupId));
}

export async function getTribeGameSessionsCached(groupId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:sessions`);
  return db
    .select({
      compGameLog: compGameLogTable,
      profile: profileTable,
      gameDetails: gameTable,
    })
    .from(compGameLogTable)
    .leftJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(eq(compGameLogTable.groupId, groupId));
}

export async function getRollingPlayerStatsByGroupCached(groupId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:stats`);
  return db
    .select()
    .from(rollingPlayerStatsTable)
    .where(eq(rollingPlayerStatsTable.groupId, groupId));
}

export async function getDailyPlayerStatsByGroupCached(groupId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:stats`);
  return db
    .select()
    .from(histDailyPlayerStatsTable)
    .where(eq(histDailyPlayerStatsTable.groupId, groupId));
}

export async function getMonthlyPlayerStatsByGroupCached(groupId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:stats`);
  return db
    .select()
    .from(histMonthlyPlayerStatsTable)
    .where(eq(histMonthlyPlayerStatsTable.groupId, groupId));
}
