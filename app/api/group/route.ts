import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { groupTable } from "@/db/schema/group";
import { eq } from "drizzle-orm";
import { profileGroupTable } from "@/db/schema/profileGroup";

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId");
    const query = db
      .select()
      .from(profileGroupTable)
      .leftJoin(groupTable, eq(profileGroupTable.groupId, groupTable.id));

    if (profileId) {
      query.where(eq(profileGroupTable.profileId, parseInt(profileId)));
    }
    const allGroups = await query;
    return NextResponse.json(allGroups, {
      headers: {
        "Cache-Control": "private, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
