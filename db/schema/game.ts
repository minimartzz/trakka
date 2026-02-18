import { juncGameCategoryTable } from "@/db/schema/juncGameCategory";
import { juncGameFamilyTable } from "@/db/schema/juncGameFamily";
import { juncGameMechanicTable } from "@/db/schema/juncGameMechanic";
import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  real,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const gameTable = pgTable("game", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  yearPublished: smallint("year_published").notNull(),
  description: text("description").notNull(),
  rating: real("rating").notNull(),
  weight: real("weight").notNull(),
  minPlayers: smallint("min_players"),
  maxPlayers: smallint("max_players"),
  recPlayers: smallint("rec_players"),
  playingTime: smallint("playing_time"),
  minPlayingTime: smallint("min_playing_time"),
  maxPlayingTime: smallint("max_playing_time"),
  minAge: smallint("min_age"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameRelations = relations(gameTable, ({ many }) => ({
  juncGameCategory: many(juncGameCategoryTable),
  juncGameMechanic: many(juncGameMechanicTable),
  juncGameFamily: many(juncGameFamilyTable),
}));

export type SelectGame = typeof gameTable.$inferSelect;
