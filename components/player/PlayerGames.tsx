"use client";

// Games tab of the public player page: every game the player has played as a
// - Every game the player has played
// - Search bar and filter
// - Each game is a flippable card with details at the back
import { CalibratingMark } from "@/components/GameSessionCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ELO_TIER_CLASS, eloTier } from "@/utils/elo";
import {
  filterGames,
  PLAY_TIME_RANGES,
  type GameFilters,
  type playedGames,
} from "@/utils/playerProfile";
import { format, parseISO } from "date-fns";
import { Dices, RotateCcw, Search, SlidersHorizontal, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Game = ReturnType<typeof playedGames>[number] & {
  image: string | null;
  categories: string[];
  mechanics: string[];
};

const PAGE_SIZE = 24;
const NO_FILTERS: GameFilters = { categories: [], mechanics: [], complexity: [], playTime: [] };
const COMPLEXITY_OPTIONS = [
  { key: "light", label: "Light" },
  { key: "medium", label: "Medium" },
  { key: "heavy", label: "Heavy" },
];

type FilterTab = {
  key: keyof GameFilters;
  label: string;
  options: { key: string; label: string }[];
};

// Each tab is a filter group
const FilterTabs: React.FC<{
  tabs: FilterTab[];
  filters: GameFilters;
  onToggle: (key: keyof GameFilters, value: string) => void;
}> = ({ tabs, filters, onToggle }) => (
  <Tabs defaultValue={tabs[0].key} className="min-h-0 flex-1">
    <TabsList className="grid w-full grid-cols-4">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.key} value={tab.key} className="gap-1 px-1 text-xs sm:text-sm">
          {tab.label}
          {filters[tab.key].length > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[0.625rem] font-semibold text-primary-foreground tabular-nums">
              {filters[tab.key].length}
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
    {tabs.map((tab) => (
      <TabsContent
        key={tab.key}
        value={tab.key}
        className="mt-1 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1"
      >
        {tab.options.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">None recorded</p>
        ) : (
          tab.options.map((o) => (
            <label
              key={o.key}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Checkbox
                checked={(filters[tab.key] as string[]).includes(o.key)}
                onCheckedChange={() => onToggle(tab.key, o.key)}
              />
              {o.label}
            </label>
          ))
        )}
      </TabsContent>
    ))}
  </Tabs>
);

// Full game image, or a dice placeholder when the game has none
const Cover: React.FC<{ game: Game }> = ({ game }) =>
  game.image ? (
    <Image
      src={game.image}
      alt=""
      fill
      sizes="(max-width: 640px) 50vw, 240px"
      className="object-cover"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-slate-700 to-slate-900">
      <Dices className="size-12 text-white/20" />
    </div>
  );

const GameCard: React.FC<{ game: Game }> = ({ game }) => {
  const [flipped, setFlipped] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const flip = () => setFlipped((f) => !f);
  const face = "absolute inset-0 overflow-hidden rounded-xl";

  return (
    // Fades up into place the first time it scrolls into view
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${game.title}${game.favourite ? ", favourite" : ""}. Press to ${flipped ? "show the cover" : "see stats"}.`}
        onClick={flip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            flip();
          }
        }}
        className="relative aspect-square cursor-pointer select-none rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative size-full"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* ── Front: cover, title, favourite star ───────────────── */}
          <div className={face} style={{ backfaceVisibility: "hidden" }}>
            <Cover game={game} />
            <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
            {game.favourite && (
              <Star
                aria-hidden
                className="absolute top-2.5 right-2.5 size-5 fill-amber-400 text-amber-400 drop-shadow"
              />
            )}
            <p className="absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-sm font-semibold leading-snug text-white">
              {game.title}
            </p>
          </div>

          {/* ── Back: darkened cover with stats ───────────────────── */}
          <div
            className={face}
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <Cover game={game} />
            <div className="absolute inset-0 bg-black/75" />
            <div className="relative flex h-full flex-col justify-between p-3 text-white">
              <p className="line-clamp-2 text-sm font-semibold leading-snug">{game.title}</p>
              <div className="space-y-2 text-sm">
                {game.elo ? (
                  <span
                    className={cn(
                      "inline-flex items-center rounded-lg px-2 py-0.5 font-bold tabular-nums",
                      ELO_TIER_CLASS[eloTier(game.elo.elo)],
                    )}
                  >
                    ELO {game.elo.elo}
                    {game.elo.calibrating && <CalibratingMark />}
                  </span>
                ) : (
                  <span className="text-white/60">Unrated</span>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-white/60">Plays</span>
                  <span className="font-semibold tabular-nums">{game.plays}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/60">Last played</span>
                  <span className="font-semibold">
                    {format(parseISO(game.lastPlayed), "d MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PlayerGames: React.FC<{ games: Game[] }> = ({ games }) => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(NO_FILTERS);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);

  const results = useMemo(() => filterGames(games, query, filters), [games, query, filters]);
  // Filter options come from the games played, alphabetically
  const [categories, mechanics] = useMemo(() => {
    const options = (pick: (g: Game) => string[]) =>
      [...new Set(games.flatMap(pick))].sort().map((label) => ({ key: label, label }));
    return [options((g) => g.categories), options((g) => g.mechanics)];
  }, [games]);
  const activeCount = Object.values(filters).reduce((n, picked) => n + picked.length, 0);

  // New results start again from the first page
  const search = (value: string) => {
    setQuery(value);
    setVisible(PAGE_SIZE);
  };
  const toggle = (key: keyof GameFilters, value: string) => {
    setFilters((f) => {
      const picked = f[key] as string[];
      return {
        ...f,
        [key]: picked.includes(value) ? picked.filter((v) => v !== value) : [...picked, value],
      };
    });
    setVisible(PAGE_SIZE);
  };
  const reset = () => {
    setFilters(NO_FILTERS);
    setVisible(PAGE_SIZE);
  };
  const isMobile = useIsMobile();
  const tabs: FilterTab[] = [
    { key: "categories", label: "Category", options: categories },
    { key: "mechanics", label: "Mechanic", options: mechanics },
    { key: "complexity", label: "Complexity", options: COMPLEXITY_OPTIONS },
    { key: "playTime", label: "Time", options: [...PLAY_TIME_RANGES] },
  ];
  const trigger = (
    <Button variant="outline" aria-label="Filter games">
      <SlidersHorizontal />
      <span className="hidden sm:inline">Filter</span>
      {activeCount > 0 && (
        <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums">
          {activeCount}
        </span>
      )}
    </Button>
  );
  const resetButton = (
    <Button variant="ghost" size="sm" disabled={activeCount === 0} onClick={reset}>
      <RotateCcw />
      Reset all
    </Button>
  );
  const resultLabel = `${results.length} ${results.length === 1 ? "game" : "games"}`;

  // Load the next page once the end of the list is near. Re-observed after
  // each page so it keeps loading while the sentinel stays on screen.
  const hasMore = visible < results.length;
  useEffect(() => {
    if (!hasMore || !sentinel.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setVisible((v) => v + PAGE_SIZE),
      { rootMargin: "400px" },
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [hasMore, visible]);

  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search games"
            aria-label="Search games"
            className="pl-9"
          />
        </div>
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="flex min-h-0 flex-1 flex-col px-4">
                <FilterTabs tabs={tabs} filters={filters} onToggle={toggle} />
              </div>
              <SheetFooter className="flex-row items-center justify-between border-t">
                {resetButton}
                <SheetClose asChild>
                  <Button>Show {resultLabel}</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        ) : (
          <Popover>
            <PopoverTrigger asChild>{trigger}</PopoverTrigger>
            {/* Capped at 28rem, or less when the window leaves less room */}
            <PopoverContent
              align="end"
              className="flex h-[min(28rem,var(--radix-popover-content-available-height))] w-104 flex-col p-0"
            >
              <div className="border-b px-4 py-3 font-semibold">Filters</div>
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <FilterTabs tabs={tabs} filters={filters} onToggle={toggle} />
              </div>
              <div className="flex items-center justify-between border-t px-3 py-2">
                {resetButton}
                <span className="text-sm text-muted-foreground">{resultLabel}</span>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {games.length === 0 ? (
        <p className="mt-6 rounded-xl border bg-card p-6 text-muted-foreground">
          No games played yet.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-6 rounded-xl border bg-card p-6 text-muted-foreground">
          No games match your search.
        </p>
      ) : (
        // As many columns as fit, each card at least 10rem wide
        <div className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3 sm:gap-4">
          {results.slice(0, visible).map((game) => (
            <GameCard key={game.gameId} game={game} />
          ))}
        </div>
      )}
      {hasMore && <div ref={sentinel} aria-hidden className="h-px" />}
    </div>
  );
};

export default PlayerGames;
