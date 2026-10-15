import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  real,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { profileTable } from "./profile";

// Each player's current Elo per game. A cached snapshot of the latest
// elo_after in comp_game_log; a replay can always rebuild it.
export const playerGameEloTable = pgTable(
  "player_game_elo",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    profileId: integer("profile_id")
      .references(() => profileTable.id)
      .notNull(),
    gameId: integer("game_id").notNull(),
    elo: real("elo").notNull(),
    sessionsPlayed: integer("sessions_played").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("player_game_elo_profile_game_idx").on(t.profileId, t.gameId),
  ],
);

export const playerGameEloRelations = relations(
  playerGameEloTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [playerGameEloTable.profileId],
      references: [profileTable.id],
    }),
  }),
);

export type SelectPlayerGameElo = typeof playerGameEloTable.$inferSelect;
