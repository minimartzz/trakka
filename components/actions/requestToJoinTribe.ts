"use server";

import { and, eq } from "drizzle-orm";
import { groupTable } from "@/db/schema/group";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { getCallerProfileRow } from "@/utils/fetchServerUser";

// Asks to join the Tribe a session belongs to, from the no-permissions page.
// Same request as an invite link makes, so it lands in the admins' inbox.
export async function requestToJoinTribe(
  groupId: string,
): Promise<{ success: boolean }> {
  const caller = await getCallerProfileRow();
  if (!caller) return { success: false };

  try {
    const [tribe] = await db
      .select({ id: groupTable.id })
      .from(groupTable)
      .where(eq(groupTable.id, groupId));
    if (!tribe) return { success: false };

    // Spam guard: members and players with a pending request skip the insert
    const [membership] = await db
      .select({ profileId: profileGroupTable.profileId })
      .from(profileGroupTable)
      .where(
        and(
          eq(profileGroupTable.groupId, groupId),
          eq(profileGroupTable.profileId, caller.id),
        ),
      );
    if (membership) return { success: true };

    const [pending] = await db
      .select({ id: groupJoinRequestTable.id })
      .from(groupJoinRequestTable)
      .where(
        and(
          eq(groupJoinRequestTable.groupId, groupId),
          eq(groupJoinRequestTable.profileId, caller.id),
          eq(groupJoinRequestTable.status, "pending"),
        ),
      );
    if (!pending) {
      await db
        .insert(groupJoinRequestTable)
        .values({ groupId, profileId: caller.id });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to request to join tribe:", error);
    return { success: false };
  }
}
