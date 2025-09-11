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

export const groupTable = pgTable("group", {
  id: uuid("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description").notNull(),
  gamesPlayed: integer("games_played").notNull().default(0),
  dateCreated: date("date_created").notNull(),
  lastUpdated: date("last_updated").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const groupTableRelations = relations(groupTable, ({ many }) => ({
  profileGroup: many(profileGroupTable),
}));

export type SelectGroup = typeof groupTable.$inferSelect;
