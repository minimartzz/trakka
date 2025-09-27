"use server";

import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";

type Gender = "Male" | "Female" | "Others";
type NewProfile = typeof profileTable.$inferInsert;

export async function saveProfile(formData: FormData) {
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

  try {
    await db.insert(profileTable).values(newProfile);

    return { success: true };
  } catch (error) {
    console.error("Failed to insert new profile:", error);
    return { error: "Failed to save profile. Please try again", messae: error };
  }
}
