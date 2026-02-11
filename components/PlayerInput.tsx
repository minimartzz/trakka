"use client";

import { Player } from "@/app/(generic)/session/create/page";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import Image from "next/image";
import React, { useRef, useState } from "react";

interface BasePlayer {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic?: string;
}

interface PlayerInputProps<T extends BasePlayer> {
  selectablePlayers: T[];
  playerId: string;
  playerSelect: (id: string, updates: Partial<Player>) => void;
  playerDetails?: T;
}

const PlayerInput = <T extends BasePlayer>({
  selectablePlayers,
  playerId,
  playerSelect,
  playerDetails,
}: PlayerInputProps<T>) => {
  const getPlayerInfo = (playerDetails?: T) => {
    if (!playerDetails || !playerDetails.firstName) return;
    return `${playerDetails.firstName} ${playerDetails.lastName} (${playerDetails.username})`;
  };
  const [input, setInput] = useState(getPlayerInfo(playerDetails) || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  // Filter based on input
  const searchableKeys: (keyof (typeof selectablePlayers)[0])[] = [
    "firstName",
    "lastName",
    "username",
  ];
  const filteredPlayers = selectablePlayers.filter((player) => {
    return searchableKeys.some((key) => {
      return player[key]
        ?.toString()
        .toLowerCase()
        .includes(input.toLowerCase());
    });
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    if (val.length > 0) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const selectPlayer = (player: T) => {
    const displayString = `${player.firstName} ${player.lastName} (${player.username})`;
    setInput(displayString);

    playerSelect(playerId, {
      profileId: player.profileId,
      firstName: player.firstName,
      lastName: player.lastName,
      username: player.username,
      profilePic: player.profilePic,
    });

    setOpen(false);
  };

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Opens the suggestions when the user presses down after focus
    if (!open && filteredPlayers.length > 0 && e.key === "ArrorDown") {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < filteredPlayers.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (open && filteredPlayers[activeIndex]) {
        e.preventDefault();
        selectPlayer(filteredPlayers[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search name or username..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => input.length > 0 && setOpen(true)}
              className="pl-9"
            />
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="p-0 border-none shadow-lg"
          style={{ width: inputRef.current?.offsetWidth }}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <ul className="m-h-[200px] overflow-y-auto rounded-md border p-1 shadow-md list-none">
            {filteredPlayers.length === 0 ? (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                No matching players
              </li>
            ) : (
              filteredPlayers.map((player, idx) => (
                <li
                  key={player.username}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => selectPlayer(player)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    activeIndex === idx
                      ? "bg-accent text-accent-foreground"
                      : "transparent",
                  )}
                >
                  <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={player.profilePic!}
                      alt="Group Icon"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span className="ml-3">{`${player.firstName} ${player.lastName} (${player.username})`}</span>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default PlayerInput;
