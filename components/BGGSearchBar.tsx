"use client";

import {
  BGGDetailsInterface,
  fetchBGGDetails,
  fetchBGGIds,
} from "@/utils/fetchBgg";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "./ui/input";

const BGGSearchBar = ({
  onSelect,
}: {
  onSelect: (item: BGGDetailsInterface) => void;
}) => {
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
        setQuery(response[0].title);
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
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedItem(null);
        }}
        onFocus={() => setIsDropdownOpen(query.length >= 2)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
        placeholder="Enter game title"
      />

      {isDropdownOpen && searchResults.length > 0 && !selectedItem && (
        <ul className="z-10 top-20 w-full max-w-md border border-border rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
          {searchResults.map((result) => (
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
                    {result.yearPublished}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="text-center mt-4">Loading games...</p>}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      <div className="mt-8 text-center">
        {selectedItem && (
          <div>
            <div className="sm:hidden grid grid-cols-1 border p-4 mb-8 rounded-lg justify-items-center">
              <Image
                src={
                  !selectedItem.image ? "/missing_icon.png" : selectedItem.image
                }
                height="150"
                width="150"
                alt="Selected game picture"
                className="rounded-2xl items-center"
              />
              <h2 className="text-2xl font-semibold mt-2 mb-2">
                {selectedItem.title}
                <span className="text-gray-500">
                  {" "}
                  {`(${selectedItem.yearPublished})`}
                </span>
              </h2>
              <div className="flex justify-around w-full pt-3">
                <div>
                  <h3 className="pb-3">Playing Time</h3>
                  <p className="text-xl font-semibold">
                    {selectedItem.playingtime} mins
                  </p>
                </div>
                <div>
                  <h3 className="pb-2">Rating</h3>
                  <div
                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-white text-xl font-semibold 
                      ${
                        parseFloat(selectedItem.rating) == 0
                          ? "bg-gray-600"
                          : parseFloat(selectedItem.rating) < 5
                          ? "bg-red-700 text-white"
                          : parseFloat(selectedItem.rating) < 7.5
                          ? "bg-orange-500 text-white"
                          : "bg-green-600"
                      }`}
                  >
                    {selectedItem.rating.length > 3
                      ? selectedItem.rating.slice(0, 3)
                      : selectedItem.rating}
                  </div>
                </div>
                <div>
                  <h3 className="pb-3">Weight</h3>
                  <p className="text-xl font-semibold">
                    {selectedItem.weight.length > 4
                      ? selectedItem.weight.slice(0, 4)
                      : selectedItem.weight}
                  </p>
                </div>
              </div>
            </div>
            {/* Desktop and Tablet Layouts */}
            <div className="hidden sm:flex border p-4 mb-8 rounded-lg justify-center">
              <Image
                src={selectedItem.image}
                height="170"
                width="170"
                alt="Selected game picture"
                className="rounded-2xl items-center mr-6"
              />
              <div className="grow">
                <h2 className="text-2xl font-semibold mt-2 mb-6">
                  {selectedItem.title}
                  <span className="text-gray-500">
                    {" "}
                    {`(${selectedItem.yearPublished})`}
                  </span>
                </h2>
                <div className="flex justify-around w-full pt-3">
                  <div>
                    <h3 className="pb-3">Playing Time</h3>
                    <p className="text-xl font-semibold">
                      {selectedItem.playingtime} mins
                    </p>
                  </div>
                  <div>
                    <h3 className="pb-2">Rating</h3>
                    <div
                      className={`w-12 h-12 flex items-center justify-center rounded-xl text-white text-xl font-semibold 
                      ${
                        parseFloat(selectedItem.rating) == 0
                          ? "bg-gray-600"
                          : parseFloat(selectedItem.rating) < 5
                          ? "bg-red-700 text-white"
                          : parseFloat(selectedItem.rating) < 7.5
                          ? "bg-orange-500 text-white"
                          : "bg-green-600"
                      }`}
                    >
                      {selectedItem.rating.length > 3
                        ? selectedItem.rating.slice(0, 3)
                        : selectedItem.rating}
                    </div>
                  </div>
                  <div>
                    <h3 className="pb-3">Weight</h3>
                    <p className="text-xl font-semibold">
                      {selectedItem.weight.length > 4
                        ? selectedItem.weight.slice(0, 4)
                        : selectedItem.weight}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BGGSearchBar;
