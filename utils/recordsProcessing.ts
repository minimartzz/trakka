import { RecentGroupGames } from "@/lib/interfaces";

export const filterSessions = (data: RecentGroupGames[]) => {
  const combinedData = data.map((item: RecentGroupGames) => ({
    ...item.comp_game_log,
    firstName: item.sqUser.firstName,
    lastName: item.sqUser.lastName,
    username: item.sqUser.username,
    tribe: item.sqGroup.name,
  }));

  const groups = combinedData.reduce((acc, item) => {
    if (!acc[item.sessionId]) {
      acc[item.sessionId] = [];
    }
    acc[item.sessionId].push(item);
    return acc;
  }, {});

  const result = Object.values(groups).filter((group) => {
    const expectedTotal = group[0].numPlayers;
    return group.length === expectedTotal;
  });

  return result;
};
