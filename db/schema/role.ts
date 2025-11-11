import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const roleTable = pgTable("role", {
  id: integer("id").primaryKey(),
  roleName: varchar("role_name").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type SelectRole = typeof roleTable.$inferSelect;
