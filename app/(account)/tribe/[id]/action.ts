"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";

export async function getTribeMembers(groupId: string) {
  const members = await db
    .select({
      profileGroup: profileGroupTable,
      profile: profileTable,
    })
    .from(profileGroupTable)
    .leftJoin(profileTable, eq(profileGroupTable.profileId, profileTable.id))
    .where(eq(profileGroupTable.groupId, groupId));

  return members;
}

export async function getTribeDetails(groupId: string) {
  const tribeDetails = await db
    .select()
    .from(groupTable)
    .leftJoin(profileTable, eq(groupTable.createdBy, profileTable.id))
    .where(eq(groupTable.id, groupId));

  return tribeDetails;
}

export async function getTribeGameSessions(groupId: string) {
  const sessions = await db
    .select({
      compGameLog: compGameLogTable,
      profile: profileTable,
    })
    .from(compGameLogTable)
    .leftJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .where(eq(compGameLogTable.groupId, groupId));

  return sessions;
}
