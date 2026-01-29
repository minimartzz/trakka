import { SessionDataInterface } from "@/lib/interfaces";

export interface OpponentCountsUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
}

export interface TopOpponentsCount {
  count: number;
  player: OpponentCountsUser;
}
export function topOpponents(
  userId: number,
  sessions: SessionDataInterface[],
): TopOpponentsCount[] {
  const counts = new Map<number, TopOpponentsCount>();

  for (const session of sessions) {
    const playerId = session.profileId;

    if (playerId === userId) {
      continue; // Skip if it matches a user
    }

    if (counts.has(playerId)) {
      counts.get(playerId)!.count += 1;
    } else {
      counts.set(playerId, {
        count: 1,
        player: {
          id: session.profileId.toString(),
          firstName: session.firstName,
          lastName: session.lastName,
          username: session.username,
          profilePic: session.profilePic,
        },
      });
    }
  }

  // Convert map values into array
  const topSessions: TopOpponentsCount[] = Array.from(counts.values()).map(
    (entry) => ({
      count: entry.count,
      player: entry.player,
    }),
  );

  topSessions.sort((a, b) => b.count - a.count);

  return topSessions;
}

export interface TopGamesCount {
  count: number;
  wins: number;
  winRate: number;
  game: { gameId: string; gameTitle: string };
}

export function topGames(userId: number, sessions: SessionDataInterface[]) {
  const counts = new Map<
    string,
    {
      count: number;
      wins: number;
      game: { gameId: string; gameTitle: string };
    }
  >();

  for (const session of sessions) {
    const playerId = session.profileId;
    const bggGameId = session.gameId;

    if (playerId !== userId) {
      continue; // Skip if it matches a user
    }

    if (counts.has(bggGameId)) {
      counts.get(bggGameId)!.count += 1;
      if (session.isWinner) {
        counts.get(bggGameId)!.wins += 1;
      }
    } else {
      if (session.isWinner) {
        counts.set(bggGameId, {
          count: 1,
          wins: 1,
          game: {
            gameId: session.gameId,
            gameTitle: session.gameTitle,
          },
        });
      } else {
        counts.set(bggGameId, {
          count: 1,
          wins: 0,
          game: {
            gameId: session.gameId,
            gameTitle: session.gameTitle,
          },
        });
      }
    }
  }

  const topGames: TopGamesCount[] = Array.from(counts.values()).map(
    (entry) => ({
      count: entry.count,
      wins: entry.wins,
      winRate: Math.ceil((entry.wins / entry.count) * 100),
      game: {
        gameId: entry.game.gameId,
        gameTitle: entry.game.gameTitle,
      },
    }),
  );

  const topGamesSorted = topGames.sort((a, b) => b.count - a.count);

  return topGamesSorted;
}
