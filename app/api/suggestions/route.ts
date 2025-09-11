import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");

  if (!term || term.trim() === "") {
    return NextResponse.json([]);
  }

  try {
    const data = await db
      .select({
        id: profileTable.id,
        displayName: profileTable.firstName,
        username: profileTable.username,
      })
      .from(profileTable)
      .where(
        or(
          ilike(profileTable.firstName, `${term}%`),
          ilike(profileTable.username, `${term}%`)
        )
      )
      .orderBy(profileTable.firstName)
      .limit(5);

    return NextResponse.json(data);
  } catch (err) {
    console.log("Error fetching suggestions: ", err);
    return NextResponse.json({ error: "Failed to fetch suggestions" });
  }
}
