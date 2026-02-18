import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const gameMechanicTable = pgTable("game_mechanic", {
  id: integer("id").primaryKey().notNull(),
  mechanic: text("mechanic").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameMechanicRelations = relations(
  gameMechanicTable,
  ({ many }) => ({
    juncGameMechanic: many(juncGameMechanicTable),
  }),
);

export type SelectGameMechanic = typeof gameMechanicTable.$inferSelect;
