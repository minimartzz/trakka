"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { Trophy, ThumbsDown, Gamepad2 } from "lucide-react";
import {
  type GameSession,
  type MemberElo,
  type TribeMember,
} from "@/types/tribes";
import { computeLeadingPlayers, rankByElo } from "./utils";
import { FlippablePlayerCard } from "./FlippablePlayerCard";
import { EloRankingChart } from "./EloRankingChart";

export function LeadingPlayersSection({
  sessions,
  members,
  memberElos,
  currentUserId,
  selectedGameId,
}: {
  sessions: GameSession[];
  members: TribeMember[];
  memberElos: MemberElo[];
  currentUserId?: number;
  selectedGameId: number;
}) {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const { best, loser, mostPlays } = useMemo(
    () => computeLeadingPlayers(sessions, selectedGameId),
    [sessions, selectedGameId],
  );
  const eloRanking = useMemo(
    () => rankByElo(memberElos, members, selectedGameId),
    [memberElos, members, selectedGameId],
  );

  const toggleFlip = (cardKey: string) => {
    setFlippedCards((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Leading Players</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FlippablePlayerCard
          label="Best Player"
          labelIcon={<Trophy className="w-4 h-4" />}
          accentColor="primary"
          player={best}
          statLabel="Win rate"
          showRate
          flipped={!!flippedCards["best"]}
          onFlip={() => toggleFlip("best")}
        />
        <FlippablePlayerCard
          label="Biggest Loser"
          labelIcon={<ThumbsDown className="w-4 h-4" />}
          accentColor="rose"
          player={loser}
          statLabel="Last place"
          showRate
          flipped={!!flippedCards["loser"]}
          onFlip={() => toggleFlip("loser")}
        />
        <FlippablePlayerCard
          label="Most Plays"
          labelIcon={<Gamepad2 className="w-4 h-4" />}
          accentColor="violet"
          player={mostPlays}
          statLabel="Plays"
          flipped={!!flippedCards["plays"]}
          onFlip={() => toggleFlip("plays")}
        />
      </div>

      <div className="mt-4">
        <EloRankingChart rows={eloRanking} currentUserId={currentUserId} />
      </div>
    </motion.section>
  );
}
