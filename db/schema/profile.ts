import { relations } from "drizzle-orm";
import {
  AnyPgColumn,
  boolean,
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
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  claimCode: varchar("claim_code").unique(),
  // Pending-claim lock: set to the claiming user's profile id while a claim
  // request is awaiting SuperAdmin approval (null = available to claim). Only
  // one user can hold the lock at a time. Self-referential FK — the claimer
  // always has a profile row by the time this is written.
  claimRequestedBy: integer("claim_requested_by").references(
    (): AnyPgColumn => profileTable.id,
  ),
  claimRequestedAt: timestamp("claim_requested_at"),
});

export const profileRelations = relations(profileTable, ({ many, one }) => ({
  profileGroup: many(profileGroupTable),
  usersTable: one(usersTable),
  groupInvites: many(groupInvitesTable),
  groupJoinRequests: many(groupJoinRequestTable),
  notifications: many(notificationsTable),
}));

export type SelectProfile = typeof profileTable.$inferSelect;
