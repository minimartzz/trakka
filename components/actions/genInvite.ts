"use server";

import { groupInvitesTable } from "@/db/schema/groupInvites";
import { db } from "@/utils/db";
import { nanoid } from "nanoid";

interface ActionState {
  success: boolean;
  message?: string;
  inviteCode?: string;
}

export async function genInvite(
  tribeId: string,
  userId: number
): Promise<ActionState> {
  try {
    // Generate invite code
    const inviteCode = nanoid(10);

    await db.insert(groupInvitesTable).values({
      groupId: tribeId,
      code: inviteCode,
      createdBy: userId,
    });

    return { success: true, inviteCode: inviteCode };
  } catch (error) {
    console.error("Failed to generate invite:", error);
    return { success: false, message: "Failed to create invite link" };
  }
}
