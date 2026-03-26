import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils/db";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { eq } from "drizzle-orm";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { createClient } from "@/utils/supabase/server";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Resolve the authenticated user's profile — ignore any client-supplied profileId
    const [profile] = await db
      .select({ id: profileTable.id })
      .from(profileTable)
      .where(eq(profileTable.uuid, user.id));

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const allGroups = await db
      .select()
      .from(profileGroupTable)
      .leftJoin(groupTable, eq(profileGroupTable.groupId, groupTable.id))
      .where(eq(profileGroupTable.profileId, profile.id));

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
