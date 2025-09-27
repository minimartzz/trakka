import { compGameLogTable } from "@/db/schema/compGameLog";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profileId = parseInt((await params).id);

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

    const selSessions = db
      .select({
        sessionId: compGameLogTable.sessionId,
      })
      .from(compGameLogTable)
      .where(eq(compGameLogTable.profileId, profileId));

    const rawSessions = await db
      .select()
      .from(compGameLogTable)
      .leftJoin(sqUser, eq(compGameLogTable.profileId, sqUser.id))
      .leftJoin(sqGroup, eq(compGameLogTable.groupId, sqGroup.id))
      .where(inArray(compGameLogTable.sessionId, selSessions))
      .orderBy(desc(compGameLogTable.datePlayed));

    return NextResponse.json({ rawSessions });
  } catch (error) {
    console.error("Failed to retrieve Session by Profile ID", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
