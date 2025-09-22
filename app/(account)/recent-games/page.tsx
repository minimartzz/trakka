"use client";
import React, { useEffect, useState } from "react";
import {
  CombinedRecentGames,
  FilteredCounts,
  RecentGames,
} from "@/lib/interfaces";
import Link from "next/link";
import {
  filterSessions,
  getAvailableGames,
  getFilteredCounts,
} from "@/utils/recordsProcessing";
import { Filter, Play, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GameSessionCard from "@/components/GameSessionCard";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface GameFilter {
  result: "all" | "won" | "lost" | "tie" | "not_involved";
  game: string;
}

const fetchRecentGamesByProfile = async () => {
  // TODO: Grab user profile information
  const profileId = "1";
  try {
    const response = await fetch(`/api/session/profile/${profileId}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const fetchRecentGamesByGroup = async () => {
  // TODO: Get the user group?
  const groupId = "a16cb5c8-8272-4fef-bf8d-5c0a532ce22d";
  try {
    const response = await fetch(`/api/session/group/${groupId}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
};

const Page = () => {
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<GameFilter>({
    result: "all",
    game: "all",
  });
  const [gameSessions, setGameSessions] = useState<CombinedRecentGames[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<
    CombinedRecentGames[]
  >([]);
  const [availableGames, setAvailableGames] = useState<string[]>([]);
  const [filterCounts, setFilterCounts] = useState<FilteredCounts>({
    numGames: 0,
    numWins: 0,
    numLoss: 0,
    numPlayed: 0,
    numTied: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination details
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSessions = filteredSessions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  // Handle page changes
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Initial Mount - Load
  useEffect(() => {
    const getData = async () => {
      const fetchedData = await fetchRecentGamesByProfile();
      const sessions: RecentGames[] = fetchedData.rawSessions;
      const processedSessions = filterSessions(1, sessions); // TODO: Change this to the Users ID from auth
      const filteredCounts = getFilteredCounts(processedSessions);
      const uniqueGames = getAvailableGames(processedSessions);

      setGameSessions(processedSessions);
      setFilteredSessions(processedSessions);
      setFilterCounts(filteredCounts);
      setAvailableGames(uniqueGames);

      setLoading(false);
    };

    getData();
  }, []);

  // Handle selecting filter change
  const handleSelectFilter = (type: "result" | "game", value: string) => {
    setSelectedFilter((prev) => ({ ...prev, [type]: value }));
  };

  // Implementing filters
  useEffect(() => {
    let filtered = [...gameSessions];

    // Filtering on button selection
    switch (selectedFilter.result) {
      case "won":
        filtered = filtered.filter((session) => session.isWinner);
        setAvailableGames(getAvailableGames(filtered));
        break;
      case "tie":
        filtered = filtered.filter((session) => session.isTied);
        setAvailableGames(getAvailableGames(filtered));
        break;
      case "lost":
        filtered = filtered.filter((session) => session.isLoser);
        setAvailableGames(getAvailableGames(filtered));
        break;
      case "not_involved":
        filtered = filtered.filter((session) => !session.isPlayer);
        setAvailableGames(getAvailableGames(filtered));
        break;
      default:
        setAvailableGames(getAvailableGames(filtered));
    }

    // Filtering on game selection
    if (selectedFilter.game !== "all") {
      filtered = filtered.filter(
        (session) => session.gameTitle === selectedFilter.game
      );
    }

    setFilteredSessions(filtered);
  }, [gameSessions, selectedFilter]);

  // Loading the page if data is still being fetched
  if (loading) {
    return (
      <div className="p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">My Recent Games</h1>
          <p className="text-muted-foreground mt-2">
            You latest game sessions and results
          </p>
        </div>
        <div className="p-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded w-16"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Recent Games</h1>
        <p className="text-muted-foreground mt-2">
          You latest game sessions and results
        </p>
      </div>

      {/* Filtering and Recent Games */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2"></div>
          {[
            { key: "all", label: "All", count: filterCounts.numGames },
            { key: "won", label: "Won", count: filterCounts.numWins },
            { key: "lost", label: "Lost", count: filterCounts.numLoss },
            { key: "tie", label: "Tie", count: filterCounts.numTied },
            {
              key: "not_involved",
              label: "Not Involved",
              count: filterCounts.numGames - filterCounts.numPlayed,
            },
          ].map(({ key, label, count }) => (
            <Button
              key={key}
              variant={selectedFilter.result === key ? "default" : "outline"}
              size="sm"
              onClick={() => handleSelectFilter("result", key)}
              className="h-8"
            >
              {label} ({count})
            </Button>
          ))}

          {/* Filter Games */}
          <Select
            value={selectedFilter.game}
            onValueChange={(value) => handleSelectFilter("game", value)}
          >
            <SelectTrigger className="w-[200px] h-8">
              <SelectValue placeholder="All games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All games</SelectItem>
              {availableGames.map((game) => (
                <SelectItem key={game} value={game}>
                  {game}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
        <Trophy className="h-4 w-4" />
        <span>Total Recent Games • {filterCounts.numGames} sessions</span>
      </div>

      {/* Game Sessions */}
      {gameSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No games played yet</h3>
            <p className="text-muted-foreground mb-4">
              Start recording your game sessions to see them here
            </p>
            <Button
              className="rounded-full h-12 w-12 sm:h-12 sm:w-auto px-2 mr-10"
              asChild
            >
              <Link href="/session/create">
                <Play className="text-white" />
                <span className="hidden sm:block font-semibold text-[16px] text-white">
                  New Session
                </span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No sessions match your filters
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentSessions.map((session) => (
            <GameSessionCard
              key={session.sessionId}
              session={session}
              userId={1} // TODO: Change this to the Users ID from auth
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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

              {/* Dynamic Page Links */}
              {[...Array(totalPages)].map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    onClick={() => handlePageChange(index + 1)}
                    isActive={currentPage === index + 1}
                    className="cursor-pointer"
                  >
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

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
