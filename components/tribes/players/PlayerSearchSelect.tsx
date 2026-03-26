"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type TribeMember } from "@/types/tribes";
import { Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerSearchSelectProps {
  members: TribeMember[];
  selectedId: number | null;
  onSelect: (profileId: number) => void;
  placeholder?: string;
  className?: string;
}

const PlayerSearchSelect: React.FC<PlayerSearchSelectProps> = ({
  members,
  selectedId,
  onSelect,
  placeholder = "Search players...",
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedMember = members.find((m) => m.profileId === selectedId);

  const filtered = members.filter((m) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      m.username.toLowerCase().includes(q) ||
      m.firstName.toLowerCase().includes(q) ||
      m.lastName.toLowerCase().includes(q)
    );
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg border bg-background",
          "hover:bg-muted/50 transition-colors text-left",
          open && "ring-2 ring-primary/20",
        )}
      >
        {selectedMember ? (
          <>
            <Avatar className="w-7 h-7">
              <AvatarImage src={selectedMember.image || ""} alt={selectedMember.username} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {selectedMember.firstName[0]}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 text-sm font-medium truncate">
              {selectedMember.firstName} {selectedMember.lastName}
            </span>
            <X
              className="w-4 h-4 text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(members[0]?.profileId ?? 0);
              }}
            />
          </>
        ) : (
          <>
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="flex-1 text-sm text-muted-foreground">{placeholder}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 border rounded-lg bg-popover shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b">
            <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted/50">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or username..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[240px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No players found
              </div>
            ) : (
              filtered.map((member) => (
                <button
                  key={member.profileId}
                  type="button"
                  onClick={() => {
                    onSelect(member.profileId);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 hover:bg-muted/50 transition-colors text-left",
                    selectedId === member.profileId && "bg-primary/5",
                  )}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.image || ""} alt={member.username} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {member.firstName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">@{member.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {member.gamesPlayed} games
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerSearchSelect;
