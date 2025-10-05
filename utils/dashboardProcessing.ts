import { RecentGames } from "@/lib/interfaces";
import { SqUser } from "@/lib/interfaces";

export interface Top5OpponentsCount {
  count: number;
  player: SqUser;
}
export function top5Opponents(
  userId: number,
  sessions: RecentGames[]
): Top5OpponentsCount[] {
  const counts = new Map<number, { count: number; player: SqUser }>();

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
  const topSessions: Top5OpponentsCount[] = Array.from(counts.values()).map(
    (entry) => ({
      count: entry.count,
      player: entry.player,
    })
  );

  topSessions.sort((a, b) => b.count - a.count);

  const topFive = topSessions.slice(0, 5);

  return topFive;
}
