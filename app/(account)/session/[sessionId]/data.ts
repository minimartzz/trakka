import { format } from "date-fns";
import { and, eq, inArray, lte } from "drizzle-orm";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { gameTable } from "@/db/schema/game";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { gameExpansionTable } from "@/db/schema/gameExpansion";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { groupTable } from "@/db/schema/group";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { juncSessionExpansionTable } from "@/db/schema/juncSessionExpansion";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import {
  Roles,
  type SessionExpansion,
  type SessionPlayer,
} from "@/lib/interfaces";
import { db } from "@/utils/db";
import {
  buildEloRace,
  playNumbers,
  sessionMode,
  type EloRacePoint,
  type SessionMode,
} from "@/utils/sessionPage";

// Uncached on purpose: the page must reflect edits and Elo replays at once,
// and one session is only a handful of rows.

export interface SessionTribe {
  id: string;
  name: string;
  image: string;
}

export interface SessionGame {
  image: string | null;
  thumbnail: string | null;
  yearPublished: number | null;
  weight: number;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  minPlayingTime: number | null;
  maxPlayingTime: number | null;
  mechanics: string[];
  categories: string[];
}

// A session card's player, plus what only this page shows
export interface SessionPagePlayer
  extends Omit<SessionPlayer, "rowId" | "score"> {
  isAnonymous: boolean;
  // Per-session WPA
  wpa: number | null;
  // This session is their Nth play of the game
  playNumber: number;
}

export interface SessionPageData {
  sessionId: string;
  datePlayed: string;
  gameTitle: string;
  numPlayers: number;
  mode: SessionMode;
  description: string | null;
  tribe: SessionTribe;
  // Null if the game's details were never stored
  game: SessionGame | null;
  expansions: SessionExpansion[];
  // In finishing order
  players: SessionPagePlayer[];
  // Each player's last Rated Sessions of the game. Null unless this session
  // moved someone's Elo.
  eloRace: Record<number, EloRacePoint[]> | null;
  canEdit: boolean;
}

export type SessionPageResult =
  | { kind: "not-found" }
  | { kind: "no-access"; tribe: SessionTribe; requestPending: boolean }
  | { kind: "ok"; data: SessionPageData };

const querySessionRows = (sessionId: string) =>
  db
    .select({
      rowId: compGameLogTable.id,
      datePlayed: compGameLogTable.datePlayed,
      createdAt: compGameLogTable.createdAt,
      gameId: compGameLogTable.gameId,
      gameTitle: compGameLogTable.gameTitle,
      numPlayers: compGameLogTable.numPlayers,
      groupId: compGameLogTable.groupId,
      tribeName: groupTable.name,
      tribeImage: groupTable.image,
      isVp: compGameLogTable.isVp,
      coop: compGameLogTable.coop,
      description: compGameLogTable.sessionDescription,
      profileId: compGameLogTable.profileId,
      firstName: profileTable.firstName,
      lastName: profileTable.lastName,
      username: profileTable.username,
      profilePic: profileTable.image,
      isAnonymous: profileTable.isAnonymous,
      teamId: compGameLogTable.teamId,
      victoryPoints: compGameLogTable.victoryPoints,
      position: compGameLogTable.position,
      isWinner: compGameLogTable.isWinner,
      isTie: compGameLogTable.isTie,
      isFirstPlay: compGameLogTable.isFirstPlay,
      isHighScore: compGameLogTable.highScore,
      wpa: compGameLogTable.score,
      eloBefore: compGameLogTable.eloBefore,
      eloAfter: compGameLogTable.eloAfter,
      eloSessionsBefore: compGameLogTable.eloSessionsBefore,
    })
    .from(compGameLogTable)
    .innerJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .innerJoin(groupTable, eq(compGameLogTable.groupId, groupTable.id))
    .where(eq(compGameLogTable.sessionId, sessionId));

async function queryGame(gameId: number): Promise<SessionGame | null> {
  const [[game], mechanics, categories] = await Promise.all([
    db
      .select({
        image: gameTable.imageUrl,
        thumbnail: gameTable.thumbnail,
        yearPublished: gameTable.yearPublished,
        weight: gameTable.weight,
        minPlayers: gameTable.minPlayers,
        maxPlayers: gameTable.maxPlayers,
        playingTime: gameTable.playingTime,
        minPlayingTime: gameTable.minPlayingTime,
        maxPlayingTime: gameTable.maxPlayingTime,
      })
      .from(gameTable)
      .where(eq(gameTable.id, gameId)),
    db
      .select({ name: gameMechanicTable.mechanic })
      .from(juncGameMechanicTable)
      .innerJoin(
        gameMechanicTable,
        eq(juncGameMechanicTable.mechanicId, gameMechanicTable.id),
      )
      .where(eq(juncGameMechanicTable.gameId, gameId)),
    db
      .select({ name: gameCategoryTable.category })
      .from(juncGameCategoryTable)
      .innerJoin(
        gameCategoryTable,
        eq(juncGameCategoryTable.categoryId, gameCategoryTable.id),
      )
      .where(eq(juncGameCategoryTable.gameId, gameId)),
  ]);

  if (!game) return null;
  return {
    ...game,
    // 0 is how BGG reports an unknown year
    yearPublished: game.yearPublished || null,
    mechanics: mechanics.map((m) => m.name),
    categories: categories.map((c) => c.name),
  };
}

const queryExpansions = (sessionId: string): Promise<SessionExpansion[]> =>
  db
    .select({
      id: gameExpansionTable.id,
      name: gameExpansionTable.name,
      thumbnail: gameExpansionTable.thumbnail,
    })
    .from(juncSessionExpansionTable)
    .innerJoin(
      gameExpansionTable,
      eq(juncSessionExpansionTable.expansionId, gameExpansionTable.id),
    )
    .where(eq(juncSessionExpansionTable.sessionId, sessionId));

// Every row these players have of the game up to this session's date, from any
// Tribe. Later same-day sessions are dropped by the helpers' replay order.
const queryHistory = (gameId: number, profileIds: number[], date: string) =>
  db
    .select({
      profileId: compGameLogTable.profileId,
      sessionId: compGameLogTable.sessionId,
      datePlayed: compGameLogTable.datePlayed,
      createdAt: compGameLogTable.createdAt,
      groupId: compGameLogTable.groupId,
      eloAfter: compGameLogTable.eloAfter,
      eloSessionsBefore: compGameLogTable.eloSessionsBefore,
    })
    .from(compGameLogTable)
    .where(
      and(
        eq(compGameLogTable.gameId, gameId),
        inArray(compGameLogTable.profileId, profileIds),
        lte(compGameLogTable.datePlayed, date),
      ),
    );

async function queryMembershipRole(profileId: number, groupId: string) {
  const [membership] = await db
    .select({ roleId: profileGroupTable.roleId })
    .from(profileGroupTable)
    .where(
      and(
        eq(profileGroupTable.profileId, profileId),
        eq(profileGroupTable.groupId, groupId),
      ),
    );
  return membership?.roleId ?? null;
}

async function queryRequestPending(profileId: number, groupId: string) {
  const [request] = await db
    .select({ id: groupJoinRequestTable.id })
    .from(groupJoinRequestTable)
    .where(
      and(
        eq(groupJoinRequestTable.profileId, profileId),
        eq(groupJoinRequestTable.groupId, groupId),
        eq(groupJoinRequestTable.status, "pending"),
      ),
    );
  return request !== undefined;
}

// The session's game title and date, for members only: the page title must not
// tell outsiders what was played
export async function getSessionTitle(
  sessionId: string,
  viewerId: number,
): Promise<string | null> {
  const [row] = await db
    .select({
      gameTitle: compGameLogTable.gameTitle,
      datePlayed: compGameLogTable.datePlayed,
      groupId: compGameLogTable.groupId,
    })
    .from(compGameLogTable)
    .where(eq(compGameLogTable.sessionId, sessionId))
    .limit(1);
  if (!row) return null;

  const roleId = await queryMembershipRole(viewerId, row.groupId);
  return roleId === null
    ? null
    : `${row.gameTitle} · ${format(new Date(row.datePlayed), "d MMM yyyy")}`;
}

export async function getSessionPage(
  sessionId: string,
  viewerId: number,
): Promise<SessionPageResult> {
  const rows = await querySessionRows(sessionId);
  if (rows.length === 0) return { kind: "not-found" };

  // Session-level fields are identical on every row
  const first = rows[0];
  const tribe: SessionTribe = {
    id: first.groupId,
    name: first.tribeName,
    image: first.tribeImage,
  };

  const roleId = await queryMembershipRole(viewerId, tribe.id);
  if (roleId === null) {
    return {
      kind: "no-access",
      tribe,
      requestPending: await queryRequestPending(viewerId, tribe.id),
    };
  }

  const mode = sessionMode(first);
  const [game, expansions, history] = await Promise.all([
    queryGame(first.gameId),
    queryExpansions(sessionId),
    queryHistory(
      first.gameId,
      rows.map((r) => r.profileId),
      first.datePlayed,
    ),
  ]);

  const order = {
    sessionId,
    datePlayed: first.datePlayed,
    createdAt: first.createdAt,
  };
  const plays = playNumbers(history, order);
  const race =
    mode === "rated"
      ? buildEloRace(history, { ...order, groupId: tribe.id })
      : null;

  // Finishing order, with insertion order breaking ties as on session cards
  const players: SessionPagePlayer[] = [...rows]
    .sort((a, b) => a.position - b.position || a.rowId - b.rowId)
    .map((r) => ({
      profileId: r.profileId,
      firstName: r.firstName,
      lastName: r.lastName,
      username: r.username,
      profilePic: r.profilePic,
      isAnonymous: r.isAnonymous,
      teamId: r.teamId,
      victoryPoints: r.victoryPoints,
      position: r.position,
      isWinner: r.isWinner,
      isTie: r.isTie,
      isFirstPlay: r.isFirstPlay,
      isHighScore: r.isHighScore,
      wpa: r.wpa,
      eloBefore: r.eloBefore,
      eloAfter: r.eloAfter,
      eloSessionsBefore: r.eloSessionsBefore,
      playNumber: plays.get(r.profileId) ?? 1,
    }));

  return {
    kind: "ok",
    data: {
      sessionId,
      datePlayed: first.datePlayed,
      gameTitle: first.gameTitle,
      numPlayers: first.numPlayers,
      mode,
      description:
        rows.map((r) => r.description?.trim()).find(Boolean) ?? null,
      tribe,
      game,
      expansions,
      players,
      eloRace: race && race.size > 0 ? Object.fromEntries(race) : null,
      canEdit: roleId === Roles.SuperAdmin || roleId === Roles.Admin,
    },
  };
}
