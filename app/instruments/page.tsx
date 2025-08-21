import { compGameLogTable } from "@/db/schema/compGameLog";
import { groupTable } from "@/db/schema/group";
import { profileTable } from "@/db/schema/profile";
import { profileGroupTable } from "@/db/schema/profileGroup";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import React from "react";

// Drizzle connection strings
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client);

const Page = async () => {
  const results = await db.select().from(compGameLogTable);

  return <pre>{JSON.stringify(results, null, 2)}</pre>;
};

export default Page;
