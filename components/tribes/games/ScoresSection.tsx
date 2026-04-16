"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target } from "lucide-react";
import { type GameSession } from "@/types/tribes";
import {
  type ScoreCardKey,
  SCORE_CARD_KEYS,
  SCORE_CARD_DEFS,
  scoreColorMap,
} from "./types";
import { computeScoreStats } from "./utils";
import { ExpandedScoreCard } from "./ExpandedScoreCard";
import { CompactScoreCard } from "./CompactScoreCard";

export function ScoresSection({
  sessions,
  selectedGameId,
}: {
  sessions: GameSession[];
  selectedGameId: number;
}) {
  const [scoreCardOrder, setScoreCardOrder] = useState<ScoreCardKey[]>([
    ...SCORE_CARD_KEYS,
  ]);

  const scoreStats = useMemo(
    () => computeScoreStats(sessions, selectedGameId),
    [sessions, selectedGameId],
  );

  const handleScoreCardSwap = useCallback((clickedKey: ScoreCardKey) => {
    setScoreCardOrder((prev) => {
      const newOrder = [...prev];
      const clickedIdx = newOrder.indexOf(clickedKey);
      [newOrder[0], newOrder[clickedIdx]] = [newOrder[clickedIdx], newOrder[0]];
      return newOrder;
    });
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Scores</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Expanded card */}
        <div className="lg:w-[320px] lg:shrink-0 lg:h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={scoreCardOrder[0]}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ExpandedScoreCard
                cardKey={scoreCardOrder[0]}
                data={scoreStats[scoreCardOrder[0]]}
                color={scoreColorMap[SCORE_CARD_DEFS[scoreCardOrder[0]].accentColor]}
                label={SCORE_CARD_DEFS[scoreCardOrder[0]].label}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Compact grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-rows-2 gap-3 lg:h-[360px]">
          {scoreCardOrder.slice(1).map((key) => (
            <CompactScoreCard
              key={key}
              cardKey={key}
              data={scoreStats[key]}
              color={scoreColorMap[SCORE_CARD_DEFS[key].accentColor]}
              label={SCORE_CARD_DEFS[key].label}
              onClick={() => handleScoreCardSwap(key)}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
