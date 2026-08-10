"use client";

import {
  getTribeSuperAdmins,
  searchTribes,
  type TribeSearchResult,
  type TribeSuperAdmin,
} from "@/app/(generic)/onboarding/action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { DraftTribe } from "@/db/schema/profile";
import { Loader2, Search, Users } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface TribeSearchRowProps {
  onConfirm: (tribe: DraftTribe) => void;
  /** Already queued, so they never show up as a result again. */
  excludedIds: string[];
}

/**
 * One search bar at a time: type, pick from the top five, check the admins who
 * will get the request, confirm. Confirming queues the tribe — the request
 * itself is only sent when the whole flow completes.
 */
const TribeSearchRow = ({ onConfirm, excludedIds }: TribeSearchRowProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TribeSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);

  const [candidate, setCandidate] = useState<TribeSearchResult | null>(null);
  const [admins, setAdmins] = useState<TribeSuperAdmin[] | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  // Stable dep: the array identity changes on every parent render.
  const excludedKey = excludedIds.join(",");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2 || candidate) {
      setResults([]);
      setOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    setError(false);
    const timer = setTimeout(async () => {
      try {
        const found = await searchTribes(trimmed);
        const excluded = excludedKey ? excludedKey.split(",") : [];
        setResults(found.filter((t) => !excluded.includes(t.id)));
      } catch {
        setError(true);
        setResults([]);
      } finally {
        setSearching(false);
        setOpen(true);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, candidate, excludedKey]);

  const handleSelect = async (tribe: TribeSearchResult) => {
    setCandidate(tribe);
    setOpen(false);
    setAdmins(null);
    setAdmins(await getTribeSuperAdmins(tribe.id));
  };

  const handleCancel = () => {
    setCandidate(null);
    setAdmins(null);
    setQuery("");
    inputRef.current?.focus();
  };

  if (candidate) {
    return (
      <div className="rounded-lg border p-4">
        <div className="flex items-start gap-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-md border bg-muted">
            <Image
              src={candidate.image}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{candidate.name}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="size-3" />
              <span className="tabular-nums">{candidate.memberCount}</span>
              {candidate.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Your request goes to
          </p>
          {admins === null ? (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Looking up admins…
            </div>
          ) : admins.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              This tribe has no admins listed — your request may sit unanswered.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              {admins.map((admin) => (
                <li key={admin.username} className="flex items-center gap-2">
                  <div className="relative size-6 shrink-0 overflow-hidden rounded-full border bg-muted">
                    <Image
                      src={admin.image}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                  <span className="text-sm">
                    {admin.firstName} {admin.lastName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            className="h-10 sm:h-9"
          >
            Not this one
          </Button>
          <Button
            type="button"
            onClick={() =>
              onConfirm({
                id: candidate.id,
                name: candidate.name,
                image: candidate.image,
                source: "search",
              })
            }
            className="h-10 sm:h-9"
          >
            Add to my list
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setOpen(true);
            }}
            placeholder="Search by tribe name or ID…"
            aria-label="Search for a tribe"
            className="h-11 pl-9"
          />
          {searching && (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        sideOffset={6}
        // Keep the caret in the input; the list is browsed with the mouse or
        // arrow keys, never by focus stealing.
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-(--radix-popover-trigger-width) p-0"
      >
        {searching ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Searching…
          </p>
        ) : error ? (
          <p className="p-4 text-center text-sm text-destructive">
            Search failed. Try again.
          </p>
        ) : results.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No tribes match that. Check the spelling, or ask them for the tribe
            ID.
          </p>
        ) : (
          <ul className="max-h-72 divide-y overflow-y-auto">
            {results.map((tribe) => (
              <li key={tribe.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(tribe)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent/60"
                >
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-md border bg-muted">
                    <Image
                      src={tribe.image}
                      alt=""
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {tribe.name}
                    </span>
                    <span className="block text-xs tabular-nums text-muted-foreground">
                      {tribe.memberCount}{" "}
                      {tribe.memberCount === 1 ? "member" : "members"}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TribeSearchRow;
