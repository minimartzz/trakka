"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameFamilyTable } from "@/db/schema/gameFamily";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameFamilyTable } from "@/db/schema/juncGameFamily";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { groupTable } from "@/db/schema/group";
import { notificationsTable } from "@/db/schema/notifications";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { BGGDetailsInterface } from "@/utils/fetchBgg";

type Notification = typeof notificationsTable.$inferInsert;
type CompGameLog = typeof compGameLogTable.$inferInsert;

export async function notifyPlayersOfSession(notification: Notification[]) {
  try {
    const result = await db
      .insert(notificationsTable)
      .values(notification)
      .returning();

    if (result.length === 0) {
      console.error(
        "Failed to insert new session entries into notifications table",
      );
    }
  } catch (error) {
    console.error(
      "Issue when trying to insert into notifications table:",
      error,
    );
  }
}

export async function getTribes(profileId: number) {
  try {
    const sq = db
      .select({
        id: groupTable.id,
        name: groupTable.name,
        image: groupTable.image,
      })
      .from(groupTable)
      .as("sq");

    const result = await db
      .select({
        id: profileGroupTable.groupId,
        name: sq.name,
        image: sq.image,
      })
      .from(profileGroupTable)
      .leftJoin(sq, eq(profileGroupTable.groupId, sq.id))
      .where(
        and(
          eq(profileGroupTable.profileId, profileId),
          inArray(profileGroupTable.roleId, [1, 2]),
        ),
      )
      .orderBy(sq.name);

    if (result.length === 0) {
      console.error("Did not retrieve any tribes from profileGroup table");
    }

    return result;
  } catch (error) {
    console.error("Issue when trying to retrieve tribes:", error);
    return [];
  }
}

export async function getRecentUsedTribes(profileId: number) {
  try {
    const tribeInfo = db
      .select({
        id: groupTable.id,
        name: groupTable.name,
        image: groupTable.image,
      })
      .from(groupTable)
      .as("tribeInfo");

    const result = await db
      .selectDistinctOn([compGameLogTable.groupId], {
        id: compGameLogTable.groupId,
        name: tribeInfo.name,
        image: tribeInfo.image,
        createdAt: compGameLogTable.createdAt,
      })
      .from(compGameLogTable)
      .leftJoin(tribeInfo, eq(compGameLogTable.groupId, tribeInfo.id))
      .where(
        and(
          eq(compGameLogTable.profileId, profileId),
          eq(compGameLogTable.createdBy, profileId),
        ),
      )
      .orderBy(compGameLogTable.groupId, desc(compGameLogTable.createdAt))
      .limit(3);

    return result;
  } catch (error) {
    console.error("Issue when trying to retrieve recently used tribes:", error);
    return [];
  }
}

export async function getSelectablePlayers(tribeId: string) {
  try {
    const playerDetails = db.select().from(profileTable).as("playerDetails");

    const result = await db
      .select({
        profileId: profileGroupTable.profileId,
        groupId: profileGroupTable.groupId,
        firstName: playerDetails.firstName,
        lastName: playerDetails.lastName,
        username: playerDetails.username,
        profilePic: playerDetails.image,
      })
      .from(profileGroupTable)
      .innerJoin(
        playerDetails,
        eq(profileGroupTable.profileId, playerDetails.id),
      )
      .where(eq(profileGroupTable.groupId, tribeId));

    if (result.length === 0) {
      console.error("Did not retrieve any players from profileGroup table");
    }

    return result;
  } catch (error) {
    console.error("Issue when trying to retrieve players:", error);
    return [];
  }
}

// Submit Session
export async function submitNewSession(payload: CompGameLog[]) {
  try {
    const result = await db
      .insert(compGameLogTable)
      .values(payload)
      .returning();

    if (result.length === 0) {
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to submit session: ", error);
    return { success: false };
  }
}

/**
 * Upserts game details and related metadata (categories, families, mechanics)
 * into the database. Uses onConflictDoNothing to handle duplicates efficiently.
 *
 * Strategy for minimizing DB calls:
 * 1. Single upsert for the game record
 * 2. Batch upsert for all categories, families, mechanics (3 calls)
 * 3. Batch upsert for all junction table entries (3 calls)
 * Total: 7 DB calls maximum (regardless of data size)
 */
export async function upsertGameDetails(selectedGame: BGGDetailsInterface) {
  try {
    const gameId = parseInt(selectedGame.id);

    // 1. Upsert the game record
    await db
      .insert(gameTable)
      .values({
        id: gameId,
        name: selectedGame.title,
        imageUrl: selectedGame.image || null,
        yearPublished: parseInt(selectedGame.yearPublished) || 0,
        description: selectedGame.description,
        rating: parseFloat(selectedGame.rating) || 0,
        weight: parseFloat(selectedGame.weight) || 0,
        minPlayers: parseInt(selectedGame.minPlayers) || null,
        maxPlayers: parseInt(selectedGame.maxPlayers) || null,
        recPlayers: parseInt(selectedGame.recPlayers) || null,
        playingTime: parseInt(selectedGame.playingTime) || null,
        minPlayingTime: parseInt(selectedGame.minPlayingTime) || null,
        maxPlayingTime: parseInt(selectedGame.maxPlayingTime) || null,
        minAge: parseInt(selectedGame.minAge) || null,
      })
      .onConflictDoNothing({ target: gameTable.id });

    // 2. Batch upsert categories
    if (selectedGame.categories.length > 0) {
      const categoryValues = selectedGame.categories.map((cat) => ({
        id: parseInt(cat.id),
        category: cat.name,
      }));
      await db
        .insert(gameCategoryTable)
        .values(categoryValues)
        .onConflictDoNothing({ target: gameCategoryTable.id });
    }

    // 3. Batch upsert families
    if (selectedGame.families.length > 0) {
      const familyValues = selectedGame.families.map((fam) => ({
        id: parseInt(fam.id),
        family: fam.name,
      }));
      await db
        .insert(gameFamilyTable)
        .values(familyValues)
        .onConflictDoNothing({ target: gameFamilyTable.id });
    }

    // 4. Batch upsert mechanics
    if (selectedGame.mechanics.length > 0) {
      const mechanicValues = selectedGame.mechanics.map((mech) => ({
        id: parseInt(mech.id),
        mechanic: mech.name,
      }));
      await db
        .insert(gameMechanicTable)
        .values(mechanicValues)
        .onConflictDoNothing({ target: gameMechanicTable.id });
    }

    // 5. Batch upsert junction table: game <-> categories
    if (selectedGame.categories.length > 0) {
      const juncCategoryValues = selectedGame.categories.map((cat) => ({
        gameId: gameId,
        categoryId: parseInt(cat.id),
      }));
      await db
        .insert(juncGameCategoryTable)
        .values(juncCategoryValues)
        .onConflictDoNothing();
    }

    // 6. Batch upsert junction table: game <-> families
    if (selectedGame.families.length > 0) {
      const juncFamilyValues = selectedGame.families.map((fam) => ({
        gameId: gameId,
        familyId: parseInt(fam.id),
      }));
      await db
        .insert(juncGameFamilyTable)
        .values(juncFamilyValues)
        .onConflictDoNothing();
    }

    // 7. Batch upsert junction table: game <-> mechanics
    if (selectedGame.mechanics.length > 0) {
      const juncMechanicValues = selectedGame.mechanics.map((mech) => ({
        gameId: gameId,
        mechanicId: parseInt(mech.id),
      }));
      await db
        .insert(juncGameMechanicTable)
        .values(juncMechanicValues)
        .onConflictDoNothing();
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to upsert game details:", error);
    return { success: false, error };
  }
}
