import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema/schema";

// Database client with connection pooling optimized for serverless
const client = postgres(process.env.DATABASE_URL!, {
  prepare: true, // Enable prepared statements for query caching
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 30, // Max connection lifetime of 30 minutes
});

export const db = drizzle(client, { schema });

export type DrizzleDbType = typeof db;
