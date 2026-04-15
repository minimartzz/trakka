"use client";

import { useState, useMemo } from "react";
import { Dices } from "lucide-react";
import { motion } from "motion/react";
import { type GameSession, type TribeMember } from "@/types/tribes";
import { buildGameList, getDefaultGame } from "./games/utils";
import { GameSearchSection } from "./games/GameSearchSection";
import { GameInfoSection } from "./games/GameInfoSection";
import { LeadingPlayersSection } from "./games/LeadingPlayersSection";
import { ScoresSection } from "./games/ScoresSection";
import { PlayerPerformanceSection } from "./games/PlayerPerformanceSection";

// ─── Props ────────────────────────────────────────────────────────────────────

interface TribeGamesTabProps {
  sessions: GameSession[];
  members?: TribeMember[];
  groupId?: string;
  currentUserId?: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TribeGamesTab: React.FC<TribeGamesTabProps> = ({
  sessions,
  members = [],
  currentUserId,
}) => {
  const gameList = useMemo(() => buildGameList(sessions), [sessions]);
  const defaultGame = useMemo(() => getDefaultGame(gameList), [gameList]);

  const [selectedGameId, setSelectedGameId] = useState<number | null>(
    defaultGame?.gameId ?? null,
  );

  const selectedGame = useMemo(
    () => gameList.find((g) => g.gameId === selectedGameId) ?? null,
    [gameList, selectedGameId],
  );

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (sessions.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-5">
            <Dices className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Games Recorded</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Start logging game sessions to explore your tribe&apos;s game
            analytics!
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 space-y-8 mb-15">
      <GameSearchSection
        gameList={gameList}
        selectedGameId={selectedGameId}
        selectedGame={selectedGame}
        onSelectGame={setSelectedGameId}
      />

      {selectedGame && selectedGameId && (
        <>
          <GameInfoSection
            key={`info-${selectedGameId}`}
            sessions={sessions}
            selectedGameId={selectedGameId}
            selectedGame={selectedGame}
          />
          <LeadingPlayersSection
            key={`players-${selectedGameId}`}
            sessions={sessions}
            selectedGameId={selectedGameId}
          />
          <ScoresSection
            key={`scores-${selectedGameId}`}
            sessions={sessions}
            selectedGameId={selectedGameId}
          />
          <PlayerPerformanceSection
            key={`player-${selectedGameId}`}
            sessions={sessions}
            selectedGameId={selectedGameId}
            selectedGame={selectedGame}
            members={members}
            currentUserId={currentUserId ?? null}
          />
        </>
      )}
    </div>
  );
};

export default TribeGamesTab;
