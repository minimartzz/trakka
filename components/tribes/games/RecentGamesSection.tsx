"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Dices } from "lucide-react";
import { type GameSession } from "@/types/tribes";
import RecentSessions from "../RecentSessions";

/**
 * Recent games played by the tribe for the currently selected game.
 *
 * Reuses the same {@link RecentSessions} card as the tribe home tab so the
 * table looks identical; it only narrows the data down to the selected game
 * and defaults to showing every session (all-time) in descending date order,
 * which RecentSessions already handles internally.
 */
export function RecentGamesSection({
  sessions,
  selectedGameId,
  currentUserId,
  canEdit = false,
}: {
  sessions: GameSession[];
  selectedGameId: number;
  currentUserId?: number;
  canEdit?: boolean;
}) {
  const gameSessions = useMemo(
    () => sessions.filter((s) => s.gameId === selectedGameId),
    [sessions, selectedGameId],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Dices className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Recent Games</h2>
      </div>

      <RecentSessions
        sessions={gameSessions}
        currentUserId={currentUserId}
        emptyMessage="No sessions recorded for this game yet"
        initialTimeFilter="all_time"
        canEdit={canEdit}
      />
    </motion.section>
  );
}
