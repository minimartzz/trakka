"use server";

import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Gender = "Male" | "Female" | "Others";
type updatedProfile = Omit<typeof profileTable.$inferInsert, "uuid" | "email">;

export async function updateProfile(formData: FormData) {
  const userId = formData.get("userId") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const username = formData.get("username") as string;
  const description = formData.get("description") as string;
  const gender = formData.get("gender") as Gender;
  const image = formData.get("profilePicture") as string;

  const updatedProfile: updatedProfile = {
    firstName,
    lastName,
    username,
    description,
    gender,
    image,
  };

  // Push to DB
  try {
    await db
      .update(profileTable)
      .set(updatedProfile)
      .where(eq(profileTable.id, Number(userId)));

    revalidatePath("/account");

    return { success: true, message: "Profile successfully updated" };
  } catch (error) {
    console.error("Failed to update profile in Database:", error);
    return { success: false, message: "Failed to update profile" };
  }
}
