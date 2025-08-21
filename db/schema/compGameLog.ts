import {
  integer,
  pgTable,
  varchar,
  date,
  text,
  numeric,
  smallint,
  uuid,
  boolean,
  real,
  timestamp,
} from "drizzle-orm/pg-core";
import { profileTable } from "./profile";
import { groupTable } from "./group";
import { relations } from "drizzle-orm";

export const compGameLogTable = pgTable("comp_game_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: varchar("session_id").notNull(),
  datePlayed: date("date_played").notNull(),
  gameId: varchar("game_id").notNull(),
  gameTitle: text("game_title").notNull(),
  gameWeight: numeric("game_weight").notNull(),
  gameLength: integer("game_length").notNull(),
  numPlayers: smallint("num_players").notNull(),
  profileId: integer("profile_id")
    .references(() => profileTable.id)
    .notNull(),
  groupId: uuid("group_id")
    .references(() => groupTable.id)
    .notNull(),
  isVp: boolean("is_vp").notNull(),
  victoryPoints: integer("victory_points"),
  isWinner: boolean("is_winner"),
  position: smallint("position"),
  winContrib: smallint("win_contrib"),
  score: real("score"),
  highScore: boolean("high_score"),
  quarter: smallint("quarter").notNull(),
  month: smallint("month").notNull(),
  year: smallint("year").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const compGameLogTableRelations = relations(
  compGameLogTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [compGameLogTable.profileId],
      references: [profileTable.id],
    }),
    group: one(groupTable, {
      fields: [compGameLogTable.groupId],
      references: [groupTable.id],
    }),
  })
);

export type SelectCompGameLog = typeof compGameLogTable.$inferSelect;
