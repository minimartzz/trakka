"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { db } from "@/utils/db";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function submitSessionRating(
  profileId: number,
  sessionId: string,
  rating: number
) {
  try {
    const result = await db
      .update(compGameLogTable)
      .set({ rating: rating })
      .where(
        and(
          eq(compGameLogTable.profileId, profileId),
          eq(compGameLogTable.sessionId, sessionId)
        )
      )
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        message: "Failed to update database with session rating",
      };
    }

    revalidatePath("/recent-games");
    return {
      success: true,
      message: "Your rating for the session has been submitted",
    };
  } catch (error) {
    console.error("Failed to submit session rating:", error);
    return { success: false, message: "Failed to submit session rating" };
  }
}
