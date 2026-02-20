import { juncGameFamilyTable } from "@/db/schema/juncGameFamily";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const gameFamilyTable = pgTable("game_family", {
  id: integer("id").primaryKey().notNull(),
  family: text("family").notNull(),
  familyRenamed: text("family_renamed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameFamilyRelations = relations(gameFamilyTable, ({ many }) => ({
  juncGameFamily: many(juncGameFamilyTable),
}));

export type SelectGameFamily = typeof gameFamilyTable.$inferSelect;
