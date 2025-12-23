"use server";
import { feedbackTable } from "@/db/schema/feedback";
import { db } from "@/utils/db";

export async function submitFeedback(profileId: number, feedback: string) {
  try {
    const result = await db
      .insert(feedbackTable)
      .values({ profileId: profileId, feedback: feedback })
      .returning();

    if (result.length === 0) {
      return {
        success: false,
        message: "Failed to insert into feedback table",
      };
    }

    return {
      success: true,
      message:
        "Thank you! Your feedback has been received, we will work on it soon!",
    };
  } catch (error) {
    console.error("Failed to submit feedback:", error);
    return { success: false, message: "Failed to submit feedback" };
  }
}
