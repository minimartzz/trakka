import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { profileGroupTable } from "./profileGroup";
import { usersTable } from "@/db/schema/authUser";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";
import { notificationsTable } from "@/db/schema/notifications";

export const profileTable = pgTable("profile", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid("uuid").references(() => usersTable.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  username: varchar("username").unique().notNull(),
  description: text("description").notNull(),
  gender: varchar("gender", { enum: ["Male", "Female", "Others"] }).notNull(),
  image: text("image").notNull(),
});

export const profileRelations = relations(profileTable, ({ many, one }) => ({
  profileGroup: many(profileGroupTable),
  usersTable: one(usersTable),
  groupInvites: many(groupInvitesTable),
  groupJoinRequests: many(groupJoinRequestTable),
  notifications: many(notificationsTable),
}));

export type SelectProfile = typeof profileTable.$inferSelect;
