"use client";

import React, { useMemo, useState } from "react";
import { FilteredCounts, GroupedSession } from "@/lib/interfaces";
import {
  AvailableGame,
  AvailableTribe,
  getAvailableGames,
  getAvailableTribes,
  getFilteredCounts,
} from "@/utils/recordsProcessing";
import { Search, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import GameSessionCard from "@/components/GameSessionCard";
import RecentGamesFilters, {
  RecentGamesFilterState,
} from "@/components/RecentGamesFilters";

const DEFAULT_FILTERS: RecentGamesFilterState = {
  result: "all",
  gameIds: [],
  tribeIds: [],
  dateRange: undefined,
};

interface RecentGamesViewProps {
  /** Profile whose perspective the sessions are shown from. */
  userId: number;
  sessions: GroupedSession[];
  /** Tribe IDs the viewer may edit. Ignored entirely when readOnly. */
  editableTribeIds?: Set<string>;
  /**
   * Read-only mode: hides all functionality of the sie.
   * Used for the public landing-page demo.
   */
  readOnly?: boolean;
  /** Max sessions to show in readOnly mode. */
  maxSessions?: number;
}

const RecentGamesView: React.FC<RecentGamesViewProps> = ({
  userId,
  sessions,
  editableTribeIds,
  readOnly = false,
  maxSessions = 10,
}) => {
  const [filters, setFilters] =
    useState<RecentGamesFilterState>(DEFAULT_FILTERS);

  const availableGames: AvailableGame[] = useMemo(
    () => getAvailableGames(sessions),
    [sessions],
  );
  const availableTribes: AvailableTribe[] = useMemo(
    () => getAvailableTribes(sessions),
    [sessions],
  );
  const filterCounts: FilteredCounts = useMemo(
    () => getFilteredCounts(sessions),
    [sessions],
  );

  const isDefault =
    filters.result === "all" &&
    filters.gameIds.length === 0 &&
    filters.tribeIds.length === 0 &&
    filters.dateRange === undefined;

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (filters.result === "won" && !session.isWinner) return false;
      if (filters.result === "lost" && session.isWinner) return false;
      if (filters.result === "tie" && !session.isTied) return false;

      if (
        filters.gameIds.length > 0 &&
        !filters.gameIds.includes(session.gameId)
      ) {
        return false;
      }

      if (
        filters.tribeIds.length > 0 &&
        !filters.tribeIds.includes(session.tribeId)
      ) {
        return false;
      }

      const { from, to } = filters.dateRange ?? {};
      if (from) {
        const sessionDay = new Date(session.datePlayed);
        sessionDay.setHours(0, 0, 0, 0);
        const start = new Date(from);
        start.setHours(0, 0, 0, 0);
        const end = new Date(to ?? from);
        end.setHours(0, 0, 0, 0);
        if (sessionDay < start || sessionDay > end) return false;
      }

      return true;
    });
  }, [sessions, filters]);

  const visibleSessions = readOnly
    ? filteredSessions.slice(0, maxSessions)
    : filteredSessions;

  const resultChips = [
    {
      key: "all" as const,
      label: "All",
      count: filterCounts.numGames,
      dotClass: "bg-primary",
    },
    {
      key: "won" as const,
      label: "Won",
      count: filterCounts.numWins,
      dotClass: "bg-accent-1",
    },
    {
      key: "lost" as const,
      label: "Lost",
      count: filterCounts.numLoss,
      dotClass: "bg-destructive",
    },
    {
      key: "tie" as const,
      label: "Tie",
      count: filterCounts.numTied,
      dotClass: "bg-accent-2",
    },
  ];

  return (
    <div className="space-y-6">
      <RecentGamesFilters
        filters={filters}
        resultChips={resultChips}
        availableGames={availableGames}
        availableTribes={availableTribes}
        isDefault={isDefault}
        shownCount={filteredSessions.length}
        totalCount={sessions.length}
        onResultChange={(result) => setFilters((f) => ({ ...f, result }))}
        onToggleGame={(gameId) =>
          setFilters((f) => ({
            ...f,
            gameIds: f.gameIds.includes(gameId)
              ? f.gameIds.filter((id) => id !== gameId)
              : [...f.gameIds, gameId],
          }))
        }
        onClearGames={() => setFilters((f) => ({ ...f, gameIds: [] }))}
        onToggleTribe={(tribeId) =>
          setFilters((f) => ({
            ...f,
            tribeIds: f.tribeIds.includes(tribeId)
              ? f.tribeIds.filter((id) => id !== tribeId)
              : [...f.tribeIds, tribeId],
          }))
        }
        onClearTribes={() => setFilters((f) => ({ ...f, tribeIds: [] }))}
        onDateRangeChange={(dateRange) =>
          setFilters((f) => ({ ...f, dateRange }))
        }
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No games played yet</h3>
            <p className="text-muted-foreground">
              Game sessions will show up here once they&rsquo;re recorded.
            </p>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">
              No sessions match your filters
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {visibleSessions.map((session) => (
            <GameSessionCard
              key={session.sessionId}
              session={session}
              userId={userId}
              canEdit={
                !readOnly && (editableTribeIds?.has(session.tribeId) ?? false)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentGamesView;
