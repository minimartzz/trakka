"use client";
import React, { useEffect, useRef, useState } from "react";
import { FilteredCounts, GroupedSession } from "@/lib/interfaces";
import Link from "next/link";
import {
  AvailableGame,
  AvailableTribe,
  filterSessionData,
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
import { cn } from "@/lib/utils";
import useAuth from "@/app/hooks/useAuth";
import {
  fetchRecentGamesPage,
  RecentGamesFilters as RecentGamesFilterArgs,
} from "@/app/(account)/recent-games/action";
import { getUserTribeRoles } from "@/app/(generic)/session/edit/[sessionId]/action";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 10;

const DEFAULT_FILTERS: RecentGamesFilterState = {
  result: "all",
  gameIds: [],
  tribeIds: [],
  dateRange: undefined,
};

// The date range is compared as YYYY-MM-DD strings against the date column.
const toFilterArgs = (
  filters: RecentGamesFilterState,
): RecentGamesFilterArgs => {
  const { from, to } = filters.dateRange ?? {};
  const toIsoDay = (d: Date) => {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  };
  return {
    result: filters.result,
    gameIds: filters.gameIds,
    tribeIds: filters.tribeIds,
    from: from ? toIsoDay(from) : undefined,
    // "to" optional = single day; fall back to "from" so a single-day pick works
    to: from ? toIsoDay(to ?? from) : undefined,
  };
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
  // `loading`: Applies on first load only
  // `refetching`: Renders every subsequent page
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
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

  const [totalSessions, setTotalSessions] = useState(0);

  // Editable tribe IDs don't change with filters/page, so load them once.
  useEffect(() => {
    if (authLoading || !user) return;

    getUserTribeRoles(user.id).then((tribeRoles) => {
      // Tribe IDs where user is SuperAdmin (1) or Admin (2)
      setEditableTribeIds(
        new Set(
          tribeRoles
            .filter((r) => r.roleId === 1 || r.roleId === 2)
            .map((r) => r.groupId),
        ),
      );
    });
  }, [user, authLoading]);

  // Reset to first page whenever the filter set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch a single page of sessions from the server whenever the user,
  // filters or page changes. Filtering/counting/pagination all happen in SQL;
  // only this page's rows come back, then filterSessionData groups them.
  const hasLoadedOnce = useRef(false);
  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    // First load shows the full skeleton; later refetches keep the page up.
    if (hasLoadedOnce.current) setRefetching(true);

    fetchRecentGamesPage(
      user.id,
      currentPage,
      ITEMS_PER_PAGE,
      toFilterArgs(filters),
    ).then((response) => {
      if (cancelled) return;
      if (!response.success || !response.data) {
        toast.error(response.message ?? "Failed to load recent games");
        setLoading(false);
        setRefetching(false);
        return;
      }

      const {
        sessions,
        totalSessions,
        counts,
        availableGames,
        availableTribes,
      } = response.data;
      const groupedSessions = filterSessionData(user.id, sessions).filter(
        (session) => session.isPlayer,
      );

      setGameSessions(groupedSessions);
      setTotalSessions(totalSessions);
      setFilterCounts(counts);
      setAvailableGames(availableGames);
      setAvailableTribes(availableTribes);
      setLoading(false);
      setRefetching(false);
      hasLoadedOnce.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, filters, currentPage]);

  const totalPages = Math.ceil(totalSessions / ITEMS_PER_PAGE);
  const currentSessions = gameSessions;

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
        shownCount={totalSessions}
        totalCount={filterCounts.numGames}
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
      {filterCounts.numGames === 0 ? (
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
      ) : totalSessions === 0 ? (
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
        <div
          className={cn(
            "space-y-6 transition-opacity sm:space-y-8",
            refetching && "pointer-events-none opacity-50",
          )}
        >
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
