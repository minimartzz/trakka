"use client";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  BGGDetailsInterface,
  fetchBGGDetails,
  fetchBGGIds,
} from "@/utils/fetchBgg";
import { Loader2, Timer, Weight } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";

const BGGSearchBar = ({
  onSelect,
}: {
  onSelect: (item: BGGDetailsInterface) => void;
}) => {
  const [query, setQuery] = useState("");
  const [exactMatch, setExactMatch] = useState(false);
  const [searchResults, setSearchResults] = useState<BGGDetailsInterface[]>([]);
  const [selectedGame, setSelectedGame] = useState<BGGDetailsInterface | null>(
    null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setIsDropdownOpen(true);
      setSearchError(null);

      try {
        const bggData = await fetchBGGIds(query, exactMatch, controller.signal);
        if (bggData.length === 0) {
          setLoading(false);
          return;
        }

        const bggDetailed: BGGDetailsInterface[] = await fetchBGGDetails(
          bggData,
          controller.signal
        );
        if (bggDetailed.length === 0) {
          setLoading(false);
          return;
        }

        setSearchResults(bggDetailed);
      } catch (error: any) {
        setSearchError(error.message);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, exactMatch]);

  const handleSelect = async (result: BGGDetailsInterface) => {
    setIsDropdownOpen(false);
    setQuery("");
    setSelectedGame(null);

    try {
      const response = await fetchBGGDetails(
        [{ id: result.id, type: result.type }],
        new AbortController().signal
      );
      if (response != null) {
        setSelectedGame(response[0]);
        setQuery(response[0].title);
        onSelect(response[0]);
      }
    } catch (e: any) {
      setSearchError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-1">
      {/* Main search bar */}
      <Input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
        }}
        onFocus={() => setIsDropdownOpen(query.length >= 2)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        placeholder="Enter game title"
      />

      {/* Exact Match Checkbox */}
      <div className="flex ml-2 mt-3 items-center gap-x-2">
        <p className="text-muted-foreground text-sm">Exact Match</p>
        <Checkbox
          id="exact-match"
          checked={exactMatch}
          onCheckedChange={(checkedState) => {
            if (checkedState === "indeterminate") {
              setExactMatch(false);
            } else {
              setExactMatch(checkedState);
            }
          }}
        />
      </div>

      {/* Game Dropdown */}
      {isDropdownOpen && !selectedGame && (
        <ul className="z-10 top-20 w-full max-w-md border border-border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {/* If still looking for games */}
          {loading && searchResults.length === 0 && (
            <div className="flex justify-center items-center">
              <Loader2 className="m-4 h-8 w-8 animate-spin" />
            </div>
          )}

          {/* If no games found */}
          {searchResults.length === 0 && !loading && (
            <p className="m-4 text-lg font-semibold">
              No games found. Try other keywords...
            </p>
          )}

          {/* If games found */}
          {searchResults.length > 0 &&
            searchResults.map((result) => (
              <li
                key={result.id}
                onClick={() => handleSelect(result)}
                className="p-2 cursor-pointer hover:bg-accent text-accent-foreground"
              >
                <div className="flex align-middle">
                  <Image
                    src={
                      !result.thumbnail ? "/missing_icon.png" : result.thumbnail
                    }
                    alt={`thumbnail for ${result.title}`}
                    width={48}
                    height={48}
                    className="rounded-md"
                  />
                  <div className="flex grow flex-col ml-2 gap-y-0">
                    <p className="m-0 text-base font-bold">{result.title}</p>
                    <p className="m-0 text-sm font-light text-gray-500 italic">
                      {result.yearPublished === "0"
                        ? "n.d"
                        : result.yearPublished}
                    </p>
                  </div>
                </div>
              </li>
            ))}

          {/* If there's an error */}
          {searchError && (
            <p className="m-4 text-lg font-semibold text-destructive">
              Error with the search. Please try again later.
            </p>
          )}
        </ul>
      )}

      {/* Selected Game - Desktop/ Tablet */}
      <div className="hidden sm:block mt-3">
        {selectedGame && (
          <Card className="flex flex-row justify-between shadow-none rounded-sm p-4">
            <div className="flex gap-x-4">
              <Image
                src={
                  !selectedGame.image ? "/missing_icon.png" : selectedGame.image
                }
                height="120"
                width="120"
                alt="Selected game picture"
                className="rounded-lg items-center"
              />
              <div>
                <h2 className="text-2xl font-semibold mb-3 m-0">
                  {selectedGame.title}
                  <span className="text-gray-500">
                    {" "}
                    {`(${selectedGame.yearPublished})`}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 line-clamp-5 w-3/4">
                  {selectedGame.description}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end mr-2 mt-2 gap-y-3">
              <div className="flex justify-between items-center text-nowrap gap-x-2">
                <Timer className="h-6 w-6" />
                <p className="text-md font-semibold">
                  {selectedGame.playingtime} mins
                </p>
              </div>
              <div className="flex justify-between items-center text-nowrap gap-x-2">
                <Weight className="h-5 w-5" />
                <p className="text-md font-semibold">
                  {selectedGame.weight.length > 4
                    ? selectedGame.weight.slice(0, 4)
                    : selectedGame.weight}
                </p>
              </div>
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-md text-white text-lg font-semibold 
                      ${
                        parseFloat(selectedGame.rating) == 0
                          ? "bg-gray-600"
                          : parseFloat(selectedGame.rating) < 5
                          ? "bg-red-700 text-white"
                          : parseFloat(selectedGame.rating) < 7.5
                          ? "bg-orange-500 text-white"
                          : "bg-green-600"
                      }`}
              >
                {selectedGame.rating.length > 3
                  ? selectedGame.rating.slice(0, 3)
                  : selectedGame.rating}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Selected Game - Mobile */}
      <div className="block sm:hidden mt-3">
        {selectedGame && (
          <Card className="flex items-center justify-between shadow-none rounded-sm p-4">
            <h2 className="text-xl font-semibold m-0">
              {selectedGame.title}
              <span className="text-gray-500">
                {" "}
                {`(${selectedGame.yearPublished})`}
              </span>
            </h2>
            <Image
              src={
                !selectedGame.image ? "/missing_icon.png" : selectedGame.image
              }
              height="120"
              width="120"
              alt="Selected game picture"
              className="rounded-lg items-center"
            />
            <div className="flex justify-around w-full pt-3">
              <div>
                <h3 className="pb-3">Playing Time</h3>
                <p className="text-xl font-semibold">
                  {selectedGame.playingtime} mins
                </p>
              </div>
              <div>
                <h3 className="pb-2">Rating</h3>
                <div
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-white text-xl font-semibold 
                      ${
                        parseFloat(selectedGame.rating) == 0
                          ? "bg-gray-600"
                          : parseFloat(selectedGame.rating) < 5
                          ? "bg-red-700 text-white"
                          : parseFloat(selectedGame.rating) < 7.5
                          ? "bg-orange-500 text-white"
                          : "bg-green-600"
                      }`}
                >
                  {selectedGame.rating.length > 3
                    ? selectedGame.rating.slice(0, 3)
                    : selectedGame.rating}
                </div>
              </div>
              <div>
                <h3 className="pb-3">Weight</h3>
                <p className="text-xl font-semibold">
                  {selectedGame.weight.length > 4
                    ? selectedGame.weight.slice(0, 4)
                    : selectedGame.weight}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BGGSearchBar;
