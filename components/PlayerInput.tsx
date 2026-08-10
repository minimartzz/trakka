"use client";

import { Player } from "@/components/SessionForm";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Ghost, Search, UserPlus, X } from "lucide-react";
import Image from "next/image";
import React, { useImperativeHandle, useRef, useState } from "react";

export interface PlayerInputHandle {
  markAnonymous: () => void;
  clear: () => void;
}

interface BasePlayer {
  profileId: number;
  firstName: string;
  lastName: string;
  username: string;
  profilePic?: string;
  isAnonymous?: boolean;
}

interface PlayerInputProps<T extends BasePlayer> {
  selectablePlayers: T[];
  playerId: string;
  playerSelect: (id: string, updates: Partial<Player>) => void;
  playerDetails?: T;
  openOnFocus?: boolean;
  allowAnonymous?: boolean;
  invalid?: boolean;
}

const splitName = (name: string): { firstName: string; lastName: string } => {
  const [firstName, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
};

const AnonBadge = () => (
  <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
    <Ghost className="h-3 w-3" />
    anon
  </span>
);

const PlayerInputInner = <T extends BasePlayer>(
  {
    selectablePlayers,
    playerId,
    playerSelect,
    playerDetails,
    openOnFocus = true,
    allowAnonymous = false,
    invalid = false,
  }: PlayerInputProps<T>,
  ref: React.ForwardedRef<PlayerInputHandle>,
) => {
  const getPlayerInfo = (playerDetails?: T) => {
    if (!playerDetails || !playerDetails.firstName) return;
    return `${playerDetails.firstName} ${playerDetails.lastName} (${playerDetails.username})`;
  };
  const [input, setInput] = useState(getPlayerInfo(playerDetails) || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // True while this row holds a new anonymous player (no profile yet)
  const [anonSelected, setAnonSelected] = useState(false);
  // For X functionality - only true when a user/ anon user is selected
  const [hasSelection, setHasSelection] = useState(
    Boolean(playerDetails?.firstName),
  );

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

  const showAnonOption = allowAnonymous && input.trim().length > 0;
  const optionCount = filteredPlayers.length + (showAnonOption ? 1 : 0);

  // Resets the row's selection state without touching the visible text
  // NOTE: This is for the anonymous user manual selection button
  const clearAnonSelection = () => {
    setAnonSelected(false);
    setHasSelection(false);
    playerSelect(playerId, {
      profileId: 0,
      isAnonymous: false,
      firstName: "",
      lastName: "",
      username: "",
      profilePic: "",
    });
  };

  // Removes the selected player and text
  const clearSelection = () => {
    setInput("");
    clearAnonSelection();
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setActiveIndex(0);
    // Editing the name invalidates any prior selection, anonymous or not
    if (anonSelected) {
      clearAnonSelection();
    } else if (hasSelection) {
      setHasSelection(false);
      playerSelect(playerId, {
        profileId: 0,
        isAnonymous: false,
        firstName: "",
        lastName: "",
        username: "",
        profilePic: "",
      });
    }
    setOpen(openOnFocus ? true : val.trim().length > 0);
  };

  const selectPlayer = (player: T) => {
    const displayString = `${player.firstName} ${player.lastName} (${player.username})`;
    setInput(displayString);
    setAnonSelected(false);
    setHasSelection(true);

    playerSelect(playerId, {
      profileId: player.profileId,
      firstName: player.firstName,
      lastName: player.lastName,
      username: player.username,
      profilePic: player.profilePic,
      isAnonymous: player.isAnonymous ?? false,
    });

    setOpen(false);
  };

  const selectAnonymous = () => {
    const trimmed = input.trim();
    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }
    // Strip a previous "(anonymous)" suffix so re-marking doesn't stack it
    const name = trimmed.replace(/\s*\(anonymous\)$/i, "");
    const { firstName, lastName } = splitName(name);

    setInput(`${name} (anonymous)`);
    setAnonSelected(true);
    setHasSelection(true);

    playerSelect(playerId, {
      profileId: 0,
      isAnonymous: true,
      firstName,
      lastName,
      username: "",
      profilePic: "",
    });

    setOpen(false);
  };

  useImperativeHandle(ref, () => ({
    markAnonymous: selectAnonymous,
    clear: clearSelection,
  }));

  const listboxId = `player-options-${playerId}`;

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Opens the suggestions when the user presses down after focus
    if (!open && optionCount > 0 && e.key === "ArrowDown") {
      setOpen(true);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < optionCount - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      if (open && activeIndex < filteredPlayers.length) {
        e.preventDefault();
        selectPlayer(filteredPlayers[activeIndex]);
      } else if (
        open &&
        showAnonOption &&
        activeIndex === filteredPlayers.length
      ) {
        e.preventDefault();
        selectAnonymous();
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
              onFocus={openOnFocus ? () => setOpen(true) : undefined}
              className={cn("pl-9", hasSelection && "pr-9")}
              role="combobox"
              aria-invalid={invalid}
              aria-expanded={open}
              aria-controls={listboxId}
              aria-autocomplete="list"
              aria-activedescendant={
                open && activeIndex < optionCount
                  ? `${listboxId}-${activeIndex}`
                  : undefined
              }
            />
            {hasSelection && (
              <button
                type="button"
                onClick={clearSelection}
                aria-label="Clear selected player"
                title="Clear selected player"
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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
            className="max-h-50 overflow-y-auto rounded-md border p-1 shadow-md list-none"
          >
            {filteredPlayers.length === 0 && !showAnonOption ? (
              <li className="px-2 py-4 text-center text-sm text-muted-foreground">
                {selectablePlayers.length === 0
                  ? "No friends to add yet. Invite people to your tribes first."
                  : "No matching players"}
              </li>
            ) : (
              <>
                {filteredPlayers.map((player, idx) => (
                  <li
                    key={player.username}
                    id={`${listboxId}-${idx}`}
                    role="option"
                    aria-selected={activeIndex === idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectPlayer(player)}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
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
                    <span className="ml-3 truncate">{`${player.firstName} ${player.lastName} (${player.username})`}</span>
                    {player.isAnonymous && <AnonBadge />}
                  </li>
                ))}
                {showAnonOption && (
                  <li
                    id={`${listboxId}-${filteredPlayers.length}`}
                    role="option"
                    aria-selected={activeIndex === filteredPlayers.length}
                    onMouseEnter={() => setActiveIndex(filteredPlayers.length)}
                    onClick={selectAnonymous}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm border-t px-2 py-2.5 text-sm outline-none transition-colors",
                      activeIndex === filteredPlayers.length
                        ? "bg-accent text-accent-foreground"
                        : "transparent",
                    )}
                  >
                    <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="ml-3 min-w-0 truncate">
                      Add &quot;
                      {input.trim().replace(/\s*\(anonymous\)$/i, "")}
                      &quot; as anonymous player
                    </span>
                  </li>
                )}
              </>
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};

type PlayerInputComponent = <T extends BasePlayer>(
  props: PlayerInputProps<T> & { ref?: React.ForwardedRef<PlayerInputHandle> },
) => React.ReactElement | null;

const PlayerInput = React.forwardRef(
  PlayerInputInner,
) as unknown as PlayerInputComponent;

export default PlayerInput;
