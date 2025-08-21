import { relations } from "drizzle-orm";
import { integer, pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { profileTable } from "./profile";
import { groupTable } from "./group";

export const profileGroupTable = pgTable("profile_group", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  profileId: integer("profile_id")
    .references(() => profileTable.id)
    .notNull(),
  groupId: uuid("group_id")
    .references(() => groupTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profileGroupRelations = relations(
  profileGroupTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [profileGroupTable.profileId],
      references: [profileTable.id],
    }),
    group: one(groupTable, {
      fields: [profileGroupTable.groupId],
      references: [groupTable.id],
    }),
  })
);

export type SelectProfileGroup = typeof profileGroupTable.$inferSelect;
