"use server";

import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Gender = "Male" | "Female" | "Others";
type updatedProfile = Omit<typeof profileTable.$inferInsert, "uuid" | "email">;

export async function updateProfile(formData: FormData) {
  // Resolve the caller's identity from their session — never trust client-supplied userId
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const [profile] = await db
    .select({ id: profileTable.id })
    .from(profileTable)
    .where(eq(profileTable.uuid, user.id));

  if (!profile) return { success: false, message: "Unauthorized" };

  const firstName = (formData.get("firstName") as string)?.trim();
  const lastName = (formData.get("lastName") as string)?.trim();
  const username = (formData.get("username") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() ?? "";
  const gender = formData.get("gender") as Gender;
  const image = formData.get("profilePicture") as string;

  if (!firstName || firstName.length > 50)
    return { success: false, message: "First name must be 1–50 characters" };
  if (!lastName || lastName.length > 50)
    return { success: false, message: "Last name must be 1–50 characters" };
  if (!username || username.length > 30 || !/^[a-zA-Z0-9_]+$/.test(username))
    return { success: false, message: "Username must be 1–30 alphanumeric characters or underscores" };
  if (description.length > 300)
    return { success: false, message: "Description must be 300 characters or fewer" };
  if (!["Male", "Female", "Others"].includes(gender))
    return { success: false, message: "Invalid gender value" };

  const updatedProfile: updatedProfile = {
    firstName,
    lastName,
    username,
    description,
    gender,
    image,
  };

  try {
    await db
      .update(profileTable)
      .set(updatedProfile)
      .where(eq(profileTable.id, profile.id));

    revalidatePath("/account");

    return { success: true, message: "Profile successfully updated" };
  } catch (error) {
    console.error("Failed to update profile in Database:", error);
    return { success: false, message: "Failed to update profile" };
  }
}
