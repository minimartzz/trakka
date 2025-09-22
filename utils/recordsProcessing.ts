import {
  CombinedRecentGames,
  FilteredCounts,
  RecentGames,
} from "@/lib/interfaces";

export const filterSessions = (
  userId: number,
  data: RecentGames[]
): CombinedRecentGames[] => {
  const combinedData = data.map((item: RecentGames) => ({
    ...item.comp_game_log,
    firstName: item.sqUser.firstName,
    lastName: item.sqUser.lastName,
    username: item.sqUser.username,
    profilePic: item.sqUser.profilePic,
    tribe: item.sqGroup.name,
  }));

  const sessionMap = new Map<string, CombinedRecentGames>();

  combinedData.forEach((record) => {
    if (!sessionMap.has(record.sessionId)) {
      sessionMap.set(record.sessionId, {
        sessionId: record.sessionId,
        gameTitle: record.gameTitle,
        createdAt: record.createdAt,
        isPlayer: false,
        isWinner: false,
        isLoser: false,
        isTied: false,
        players: [],
      });
    }

    // Get the existing session info
    const session = sessionMap.get(record.sessionId);

    // Populate the information
    if (record.profileId === userId) {
      session!.isPlayer = true;
      if (record.isTie) session!.isTied = true;
      if (record.isWinner) session!.isWinner = true;
      if (session!.isPlayer && !record.isWinner) {
        session!.isLoser = true;
      }
    }

    // Add original players to the list
    session!.players.push(record);
  });

  // Sort the players by position in ascending order
  sessionMap.forEach((session) => {
    session.players.sort((a, b) => {
      return a.position! - b.position!;
    });
  });

  // Filter out entries that don't match player count
  const groups = Array.from(sessionMap.values());
  const results = Object.values(groups).filter((group) => {
    const expectedPlayers = group.players[0].numPlayers;
    return group.players.length === expectedPlayers;
  });

  // Sort results in descending order based on createdAt to get latest at top
  results.sort((a, b) => {
    const dateA = new Date(a.createdAt!);
    const dateB = new Date(b.createdAt!);

    return dateB.getTime() - dateA.getTime();
  });

  return results;
};

export const getFilteredCounts = (
  data: CombinedRecentGames[]
): FilteredCounts => {
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
    }
  );

  return counts;
};

export const getAvailableGames = (data: CombinedRecentGames[]): string[] => {
  return [...new Set(data.map((items) => items.gameTitle))].sort();
};
