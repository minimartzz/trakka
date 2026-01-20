"use server";

import { notificationsTable } from "@/db/schema/notifications";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
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
