import { type GameSession, type TribeMember } from "@/types/tribes";
import { compGameLogTable, SelectCompGameLog } from "@/db/schema/compGameLog";
import { SelectGame } from "@/db/schema/game";
import { profileTable, SelectProfile } from "@/db/schema/profile";
import { SelectProfileGroup } from "@/db/schema/profileGroup";

export interface TribeMemberInterface {
  profileGroup: SelectProfileGroup;
  profile: Pick<
    SelectProfile,
    "id" | "username" | "firstName" | "lastName" | "image"
  > | null;
}

// Only select the columns that are used
// Pick<> separates the columns that are required from an existing Type definition
export interface SessionLogRow {
  compGameLog: Pick<
    SelectCompGameLog,
    | "sessionId"
    | "datePlayed"
    | "createdAt"
    | "gameId"
    | "gameTitle"
    | "profileId"
    | "isWinner"
    | "position"
    | "score"
    | "victoryPoints"
    | "winContrib"
  >;
  profile: Pick<
    SelectProfile,
    "username" | "firstName" | "lastName" | "image"
  > | null;
  gameDetails: Pick<
    SelectGame,
    "imageUrl" | "thumbnail" | "playingTime" | "weight"
  > | null;
}

// Process game logs into sessions
export function processGameSessions(logs: SessionLogRow[]): GameSession[] {
  const sessionMap = new Map<string, GameSession>();

  logs.forEach((log) => {
    const { compGameLog, profile, gameDetails } = log;

    if (!sessionMap.has(compGameLog.sessionId)) {
      sessionMap.set(compGameLog.sessionId, {
        sessionId: compGameLog.sessionId,
        datePlayed: compGameLog.datePlayed,
        createdAt: compGameLog.createdAt
          ? compGameLog.createdAt.toISOString()
          : compGameLog.datePlayed,
        gameId: compGameLog.gameId,
        gameTitle: compGameLog.gameTitle,
        gameImageUrl: gameDetails?.imageUrl || null,
        thumbnail: gameDetails?.thumbnail || null,
        playingTime: gameDetails?.playingTime || null,
        gameWeight: gameDetails?.weight || null,
        players: [],
      });
    }

    const session = sessionMap.get(compGameLog.sessionId)!;
    session.players.push({
      profileId: compGameLog.profileId,
      username: profile?.username || "username",
      firstName: profile?.firstName || "Anonymous User",
      lastName: profile?.lastName || "",
      image: profile?.image || null,
      isWinner: compGameLog.isWinner,
      position: compGameLog.position,
      score: compGameLog.score,
      victoryPoints: compGameLog.victoryPoints,
      winContrib: compGameLog.winContrib,
    });
  });

  return Array.from(sessionMap.values());
}

// Process members with stats
export function processMembersWithStats(
  members: TribeMemberInterface[],
  sessions: GameSession[],
): TribeMember[] {
  const statsByProfile = new Map<
    number,
    { gamesPlayed: number; wins: number }
  >();
  for (const session of sessions) {
    const counted = new Set<number>();
    for (const player of session.players) {
      if (counted.has(player.profileId)) continue;
      counted.add(player.profileId);

      const entry = statsByProfile.get(player.profileId) ?? {
        gamesPlayed: 0,
        wins: 0,
      };
      entry.gamesPlayed += 1;
      if (player.isWinner) entry.wins += 1;
      statsByProfile.set(player.profileId, entry);
    }
  }

  return members.map((member) => {
    const profileId = member.profileGroup.profileId;
    const { gamesPlayed, wins } = statsByProfile.get(profileId) ?? {
      gamesPlayed: 0,
      wins: 0,
    };

    // TODO: WPA calculation comes here
    const winRate =
      gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;

    return {
      profileId,
      username: member.profile?.username || "Unknown",
      firstName: member.profile?.firstName || "Unknown",
      lastName: member.profile?.lastName || "",
      image: member.profile?.image || null,
      roleId: member.profileGroup.roleId,
      joinedAt: member.profileGroup.createdAt
        ? member.profileGroup.createdAt.toISOString()
        : null,
      gamesPlayed,
      wins,
      winRate,
    };
  });
}
