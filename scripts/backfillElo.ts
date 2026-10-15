// One-off: replays every game's Elo from its first session (docs/ELO.md).
// Run after applying db/migrations/0001_elo.sql:
//   npx tsx scripts/backfillElo.ts
// Safe to re-run; a replay always produces the same result.
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Imported after dotenv so DATABASE_URL is set when the client is created
  const { db } = await import("@/utils/db");
  const { compGameLogTable } = await import("@/db/schema/compGameLog");
  const { replayGameElo } = await import("@/utils/eloReplay");

  const games = await db
    .selectDistinct({ gameId: compGameLogTable.gameId })
    .from(compGameLogTable);

  for (const [i, { gameId }] of games.entries()) {
    await db.transaction((tx) => replayGameElo(tx, gameId, "0001-01-01"));
    console.log(`Replayed game ${gameId} (${i + 1}/${games.length})`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Elo backfill failed:", error);
  process.exit(1);
});
