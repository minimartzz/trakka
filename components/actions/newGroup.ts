"use server";

import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";

type groupInsert = typeof groupTable.$inferInsert;
type playerTribeInsert = typeof profileGroupTable.$inferInsert;

export async function createTribe(
  tribeDetails: groupInsert,
  playerTribeDetails: playerTribeInsert[],
) {
  try {
    return await db.transaction(async (tx) => {
      const tribeResult = await tx
        .insert(groupTable)
        .values(tribeDetails)
        .returning();
      if (tribeResult.length === 0) {
        throw new Error("Failed to insert tribe");
      }

      const tribePlayerResult = await tx
        .insert(profileGroupTable)
        .values(playerTribeDetails)
        .returning();
      if (tribePlayerResult.length === 0) {
        throw new Error("Failed to insert player-tribe");
      }

      return { success: true };
    });
  } catch (error) {
    console.error("Failed to insert in DB to create Tribe");
    return { success: false };
  }
}
