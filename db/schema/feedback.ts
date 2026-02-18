import { profileTable } from "@/db/schema/profile";
import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const feedbackTable = pgTable("feedback", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  profileId: integer("profile_id").notNull(),
  feedback: text("feedback").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedbackTableRelations = relations(feedbackTable, ({ one }) => ({
  profile: one(profileTable, {
    fields: [feedbackTable.profileId],
    references: [profileTable.id],
  }),
}));

export type SelectFeedback = typeof feedbackTable.$inferSelect;
