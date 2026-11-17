"use client";
import type { SearchResult } from "@/app/api/search/route";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Dices, Loader2, Search } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const SECTIONS = [
  { type: "users", label: "Users" },
  { type: "tribes", label: "Tribes" },
  { type: "games", label: "Games" },
] as const;
type SearchType = (typeof SECTIONS)[number]["type"];
type SectionState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; results: SearchResult[] };

// shortcut: unbounded for the page's lifetime; fine for typed search terms
const resultCache = new Map<string, SearchResult[]>();

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const GlobalSearchBar = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<
    Partial<Record<SearchType, SectionState>>
  >({});

  const term = query.trim();
  const isSearching = term.replace(/^@/, "").length >= 2;
  // "@" searches usernames, so only the Users section applies
  const visible = term.startsWith("@") ? SECTIONS.slice(0, 1) : SECTIONS;

  useEffect(() => {
    if (!isSearching) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const types = term.startsWith("@")
        ? (["users"] as const)
        : SECTIONS.map((s) => s.type);
      setSections({});
      const update = (type: SearchType, state: SectionState) =>
        setSections((prev) => ({ ...prev, [type]: state }));

      for (const type of types) {
        const key = `${type}:${term.toLowerCase()}`;
        const cached = resultCache.get(key);
        if (cached) {
          update(type, { status: "done", results: cached });
          continue;
        }
        update(type, { status: "loading" });
        fetch(
          `/api/search?type=${type}&term=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        )
          .then((res) => {
            if (!res.ok) throw new Error(`Search failed: ${res.status}`);
            return res.json() as Promise<SearchResult[]>;
          })
          .then((results) => {
            resultCache.set(key, results);
            update(type, { status: "done", results });
          })
          .catch((err) => {
            if (err.name !== "AbortError") update(type, { status: "error" });
          });
      }
    }, 250);

    // Cancel the pending search and any in-flight requests for the old term
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term, isSearching]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="flex w-full items-center">
      {/* Search bar - sits above the overlay so it stays usable while open */}
      <div className="z-60 relative w-full">
        <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3">
          <Search className="h-4 w-4" />
        </div>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          placeholder="Search anything..."
          className="z-60 bg-background pl-9 w-full"
        />
      </div>

      {/* Full screen overlay: any click closes it; cards navigate first */}
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-label="Search results"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/70 backdrop-blur-xs text-white"
          >
            <div className="px-4 pt-24 pb-10 sm:px-12">
              {!isSearching ? (
                <h1 className="font-bold text-2xl md:text-4xl lg:text-5xl">
                  Search for users, tribes, games...
                </h1>
              ) : (
                <div className="flex flex-col gap-8">
                  {visible.map(({ type, label }) => (
                    <ResultSection
                      key={type}
                      type={type}
                      label={label}
                      state={sections[type] ?? { status: "loading" }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const ResultSection = ({
  type,
  label,
  state,
}: {
  type: SearchType;
  label: string;
  state: SectionState;
}) => (
  <section>
    <h2 className="mb-3 text-xl font-bold lg:mb-4 lg:text-4xl">{label}</h2>
    {state.status === "loading" ? (
      <Loader2 className="h-6 w-6 animate-spin" aria-label={`Loading ${label}`} />
    ) : state.status === "error" ? (
      <p className="text-white/60">Couldn&apos;t load {label.toLowerCase()}</p>
    ) : state.results.length === 0 ? (
      <p className="text-white/60">No {label.toLowerCase()} found</p>
    ) : (
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {state.results.map((result) => (
          <Link
            key={result.id}
            href={result.href}
            // The click bubbles to the overlay, which closes it
            onClick={() =>
              posthog.capture("global_search_result_clicked", { type })
            }
            className={cn(
              "shrink-0 basis-[38%] snap-start overflow-hidden rounded-xl bg-card text-card-foreground transition-opacity hover:opacity-90 md:basis-[21%] lg:basis-[14.5%]",
              type === "users" && "p-3",
            )}
          >
            {/* Tribe and game images sit flush against the card's top and sides */}
            <Avatar
              className={cn(
                "aspect-square size-auto w-full",
                type === "users" ? "rounded-full" : "rounded-xl",
              )}
            >
              {result.image && (
                <AvatarImage src={result.image} alt="" className="object-cover" />
              )}
              <AvatarFallback
                className={cn(
                  "text-xl font-semibold",
                  type === "users" ? "rounded-full" : "rounded-xl",
                )}
              >
                {type === "games" ? (
                  <Dices className="h-1/3 w-1/3 text-muted-foreground" />
                ) : (
                  initials(result.title)
                )}
              </AvatarFallback>
            </Avatar>
            <div className={type === "users" ? "mt-2" : "px-3 pt-2 pb-3"}>
              <p className="truncate font-semibold">{result.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {result.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </section>
);

export default GlobalSearchBar;
