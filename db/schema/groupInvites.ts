import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const groupInvitesTable = pgTable("group_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id").notNull(),
  code: text("code").notNull().unique(),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupInvitesTableRelations = relations(
  groupInvitesTable,
  ({ one }) => ({
    createdBy: one(profileTable, {
      fields: [groupInvitesTable.createdBy],
      references: [profileTable.id],
    }),
    group: one(groupTable, {
      fields: [groupInvitesTable.groupId],
      references: [groupTable.id],
    }),
  }),
);

export type SelectGroupInvites = typeof groupInvitesTable.$inferSelect;
