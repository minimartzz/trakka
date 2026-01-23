"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { groupTable } from "@/db/schema/group";
import { notificationsTable } from "@/db/schema/notifications";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { and, desc, eq, inArray } from "drizzle-orm";

type Notification = typeof notificationsTable.$inferInsert;

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
      .leftJoin(
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
