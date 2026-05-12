"use server";
import { notificationsTable } from "@/db/schema/notifications";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { and, eq, inArray, sql } from "drizzle-orm";

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
          eq(notificationsTable.isRead, false),
        ),
      );

    return result;
  } catch (error) {
    console.error("Failed to retrieve tribe requests: ", error);
  }
}

export async function getTribeRequestsByGroupId(
  profileId: number,
  groupId: string,
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
          sql`${notificationsTable.data}->>'group_id' = ${groupId}`,
        ),
      );

    return result;
  } catch (error) {
    console.error("Failed to retrieve tribe requests: ", error);
  }
}

export async function updateTribeRequests(
  groupId: string,
  tribeName: string,
  tribeImageUrl: string,
  requesterId: number,
  status: string,
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const [callerProfile] = await db
      .select({ id: profileTable.id })
      .from(profileTable)
      .where(eq(profileTable.uuid, user.id));

    if (!callerProfile) {
      return { success: false, message: "Unauthorized" };
    }

    const [membership] = await db
      .select({ roleId: profileGroupTable.roleId })
      .from(profileGroupTable)
      .where(
        and(
          eq(profileGroupTable.groupId, groupId),
          eq(profileGroupTable.profileId, callerProfile.id),
          inArray(profileGroupTable.roleId, [1, 2]),
        ),
      );

    if (!membership) {
      return { success: false, message: "Unauthorized" };
    }

    const { data: claimed, error: rpcError } = await supabase.rpc(
      "approve_join_request",
      {
        p_req_id: requesterId,
        p_group_id: groupId,
        p_decision: status,
      },
    );

    if (rpcError) {
      console.error("approve_join_request RPC failed:", rpcError);
      return {
        success: false,
        message: "Failed to make change to user. Please try again later.",
      };
    }

    if (!claimed) {
      return {
        success: false,
        message: "This request has already been handled by another admin.",
      };
    }

    // Tell the requester what happened. Runs only on the winning call so
    // the requester sees exactly one notification.
    await db.insert(notificationsTable).values({
      type: "tribe_join",
      data: {
        tribeName,
        tribeImageUrl,
        outcome: status,
      },
      isRead: false,
      profileId: requesterId,
    });

    return {
      success: true,
      message:
        status === "accept"
          ? "Successfully added user to the group!"
          : "Successfully rejected user request to join the group!",
    };
  } catch (error) {
    console.error("Failed to update tribe request: ", error);
    return {
      success: false,
      message: "Failed to make change to user. Please try again later.",
    };
  }
}
