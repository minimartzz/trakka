"use server";

import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameFamilyTable } from "@/db/schema/gameFamily";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { groupTable } from "@/db/schema/group";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameFamilyTable } from "@/db/schema/juncGameFamily";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
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
  // const categories = db
  //   .select({
  //     gameId: juncGameCategoryTable.gameId,
  //     category: gameCategoryTable.category,
  //   })
  //   .from(juncGameCategoryTable)
  //   .leftJoin(
  //     gameCategoryTable,
  //     eq(juncGameCategoryTable.categoryId, gameCategoryTable.id),
  //   );

  // const families = db
  //   .select({
  //     gameId: juncGameFamilyTable.gameId,
  //     family: gameFamilyTable.family,
  //   })
  //   .from(juncGameFamilyTable)
  //   .leftJoin(
  //     gameFamilyTable,
  //     eq(juncGameFamilyTable.familyId, gameFamilyTable.id),
  //   );

  // const mechanics = db
  //   .select({
  //     gameId: juncGameMechanicTable.gameId,
  //     mechanic: gameMechanicTable.mechanic,
  //   })
  //   .from(juncGameMechanicTable)
  //   .leftJoin(
  //     gameMechanicTable,
  //     eq(juncGameMechanicTable.mechanicId, gameMechanicTable.id),
  //   );

  const sessions = await db
    .select({
      compGameLog: compGameLogTable,
      profile: profileTable,
      gameDetails: gameTable,
    })
    .from(compGameLogTable)
    .leftJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(eq(compGameLogTable.groupId, groupId));

  return sessions;
}
