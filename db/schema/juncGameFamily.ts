import { gameTable } from "@/db/schema/game";
import { gameFamilyTable } from "@/db/schema/gameFamily";
import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp } from "drizzle-orm/pg-core";

export const juncGameFamilyTable = pgTable("junc_game_family", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  gameId: integer("game_id").notNull(),
  familyId: integer("family_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const juncGameFamilyRelations = relations(
  juncGameFamilyTable,
  ({ one }) => ({
    game: one(gameTable, {
      fields: [juncGameFamilyTable.gameId],
      references: [gameTable.id],
    }),
    family: one(gameFamilyTable, {
      fields: [juncGameFamilyTable.familyId],
      references: [gameFamilyTable.id],
    }),
  }),
);

export type SelectJuncGameFamily = typeof juncGameFamilyTable.$inferSelect;
