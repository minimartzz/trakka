import {
  CombinedRecentGroupGames,
  FilteredCounts,
  RecentGroupGames,
} from "@/lib/interfaces";

export const filterSessions = (
  userId: number,
  data: RecentGroupGames[]
): CombinedRecentGroupGames[] => {
  const combinedData = data.map((item: RecentGroupGames) => ({
    ...item.comp_game_log,
    firstName: item.sqUser.firstName,
    lastName: item.sqUser.lastName,
    username: item.sqUser.username,
    tribe: item.sqGroup.name,
  }));

  const sessionMap = new Map<string, CombinedRecentGroupGames>();

  combinedData.forEach((record) => {
    if (!sessionMap.has(record.sessionId)) {
      sessionMap.set(record.sessionId, {
        sessionId: record.sessionId,
        gameTitle: record.gameTitle,
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
      if (session!.isPlayer && !record.isWinner && !record.isTie) {
        session!.isLoser = true;
      }
    }

    // Add original players to the list
    session!.players.push(record);
  });

  // Filter out entries that don't match player count
  const groups = Array.from(sessionMap.values());
  const results = Object.values(groups).filter((group) => {
    const expectedPlayers = group.players[0].numPlayers;
    return group.players.length === expectedPlayers;
  });

  return results;
};

export const getFilteredCounts = (
  data: CombinedRecentGroupGames[]
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
