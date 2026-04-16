"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, Dices } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type GameListItem } from "@/types/tribes";

export function GameSearchSection({
  gameList,
  selectedGameId,
  selectedGame,
  onSelectGame,
}: {
  gameList: GameListItem[];
  selectedGameId: number | null;
  selectedGame: GameListItem | null;
  onSelectGame: (gameId: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return gameList;
    const q = searchQuery.toLowerCase();
    return gameList.filter((g) => g.gameTitle.toLowerCase().includes(q));
  }, [gameList, searchQuery]);

  const handleSelectGame = (gameId: number) => {
    onSelectGame(gameId);
    setDropdownOpen(false);
    setSearchQuery("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Dices className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Game Analytics</h2>
      </div>

      <div ref={dropdownRef} className="relative">
        <div
          className={cn(
            "flex items-center gap-2 border rounded-lg bg-card px-3 py-2 cursor-pointer transition-all",
            dropdownOpen
              ? "ring-2 ring-primary/50 border-primary"
              : "hover:border-primary/40",
          )}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          {dropdownOpen ? (
            <Input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm flex-1 truncate">
              {selectedGame?.gameTitle ?? "Select a game..."}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
              dropdownOpen && "rotate-180",
            )}
          />
        </div>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-popover border rounded-lg shadow-lg overflow-hidden"
            >
              <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
                {filteredGames.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No games found
                  </div>
                ) : (
                  filteredGames.map((game) => (
                    <button
                      key={game.gameId}
                      onClick={() => handleSelectGame(game.gameId)}
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2.5 rounded-md text-sm transition-colors text-left",
                        game.gameId === selectedGameId
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent/50",
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {game.imageUrl ? (
                          <img
                            src={game.imageUrl}
                            alt={game.gameTitle}
                            className="w-7 h-7 rounded object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                            <Dices className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="truncate">{game.gameTitle}</span>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {game.playCount}{" "}
                        {game.playCount === 1 ? "game" : "games"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
