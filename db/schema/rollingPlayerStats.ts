import { relations } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  real,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { profileTable } from "./profile";
import { groupTable } from "./group";

export const rollingPlayerStatsTable = pgTable(
  "rolling_player_stats",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    profileId: integer("profile_id").notNull(),
    groupId: uuid("group_id").notNull(),
    sessionsPlayed: integer("sessions_played").notNull().default(0),
    rollingScore: real("rolling_score").notNull().default(0.0),
    sessionsWon: integer("sessions_won").notNull().default(0),
    latestSession: date("latest_session").notNull(),
  },
  (t) => [
    uniqueIndex("rolling_player_stats_profile_group_idx").on(
      t.profileId,
      t.groupId,
    ),
  ],
);

export const rollingPlayerStats = relations(
  rollingPlayerStatsTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [rollingPlayerStatsTable.profileId],
      references: [profileTable.id],
    }),
    group: one(groupTable, {
      fields: [rollingPlayerStatsTable.groupId],
      references: [groupTable.id],
    }),
  }),
);

export type SelectRollingPlayerStats =
  typeof rollingPlayerStatsTable.$inferSelect;
