"use server";

/**
 * Generates a reusable invite code for a group for the user.
 * If the user has already created an invite link, reuse it,
 * else create a new one
 */

import { groupInvitesTable } from "@/db/schema/groupInvites";
import { db } from "@/utils/db";
import { nanoid } from "nanoid";
import { and, eq } from "drizzle-orm";

interface ActionState {
  success: boolean;
  message?: string;
  inviteCode?: string;
}

export async function genInvite(
  tribeId: string,
  userId: number,
): Promise<ActionState> {
  try {
    const [existing] = await db
      .select({
        code: groupInvitesTable.code,
      })
      .from(groupInvitesTable)
      .where(
        and(
          eq(groupInvitesTable.createdBy, userId),
          eq(groupInvitesTable.groupId, tribeId),
        ),
      );

    if (existing) {
      return { success: true, inviteCode: existing.code };
    }

    const code = nanoid(10);
    await db.insert(groupInvitesTable).values({
      groupId: tribeId,
      code,
      createdBy: userId,
    });

    return { success: true, inviteCode: code };
  } catch (error) {
    console.error("Failed to generate invite:", error);
    return { success: false, message: "Failed to create invite link" };
  }
}
