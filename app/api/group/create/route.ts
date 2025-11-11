import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const entries = await request.json();

    // Insert group information
    const groupInsertOutcome = await db
      .insert(groupTable)
      .values(entries.gD)
      .returning();

    // Insert profilegroup information
    const profileGroupInsertOutcome = await db
      .insert(profileGroupTable)
      .values(entries.pWG)
      .returning();

    if (groupInsertOutcome.length > 0 && profileGroupInsertOutcome.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Successfully created group",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to create group" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Session Insert API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
