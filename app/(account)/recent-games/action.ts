"use server";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { cacheLife, cacheTag } from "next/cache";
import { desc, eq, inArray } from "drizzle-orm";

async function querySessionsByProfile(profileId: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`recent-games:${profileId}`);

  const userDetails = db
    .select({
      id: profileTable.id,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
    })
    .from(profileTable)
    .as("userDetails");

  const tribeDetails = db
    .select({
      id: groupTable.id,
      name: groupTable.name,
    })
    .from(groupTable)
    .as("tribeDetails");

  const userSessions = db
    .select({
      sessionId: compGameLogTable.sessionId,
    })
    .from(compGameLogTable)
    .where(eq(compGameLogTable.profileId, profileId));

  return db
    .select({
      sessionId: compGameLogTable.sessionId,
      datePlayed: compGameLogTable.datePlayed,
      gameTitle: compGameLogTable.gameTitle,
      gameId: compGameLogTable.gameId,
      gameImage: gameTable.imageUrl,
      gameThumbnail: gameTable.thumbnail,
      createdAt: compGameLogTable.createdAt,
      numPlayers: compGameLogTable.numPlayers,
      rowId: compGameLogTable.id,
      // Tribe Details
      tribeId: tribeDetails.id,
      tribeName: tribeDetails.name,
      // User Details + Results
      profileId: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      username: userDetails.username,
      profilePic: userDetails.profilePic,
      isVp: compGameLogTable.isVp,
      victoryPoints: compGameLogTable.victoryPoints,
      position: compGameLogTable.position,
      isWinner: compGameLogTable.isWinner,
      isTie: compGameLogTable.isTie,
      isFirstPlay: compGameLogTable.isFirstPlay,
      isHighScore: compGameLogTable.highScore,
      rating: compGameLogTable.rating,
    })
    .from(compGameLogTable)
    .innerJoin(userDetails, eq(compGameLogTable.profileId, userDetails.id))
    .innerJoin(tribeDetails, eq(compGameLogTable.groupId, tribeDetails.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(inArray(compGameLogTable.sessionId, userSessions))
    .orderBy(desc(compGameLogTable.datePlayed));
}

export async function fetchSessions(profileId: number) {
  try {
    const rows = await querySessionsByProfile(profileId);
    // Prefer the lightweight thumbnail to keep card loading fast; fall back to
    // the full image only when no thumbnail exists.
    const response = rows.map(({ gameThumbnail, ...row }) => ({
      ...row,
      gameImage: gameThumbnail ?? row.gameImage,
    }));

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Failed to retrieve Sessions by Profile ID", error);
    return {
      success: false,
      message: "Failed to retrieve sessions from profile ID",
    };
  }
}