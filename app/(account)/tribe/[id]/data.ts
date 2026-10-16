import { cacheLife, cacheTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { groupTable } from "@/db/schema/group";
import { histDailyPlayerStatsTable } from "@/db/schema/histDailyPlayerStats";
import { histMonthlyPlayerStatsTable } from "@/db/schema/histMonthlyPlayerStats";
import { playerGameEloTable } from "@/db/schema/playerGameElo";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";

export async function getTribeMembersCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:members`);
  return db
    .select({
      profileGroup: profileGroupTable,
      profile: {
        id: profileTable.id,
        username: profileTable.username,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        image: profileTable.image,
      },
    })
    .from(profileGroupTable)
    .leftJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .where(eq(profileGroupTable.groupId, groupId));
}

export async function getTribeDetailsCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:details`);
  return db
    .select()
    .from(groupTable)
    .leftJoin(profileTable, eq(groupTable.createdBy, profileTable.id))
    .where(eq(groupTable.id, groupId));
}

export async function getTribeGameSessionsCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:sessions`);
  return db
    .select({
      compGameLog: {
        sessionId: compGameLogTable.sessionId,
        datePlayed: compGameLogTable.datePlayed,
        createdAt: compGameLogTable.createdAt,
        gameId: compGameLogTable.gameId,
        gameTitle: compGameLogTable.gameTitle,
        profileId: compGameLogTable.profileId,
        isWinner: compGameLogTable.isWinner,
        position: compGameLogTable.position,
        score: compGameLogTable.score,
        victoryPoints: compGameLogTable.victoryPoints,
        winContrib: compGameLogTable.winContrib,
        coop: compGameLogTable.coop,
        isVp: compGameLogTable.isVp,
        eloBefore: compGameLogTable.eloBefore,
        eloAfter: compGameLogTable.eloAfter,
        eloSessionsBefore: compGameLogTable.eloSessionsBefore,
      },
      profile: {
        username: profileTable.username,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        image: profileTable.image,
      },
      gameDetails: {
        imageUrl: gameTable.imageUrl,
        thumbnail: gameTable.thumbnail,
        playingTime: gameTable.playingTime,
        weight: gameTable.weight,
      },
    })
    .from(compGameLogTable)
    .leftJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(eq(compGameLogTable.groupId, groupId));
}

export async function getRollingPlayerStatsByGroupCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:stats`);
  return db
    .select()
    .from(rollingPlayerStatsTable)
    .where(eq(rollingPlayerStatsTable.groupId, groupId));
}

// Members' current Elo in every game they've played, anywhere. Elo is
// global, so any replay can change it: tagged "elo" as well as the tribe.
export async function getTribeMemberElosCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:elo`, "elo");
  return db
    .select({
      profileId: playerGameEloTable.profileId,
      gameId: playerGameEloTable.gameId,
      elo: playerGameEloTable.elo,
      sessionsPlayed: playerGameEloTable.sessionsPlayed,
      gameTitle: gameTable.name,
      thumbnail: gameTable.thumbnail,
    })
    .from(playerGameEloTable)
    .innerJoin(
      profileGroupTable,
      eq(playerGameEloTable.profileId, profileGroupTable.profileId),
    )
    .leftJoin(gameTable, eq(playerGameEloTable.gameId, gameTable.id))
    .where(eq(profileGroupTable.groupId, groupId));
}

export async function getDailyPlayerStatsByGroupCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:stats`);
  return db
    .select()
    .from(histDailyPlayerStatsTable)
    .where(eq(histDailyPlayerStatsTable.groupId, groupId));
}

export async function getMonthlyPlayerStatsByGroupCached(groupId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`tribe:${groupId}`, `tribe:${groupId}:stats`);
  return db
    .select()
    .from(histMonthlyPlayerStatsTable)
    .where(eq(histMonthlyPlayerStatsTable.groupId, groupId));
}
