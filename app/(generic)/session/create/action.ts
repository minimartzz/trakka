"use server";

import { notificationsTable } from "@/db/schema/notifications";
import { db } from "@/utils/db";

type Notification = typeof notificationsTable.$inferInsert;

export async function notifyPlayersOfSession(notification: Notification[]) {
  try {
    const result = await db
      .insert(notificationsTable)
      .values(notification)
      .returning();

    if (result.length === 0) {
      console.error(
        "Failed to insert new session entries into notifications table",
      );
    }
  } catch (error) {
    console.error("Issue when trying to insert into notifications table:");
  }
}
