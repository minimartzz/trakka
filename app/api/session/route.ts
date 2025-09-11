import { compGameLogTable } from "@/db/schema/compGameLog";
import { db } from "@/utils/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const entries = await request.json();

    const dbOutcome = await db
      .insert(compGameLogTable)
      .values(entries)
      .returning();

    if (dbOutcome.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Session added successfully!",
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to insert entries." },
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
