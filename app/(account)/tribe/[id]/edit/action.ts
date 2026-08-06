"use server";

import { profileGroupTable } from "@/db/schema/profileGroup";
import { profileTable } from "@/db/schema/profile";
import { groupTable } from "@/db/schema/group";
import { notificationsTable } from "@/db/schema/notifications";
import { format } from "date-fns";
import { db } from "@/utils/db";
import { and, eq, ilike, inArray, notInArray, or, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { requireTribeSuperAdmin } from "@/utils/auth";
import { Roles } from "@/lib/interfaces";

// Notification types routed to every SuperAdmin of a tribe (see
// requestClaim/RequestInbox); kept in sync with SuperAdmin membership below.
const SUPERADMIN_NOTIFICATION_TYPES = ["join_request", "claim_request"];

type ActionResult = { success: boolean; message: string };

export async function searchAddableProfiles(groupId: string, query: string) {
  try {
    await requireTribeSuperAdmin(groupId);
  } catch {
    return { success: false as const, message: "Unauthorized" };
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return { success: true as const, data: [] };
  }

  try {
    const memberIds = db
      .select({ profileId: profileGroupTable.profileId })
      .from(profileGroupTable)
      .where(eq(profileGroupTable.groupId, groupId));

    const pattern = `%${trimmed}%`;
    const results = await db
      .select({
        profileId: profileTable.id,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        username: profileTable.username,
        profilePic: profileTable.image,
      })
      .from(profileTable)
      .where(
        and(
          eq(profileTable.isAnonymous, false),
          notInArray(profileTable.id, memberIds),
          or(
            ilike(profileTable.firstName, pattern),
            ilike(profileTable.lastName, pattern),
            ilike(profileTable.username, pattern),
          ),
        ),
      )
      .limit(8);

    return { success: true as const, data: results };
  } catch (error) {
    console.error("Failed to search profiles:", error);
    return { success: false as const, message: "Search failed" };
  }
}

/**
 * Applies every staged settings change in one transaction:
 * tribe details plus the full member list (additions, removals, role
 * changes). The submitted list is the desired final membership; the server
 * re-derives all safety rules from the database rather than trusting the
 * client.
 */
export async function saveTribeSettings(
  groupId: string,
  formData: FormData,
  membersUpdate: { profileId: number; roleId: number }[],
): Promise<ActionResult> {
  let caller;
  try {
    caller = await requireTribeSuperAdmin(groupId);
  } catch {
    return { success: false, message: "Unauthorized" };
  }

  // Identity validation
  const groupName = (formData.get("groupName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const image = formData.get("groupImage") as string;

  if (!groupName || groupName.length > 80)
    return { success: false, message: "Group name must be 1–80 characters" };
  if (description.length > 500)
    return {
      success: false,
      message: "Description must be 500 characters or fewer",
    };

  // Membership validation
  if (membersUpdate.length === 0)
    return { success: false, message: "A tribe must have members" };
  if (membersUpdate.some((m) => ![1, 2, 3].includes(m.roleId)))
    return { success: false, message: "Invalid role" };

  const uniqueIds = new Set(membersUpdate.map((m) => m.profileId));
  if (uniqueIds.size !== membersUpdate.length)
    return { success: false, message: "Duplicate players in member list" };
  if (!uniqueIds.has(caller.profileId))
    return { success: false, message: "You can't remove yourself" };

  try {
    const message = await db.transaction(async (tx) => {
      const current = await tx
        .select({
          profileId: profileGroupTable.profileId,
          roleId: profileGroupTable.roleId,
          isAnonymous: profileTable.isAnonymous,
        })
        .from(profileGroupTable)
        .innerJoin(
          profileTable,
          eq(profileGroupTable.profileId, profileTable.id),
        )
        .where(eq(profileGroupTable.groupId, groupId));

      const currentById = new Map(current.map((m) => [m.profileId, m]));

      // New members must be real (non-anonymous) accounts
      const newIds = membersUpdate
        .map((m) => m.profileId)
        .filter((id) => !currentById.has(id));
      if (newIds.length > 0) {
        const newProfiles = await tx
          .select({ id: profileTable.id })
          .from(profileTable)
          .where(
            and(
              inArray(profileTable.id, newIds),
              eq(profileTable.isAnonymous, false),
            ),
          );
        if (newProfiles.length !== newIds.length) {
          return "One or more added players could not be found";
        }
      }

      // Caller maintains their own role, anonymous users maintain theirs
      // even if submission was made
      const finalMembers = membersUpdate.map((m) => {
        const existing = currentById.get(m.profileId);
        if (m.profileId === caller.profileId)
          return { ...m, roleId: caller.roleId };
        if (existing?.isAnonymous) return { ...m, roleId: existing.roleId };
        return m;
      });

      if (!finalMembers.some((m) => m.roleId === Roles.SuperAdmin)) {
        return "A tribe must keep at least one SuperAdmin";
      }

      // Tribe details
      await tx
        .update(groupTable)
        .set({
          name: groupName,
          description,
          image,
          lastUpdated: format(new Date(), "yyyy-MM-dd"),
        })
        .where(eq(groupTable.id, groupId));

      // Remove members that were deleted from the list
      await tx.delete(profileGroupTable).where(
        and(
          eq(profileGroupTable.groupId, groupId),
          notInArray(
            profileGroupTable.profileId,
            finalMembers.map((m) => m.profileId),
          ),
        ),
      );

      // Insert new members/ apply role changes
      for (const member of finalMembers) {
        await tx
          .insert(profileGroupTable)
          .values({
            groupId,
            profileId: member.profileId,
            roleId: member.roleId,
          })
          .onConflictDoUpdate({
            target: [profileGroupTable.groupId, profileGroupTable.profileId],
            set: { roleId: member.roleId },
          });
      }

      // Handling SuperAdmin role:
      // New SuperAdmins get existing notifications
      // Old SuperAdmins remove the notifications that they used to have
      const wasSuperAdmin = (profileId: number) =>
        currentById.get(profileId)?.roleId === Roles.SuperAdmin;
      const isSuperAdmin = (profileId: number) =>
        finalMembers.find((m) => m.profileId === profileId)?.roleId ===
        Roles.SuperAdmin;

      const previousSuperAdminIds = current
        .filter((m) => m.roleId === Roles.SuperAdmin)
        .map((m) => m.profileId);
      const promoted = finalMembers
        .filter((m) => isSuperAdmin(m.profileId) && !wasSuperAdmin(m.profileId))
        .map((m) => m.profileId);
      const demoted = current
        .filter((m) => wasSuperAdmin(m.profileId) && !isSuperAdmin(m.profileId))
        .map((m) => m.profileId);

      if (promoted.length > 0 && previousSuperAdminIds.length > 0) {
        const existingRequests = await tx
          .select({
            type: notificationsTable.type,
            data: notificationsTable.data,
          })
          .from(notificationsTable)
          .where(
            and(
              inArray(notificationsTable.profileId, previousSuperAdminIds),
              eq(notificationsTable.isRead, false),
              inArray(notificationsTable.type, SUPERADMIN_NOTIFICATION_TYPES),
              sql`${notificationsTable.data}->>'group_id' = ${groupId}`,
            ),
          );

        // Every SuperAdmin is fanned out an identical (type, data) row per
        // request, so dedupe before re-fanning out to the promoted members.
        const toInherit = Array.from(
          new Map(
            existingRequests.map((n) => [
              `${n.type}:${JSON.stringify(n.data)}`,
              n,
            ]),
          ).values(),
        );

        if (toInherit.length > 0) {
          await tx.insert(notificationsTable).values(
            promoted.flatMap((profileId) =>
              toInherit.map((n) => ({
                type: n.type,
                data: n.data,
                isRead: false,
                profileId,
              })),
            ),
          );
        }
      }

      if (demoted.length > 0) {
        await tx
          .delete(notificationsTable)
          .where(
            and(
              inArray(notificationsTable.profileId, demoted),
              inArray(notificationsTable.type, SUPERADMIN_NOTIFICATION_TYPES),
              sql`${notificationsTable.data}->>'group_id' = ${groupId}`,
            ),
          );
      }

      return null;
    });

    if (message) return { success: false, message };

    updateTag(`tribe:${groupId}`);
    revalidatePath(`/tribe/${groupId}`);
    revalidatePath(`/tribe/${groupId}/edit`);
    return { success: true, message: "Tribe settings saved" };
  } catch (error) {
    console.error("Failed to save tribe settings:", error);
    return { success: false, message: "Failed to save tribe settings" };
  }
}
