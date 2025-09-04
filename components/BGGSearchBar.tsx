// TODO:
// 1. Change this to a component
// 2. Handle missing images -> Find and use question mark image from local
// 3. Update loading sequence when finding entries
"use client";

import {
  BGGDetailsInterface,
  fetchBGGDetails,
  fetchBGGIds,
} from "@/utils/fetchBgg";
import React from "react";
import { useState, useEffect } from "react";
import { Input } from "./ui/input";

const BGGSearchBar = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BGGDetailsInterface[]>([]);
  const [selectedItem, setSelectedItem] = useState<BGGDetailsInterface | null>(
    null
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controller = new AbortController();
  const signal = controller.signal;

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const bggdata = await fetchBGGIds(query, signal);
        if (bggdata.length == 0) {
          setLoading(false);
          return;
        }

        const bggDetailed: BGGDetailsInterface[] = await fetchBGGDetails(
          bggdata,
          signal
        );
        if (bggDetailed.length == 0) {
          setLoading(false);
          return;
        }
        setSearchResults(bggDetailed);
        setIsDropdownOpen(true);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (result: BGGDetailsInterface) => {
    setIsDropdownOpen(false);
    setQuery("");
    setLoading(true);
    setSelectedItem(null);

    try {
      const response = await fetchBGGDetails(
        [{ id: result.id, type: result.type }],
        signal
      );
      if (response != null) {
        setSelectedItem(response[0]);
        onSelect(response[0]);
      }
    } catch (e: any) {
      setError(e.mesasge);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-1">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsDropdownOpen(query.length >= 3)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        placeholder="Enter game title"
        // className="border p-2 rounded w-full max-w-md"
      />

      {isDropdownOpen && searchResults.length > 0 && (
        <ul className="absolute z-10 top-20 w-full max-w-md bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {searchResults.map((result) => (
            <li
              key={result.id}
              onClick={() => handleSelect(result)}
              className="p-2 cursor-pointer hover:bg-gray-100 text-black"
            >
              <div className="flex align-middle">
                <img
                  src={result.thumbnail}
                  alt={`thumbnal for ${result.title}`}
                  className="rounded-md size-12"
                />
                <div className="flex grow flex-col ml-2 gap-y-0">
                  <p className="m-0 text-base font-bold">{result.title}</p>
                  <p className="m-0 text-sm font-light text-gray-500 italic">
                    {result.yearPublished}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="text-center mt-4">Loading details...</p>}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      <div className="mt-8 text-center">
        {selectedItem && (
          <div className="border p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-2">{selectedItem.title}</h2>
            <p className="text-gray-700">{selectedItem.weight}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BGGSearchBar;
