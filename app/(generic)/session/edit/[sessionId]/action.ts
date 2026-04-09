"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { profileTable } from "@/db/schema/profile";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import { and, eq, sql } from "drizzle-orm";

type CompGameLog = typeof compGameLogTable.$inferInsert;

// Fetch full session data by sessionId for editing
export async function fetchSessionForEdit(sessionId: string) {
  try {
    const playerDetails = db
      .select({
        id: profileTable.id,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        username: profileTable.username,
        profilePic: profileTable.image,
      })
      .from(profileTable)
      .as("playerDetails");

    const tribeDetails = db
      .select({
        id: groupTable.id,
        name: groupTable.name,
      })
      .from(groupTable)
      .as("tribeDetails");

    const gameDetails = db
      .select({
        id: gameTable.id,
        name: gameTable.name,
        imageUrl: gameTable.imageUrl,
        yearPublished: gameTable.yearPublished,
        description: gameTable.description,
        rating: gameTable.rating,
        weight: gameTable.weight,
        minPlayers: gameTable.minPlayers,
        maxPlayers: gameTable.maxPlayers,
        recPlayers: gameTable.recPlayers,
        playingTime: gameTable.playingTime,
        minPlayingTime: gameTable.minPlayingTime,
        maxPlayingTime: gameTable.maxPlayingTime,
        minAge: gameTable.minAge,
      })
      .from(gameTable)
      .as("gameDetails");

    const rows = await db
      .select({
        // Session fields
        id: compGameLogTable.id,
        sessionId: compGameLogTable.sessionId,
        datePlayed: compGameLogTable.datePlayed,
        gameId: compGameLogTable.gameId,
        gameTitle: compGameLogTable.gameTitle,
        gameWeight: compGameLogTable.gameWeight,
        gameLength: compGameLogTable.gameLength,
        numPlayers: compGameLogTable.numPlayers,
        groupId: compGameLogTable.groupId,
        isVp: compGameLogTable.isVp,
        victoryPoints: compGameLogTable.victoryPoints,
        isWinner: compGameLogTable.isWinner,
        position: compGameLogTable.position,
        winContrib: compGameLogTable.winContrib,
        score: compGameLogTable.score,
        highScore: compGameLogTable.highScore,
        isTie: compGameLogTable.isTie,
        isFirstPlay: compGameLogTable.isFirstPlay,
        createdBy: compGameLogTable.createdBy,
        // Player details
        profileId: playerDetails.id,
        firstName: playerDetails.firstName,
        lastName: playerDetails.lastName,
        username: playerDetails.username,
        profilePic: playerDetails.profilePic,
        // Tribe details
        tribeName: tribeDetails.name,
        // Game details
        gameImageUrl: gameDetails.imageUrl,
        gameYearPublished: gameDetails.yearPublished,
        gameDescription: gameDetails.description,
        gameRating: gameDetails.rating,
        gameWeightFull: gameDetails.weight,
        gameMinPlayers: gameDetails.minPlayers,
        gameMaxPlayers: gameDetails.maxPlayers,
        gameRecPlayers: gameDetails.recPlayers,
        gamePlayingTime: gameDetails.playingTime,
        gameMinPlayingTime: gameDetails.minPlayingTime,
        gameMaxPlayingTime: gameDetails.maxPlayingTime,
        gameMinAge: gameDetails.minAge,
      })
      .from(compGameLogTable)
      .innerJoin(playerDetails, eq(compGameLogTable.profileId, playerDetails.id))
      .innerJoin(tribeDetails, eq(compGameLogTable.groupId, tribeDetails.id))
      .innerJoin(gameDetails, eq(compGameLogTable.gameId, gameDetails.id))
      .where(eq(compGameLogTable.sessionId, sessionId))
      .orderBy(compGameLogTable.position);

    if (rows.length === 0) {
      return { success: false, message: "Session not found" };
    }

    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to fetch session for edit:", error);
    return { success: false, message: "Failed to fetch session" };
  }
}

// Check if user has Admin or SuperAdmin role in a tribe
export async function checkUserRole(
  profileId: number,
  groupId: string,
): Promise<boolean> {
  try {
    const result = await db
      .select({ roleId: profileGroupTable.roleId })
      .from(profileGroupTable)
      .where(
        and(
          eq(profileGroupTable.profileId, profileId),
          eq(profileGroupTable.groupId, groupId),
        ),
      );

    if (result.length === 0) return false;
    // Role 1 = SuperAdmin, Role 2 = Admin
    return result[0].roleId === 1 || result[0].roleId === 2;
  } catch (error) {
    console.error("Failed to check user role:", error);
    return false;
  }
}

// Update an existing session
export async function updateSession(
  sessionId: string,
  oldRows: { profileId: number; isWinner: boolean; score: number | null }[],
  newPayload: CompGameLog[],
) {
  try {
    // Step 1: Reverse the old rolling stats
    for (const oldRow of oldRows) {
      await db
        .update(rollingPlayerStatsTable)
        .set({
          sessionsPlayed: sql`${rollingPlayerStatsTable.sessionsPlayed} - 1`,
          sessionsWon: oldRow.isWinner
            ? sql`${rollingPlayerStatsTable.sessionsWon} - 1`
            : rollingPlayerStatsTable.sessionsWon,
          rollingScore: sql`${rollingPlayerStatsTable.rollingScore} - ${oldRow.score ?? 0}`,
        })
        .where(
          and(
            eq(rollingPlayerStatsTable.profileId, oldRow.profileId),
            eq(
              rollingPlayerStatsTable.groupId,
              newPayload[0].groupId,
            ),
          ),
        );
    }

    // Step 2: Delete old comp_game_log entries for this session
    await db
      .delete(compGameLogTable)
      .where(eq(compGameLogTable.sessionId, sessionId));

    // Step 3: Insert new comp_game_log entries
    await db.insert(compGameLogTable).values(newPayload);

    // Step 4: Apply new rolling stats
    const rollingStats = newPayload.map((log) => ({
      profileId: log.profileId,
      groupId: log.groupId,
      rollingScore: log.score!,
      sessionsPlayed: 1,
      sessionsWon: log.isWinner ? 1 : 0,
      latestSession: log.datePlayed,
    }));

    await db
      .insert(rollingPlayerStatsTable)
      .values(rollingStats)
      .onConflictDoUpdate({
        target: [
          rollingPlayerStatsTable.profileId,
          rollingPlayerStatsTable.groupId,
        ],
        set: {
          rollingScore: sql`${rollingPlayerStatsTable.rollingScore} + EXCLUDED.rolling_score`,
          sessionsPlayed: sql`${rollingPlayerStatsTable.sessionsPlayed} + 1`,
          sessionsWon: sql`${rollingPlayerStatsTable.sessionsWon} + EXCLUDED.sessions_won`,
          latestSession: sql`EXCLUDED.latest_session`,
        },
      });

    return { success: true };
  } catch (error) {
    console.error("Failed to update session:", error);
    return { success: false };
  }
}

// Get user roles for all tribes the user belongs to
export async function getUserTribeRoles(profileId: number) {
  try {
    const result = await db
      .select({
        groupId: profileGroupTable.groupId,
        roleId: profileGroupTable.roleId,
      })
      .from(profileGroupTable)
      .where(eq(profileGroupTable.profileId, profileId));

    return result;
  } catch (error) {
    console.error("Failed to get user tribe roles:", error);
    return [];
  }
}