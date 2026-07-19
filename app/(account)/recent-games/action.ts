"use server";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import { cacheLife, cacheTag } from "next/cache";
import {
  and,
  countDistinct,
  desc,
  eq,
  gte,
  inArray,
  lte,
  max,
} from "drizzle-orm";
import { AvailableGame, AvailableTribe } from "@/utils/recordsProcessing";
import { FilteredCounts, SessionDataInterface } from "@/lib/interfaces";

async function querySessionsByProfile(profileId: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag(`recent-games:${profileId}`);

  const userDetails = db
    .select({
      id: profileTable.id,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
    })
    .from(profileTable)
    .as("userDetails");

  const tribeDetails = db
    .select({
      id: groupTable.id,
      name: groupTable.name,
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
      createdAt: compGameLogTable.createdAt,
      numPlayers: compGameLogTable.numPlayers,
      rowId: compGameLogTable.id,
      // Tribe Details
      tribeId: tribeDetails.id,
      tribeName: tribeDetails.name,
      // User Details + Results
      profileId: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      username: userDetails.username,
      profilePic: userDetails.profilePic,
      isVp: compGameLogTable.isVp,
      victoryPoints: compGameLogTable.victoryPoints,
      position: compGameLogTable.position,
      isWinner: compGameLogTable.isWinner,
      isTie: compGameLogTable.isTie,
      isFirstPlay: compGameLogTable.isFirstPlay,
      isHighScore: compGameLogTable.highScore,
      rating: compGameLogTable.rating,
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

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Failed to retrieve Sessions by Profile ID", error);
    return {
      success: false,
      message: "Failed to retrieve sessions from profile ID",
    };
  }
}

// Pagination for recent games: Pulls session data page by page using a page
// variable to track the offset

export interface RecentGamesFilters {
  result: "all" | "won" | "lost" | "tie";
  gameIds: number[];
  tribeIds: string[];
  from?: string;
  to?: string;
}

export interface RecentGamesPage {
  sessions: SessionDataInterface[];
  totalSessions: number;
  counts: FilteredCounts; // All games the user has played
  availableGames: AvailableGame[];
  availableTribes: AvailableTribe[];
}

// SELECT that returns the full raw player rows for a set of sessions based on the
// found session IDs of the current user
function playerRowsForSessions(sessionIds: string[]) {
  // 1. Get user details
  const userDetails = db
    .select({
      id: profileTable.id,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
    })
    .from(profileTable)
    .as("userDetails");

  // 2. Get tribe details
  const tribeDetails = db
    .select({ id: groupTable.id, name: groupTable.name })
    .from(groupTable)
    .as("tribeDetails");

  // 3. Get the sessions based on the IDs and hydrate with user and tribe details
  return db
    .select({
      sessionId: compGameLogTable.sessionId,
      datePlayed: compGameLogTable.datePlayed,
      gameTitle: compGameLogTable.gameTitle,
      gameId: compGameLogTable.gameId,
      gameImage: gameTable.imageUrl,
      gameThumbnail: gameTable.thumbnail,
      createdAt: compGameLogTable.createdAt,
      numPlayers: compGameLogTable.numPlayers,
      rowId: compGameLogTable.id,
      tribeId: tribeDetails.id,
      tribeName: tribeDetails.name,
      profileId: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      username: userDetails.username,
      profilePic: userDetails.profilePic,
      isVp: compGameLogTable.isVp,
      victoryPoints: compGameLogTable.victoryPoints,
      position: compGameLogTable.position,
      isWinner: compGameLogTable.isWinner,
      isTie: compGameLogTable.isTie,
      isFirstPlay: compGameLogTable.isFirstPlay,
      isHighScore: compGameLogTable.highScore,
      rating: compGameLogTable.rating,
    })
    .from(compGameLogTable)
    .innerJoin(userDetails, eq(compGameLogTable.profileId, userDetails.id))
    .innerJoin(tribeDetails, eq(compGameLogTable.groupId, tribeDetails.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(inArray(compGameLogTable.sessionId, sessionIds))
    .orderBy(desc(compGameLogTable.datePlayed));
}

async function queryRecentGamesPage(
  profileId: number,
  page: number,
  pageSize: number,
  filters: RecentGamesFilters,
): Promise<RecentGamesPage> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`recent-games:${profileId}`);

  // Result-filter predicate, from the user's own row only.
  const resultWhere =
    filters.result === "won"
      ? eq(compGameLogTable.isWinner, true)
      : filters.result === "lost"
        ? eq(compGameLogTable.isWinner, false)
        : filters.result === "tie"
          ? eq(compGameLogTable.isTie, true)
          : undefined;

  const filterWhere = and(
    eq(compGameLogTable.profileId, profileId),
    resultWhere,
    filters.gameIds.length > 0
      ? inArray(compGameLogTable.gameId, filters.gameIds)
      : undefined,
    filters.tribeIds.length > 0
      ? inArray(compGameLogTable.groupId, filters.tribeIds)
      : undefined,
    filters.from ? gte(compGameLogTable.datePlayed, filters.from) : undefined,
    filters.to ? lte(compGameLogTable.datePlayed, filters.to) : undefined,
  );

  // 1. Page of DISTINCT sessions the user played in, filtered + ordered.
  const pageRows = await db
    .select({
      sessionId: compGameLogTable.sessionId,
      datePlayed: max(compGameLogTable.datePlayed),
      createdAt: max(compGameLogTable.createdAt),
    })
    .from(compGameLogTable)
    .where(filterWhere)
    .groupBy(compGameLogTable.sessionId)
    .orderBy(
      // Sort by date played first; fall back to session create time
      desc(max(compGameLogTable.datePlayed)),
      desc(max(compGameLogTable.createdAt)),
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Count distinct sessions so the page count matches the grouped rows above.
  const [{ total }] = await db
    .select({ total: countDistinct(compGameLogTable.sessionId) })
    .from(compGameLogTable)
    .where(filterWhere);

  // 2. Full player rows for just this page's sessions.
  const sessionIds = pageRows.map((r) => r.sessionId);
  const rawRows =
    sessionIds.length > 0 ? await playerRowsForSessions(sessionIds) : [];
  const sessions = rawRows.map(({ gameThumbnail, ...row }) => ({
    ...row,
    gameImage: gameThumbnail ?? row.gameImage,
  }));

  // 3. Counts + filter options over the user's WHOLE history (unfiltered), so
  //    the result chips and dropdowns never shrink to the current page/filter.
  const historyRows = await db
    .select({
      sessionId: compGameLogTable.sessionId,
      gameId: compGameLogTable.gameId,
      gameTitle: compGameLogTable.gameTitle,
      gameImage: gameTable.imageUrl,
      gameThumbnail: gameTable.thumbnail,
      tribeId: compGameLogTable.groupId,
      tribeName: groupTable.name,
      isWinner: compGameLogTable.isWinner,
      isTie: compGameLogTable.isTie,
    })
    .from(compGameLogTable)
    .innerJoin(groupTable, eq(compGameLogTable.groupId, groupTable.id))
    .leftJoin(gameTable, eq(compGameLogTable.gameId, gameTable.id))
    .where(eq(compGameLogTable.profileId, profileId));

  const counts: FilteredCounts = {
    numGames: 0,
    numWins: 0,
    numLoss: 0,
    numTied: 0,
  };
  const gamesMap = new Map<number, AvailableGame>();
  const tribesMap = new Map<string, AvailableTribe>();
  // Count once per session, not per row: a user can hold multiple rows in one
  // session (team mode), which would otherwise inflate the win/loss tallies and
  // desync numGames from totalSessions.
  const countedSessions = new Set<string>();
  for (const r of historyRows) {
    if (!countedSessions.has(r.sessionId)) {
      countedSessions.add(r.sessionId);
      if (r.isWinner) counts.numWins += 1;
      else counts.numLoss += 1;
      if (r.isTie) counts.numTied += 1;
    }
    if (!gamesMap.has(r.gameId)) {
      gamesMap.set(r.gameId, {
        gameId: r.gameId,
        gameTitle: r.gameTitle,
        gameImage: r.gameThumbnail ?? r.gameImage,
      });
    }
    if (!tribesMap.has(r.tribeId)) {
      tribesMap.set(r.tribeId, { tribeId: r.tribeId, tribeName: r.tribeName });
    }
  }
  counts.numGames = counts.numWins + counts.numLoss;

  const availableGames = [...gamesMap.values()].sort((a, b) =>
    a.gameTitle.localeCompare(b.gameTitle),
  );
  const availableTribes = [...tribesMap.values()].sort((a, b) =>
    a.tribeName.localeCompare(b.tribeName),
  );

  return {
    sessions,
    totalSessions: total,
    counts,
    availableGames,
    availableTribes,
  };
}

export async function fetchRecentGamesPage(
  profileId: number,
  page: number,
  pageSize: number,
  filters: RecentGamesFilters,
) {
  try {
    const data = await queryRecentGamesPage(profileId, page, pageSize, filters);
    return { success: true, data };
  } catch (error) {
    console.error("Failed to retrieve paginated recent games", error);
    return {
      success: false,
      message: "Failed to retrieve recent games",
    };
  }
}
