// Custom Interfaces
import { SelectCompGameLog } from "@/db/schema/compGameLog";
import { Database } from "@/database.types";

// For User Auth
type AuthUser = Database["auth"]["Tables"]["users"]["Row"];
type UserProfile = Database["public"]["Tables"]["profile"]["Row"];
export type User = AuthUser & UserProfile;

// For Recent Games section
export interface SqUser {
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
  profileId: number;
  position: number;
}
export interface RecentGames {
  comp_game_log: SelectCompGameLog;
  sqUser: SqUser;
  sqGroup: SqGroup;
}
export interface CombinedRecentGames {
  sessionId: string;
  gameTitle: string;
  createdAt: Date | null;
  datePlayed: string;
  isPlayer: boolean;
  isWinner: boolean;
  isLoser: boolean;
  isTied: boolean;
  players: joinedCompGameLog[];
  tribe: string;
  rating: number;
}

export interface FilteredCounts {
  numGames: number;
  numWins: number;
  numLoss: number;
  numPlayed: number;
  numTied: number;
}

// For Groups
export const Roles = {
  SuperAdmin: 1,
  Admin: 2,
  Member: 3,
};

// For Tribe Requests
export interface TribeRequest {
  id: string;
  profileId: number;
  type: string;
  data: {
    group_id: string;
    requester: {
      image: string;
      username: string;
      last_name: string;
      first_name: string;
    };
    group_name: string;
    request_id: string;
    requester_id: number;
  };
  isRead: boolean;
}
