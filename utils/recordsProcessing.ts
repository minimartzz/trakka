import {
  FilteredCounts,
  GroupedSession,
  SessionDataInterface,
  SessionPlayer,
} from "@/lib/interfaces";

export const filterSessionData = (
  userId: number,
  data: SessionDataInterface[],
): GroupedSession[] => {
  const sessionMap = new Map<string, GroupedSession>();

  // Group records into sessions
  data.forEach((record) => {
    if (!sessionMap.has(record.sessionId)) {
      sessionMap.set(record.sessionId, {
        sessionId: record.sessionId,
        datePlayed: record.datePlayed,
        gameTitle: record.gameTitle,
        gameId: record.gameId,
        createdAt: new Date(record.createdAt),
        numPlayers: record.numPlayers,
        tribe: record.tribeName,
        players: [],
        isVp: record.isVp,
        isPlayer: false,
        isWinner: false,
        isTied: false,
        isLoser: false,
        isFirstPlay: record.isFirstPlay,
        isHighScore: record.isHighScore,
        rating: record.rating,
      });
    }

    const player: SessionPlayer = {
      profileId: record.profileId,
      firstName: record.firstName,
      lastName: record.lastName,
      username: record.username,
      profilePic: record.profilePic,
      victoryPoints: record.victoryPoints,
      position: record.position,
      isWinner: record.isWinner,
      isTie: record.isTie,
      isFirstPlay: record.isFirstPlay,
      isHighScore: record.isHighScore,
    };

    sessionMap.get(record.sessionId)!.players.push(player);
  });

  // Sort players, remove invalid sessions (players != numPlayers), user stats
  const cleanedSessions = Array.from(sessionMap.values())
    // Remove sessions where numPlayers != found players in session
    .filter((session) => {
      return session.players.length === session.numPlayers;
    })
    .map((session) => {
      // Sort players by position
      session.players.sort((a, b) => a.position! - b.position!);

      // Find the player records
      const userRecord = session.players.find(
        (player) => player.profileId === userId,
      );
      if (!userRecord) return session;

      // Find out if player is loser by comparing their position to highest position in session
      const allPosition = session.players.map((player) => player.position);
      const highestPosition = Math.max(...allPosition);

      return {
        ...session,
        isPlayer: true,
        isWinner: userRecord.isWinner,
        isTied: userRecord.isTie,
        isLoser: userRecord.position === highestPosition,
        isFirstPlay: userRecord.isFirstPlay,
        isHighScore: userRecord.isHighScore,
        rating:
          data.find(
            (e) => e.sessionId === session.sessionId && e.profileId === userId,
          )?.rating ?? null,
      };
    });

  // Sort sessions by descending order
  const sortedSessions = cleanedSessions.sort((a, b) => {
    if (b.datePlayed !== a.datePlayed) {
      return b.datePlayed.localeCompare(a.datePlayed);
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return sortedSessions;
};

export const getFilteredCounts = (data: GroupedSession[]): FilteredCounts => {
  const counts = data.reduce<FilteredCounts>(
    (acc, item) => {
      acc.numGames += 1;
      if (item.isPlayer) acc.numPlayed += 1;
      if (item.isWinner) acc.numWins += 1;
      if (item.isLoser) acc.numLoss += 1;
      if (item.isTied) acc.numTied += 1;
      return acc;
    },
    {
      numGames: 0,
      numWins: 0,
      numLoss: 0,
      numPlayed: 0,
      numTied: 0,
    },
  );

  return counts;
};

export const getAvailableGames = (data: GroupedSession[]): string[] => {
  return [...new Set(data.map((items) => items.gameTitle))].sort();
};

export const positionOrdinalSuffix = (position: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const remainder = position % 100;

  const ordinal =
    suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0];

  return `${position}${ordinal}`;
};
