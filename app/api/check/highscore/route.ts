import { compGameLogTable } from "@/db/schema/compGameLog";
import { db } from "@/utils/db";
import { eq, max } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { gameId, score } = await request.json();

    // Validate request
    if (!gameId || score == undefined || typeof score !== "number") {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    const results = await db
      .select({
        high_score: max(compGameLogTable.victoryPoints),
      })
      .from(compGameLogTable)
      .where(eq(compGameLogTable.gameId, gameId));

    const isNewHighScore =
      results[0].high_score != null ? score >= results[0].high_score! : true;

    return NextResponse.json({ isNewHighScore });
  } catch (error) {
    console.error("Highscore API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
