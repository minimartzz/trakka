"use server";

import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";

// Get all players from profiles table
export async function getAllPlayers() {
  try {
    const result = await db
      .select({
        profileId: profileTable.id,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        username: profileTable.username,
        profilePic: profileTable.image,
      })
      .from(profileTable);

    return { success: true, data: result };
  } catch (error) {
    console.error("[DB] Failed to retrieve players: ", error);
    return { success: false, message: "Failed to retrieve players" };
  }
}
