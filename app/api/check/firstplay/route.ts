import { compGameLogTable } from "@/db/schema/compGameLog";
import { db } from "@/utils/db";
import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { gameId, profileId } = await request.json();

  // Validate request
  if (!gameId || !profileId) {
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }

  try {
    const results = await db
      .select({
        count: count(),
      })
      .from(compGameLogTable)
      .where(
        and(
          eq(compGameLogTable.gameId, gameId),
          eq(compGameLogTable.profileId, profileId)
        )
      );
    const isFirstPlay = results[0].count == 0;

    return NextResponse.json({ isFirstPlay });
  } catch (error) {
    console.error("First Play API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
