"use server";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { notificationsTable } from "@/db/schema/notifications";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { and, eq, sql } from "drizzle-orm";

export async function getAllTribeRequests(profileId: number) {
  try {
    const result = await db
      .select({
        id: notificationsTable.id,
        profileId: notificationsTable.profileId,
        type: notificationsTable.type,
        data: notificationsTable.data,
        isRead: notificationsTable.isRead,
      })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.profileId, profileId),
          eq(notificationsTable.type, "join_request"),
          eq(notificationsTable.isRead, false)
        )
      );

    return result;
  } catch (error) {
    console.error("Failed to retrieve tribe requests: ", error);
  }
}

export async function getTribeRequestsByGroupId(
  profileId: number,
  groupId: string
) {
  try {
    const result = await db
      .select({
        id: notificationsTable.id,
        profileId: notificationsTable.profileId,
        type: notificationsTable.type,
        data: notificationsTable.data,
        isRead: notificationsTable.isRead,
      })
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.profileId, profileId),
          eq(notificationsTable.type, "join_request"),
          eq(notificationsTable.isRead, false),
          sql`${notificationsTable.data}->>'group_id' = ${groupId}`
        )
      );

    return result;
  } catch (error) {
    console.error("Failed to retrieve tribe requests: ", error);
  }
}

export async function updateTribeRequests(
  groupId: string,
  requesterId: number,
  status: string
) {
  try {
    const notifUpdate = await db
      .update(notificationsTable)
      .set({
        isRead: true,
      })
      .where(
        and(
          sql`${notificationsTable.data}->>'group_id' = ${groupId}`,
          sql`${notificationsTable.data}->>'requester_id' = ${requesterId}`
        )
      )
      .returning();

    if (notifUpdate.length === 0) {
      console.error("Failed to update notifactions table");
      return {
        success: false,
        message: "Failed to make change to user. Please try again later.",
      };
    }

    const joinRequestUpdate = await db
      .update(groupJoinRequestTable)
      .set({ status: status })
      .where(
        and(
          eq(groupJoinRequestTable.groupId, groupId),
          eq(groupJoinRequestTable.profileId, requesterId)
        )
      )
      .returning();

    if (joinRequestUpdate.length === 0) {
      console.error("Failed to update group_join_requests table");
      return {
        success: false,
        message: "Failed to make change to user. Please try again later.",
      };
    }

    if (status === "accept") {
      const insertUserToTribe = await db
        .insert(profileGroupTable)
        .values({
          groupId: groupId,
          profileId: requesterId,
          roleId: 3,
        })
        .onConflictDoNothing()
        .returning();

      if (insertUserToTribe.length === 0) {
        console.error("Failed to insert into profile_group table");
        return {
          success: false,
          message: "Failed to make change to user. Please try again later.",
        };
      }

      return {
        success: true,
        message: "Successfully added user to the group!",
      };
    } else {
      return {
        success: true,
        message: "Successfully rejected user request to join the group!",
      };
    }
  } catch (error) {
    console.error("Failed to retrieve tribe requests: ", error);
    return {
      success: false,
      message: "Failed to make change to user. Please try again later.",
    };
  }
}
