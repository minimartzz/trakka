"use server";

import { profileGroupTable } from "@/db/schema/profileGroup";
import { groupTable } from "@/db/schema/group";
import { format } from "date-fns";
import { db } from "@/utils/db";
import { and, eq, notInArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
  const dateUpdated = new Date();
  const groupId = formData.get("groupId") as string;
  const profileGroupList = formData.get("profileGroupList") as string;

  // Group table info
  const groupInfo: updatedGroup = {
    name: formData.get("groupName") as string,
    description: formData.get("description") as string,
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
