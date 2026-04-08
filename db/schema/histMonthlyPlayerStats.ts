import { relations } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  real,
  smallint,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { profileTable } from "./profile";
import { groupTable } from "./group";

export const histMonthlyPlayerStatsTable = pgTable("hist_daily_player_stats", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp("created_at").defaultNow(),
  profileId: integer("profile_id").notNull(),
  groupId: uuid("group_id").notNull(),
  sessionsPlayed: integer("sessions_played").notNull().default(1),
  score: real("score").notNull().default(0.0),
  winRate: real("win_rate").notNull().default(0.0),
  snapshotDate: date("snapshot_date").notNull(),
  year: smallint("year").notNull(),
  month: smallint("month").notNull(),
  day: smallint("day").notNull(),
});

export const histMonthlyPlayerStatsTableRelations = relations(
  histMonthlyPlayerStatsTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [histMonthlyPlayerStatsTable.profileId],
      references: [profileTable.id],
    }),
    group: one(groupTable, {
      fields: [histMonthlyPlayerStatsTable.profileId],
      references: [groupTable.id],
    }),
  }),
);

export type SelectHistMonthlyPlayerStats =
  typeof histMonthlyPlayerStatsTable.$inferSelect;
