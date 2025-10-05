import { RecentGames } from "@/lib/interfaces";
import { SqUser } from "@/lib/interfaces";

export interface TopOpponentsCount {
  count: number;
  player: SqUser;
}
export function topOpponents(
  userId: number,
  sessions: RecentGames[]
): TopOpponentsCount[] {
  const counts = new Map<number, TopOpponentsCount>();

  for (const session of sessions) {
    const playerId = parseInt(session.sqUser.id);

    if (playerId === userId) {
      continue; // Skip if it matches a user
    }

    if (counts.has(playerId)) {
      counts.get(playerId)!.count += 1;
    } else {
      counts.set(playerId, {
        count: 1,
        player: session.sqUser,
      });
    }
  }

  // Convert map values into array
  const topSessions: TopOpponentsCount[] = Array.from(counts.values()).map(
    (entry) => ({
      count: entry.count,
      player: entry.player,
    })
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

export function topGames(userId: number, sessions: RecentGames[]) {
  const counts = new Map<
    string,
    {
      count: number;
      wins: number;
      game: { gameId: string; gameTitle: string };
    }
  >();

  for (const session of sessions) {
    const playerId = parseInt(session.sqUser.id);
    const bggGameId = session.comp_game_log.gameId;

    if (playerId !== userId) {
      continue; // Skip if it matches a user
    }

    if (counts.has(bggGameId)) {
      counts.get(bggGameId)!.count += 1;
      if (session.comp_game_log.isWinner) {
        counts.get(bggGameId)!.wins += 1;
      }
    } else {
      if (session.comp_game_log.isWinner) {
        counts.set(bggGameId, {
          count: 1,
          wins: 1,
          game: {
            gameId: session.comp_game_log.gameId,
            gameTitle: session.comp_game_log.gameTitle,
          },
        });
      } else {
        counts.set(bggGameId, {
          count: 1,
          wins: 0,
          game: {
            gameId: session.comp_game_log.gameId,
            gameTitle: session.comp_game_log.gameTitle,
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
    })
  );

  return topGames;
}
