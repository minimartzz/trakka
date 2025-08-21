import { relations } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { profileGroupTable } from "./profileGroup";

export const profileTable = pgTable("profile", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  username: varchar("username").unique().notNull(),
  description: text("description").notNull(),
  gender: varchar("gender", { enum: ["Male", "Female", "Others"] }).notNull(),
  image: text("image").notNull(),
  dateJoined: date("date_joined").notNull(),
  lastLogin: date("last_login").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const profileRelations = relations(profileTable, ({ many }) => ({
  profileGroup: many(profileGroupTable),
}));

export type SelectProfile = typeof profileTable.$inferSelect;
