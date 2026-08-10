"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { gameExpansionTable } from "@/db/schema/gameExpansion";
import { groupTable } from "@/db/schema/group";
import { juncSessionExpansionTable } from "@/db/schema/juncSessionExpansion";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { profileTable } from "@/db/schema/profile";
import { rollingPlayerStatsTable } from "@/db/schema/rollingPlayerStats";
import { db } from "@/utils/db";
import { requireTribeAdmin } from "@/utils/auth";
import { and, eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";

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
        isAnonymous: profileTable.isAnonymous,
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
        thumbnail: gameTable.thumbnail,
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
        coop: compGameLogTable.coop,
        sessionDescription: compGameLogTable.sessionDescription,
        victoryPoints: compGameLogTable.victoryPoints,
        isWinner: compGameLogTable.isWinner,
        position: compGameLogTable.position,
        winContrib: compGameLogTable.winContrib,
        score: compGameLogTable.score,
        highScore: compGameLogTable.highScore,
        isTie: compGameLogTable.isTie,
        isFirstPlay: compGameLogTable.isFirstPlay,
        teamId: compGameLogTable.teamId,
        createdBy: compGameLogTable.createdBy,
        // Player details
        profileId: playerDetails.id,
        firstName: playerDetails.firstName,
        lastName: playerDetails.lastName,
        username: playerDetails.username,
        profilePic: playerDetails.profilePic,
        isAnonymous: playerDetails.isAnonymous,
        // Tribe details
        tribeName: tribeDetails.name,
        // Game details
        gameImageUrl: gameDetails.imageUrl,
        gameThumbnail: gameDetails.thumbnail,
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
      .innerJoin(
        playerDetails,
        eq(compGameLogTable.profileId, playerDetails.id),
      )
      .innerJoin(tribeDetails, eq(compGameLogTable.groupId, tribeDetails.id))
      .innerJoin(gameDetails, eq(compGameLogTable.gameId, gameDetails.id))
      .where(eq(compGameLogTable.sessionId, sessionId))
      .orderBy(compGameLogTable.position);

    if (rows.length === 0) {
      return { success: false, message: "Session not found" };
    }

    // Expansion details
    const expansions = await db
      .select({
        id: gameExpansionTable.id,
        title: gameExpansionTable.name,
        thumbnail: gameExpansionTable.thumbnail,
        image: gameExpansionTable.imageUrl,
        yearPublished: gameExpansionTable.yearPublished,
        weight: gameExpansionTable.weight,
      })
      .from(juncSessionExpansionTable)
      .innerJoin(
        gameExpansionTable,
        eq(juncSessionExpansionTable.expansionId, gameExpansionTable.id),
      )
      .where(eq(juncSessionExpansionTable.sessionId, sessionId));

    return { success: true, data: rows, expansions };
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
  oldRows: {
    profileId: number;
    isWinner: boolean;
    score: number | null;
    isVp: boolean;
  }[],
  newPayload: CompGameLog[],
  expansionIds: number[] = [],
) {
  if (newPayload.length === 0) {
    return { success: false };
  }

  // Editing a session is restricted to admins of the tribes involved.
  // Use a Set in case the edit moves the session between groups.
  const affectedGroupIds = Array.from(
    new Set(newPayload.map((log) => log.groupId)),
  );
  try {
    for (const groupId of affectedGroupIds) {
      await requireTribeAdmin(groupId);
    }
  } catch {
    return { success: false };
  }

  try {
    // Step 1: Reverse the old rolling stats. Decrement whichever bucket
    // (rated vs. unrated) the row actually contributed to when it was
    // written, so an unrated row never eats into the rated WPA columns.
    for (const oldRow of oldRows) {
      await db
        .update(rollingPlayerStatsTable)
        .set({
          sessionsPlayed: oldRow.isVp
            ? sql`${rollingPlayerStatsTable.sessionsPlayed} - 1`
            : rollingPlayerStatsTable.sessionsPlayed,
          sessionsWon:
            oldRow.isVp && oldRow.isWinner
              ? sql`${rollingPlayerStatsTable.sessionsWon} - 1`
              : rollingPlayerStatsTable.sessionsWon,
          rollingScore: oldRow.isVp
            ? sql`${rollingPlayerStatsTable.rollingScore} - ${oldRow.score ?? 0}`
            : rollingPlayerStatsTable.rollingScore,
          unratedSessionsPlayed: oldRow.isVp
            ? rollingPlayerStatsTable.unratedSessionsPlayed
            : sql`${rollingPlayerStatsTable.unratedSessionsPlayed} - 1`,
          unratedSessionsWon:
            !oldRow.isVp && oldRow.isWinner
              ? sql`${rollingPlayerStatsTable.unratedSessionsWon} - 1`
              : rollingPlayerStatsTable.unratedSessionsWon,
        })
        .where(
          and(
            eq(rollingPlayerStatsTable.profileId, oldRow.profileId),
            eq(rollingPlayerStatsTable.groupId, newPayload[0].groupId),
          ),
        );
    }

    // Step 2: Delete old comp_game_log entries for this session
    await db
      .delete(compGameLogTable)
      .where(eq(compGameLogTable.sessionId, sessionId));

    // Step 3: Insert new comp_game_log entries
    await db.insert(compGameLogTable).values(newPayload);

    // Step 4: Apply new rolling stats — same rated/unrated branch as create.
    const rollingStats = newPayload.map((log) => ({
      profileId: log.profileId,
      groupId: log.groupId,
      rollingScore: log.isVp ? log.score! : 0,
      sessionsPlayed: log.isVp ? 1 : 0,
      sessionsWon: log.isVp && log.isWinner ? 1 : 0,
      unratedSessionsPlayed: log.isVp ? 0 : 1,
      unratedSessionsWon: !log.isVp && log.isWinner ? 1 : 0,
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
          sessionsPlayed: sql`${rollingPlayerStatsTable.sessionsPlayed} + EXCLUDED.sessions_played`,
          sessionsWon: sql`${rollingPlayerStatsTable.sessionsWon} + EXCLUDED.sessions_won`,
          unratedSessionsPlayed: sql`${rollingPlayerStatsTable.unratedSessionsPlayed} + EXCLUDED.unrated_sessions_played`,
          unratedSessionsWon: sql`${rollingPlayerStatsTable.unratedSessionsWon} + EXCLUDED.unrated_sessions_won`,
          latestSession: sql`EXCLUDED.latest_session`,
        },
      });

    // Step 5: Replace the session's expansion links.
    await db
      .delete(juncSessionExpansionTable)
      .where(eq(juncSessionExpansionTable.sessionId, sessionId));
    if (expansionIds.length > 0) {
      await db
        .insert(juncSessionExpansionTable)
        .values(expansionIds.map((expansionId) => ({ sessionId, expansionId })))
        .onConflictDoNothing();
    }

    for (const groupId of affectedGroupIds) {
      updateTag(`tribe:${groupId}`);
    }

    // Invalidate recent-games cache for every player touched by the edit
    const affectedProfileIds = new Set([
      ...newPayload.map((log) => log.profileId),
      ...oldRows.map((row) => row.profileId),
    ]);
    for (const profileId of affectedProfileIds) {
      updateTag(`recent-games:${profileId}`);
    }

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
