import { and, desc, eq, gte, isNotNull, lt, notInArray, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { compGameLogTable } from "@/db/schema/compGameLog";
import { playerGameEloTable } from "@/db/schema/playerGameElo";
import type { DrizzleDbType } from "@/utils/db";
import { replayElo, type PlayerEloState } from "@/utils/elo";

export type Tx = Parameters<Parameters<DrizzleDbType["transaction"]>[0]>[0];

// Who a replay touched, so callers can invalidate their caches
export interface EloReplayAffected {
  profileIds: number[];
  groupIds: string[];
}

// Arbitrary first key for pg_advisory_xact_lock; the second is the game id
const ELO_LOCK_NAMESPACE = 7457;
// Rows per UPDATE, keeping well under Postgres' bind-parameter limit
const UPDATE_CHUNK_SIZE = 1000;

// Takes the per-game Elo locks, held until the transaction ends. Callers take
// them first, before writing any comp_game_log rows, and sorted, so two writers
// to the same games can't deadlock on row locks or on each other.
export async function lockGamesForElo(tx: Tx, gameIds: Iterable<number>) {
  for (const gameId of [...new Set(gameIds)].sort((a, b) => a - b)) {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${ELO_LOCK_NAMESPACE}, ${gameId})`,
    );
  }
}

// Recalculates a game's Elo from `fromDate` (YYYY-MM-DD) onwards: rewrites
// elo_before/elo_after/elo_sessions_before on every row from that date and
// rebuilds the game's player_game_elo rows. Must run inside the transaction
// that changed the game's sessions, after lockGamesForElo. See docs/ELO.md and
// docs/adr/0002.
export async function replayGameElo(
  tx: Tx,
  gameId: number,
  fromDate: string,
): Promise<EloReplayAffected> {
  // Re-taking a held lock is a no-op; this covers callers like the backfill
  await lockGamesForElo(tx, [gameId]);

  // Each player's state from their latest Rated Session before fromDate
  const prior = await tx
    .selectDistinctOn([compGameLogTable.profileId], {
      profileId: compGameLogTable.profileId,
      eloAfter: compGameLogTable.eloAfter,
      eloSessionsBefore: compGameLogTable.eloSessionsBefore,
    })
    .from(compGameLogTable)
    .where(
      and(
        eq(compGameLogTable.gameId, gameId),
        lt(compGameLogTable.datePlayed, fromDate),
        isNotNull(compGameLogTable.eloAfter),
      ),
    )
    // Must match replayElo's order exactly: created_at at millisecond
    // precision (as a JS Date holds it) and session_id by code unit.
    .orderBy(
      compGameLogTable.profileId,
      desc(compGameLogTable.datePlayed),
      desc(sql`date_trunc('milliseconds', ${compGameLogTable.createdAt})`),
      desc(sql`${compGameLogTable.sessionId} collate "C"`),
    );

  const start = new Map<number, PlayerEloState>(
    prior.map((p) => [
      p.profileId,
      { elo: p.eloAfter!, sessionsPlayed: p.eloSessionsBefore! + 1 },
    ]),
  );

  // Every row from fromDate, unrated ones included so stale Elo gets cleared
  const rows = await tx
    .select({
      rowId: compGameLogTable.id,
      sessionId: compGameLogTable.sessionId,
      profileId: compGameLogTable.profileId,
      groupId: compGameLogTable.groupId,
      position: compGameLogTable.position,
      teamId: compGameLogTable.teamId,
      isVp: compGameLogTable.isVp,
      coop: compGameLogTable.coop,
      datePlayed: compGameLogTable.datePlayed,
      createdAt: compGameLogTable.createdAt,
    })
    .from(compGameLogTable)
    .where(
      and(
        eq(compGameLogTable.gameId, gameId),
        gte(compGameLogTable.datePlayed, fromDate),
      ),
    );

  const result = replayElo(rows, start);

  for (let i = 0; i < result.rows.length; i += UPDATE_CHUNK_SIZE) {
    const values = sql.join(
      result.rows
        .slice(i, i + UPDATE_CHUNK_SIZE)
        .map(
          (r) =>
            sql`(${r.rowId}::integer, ${r.eloBefore}::real, ${r.eloAfter}::real, ${r.eloSessionsBefore}::smallint)`,
        ),
      sql`, `,
    );
    await tx.execute(sql`
      update ${compGameLogTable}
      set elo_before = v.elo_before,
          elo_after = v.elo_after,
          elo_sessions_before = v.elo_sessions_before
      from (values ${values}) as v(id, elo_before, elo_after, elo_sessions_before)
      where ${compGameLogTable.id} = v.id
    `);
  }

  // Current Elo: everyone with a Rated Session of this game. Anyone else
  // (removed by an edit, or merged away by a claim) loses their row.
  const players = [...result.players].map(([profileId, s]) => ({
    profileId,
    gameId,
    elo: s.elo,
    sessionsPlayed: s.sessionsPlayed,
    updatedAt: new Date(),
  }));

  if (players.length > 0) {
    await tx
      .insert(playerGameEloTable)
      .values(players)
      .onConflictDoUpdate({
        target: [playerGameEloTable.profileId, playerGameEloTable.gameId],
        set: {
          elo: sql`excluded.elo`,
          sessionsPlayed: sql`excluded.sessions_played`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
  }

  await tx
    .delete(playerGameEloTable)
    .where(
      and(
        eq(playerGameEloTable.gameId, gameId),
        players.length > 0
          ? notInArray(
              playerGameEloTable.profileId,
              players.map((p) => p.profileId),
            )
          : undefined,
      ),
    );

  return {
    profileIds: [...new Set(rows.map((r) => r.profileId))],
    groupIds: [...new Set(rows.map((r) => r.groupId))],
  };
}

// Server actions only: drops every cache that shows the replayed Elo
export function invalidateEloCaches(affected: EloReplayAffected[]) {
  updateTag("elo");
  for (const groupId of new Set(affected.flatMap((a) => a.groupIds))) {
    updateTag(`tribe:${groupId}`);
  }
  for (const profileId of new Set(affected.flatMap((a) => a.profileIds))) {
    updateTag(`recent-games:${profileId}`);
  }
}
