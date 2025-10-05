import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { groupTable } from "@/db/schema/group";

export async function GET() {
  try {
    const allGroups = await db.select().from(groupTable);

    return NextResponse.json(allGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);

    return NextResponse.json(
      { error: "Failed to fetch groups" },

      { status: 500 }
    );
  }
}
