"use server";

import { notificationsTable } from "@/db/schema/notifications";
import { db } from "@/utils/db";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function deleteNotification(notificationId: string) {
  try {
    await db
      .delete(notificationsTable)
      .where(eq(notificationsTable.id, notificationId));

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Delete error: ", error);
    return { error: "Failed to delete notification" };
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    if (notificationIds.length === 0) return { success: true };

    await db
      .update(notificationsTable)
      .set({ isRead: true })
      .where(inArray(notificationsTable.id, notificationIds));

    return { success: true };
  } catch (error) {
    console.error("Mark as read error: ", error);
    return { error: "Failed to mark notifications as read" };
  }
}
