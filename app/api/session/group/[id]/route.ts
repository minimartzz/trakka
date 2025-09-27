import { compGameLogTable } from "@/db/schema/compGameLog";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const groupId = (await params).id;

  try {
    const sqUser = db
      .select({
        id: profileTable.id,
        firstName: profileTable.firstName,
        lastName: profileTable.lastName,
        username: profileTable.username,
        profilePic: profileTable.image,
      })
      .from(profileTable)
      .as("sqUser");

    const sqGroup = db
      .select({
        id: groupTable.id,
        name: groupTable.name,
      })
      .from(groupTable)
      .as("sqGroup");

    const rawSessions = await db
      .select()
      .from(compGameLogTable)
      .leftJoin(sqUser, eq(compGameLogTable.profileId, sqUser.id))
      .leftJoin(sqGroup, eq(compGameLogTable.groupId, sqGroup.id))
      .where(eq(compGameLogTable.groupId, groupId))
      .orderBy(desc(compGameLogTable.datePlayed))
      .limit(50);

    return NextResponse.json({ rawSessions });
  } catch (error) {
    console.error("Failed to retrieve Session by Group ID", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
