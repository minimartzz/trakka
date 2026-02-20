import { gameTable } from "@/db/schema/game";
import { gameMechanicTable } from "@/db/schema/gameMechanic";
import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp } from "drizzle-orm/pg-core";

export const juncGameMechanicTable = pgTable("junc_game_mechanic", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  gameId: integer("game_id").notNull(),
  mechanicId: integer("mechanic_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const juncGameMechanicRelations = relations(
  juncGameMechanicTable,
  ({ one }) => ({
    game: one(gameTable, {
      fields: [juncGameMechanicTable.gameId],
      references: [gameTable.id],
    }),
    mechanic: one(gameMechanicTable, {
      fields: [juncGameMechanicTable.mechanicId],
      references: [gameMechanicTable.id],
    }),
  }),
);

export type SelectJuncGameMechanic = typeof juncGameMechanicTable.$inferSelect;
