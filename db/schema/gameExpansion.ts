import { gameTable } from "@/db/schema/game";
import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const gameExpansionTable = pgTable("game_expansion", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  thumbnail: text("thumbnail"),
  yearPublished: smallint("year_published"),
  weight: real("weight"),
  baseGameId: integer("base_game_id")
    .references(() => gameTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameExpansionRelations = relations(
  gameExpansionTable,
  ({ one }) => ({
    baseGame: one(gameTable, {
      fields: [gameExpansionTable.baseGameId],
      references: [gameTable.id],
    }),
  }),
);

export type SelectGameExpansion = typeof gameExpansionTable.$inferSelect;
