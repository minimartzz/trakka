"use server";

import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const NUM_SHOWCASE_SLOTS = 2;

export async function updateShowcaseSlots(slotGameIds: (number | null)[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  if (
    slotGameIds.length > NUM_SHOWCASE_SLOTS ||
    !slotGameIds.every((id) => id === null || Number.isInteger(id))
  ) {
    return { success: false, message: "Invalid showcase game selection" };
  }

  const [profile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!profile) return { success: false, message: "Unauthorized" };

  try {
    await db
      .update(profileTable)
      .set({ showcaseSlots: slotGameIds })
      .where(eq(profileTable.id, profile.id));

    revalidatePath("/dashboard");

    return { success: true, message: "Showcase updated" };
  } catch (error) {
    console.error("Failed to update showcase slots in Database:", error);
    return { success: false, message: "Failed to update showcase" };
  }
}
