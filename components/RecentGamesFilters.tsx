"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AvailableGame, AvailableTribe } from "@/utils/recordsProcessing";
import { format } from "date-fns";
import {
  CalendarDays,
  Check,
  Dices,
  ListFilter,
  RotateCcw,
  Search,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";

export type ResultFilter = "all" | "won" | "lost" | "tie";

export interface RecentGamesFilterState {
  result: ResultFilter;
  gameIds: number[];
  tribeIds: string[];
  dateRange: DateRange | undefined;
}

interface ResultChip {
  key: ResultFilter;
  label: string;
  count: number;
  dotClass: string;
}

// A single option in a multi-select list.
interface MultiSelectOption<K extends string | number> {
  id: K;
  label: string;
  image?: string | null;
}

interface MultiSelectFilterProps<K extends string | number> {
  icon: React.ReactNode;
  allLabel: string;
  searchPlaceholder: string;
  emptyLabel: string;
  options: MultiSelectOption<K>[];
  selectedIds: K[];
  onToggle: (id: K) => void;
  onClear: () => void;
}

// Searchable, scrollable multi-select popover. Shared by the Games and Tribes
// filters so both look and behave identically.
function MultiSelectFilter<K extends string | number>({
  icon,
  allLabel,
  searchPlaceholder,
  emptyLabel,
  options,
  selectedIds,
  onToggle,
  onClear,
}: MultiSelectFilterProps<K>) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  const selectedCount = selectedIds.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm" variant="outline" className="gap-1.5">
          {icon}
          {selectedCount === 0 ? allLabel : `${selectedCount} selected`}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0"
        onOpenAutoFocus={(e) => {
          // Don't pull focus into the search input on touch devices — it pops
          // the soft keyboard. Coarse pointers tap into the field themselves.
          if (
            typeof window !== "undefined" &&
            !window.matchMedia("(pointer: fine)").matches
          ) {
            e.preventDefault();
          }
        }}
      >
        {/* Embedded search — transparent so it blends with the popover */}
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          {selectedCount > 0 && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              onClick={onClear}
              className="shrink-0 text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>

        <ScrollArea className="h-64">
          <ul className="p-1">
            {filtered.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyLabel}
              </li>
            ) : (
              filtered.map((option) => {
                const checked = selectedIds.includes(option.id);
                // Whether this list shows leading thumbnails at all.
                const hasImages = options.some((o) => o.image !== undefined);
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => onToggle(option.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent",
                        checked && "bg-accent/60",
                      )}
                    >
                      {/* Visual checkbox (not a nested <button>) */}
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input",
                        )}
                      >
                        {checked && <Check className="size-3" />}
                      </span>
                      {hasImages && (
                        <span className="relative size-7 shrink-0 overflow-hidden rounded bg-muted">
                          {option.image ? (
                            <Image
                              src={option.image}
                              alt=""
                              fill
                              sizes="28px"
                              className="object-cover"
                            />
                          ) : (
                            <span className="flex size-full items-center justify-center">
                              <Dices className="size-3.5 text-muted-foreground" />
                            </span>
                          )}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

interface RecentGamesFiltersProps {
  filters: RecentGamesFilterState;
  resultChips: ResultChip[];
  availableGames: AvailableGame[];
  availableTribes: AvailableTribe[];
  isDefault: boolean;
  shownCount: number;
  totalCount: number;
  onResultChange: (result: ResultFilter) => void;
  onToggleGame: (gameId: number) => void;
  onClearGames: () => void;
  onToggleTribe: (tribeId: string) => void;
  onClearTribes: () => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  onReset: () => void;
}

// Compact label for the active range, e.g. "12 Jan – 18 Jan".
const formatRangeLabel = (range: DateRange | undefined): string => {
  if (!range?.from) return "Any dates";
  if (!range.to || range.from.getTime() === range.to.getTime()) {
    return format(range.from, "dd MMM yyyy");
  }
  return `${format(range.from, "dd MMM")} – ${format(range.to, "dd MMM yyyy")}`;
};

const RecentGamesFilters: React.FC<RecentGamesFiltersProps> = ({
  filters,
  resultChips,
  availableGames,
  availableTribes,
  isDefault,
  shownCount,
  totalCount,
  onResultChange,
  onToggleGame,
  onClearGames,
  onToggleTribe,
  onClearTribes,
  onDateRangeChange,
  onReset,
}) => {
  const hasDate = Boolean(filters.dateRange?.from);

  const gameOptions: MultiSelectOption<number>[] = availableGames.map((g) => ({
    id: g.gameId,
    label: g.gameTitle,
    image: g.gameImage,
  }));
  const tribeOptions: MultiSelectOption<string>[] = availableTribes.map(
    (t) => ({
      id: t.tribeId,
      label: t.tribeName,
    }),
  );

  const selectedGames = availableGames.filter((g) =>
    filters.gameIds.includes(g.gameId),
  );
  const selectedTribes = availableTribes.filter((t) =>
    filters.tribeIds.includes(t.tribeId),
  );

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ListFilter className="size-4 text-muted-foreground" />
          Filters
        </div>
        {!isDefault && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-10">
        {/* Row 1 — Result */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Result
          </p>
          <div
            role="group"
            aria-label="Filter by result"
            className="flex flex-wrap gap-2"
          >
            {resultChips.map(({ key, label, count, dotClass }) => {
              const active = filters.result === key;
              return (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  aria-pressed={active}
                  onClick={() => onResultChange(key)}
                  className="gap-1.5"
                >
                  <span className={cn("size-1.5 rounded-full", dotClass)} />
                  {label}
                  <span className="font-mono text-xs tabular-nums opacity-70">
                    {count}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Row 2 — Tribe + game + date */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tribe, game &amp; date
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Tribe multi-select */}
            <MultiSelectFilter
              icon={<Users className="size-3.5" />}
              allLabel="All tribes"
              searchPlaceholder="Search tribes"
              emptyLabel="No tribes found"
              options={tribeOptions}
              selectedIds={filters.tribeIds}
              onToggle={onToggleTribe}
              onClear={onClearTribes}
            />

            {/* Game multi-select */}
            <MultiSelectFilter
              icon={<Dices className="size-3.5" />}
              allLabel="All games"
              searchPlaceholder="Search games"
              emptyLabel="No games found"
              options={gameOptions}
              selectedIds={filters.gameIds}
              onToggle={onToggleGame}
              onClear={onClearGames}
            />

            {/* Date range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant={hasDate ? "default" : "outline"}
                  className="gap-1.5"
                >
                  <CalendarDays className="size-3.5" />
                  {formatRangeLabel(filters.dateRange)}
                  {hasDate && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear date filter"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateRangeChange(undefined);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          onDateRangeChange(undefined);
                        }
                      }}
                      className="-mr-1 inline-flex size-4 items-center justify-center rounded-full hover:bg-primary-foreground/20"
                    >
                      <X className="size-3" />
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={filters.dateRange}
                  onSelect={onDateRangeChange}
                  defaultMonth={filters.dateRange?.from}
                  disabled={(date) => date > new Date()}
                  numberOfMonths={1}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Status strip + active filter chips */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-3 text-sm text-muted-foreground">
        <span>
          {isDefault ? (
            <>
              <span className="font-semibold tabular-nums text-foreground">
                {totalCount}
              </span>{" "}
              {totalCount === 1 ? "session" : "sessions"}
            </>
          ) : (
            <>
              Showing{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {shownCount}
              </span>{" "}
              of <span className="tabular-nums">{totalCount}</span> sessions
            </>
          )}
        </span>

        {(selectedTribes.length > 0 || selectedGames.length > 0) && (
          <span className="flex flex-wrap items-center gap-1">
            {selectedTribes.map((t) => (
              <Badge
                key={t.tribeId}
                variant="secondary"
                className="gap-1 py-0.5 pl-2 pr-1 font-normal"
              >
                <Users className="size-3 text-muted-foreground" />
                <span className="max-w-32 truncate">{t.tribeName}</span>
                <button
                  type="button"
                  aria-label={`Remove ${t.tribeName} filter`}
                  onClick={() => onToggleTribe(t.tribeId)}
                  className="inline-flex size-3.5 items-center justify-center rounded-full hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {selectedGames.map((g) => (
              <Badge
                key={g.gameId}
                variant="secondary"
                className="gap-1 py-0.5 pl-2 pr-1 font-normal"
              >
                <span className="max-w-32 truncate">{g.gameTitle}</span>
                <button
                  type="button"
                  aria-label={`Remove ${g.gameTitle} filter`}
                  onClick={() => onToggleGame(g.gameId)}
                  className="inline-flex size-3.5 items-center justify-center rounded-full hover:bg-foreground/10"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
          </span>
        )}
      </div>
    </div>
  );
};

export default RecentGamesFilters;
