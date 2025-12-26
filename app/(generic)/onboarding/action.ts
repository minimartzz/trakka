"use server";

import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

type Gender = "Male" | "Female" | "Others";
type NewProfile = typeof profileTable.$inferInsert;

export async function saveProfile(formData: FormData) {
  const cookieStore = await cookies();

  // Inserts a new user into "profile" table
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const description = formData.get("description") as string;
  const gender = formData.get("gender") as Gender;
  const image = formData.get("profilePicture") as string;
  const uuid = formData.get("uuid") as string;

  const newProfile: NewProfile = {
    uuid,
    firstName,
    lastName,
    email,
    username,
    description,
    gender,
    image,
  };

  const insertProfileResult = await db
    .insert(profileTable)
    .values(newProfile)
    .returning();
  if (insertProfileResult.length === 0) {
    console.error("Failed to insert new profile");
    return { error: "Failed to insert new profile" };
  }

  // Checks if there is an invite cookie to make the request
  const inviteCode = cookieStore.get("pending_invite_code")?.value;
  if (inviteCode) {
    try {
      const invite = await db
        .select({
          groupId: groupInvitesTable.groupId,
        })
        .from(groupInvitesTable)
        .where(eq(groupInvitesTable.code, inviteCode));

      // Invite code exists: Insert into "groupJoin" table
      if (invite) {
        await db.insert(groupJoinRequestTable).values({
          groupId: invite[0].groupId,
          profileId: insertProfileResult[0].id,
        });

        // Remove existing invite code
        await db
          .delete(groupInvitesTable)
          .where(eq(groupInvitesTable.code, inviteCode));
      }

      // Delete the invite code
      cookieStore.delete("pending_invite_code");
    } catch (error) {
      console.error("Failed to process auto join:", error);
      return { error: "Failed to process auto join" };
    }
  }

  return { success: true };
}
