// Custom Interfaces
import { SelectCompGameLog } from "@/db/schema/compGameLog";
import { Database } from "@/database.types";

// For User Auth
type AuthUser = Database["auth"]["Tables"]["users"]["Row"];
type UserProfile = Database["public"]["Tables"]["profile"]["Row"];
export type User = AuthUser & UserProfile;

// For Recent Games section
// Raw player data from comp game log table
export interface SessionDataInterface {
  sessionId: string;
  datePlayed: string;
  gameTitle: string;
  gameId: string;
  createdAt: Date;
  numPlayers: number;
  tribeId: string;
  tribeName: string;
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
  isVp: boolean;
  victoryPoints: number | null;
  position: number;
  isWinner: boolean;
  isTie: boolean;
  isFirstPlay: boolean;
  isHighScore: boolean;
  rating: number | null;
}

// Formatted player in each session
export interface SessionPlayer {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
  victoryPoints: number | null;
  position: number;
  isWinner: boolean;
  isTie: boolean;
  isFirstPlay: boolean;
  isHighScore: boolean;
}

// Final grouped session format
export interface GroupedSession {
  sessionId: string;
  datePlayed: string;
  gameTitle: string;
  gameId: string;
  createdAt: Date;
  numPlayers: number;
  tribe: string;
  players: SessionPlayer[];
  isVp: boolean;
  // Calculated fields
  isPlayer: boolean;
  isWinner: boolean;
  isTied: boolean;
  isLoser: boolean;
  isFirstPlay: boolean;
  isHighScore: boolean;
  rating: number | null;
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
