"use client";

import { searchAddableProfiles } from "@/app/(account)/tribe/[id]/edit/action";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Loader2, Search, UserPlus } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

export interface PickedProfile {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic: string;
}

interface MemberProfilePickerProps {
  groupId: string;
  /** Profiles already staged in the member list (kept out of results). */
  excludeProfileIds: number[];
  onSelect: (player: PickedProfile) => void;
  /** Focus the input as soon as the picker mounts (new-row flow). */
  autoFocus?: boolean;
}

const MemberProfilePicker = ({
  groupId,
  excludeProfileIds,
  onSelect,
  autoFocus = false,
}: MemberProfilePickerProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced server-side search over profiles not already in the tribe
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timeout = setTimeout(async () => {
      const response = await searchAddableProfiles(groupId, trimmed);
      if (response.success) {
        setResults(response.data ?? []);
        setActiveIndex(0);
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, groupId]);

  // The server excludes saved members; staged additions are filtered here
  const visibleResults = results.filter(
    (player) => !excludeProfileIds.includes(player.profileId),
  );

  const handleSelect = (player: PickedProfile) => {
    onSelect(player);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || visibleResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < visibleResults.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visibleResults[activeIndex]) handleSelect(visibleResults[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const listboxId = "member-picker-options";
  const showList = open && query.trim().length >= 2;

  return (
    <Popover open={showList} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          {searching ? (
            <Loader2 className="absolute left-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            ref={inputRef}
            placeholder="Search name or username..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            role="combobox"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && visibleResults[activeIndex]
                ? `${listboxId}-${activeIndex}`
                : undefined
            }
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 border-none shadow-lg"
        style={{ width: inputRef.current?.offsetWidth }}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul
          id={listboxId}
          role="listbox"
          className="max-h-64 overflow-y-auto rounded-md border p-1 shadow-md list-none"
        >
          {visibleResults.length === 0 ? (
            <li className="px-2 py-4 text-center text-sm text-muted-foreground">
              {searching ? "Searching..." : "No matching players found"}
            </li>
          ) : (
            visibleResults.map((player, idx) => (
              <li
                key={player.profileId}
                id={`${listboxId}-${idx}`}
                role="option"
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelect(player)}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2.5 text-sm outline-none transition-colors",
                  activeIndex === idx
                    ? "bg-accent text-accent-foreground"
                    : "transparent",
                )}
              >
                <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-muted">
                  {player.profilePic && (
                    <Image
                      src={player.profilePic}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <span className="ml-3 min-w-0 truncate">
                  {player.firstName} {player.lastName} ({player.username})
                </span>
                <UserPlus className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default MemberProfilePicker;
