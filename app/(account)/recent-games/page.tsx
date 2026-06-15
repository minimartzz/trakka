"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  FilteredCounts,
  GroupedSession,
  SessionDataInterface,
} from "@/lib/interfaces";
import Link from "next/link";
import {
  AvailableGame,
  AvailableTribe,
  filterSessionData,
  getAvailableGames,
  getAvailableTribes,
  getFilteredCounts,
} from "@/utils/recordsProcessing";
import { Play, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GameSessionCard from "@/components/GameSessionCard";
import RecentGamesFilters, {
  RecentGamesFilterState,
} from "@/components/RecentGamesFilters";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import useAuth from "@/app/hooks/useAuth";
import { fetchSessions } from "@/app/(account)/recent-games/action";
import { getUserTribeRoles } from "@/app/(generic)/session/edit/[sessionId]/action";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const DEFAULT_FILTERS: RecentGamesFilterState = {
  result: "all",
  gameIds: [],
  tribeIds: [],
  dateRange: undefined,
};

const fetchSessionsByProfile = async (
  id: number,
): Promise<SessionDataInterface[]> => {
  try {
    const response = await fetchSessions(id);
    if (!response.success) {
      toast.error(response.message);
      return [];
    }
    return response.data ?? [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Build a visible page-number window so long lists don't render 50 links.
const getPageWindow = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
};

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] =
    useState<RecentGamesFilterState>(DEFAULT_FILTERS);
  const [gameSessions, setGameSessions] = useState<GroupedSession[]>([]);
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([]);
  const [availableTribes, setAvailableTribes] = useState<AvailableTribe[]>([]);
  const [filterCounts, setFilterCounts] = useState<FilteredCounts>({
    numGames: 0,
    numWins: 0,
    numLoss: 0,
    numTied: 0,
  });
  const [editableTribeIds, setEditableTribeIds] = useState<Set<string>>(
    new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);

  const { user, authLoading } = useAuth();

  const isDefault =
    filters.result === "all" &&
    filters.gameIds.length === 0 &&
    filters.tribeIds.length === 0 &&
    filters.dateRange === undefined;

  // Initial Mount - Load
  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const getData = async () => {
      const [sessionData, tribeRoles] = await Promise.all([
        fetchSessionsByProfile(user.id),
        getUserTribeRoles(user.id),
      ]);
      const groupedSessions = filterSessionData(user.id, sessionData).filter(
        (session) => session.isPlayer,
      );

      // Build set of tribe IDs where user is SuperAdmin (1) or Admin (2)
      const editableIds = new Set(
        tribeRoles
          .filter((r) => r.roleId === 1 || r.roleId === 2)
          .map((r) => r.groupId),
      );

      setGameSessions(groupedSessions);
      setFilterCounts(getFilteredCounts(groupedSessions));
      setAvailableGames(getAvailableGames(groupedSessions));
      setAvailableTribes(getAvailableTribes(groupedSessions));
      setEditableTribeIds(editableIds);
      setLoading(false);
    };

    getData();
  }, [user, authLoading]);

  // Apply all filters together (result + games + date)
  const filteredSessions = useMemo(() => {
    return gameSessions.filter((session) => {
      // Result
      if (filters.result === "won" && !session.isWinner) return false;
      if (filters.result === "lost" && session.isWinner) return false;
      if (filters.result === "tie" && !session.isTied) return false;

      // Games (empty = all)
      if (
        filters.gameIds.length > 0 &&
        !filters.gameIds.includes(session.gameId)
      ) {
        return false;
      }

      // Tribes (empty = all)
      if (
        filters.tribeIds.length > 0 &&
        !filters.tribeIds.includes(session.tribeId)
      ) {
        return false;
      }

      // Date range (inclusive of both ends; "to" optional = single day)
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
  }, [gameSessions, filters]);

  // Reset to first page whenever the filter set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const currentSessions = filteredSessions.slice(
    indexOfLastItem - ITEMS_PER_PAGE,
    indexOfLastItem,
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

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

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-8">
        <div>
          <h1 className="text-3xl font-bold">My Recent Games</h1>
          <p className="mt-2 text-muted-foreground">
            Your latest game sessions and results
          </p>
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse py-0">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 border-b p-5">
                  <div className="size-16 shrink-0 rounded-md bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-6 w-1/2 rounded bg-muted" />
                    <div className="h-4 w-1/3 rounded bg-muted" />
                  </div>
                </div>
                <div className="space-y-2 p-5">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-7 rounded bg-muted/60" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-8 mb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Recent Games</h1>
        <p className="mt-2 text-muted-foreground">
          Your latest game sessions and results
        </p>
      </div>

      {/* Filters */}
      <RecentGamesFilters
        filters={filters}
        resultChips={resultChips}
        availableGames={availableGames}
        availableTribes={availableTribes}
        isDefault={isDefault}
        shownCount={filteredSessions.length}
        totalCount={gameSessions.length}
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

      {/* Game Sessions */}
      {gameSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No games played yet</h3>
            <p className="mb-4 text-muted-foreground">
              Start recording your game sessions to see them here
            </p>
            <Button asChild>
              <Link href="/session/create">
                <Play className="size-4" />
                New Session
              </Link>
            </Button>
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
          {currentSessions.map((session) => (
            <GameSessionCard
              key={session.sessionId}
              session={session}
              userId={user!.id as number}
              canEdit={editableTribeIds.has(session.tribeId)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-disabled={currentPage === 1}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPageWindow(currentPage, totalPages).map((page, index) =>
                page === "..." ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-disabled={currentPage === totalPages}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Page;
