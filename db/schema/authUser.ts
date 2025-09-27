import { pgSchema, uuid } from "drizzle-orm/pg-core";

export const authSchema = pgSchema("auth");

export const usersTable = authSchema.table("users", {
  id: uuid("id").primaryKey().notNull(),
});
