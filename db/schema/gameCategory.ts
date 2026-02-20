import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const gameCategoryTable = pgTable("game_category", {
  id: integer("id").primaryKey().notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameCategoryRelations = relations(
  gameCategoryTable,
  ({ many }) => ({
    juncGameCategory: many(juncGameCategoryTable),
  }),
);

export type SelectGameCategory = typeof gameCategoryTable.$inferSelect;
