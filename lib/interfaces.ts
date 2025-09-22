// Custom Interfaces
import { SelectCompGameLog } from "@/db/schema/compGameLog";

// For Recent Games section
interface SqUser {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
}
interface SqGroup {
  id: string;
  name: string;
}
interface joinedCompGameLog extends SelectCompGameLog {
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
}
export interface RecentGames {
  comp_game_log: SelectCompGameLog;
  sqUser: SqUser;
  sqGroup: SqGroup;
}
export interface CombinedRecentGames {
  sessionId: string;
  gameTitle: string;
  isPlayer: boolean;
  isWinner: boolean;
  isLoser: boolean;
  isTied: boolean;
  players: joinedCompGameLog[];
}

export interface FilteredCounts {
  numGames: number;
  numWins: number;
  numLoss: number;
  numPlayed: number;
  numTied: number;
}
