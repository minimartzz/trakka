"use server";

import { profileGroupTable } from "@/db/schema/profileGroup";
import { profileTable } from "@/db/schema/profile";
import { groupTable } from "@/db/schema/group";
import { format } from "date-fns";
import { db } from "@/utils/db";
import { and, eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Player } from "@/components/tribes/EditTribes";

type updatedProfileGroup = typeof profileGroupTable.$inferInsert;
type updatedGroup = Omit<
  typeof groupTable.$inferInsert,
  "id" | "gamesPlayed" | "createdBy" | "dateCreated" | "createdAt"
>;

// Formatting functions
const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "yyyy-MM-dd");
};

export async function syncTribes(formData: FormData, playersUpdate: Player[]) {
  // Verify the caller is authenticated and is an admin (roleId 1 or 2) of this group
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const dateUpdated = new Date();
  const groupId = formData.get("groupId") as string;

  const [callerProfile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!callerProfile) return { success: false, message: "Unauthorized" };

  const [membership] = await db
    .select({ roleId: profileGroupTable.roleId })
    .from(profileGroupTable)
    .where(
      and(
        eq(profileGroupTable.groupId, groupId),
        eq(profileGroupTable.profileId, callerProfile.id),
      ),
    );

  if (!membership || ![1, 2].includes(membership.roleId)) {
    return { success: false, message: "Unauthorized" };
  }

  const groupName = (formData.get("groupName") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";

  if (!groupName || groupName.length > 80)
    return { success: false, message: "Group name must be 1–80 characters" };
  if (description.length > 500)
    return { success: false, message: "Description must be 500 characters or fewer" };

  // Group table info
  const groupInfo: updatedGroup = {
    name: groupName,
    description,
    lastUpdated: formatDate(dateUpdated.toString()),
    image: formData.get("groupImage") as string,
  };

  try {
    // Update Group table
    await db
      .update(groupTable)
      .set(groupInfo)
      .where(eq(groupTable.id, formData.get("groupId") as string));

    // // Deserialise the profileGroupList
    const incomingProfileIds = playersUpdate.map((player) => player.profileId);

    // Delete and Upsert Profile Group table
    await db.transaction(async (tx) => {
      if (incomingProfileIds.length > 0) {
        await tx
          .delete(profileGroupTable)
          .where(
            and(
              eq(profileGroupTable.groupId, groupId),
              notInArray(profileGroupTable.profileId, incomingProfileIds),
            ),
          );
      } else {
        await tx
          .delete(profileGroupTable)
          .where(eq(profileGroupTable.groupId, groupId));
      }

      const upsertPromises = playersUpdate.map((player) => {
        return tx
          .insert(profileGroupTable)
          .values({
            groupId: groupId,
            profileId: player.profileId,
            roleId: player.roleId,
          })
          .onConflictDoUpdate({
            target: [profileGroupTable.groupId, profileGroupTable.profileId],
            set: {
              roleId: player.roleId,
            },
          });
      });

      await Promise.all(upsertPromises);
    });

    revalidatePath(`/tribe/${groupId}`);
    return {
      success: true,
      message: "User roles and permissions successfully updated",
    };
  } catch (error) {
    console.error("Failed to update player roles", error);
    return { success: false, message: "Failed to update player roles" };
  }
}
