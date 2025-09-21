"use client";
import { CombinedRecentGroupGames, FilteredCounts } from "@/lib/interfaces";
import { Filter } from "lucide-react";
import React from "react";

interface RecentSessionFiltersProps {
  initialSessions: CombinedRecentGroupGames[];
  initialCounts: FilteredCounts;
}

const RecentSessionFilters = ({
  initialSessions,
  initialCounts,
}: RecentSessionFiltersProps) => {
  const filterButtons = [
    { key: "all", label: "All", count: initialCounts.numGames },
    { key: "won", label: "Won", count: initialCounts.numWins },
    { key: "lost", label: "Lost", count: initialCounts.numLoss },
    { key: "tie", label: "Tie", count: initialCounts.numTied },
    {
      key: "not_involved",
      label: "Not Involved",
      count: initialCounts.numGames - initialCounts.numPlayed,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filter by:</span>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2"></div>
      </div>
    </div>
  );
};

export default RecentSessionFilters;
