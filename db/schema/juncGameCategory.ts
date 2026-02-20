import { gameTable } from "@/db/schema/game";
import { gameCategoryTable } from "@/db/schema/gameCategory";
import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp } from "drizzle-orm/pg-core";

export const juncGameCategoryTable = pgTable("junc_game_category", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  gameId: integer("game_id").notNull(),
  categoryId: integer("category_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const juncGameCategoryRelations = relations(
  juncGameCategoryTable,
  ({ one }) => ({
    game: one(gameTable, {
      fields: [juncGameCategoryTable.gameId],
      references: [gameTable.id],
    }),
    category: one(gameCategoryTable, {
      fields: [juncGameCategoryTable.categoryId],
      references: [gameCategoryTable.id],
    }),
  }),
);

export type SelectJuncGameCategory = typeof juncGameCategoryTable.$inferSelect;
