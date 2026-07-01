import { desc, eq } from "drizzle-orm";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { profileTable } from "@/db/schema/profile";
import { db } from "@/utils/db";
import ResultsTicker, { type TickerResult } from "./ticker";
import { cacheLife } from "next/cache";

async function fetchTickerResults(): Promise<TickerResult[]> {
  "use cache";
  cacheLife("hours");

  const rows = await db
    .select({
      gameTitle: compGameLogTable.gameTitle,
      isVp: compGameLogTable.isVp,
      victoryPoints: compGameLogTable.victoryPoints,
      score: compGameLogTable.score,
      firstName: profileTable.firstName,
    })
    .from(compGameLogTable)
    .leftJoin(profileTable, eq(compGameLogTable.profileId, profileTable.id))
    .where(eq(compGameLogTable.isWinner, true))
    .orderBy(desc(compGameLogTable.datePlayed))
    .limit(10);

  return rows.map((r) => ({
    game: r.gameTitle,
    winner: r.firstName ?? "Unknown",
    score:
      r.isVp && r.victoryPoints != null
        ? `${r.victoryPoints} VP`
        : r.score != null
          ? `${Math.round(r.score)} pts`
          : "—",
  }));
}

const ResultsTickerServer = async () => {
  let results: TickerResult[] | undefined;
  try {
    results = await fetchTickerResults();
  } catch {
    // Fall back to static data if DB is unreachable
    results = undefined;
  }
  return <ResultsTicker results={results} />;
};

export default ResultsTickerServer;
