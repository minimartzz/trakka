import { gameExpansionTable } from "@/db/schema/gameExpansion";
import { relations } from "drizzle-orm";
import { integer, pgTable, timestamp, varchar, index } from "drizzle-orm/pg-core";

export const juncSessionExpansionTable = pgTable(
  "junc_session_expansion",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sessionId: varchar("session_id").notNull(),
    expansionId: integer("expansion_id")
      .references(() => gameExpansionTable.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("junc_session_expansion_session_idx").on(t.sessionId)],
);

export const juncSessionExpansionRelations = relations(
  juncSessionExpansionTable,
  ({ one }) => ({
    expansion: one(gameExpansionTable, {
      fields: [juncSessionExpansionTable.expansionId],
      references: [gameExpansionTable.id],
    }),
  }),
);

export type SelectJuncSessionExpansion =
  typeof juncSessionExpansionTable.$inferSelect;
