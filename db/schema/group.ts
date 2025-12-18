import { relations } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { profileGroupTable } from "./profileGroup";
import { profileTable } from "@/db/schema/profile";
import { groupInvitesTable } from "@/db/schema/groupInvites";
import { groupJoinRequestTable } from "@/db/schema/groupJoinRequests";

export const groupTable = pgTable("group", {
  id: uuid("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  image: text("image"),
  createdBy: integer("created_by").notNull(),
  dateCreated: date("date_created").notNull(),
  lastUpdated: date("last_updated").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupTableRelations = relations(groupTable, ({ one, many }) => ({
  profileGroup: many(profileGroupTable),
  createdBy: one(profileTable, {
    fields: [groupTable.createdBy],
    references: [profileTable.id],
  }),
  groupInvites: many(groupInvitesTable),
  groupJoinRequests: many(groupJoinRequestTable),
}));

export type SelectGroup = typeof groupTable.$inferSelect;
