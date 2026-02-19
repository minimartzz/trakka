import { GameSession } from "@/components/tribes/TribeHomeTab";
import { TribeMember } from "@/components/tribes/TribePlayersTab";
import { compGameLogTable, SelectCompGameLog } from "@/db/schema/compGameLog";
import { SelectGame } from "@/db/schema/game";
import { profileTable, SelectProfile } from "@/db/schema/profile";
import { SelectProfileGroup } from "@/db/schema/profileGroup";

export interface TribeMemberInterface {
  profileGroup: SelectProfileGroup;
  profile: SelectProfile | null;
}

// Process game logs into sessions
export function processGameSessions(
  logs: {
    compGameLog: SelectCompGameLog;
    profile: SelectProfile | null;
    gameDetails: SelectGame | null;
  }[],
): GameSession[] {
  const sessionMap = new Map<string, GameSession>();

  logs.forEach((log) => {
    const { compGameLog, profile, gameDetails } = log;

    if (!sessionMap.has(compGameLog.sessionId)) {
      sessionMap.set(compGameLog.sessionId, {
        sessionId: compGameLog.sessionId,
        datePlayed: compGameLog.datePlayed,
        gameId: compGameLog.gameId,
        gameTitle: compGameLog.gameTitle,
        gameImageUrl: gameDetails?.imageUrl || null,
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
    });
  });

  return Array.from(sessionMap.values());
}

// Process members with stats
export function processMembersWithStats(
  members: TribeMemberInterface[],
  sessions: GameSession[],
): TribeMember[] {
  return members.map((member) => {
    const profileId = member.profileGroup.profileId;

    // Calculate stats from sessions
    let gamesPlayed = 0;
    let wins = 0;

    sessions.forEach((session) => {
      const playerInSession = session.players.find(
        (p) => p.profileId === profileId,
      );
      if (playerInSession) {
        gamesPlayed++;
        if (playerInSession.isWinner) {
          wins++;
        }
      }
    });

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
      gamesPlayed,
      wins,
      winRate,
    };
  });
}
