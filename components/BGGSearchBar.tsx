"use client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  BGGDetailsInterface,
  fetchBGGDetails,
  fetchBGGIds,
} from "@/utils/fetchBgg";
import { Loader2, Search, Timer, Weight, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

const RatingBadge = ({ rating }: { rating: string }) => {
  const val = parseFloat(rating);
  const colorClass =
    val === 0
      ? "bg-muted text-muted-foreground"
      : val < 5
        ? "bg-red-700 text-white"
        : val < 7.5
          ? "bg-orange-500 text-white"
          : "bg-green-600 text-white";

  return (
    <div
      className={`w-9 h-9 flex items-center justify-center rounded-md text-xs font-bold shrink-0 ${colorClass}`}
    >
      {rating.length > 3 ? rating.slice(0, 3) : rating}
    </div>
  );
};

const BGGSearchBar = ({
  onSelect,
  initialGame,
}: {
  onSelect: (item: BGGDetailsInterface) => void;
  initialGame?: BGGDetailsInterface | null;
}) => {
  const [query, setQuery] = useState(initialGame?.title ?? "");
  const [exactMatch, setExactMatch] = useState(false);
  const [allResults, setAllResults] = useState<BGGDetailsInterface[]>([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedGame, setSelectedGame] = useState<BGGDetailsInterface | null>(
    initialGame ?? null,
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const listRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Infinite scroll: reveal 10 more results when sentinel enters view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const list = listRef.current;
    if (!sentinel || !list || visibleCount >= allResults.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 10, allResults.length));
        }
      },
      { root: list, threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [allResults.length, visibleCount]);

  // Fetch search results, debounced 300ms
  useEffect(() => {
    if (query.length < 2) {
      setAllResults([]);
      setVisibleCount(10);
      setIsDropdownOpen(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchError(null);

      try {
        const bggData = await fetchBGGIds(query, exactMatch);
        if (bggData.length === 0) {
          setAllResults([]);
          setLoading(false);
          return;
        }

        const bggDetailed = await fetchBGGDetails(bggData);
        setAllResults(bggDetailed);
        setVisibleCount(10);
      } catch (error: any) {
        setSearchError(error.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, exactMatch]);

  const handleSelect = (result: BGGDetailsInterface) => {
    setIsDropdownOpen(false);
    setQuery(result.title);
    setSelectedGame(result);
    onSelect(result);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedGame(null);
    setAllResults([]);
    setIsDropdownOpen(false);
    setLoading(false);
  };

  const visibleResults = allResults.slice(0, visibleCount);

  return (
    <div className="pt-1 space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            if (val.length >= 2) {
              setLoading(true);
              setIsDropdownOpen(true);
            }
          }}
          onFocus={() => {
            if (query.length >= 2) setIsDropdownOpen(true);
          }}
          onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
          placeholder="Search for a board game..."
          className="pl-9 pr-9"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : query.length > 0 ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Dropdown */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 z-50 w-full mt-1 border border-border rounded-lg shadow-xl bg-popover overflow-hidden">
            <ul
              ref={listRef}
              className="max-h-72 overflow-y-auto divide-y divide-border/40"
            >
              {/* Loading state */}
              {loading && (
                <li className="flex justify-center items-center p-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </li>
              )}

              {/* No results */}
              {!loading && allResults.length === 0 && !searchError && (
                <li className="p-4 text-center text-sm text-muted-foreground">
                  No games found. Try different keywords.
                </li>
              )}

              {/* Error */}
              {!loading && searchError && (
                <li className="p-4 text-center text-sm text-destructive">
                  Search failed. Please try again.
                </li>
              )}

              {/* Results */}
              {!loading &&
                visibleResults.map((result) => (
                  <li
                    key={result.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(result)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/60 transition-colors"
                  >
                    <div className="shrink-0 w-10 h-10 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={result.thumbnail || "/missing_icon.png"}
                        alt={result.title}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {result.yearPublished === "0"
                          ? "n.d."
                          : result.yearPublished}
                      </p>
                    </div>
                    <RatingBadge rating={result.rating} />
                  </li>
                ))}

              {/* Infinite scroll sentinel */}
              {!loading && visibleCount < allResults.length && (
                <div
                  ref={sentinelRef}
                  className="flex justify-center items-center p-3"
                >
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Exact match toggle */}
      <div className="flex items-center gap-2 ml-1">
        <Checkbox
          id="exact-match"
          checked={exactMatch}
          onCheckedChange={(checkedState) => {
            setExactMatch(checkedState === true);
          }}
        />
        <label
          htmlFor="exact-match"
          className="text-sm text-muted-foreground cursor-pointer select-none"
        >
          Exact match
        </label>
      </div>

      {/* Selected Game - Desktop / Tablet */}
      <div className="hidden sm:block">
        {selectedGame && (
          <Card className="flex flex-row justify-between shadow-none rounded-lg p-4 border-primary/20">
            <div className="flex gap-4">
              <Image
                src={selectedGame.image || "/missing_icon.png"}
                height={120}
                width={120}
                alt={selectedGame.title}
                className="rounded-lg object-cover shrink-0"
              />
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold leading-tight">
                  {selectedGame.title}
                  <span className="text-muted-foreground font-normal text-base ml-1">
                    ({selectedGame.yearPublished})
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground line-clamp-4 w-3/4 mt-1">
                  {selectedGame.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 ml-4 shrink-0">
              <div className="flex items-center gap-2 text-sm">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {selectedGame.playingtime} min
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {selectedGame.weight.length > 4
                    ? selectedGame.weight.slice(0, 4)
                    : selectedGame.weight}
                </span>
              </div>
              <RatingBadge rating={selectedGame.rating} />
            </div>
          </Card>
        )}
      </div>

      {/* Selected Game - Mobile */}
      <div className="sm:hidden">
        {selectedGame && (
          <Card className="shadow-none rounded-lg p-4 border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src={selectedGame.image || "/missing_icon.png"}
                height={56}
                width={56}
                alt={selectedGame.title}
                className="rounded-md object-cover shrink-0"
              />
              <div>
                <h2 className="text-base font-semibold leading-tight">
                  {selectedGame.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedGame.yearPublished}
                </p>
              </div>
            </div>
            <div className="flex justify-around pt-3 border-t border-border/40">
              <div className="flex flex-col items-center gap-1">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {selectedGame.playingtime} min
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Weight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {selectedGame.weight.length > 4
                    ? selectedGame.weight.slice(0, 4)
                    : selectedGame.weight}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-xs text-muted-foreground">Rating</span>
                <RatingBadge rating={selectedGame.rating} />
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BGGSearchBar;
