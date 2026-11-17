// Per-profile session reads. Server-only on purpose: not a "use server"
// module, so fetchSessions isn't an action a browser could call with someone
// else's profile id.
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { gameExpansionTable } from "@/db/schema/gameExpansion";
import { groupTable } from "@/db/schema/group";
import { juncSessionExpansionTable } from "@/db/schema/juncSessionExpansion";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { cacheLife, cacheTag } from "next/cache";
import { desc, eq, inArray } from "drizzle-orm";
import { SessionExpansion } from "@/lib/interfaces";

// Batched lookup of expansions for a set of sessions, grouped by session id
// Prevents multiple DB roundtrips on individual sessions, but performs assignment
// for each player row subsequently through Map
export async function expansionsForSessions(
  sessionIds: string[],
): Promise<Record<string, SessionExpansion[]>> {
  const record: Record<string, SessionExpansion[]> = {};
  if (sessionIds.length === 0) return record;

  const rows = await db
    .select({
      sessionId: juncSessionExpansionTable.sessionId,
      id: gameExpansionTable.id,
      name: gameExpansionTable.name,
      thumbnail: gameExpansionTable.thumbnail,
    })
    .from(juncSessionExpansionTable)
    .innerJoin(
      gameExpansionTable,
      eq(juncSessionExpansionTable.expansionId, gameExpansionTable.id),
    )
    .where(inArray(juncSessionExpansionTable.sessionId, sessionIds));

  for (const row of rows) {
    const existing = record[row.sessionId] ?? [];
    existing.push({ id: row.id, name: row.name, thumbnail: row.thumbnail });
    record[row.sessionId] = existing;
  }

  return record;
}

async function querySessionsByProfile(profileId: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`recent-games:${profileId}`);

  const userDetails = db
    .select({
      id: profileTable.id,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
      isAnonymous: profileTable.isAnonymous,
    })
    .from(profileTable)
    .as("userDetails");

  const tribeDetails = db
    .select({
      id: groupTable.id,
      name: groupTable.name,
      image: groupTable.image,
    })
    .from(groupTable)
    .as("tribeDetails");

  const userSessions = db
    .select({
      sessionId: compGameLogTable.sessionId,
    })
    .from(compGameLogTable)
    .where(eq(compGameLogTable.profileId, profileId));

  return db
    .select({
      sessionId: compGameLogTable.sessionId,
      datePlayed: compGameLogTable.datePlayed,
      gameTitle: compGameLogTable.gameTitle,
      gameId: compGameLogTable.gameId,
      gameImage: gameTable.imageUrl,
      gameThumbnail: gameTable.thumbnail,
      gameWeight: gameTable.weight,
      playingTime: gameTable.playingTime,
      createdAt: compGameLogTable.createdAt,
      numPlayers: compGameLogTable.numPlayers,
      rowId: compGameLogTable.id,
      // Tribe Details
      tribeId: tribeDetails.id,
      tribeName: tribeDetails.name,
      tribeImage: tribeDetails.image,
      // User Details
      profileId: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      username: userDetails.username,
      profilePic: userDetails.profilePic,
      isAnonymous: userDetails.isAnonymous,
      // Session Details
      isVp: compGameLogTable.isVp,
      coop: compGameLogTable.coop,
      teamId: compGameLogTable.teamId,
      victoryPoints: compGameLogTable.victoryPoints,
      position: compGameLogTable.position,
      isWinner: compGameLogTable.isWinner,
      isTie: compGameLogTable.isTie,
      isFirstPlay: compGameLogTable.isFirstPlay,
      isHighScore: compGameLogTable.highScore,
      rating: compGameLogTable.rating,
      // Per-session WPA contribution, surfaced on the dashboard's latest
      // session card
      score: compGameLogTable.score,
      eloBefore: compGameLogTable.eloBefore,
      eloAfter: compGameLogTable.eloAfter,
      eloSessionsBefore: compGameLogTable.eloSessionsBefore,
    })
    .from(compGameLogTable)
    .innerJoin(userDetails, eq(compGameLogTable.profileId, userDetails.id))
    .innerJoin(tribeDetails, eq(compGameLogTable.groupId, tribeDetails.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(inArray(compGameLogTable.sessionId, userSessions))
    .orderBy(desc(compGameLogTable.datePlayed));
}

export async function fetchSessions(profileId: number) {
  try {
    const rows = await querySessionsByProfile(profileId);
    // Prefer the lightweight thumbnail to keep card loading fast; fall back to
    // the full image only when no thumbnail exists.
    const response = rows.map(({ gameThumbnail, ...row }) => ({
      ...row,
      gameImage: gameThumbnail ?? row.gameImage,
    }));
    const expansions = await expansionsForSessions([
      ...new Set(response.map((r) => r.sessionId)),
    ]);

    return {
      success: true,
      data: response,
      expansions,
    };
  } catch (error) {
    console.error("Failed to retrieve Sessions by Profile ID", error);
    return {
      success: false,
      message: "Failed to retrieve sessions from profile ID",
    };
  }
}
