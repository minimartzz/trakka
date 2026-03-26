import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { createClient } from "@/utils/supabase/server";
import { ilike, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const term = searchParams.get("term");

  if (!term || term.trim() === "") {
    return NextResponse.json([]);
  }

  // Prevent DoS via excessively large search strings
  if (term.length > 50) {
    return NextResponse.json({ error: "Search term too long" }, { status: 400 });
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

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch (err) {
    console.log("Error fetching suggestions: ", err);
    return NextResponse.json({ error: "Failed to fetch suggestions" });
  }
}
