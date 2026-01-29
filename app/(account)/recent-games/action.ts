"use server";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { desc, eq, inArray } from "drizzle-orm";

export async function fetchSessions(profileId: number) {
  try {
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

    const response = await db
      .select({
        sessionId: compGameLogTable.sessionId,
        datePlayed: compGameLogTable.datePlayed,
        gameTitle: compGameLogTable.gameTitle,
        gameId: compGameLogTable.gameId,
        createdAt: compGameLogTable.createdAt,
        numPlayers: compGameLogTable.numPlayers,
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
      .where(inArray(compGameLogTable.sessionId, userSessions))
      .orderBy(desc(compGameLogTable.datePlayed));

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
