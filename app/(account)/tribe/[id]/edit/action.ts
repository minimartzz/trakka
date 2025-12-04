"use server";

import { profileGroupTable } from "@/db/schema/profileGroup";
import { groupTable } from "@/db/schema/group";
import { format } from "date-fns";
import { db } from "@/utils/db";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type updatedProfileGroup = typeof profileGroupTable.$inferInsert;
type updatedGroup = Omit<
  typeof groupTable.$inferInsert,
  "id" | "gamesPlayed" | "createdBy" | "dateCreated" | "createdAt"
>;

// Formatting functions
const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), "yyyy-MM-dd");
};

export async function syncTribes(formData: FormData) {
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

    // Deserialise the profileGroupList
    const usersList: updatedProfileGroup[] = JSON.parse(profileGroupList);
    const incomingProfileIds = usersList.map((user) => user.profileId);

    // Delete and Upsert Profile Group table
    await db.transaction(async (tx) => {
      if (incomingProfileIds.length > 0) {
        await tx
          .delete(profileGroupTable)
          .where(
            and(
              eq(profileGroupTable.groupId, groupId),
              inArray(profileGroupTable.profileId, incomingProfileIds)
            )
          );
      } else {
        await tx
          .delete(profileGroupTable)
          .where(eq(profileGroupTable.groupId, groupId));
      }

      const upsertPromises = usersList.map((user) => {
        return tx
          .insert(profileGroupTable)
          .values({
            groupId: groupId,
            profileId: user.profileId,
            roleId: user.roleId,
          })
          .onConflictDoUpdate({
            target: [profileGroupTable.groupId, profileGroupTable.profileId],
            set: {
              roleId: user.roleId,
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
    console.error("Failed to update user roles", error);
    return { success: false, message: "Failed to update user roles" };
  }
}
