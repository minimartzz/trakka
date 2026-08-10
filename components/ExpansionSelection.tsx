"use client";
import { getExpansionDetails } from "@/app/(generic)/session/create/action";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BGGDetailsInterface, BGGLinkInterface } from "@/utils/fetchBgg";
import { Loader2, Plus, Puzzle, Search, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";

export type SelectedExpansion = Pick<
  BGGDetailsInterface,
  "id" | "title" | "thumbnail" | "image" | "yearPublished" | "weight"
>;

interface ExpansionSelectionProps {
  expansionLinks: BGGLinkInterface[];
  selected: SelectedExpansion[];
  onChange: (expansions: SelectedExpansion[]) => void;
}

const Thumbnail = ({
  src,
  className = "h-8 w-8",
}: {
  src: string | undefined;
  className?: string;
}) => (
  <div
    className={`relative shrink-0 overflow-hidden rounded-sm bg-muted ${className}`}
  >
    {src ? (
      <Image src={src} alt="" fill sizes="32px" className="object-cover" />
    ) : (
      <Puzzle className="h-full w-full p-1.5 text-muted-foreground" />
    )}
  </div>
);

const ExpansionSelection = ({
  expansionLinks,
  selected,
  onChange,
}: ExpansionSelectionProps) => {
  const [available, setAvailable] = useState<BGGDetailsInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [fetched, setFetched] = useState(false);

  // A different base game means a different expansion list — re-arm the
  // lazy fetch so the popover doesn't keep showing the old game's options.
  const linkSignature = expansionLinks.map((link) => link.id).join(",");
  useEffect(() => {
    setFetched(false);
    setAvailable([]);
  }, [linkSignature]);

  // Fetch full expansion details lazily, only once the picker is opened.
  useEffect(() => {
    if (!open || fetched) return;
    let cancelled = false;
    setLoading(true);
    getExpansionDetails(expansionLinks).then((details) => {
      if (!cancelled) {
        setAvailable(details);
        setLoading(false);
        setFetched(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, fetched, expansionLinks]);

  const selectedIds = useMemo(
    () => new Set(selected.map((e) => e.id)),
    [selected],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const unselected = available.filter((e) => !selectedIds.has(e.id));
    if (!q) return unselected;
    return unselected.filter((e) => e.title.toLowerCase().includes(q));
  }, [available, selectedIds, search]);

  const addExpansion = (expansion: BGGDetailsInterface) => {
    onChange([
      ...selected,
      {
        id: expansion.id,
        title: expansion.title,
        thumbnail: expansion.thumbnail,
        image: expansion.image,
        yearPublished: expansion.yearPublished,
        weight: expansion.weight,
      },
    ]);
    setSearch("");
  };

  const removeExpansion = (id: string) => {
    onChange(selected.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Expansions</Label>
        {selected.length > 0 && (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {selected.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
        {selected.map((expansion) => (
          <div
            key={expansion.id}
            className="group flex h-9 items-center gap-2 rounded-md border bg-card py-1 pl-1 pr-1.5"
          >
            <Thumbnail src={expansion.thumbnail} className="h-7 w-7" />
            <span className="max-w-32 truncate text-sm font-medium">
              {expansion.title}
            </span>
            <button
              type="button"
              aria-label={`Remove ${expansion.title}`}
              onClick={() => removeExpansion(expansion.id)}
              className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-md border border-transparent px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              {selected.length === 0 ? "Add expansion" : "Add another"}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-80 p-0"
            onOpenAutoFocus={(e) => {
              // Don't pop the soft keyboard on touch devices.
              if (
                typeof window !== "undefined" &&
                !window.matchMedia("(pointer: fine)").matches
              ) {
                e.preventDefault();
              }
            }}
          >
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expansions..."
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {loading && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading expansions...
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  {available.length === 0
                    ? "No expansions found."
                    : "No matches. All expansions selected."}
                </p>
              )}

              {!loading &&
                filtered.map((expansion) => (
                  <button
                    key={expansion.id}
                    type="button"
                    onClick={() => addExpansion(expansion)}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"
                  >
                    <Thumbnail src={expansion.thumbnail} />
                    <span className="min-w-0 flex-1 truncate">
                      {expansion.title}
                    </span>
                  </button>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ExpansionSelection;
