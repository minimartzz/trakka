import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { groupTable } from "@/db/schema/group";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { and, eq, inArray } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profileId");
    const permittedGroups = db
      .select({
        groupId: profileGroupTable.groupId,
      })
      .from(profileGroupTable)
      .where(
        and(
          eq(profileGroupTable.profileId, parseInt(profileId!)),
          inArray(profileGroupTable.roleId, [1, 2])
        )
      );

    const selectableGroups = await db
      .select()
      .from(groupTable)
      .where(inArray(groupTable.id, permittedGroups));
    // const allGroups = await db.select().from(groupTable);

    return NextResponse.json(selectableGroups);
  } catch (error) {
    console.error("Error fetching groups:", error);

    return NextResponse.json(
      { error: "Failed to fetch groups" },

      { status: 500 }
    );
  }
}
