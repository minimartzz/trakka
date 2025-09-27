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
import { usersTable } from "@/db/schema/authUser";

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
}));

export type SelectProfile = typeof profileTable.$inferSelect;
