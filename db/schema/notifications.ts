import { profileTable } from "@/db/schema/profile";
import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const notificationsTable = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: integer("profile_id").notNull(),
  type: text("type").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsTableRelations = relations(
  notificationsTable,
  ({ one }) => ({
    profile: one(profileTable, {
      fields: [notificationsTable.profileId],
      references: [profileTable.id],
    }),
  }),
);

export type SelectNotifications = typeof notificationsTable.$inferSelect;
