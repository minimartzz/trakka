import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const groupJoinRequestTable = pgTable("group_join_request", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id").notNull(),
  userId: integer("user_id").notNull(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupJoinRequestTableRelations = relations(
  groupJoinRequestTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [groupJoinRequestTable.userId],
      references: [profileTable.id],
    }),
    group: one(groupTable, {
      fields: [groupJoinRequestTable.groupId],
      references: [groupTable.id],
    }),
  })
);
