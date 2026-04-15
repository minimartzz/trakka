import type { SelectHistDailyPlayerStats } from "@/db/schema/histDailyPlayerStats";
import type { SelectHistMonthlyPlayerStats } from "@/db/schema/histMonthlyPlayerStats";
import type { SelectRollingPlayerStats } from "@/db/schema/rollingPlayerStats";

// ─── Session ──────────────────────────────────────────────────────────────────

export interface GameSession {
  sessionId: string;
  datePlayed: string;
  gameId: number;
  gameTitle: string;
  gameImageUrl: string | null;
  playingTime: number | null;
  gameWeight: number | null;
  players: {
    profileId: number;
    username: string;
    firstName: string;
    lastName: string;
    image: string | null;
    isWinner: boolean;
    position: number;
    score: number | null;
    victoryPoints: number | null;
    winContrib: number | null;
    isFirstPlay?: boolean;
  }[];
}

// ─── Tribe members ────────────────────────────────────────────────────────────

export interface TribeMember {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  roleId: number;
  joinedAt: string | null;
  gamesPlayed: number;
  wins: number;
  winRate: number;
}

export interface TribeAdmin {
  profileGroup: {
    id: number;
    profileId: number;
    groupId: string;
    roleId: number;
  };
  profile: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    image: string | null;
  } | null;
}

// ─── Historical stats ─────────────────────────────────────────────────────────

export interface HistStatsInterface {
  rollingStats: SelectRollingPlayerStats[];
  dailyPlayerStats: SelectHistDailyPlayerStats[];
  monthlyPlayerStats: SelectHistMonthlyPlayerStats[];
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export type TimeFilter =
  | "today"
  | "past_week"
  | "past_month"
  | "past_year"
  | "all_time";

// ─── Games carousel ───────────────────────────────────────────────────────────

export interface PopularGame {
  gameId: string;
  gameTitle: string;
  playCount: number;
  lastPlayed: string;
  imageUrl?: string | null;
}

// ─── Game details (for Games tab) ─────────────────────────────────────────────

export interface GameListItem {
  gameId: number;
  gameTitle: string;
  playCount: number;
  imageUrl: string | null;
}

export interface LeadingPlayer {
  profileId: number;
  username: string;
  firstName: string;
  lastName: string;
  image: string | null;
  count: number;
  avgVp: number | null;
  recentGames: {
    sessionId: string;
    datePlayed: string;
    position: number;
    victoryPoints: number | null;
    isWinner: boolean;
  }[];
}
