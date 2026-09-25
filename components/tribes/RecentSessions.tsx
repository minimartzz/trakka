"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Dices,
  Calendar,
  Trophy,
  Crown,
  Medal,
  Users,
  User,
  ChevronDown,
  Sparkles,
  Pencil,
  Filter,
  Search,
  RotateCcw,
} from "lucide-react";
import { HandshakeIcon, SwordIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "nextjs-toploader/app";
import { useState, useMemo, useRef, useEffect } from "react";

import { type GameSession, type TimeFilter } from "@/types/tribes";
import DotsIcon from "@/components/icons/DotsIcon";
import { useIsMobile } from "@/hooks/use-mobile";

interface RecentSessionsProps {
  sessions: GameSession[];
  currentUserId?: number;
  emptyMessage?: string;
  delay?: number;
  showFilters?: boolean;
  pageSize?: number;
  title?: string;
  initialTimeFilter?: TimeFilter;
  /**
   * When true, an "Edit mode" toggle is shown. While active, each session
   * exposes an edit action that redirects to its edit page — available to
   * tribe admins regardless of whether they played in the session. The edit
   * page re-validates the user's role server-side, so this flag is UX only.
   */
  canEdit?: boolean;
}

const TIME_FILTER_LABELS: Record<TimeFilter, string> = {
  today: "Today",
  past_week: "Past week",
  past_month: "Past month",
  past_year: "Past year",
  all_time: "All time",
};

const PAGE_SIZE = 10;

const getTimeFilterDate = (filter: TimeFilter): Date | null => {
  const now = new Date();
  switch (filter) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "past_week":
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return weekAgo;
    case "past_month":
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return monthAgo;
    case "past_year":
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return yearAgo;
    case "all_time":
      return null;
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();

  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (today.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

// ── Session type: solo (1 player), cooperative (coop flag), competitive ──────

type SessionKind = "solo" | "cooperative" | "competitive";

const sessionType = (session: GameSession): SessionKind =>
  session.players.length === 1
    ? "solo"
    : session.coop
      ? "cooperative"
      : "competitive";

// Coop/solo sessions share one outcome rather than a single winning player
const sessionWon = (session: GameSession): boolean =>
  session.players.some((p) => p.isWinner);

const TYPE_META: Record<SessionKind, { label: string; icon: React.ReactNode }> =
  {
    solo: { label: "Solo", icon: <User className="size-4" /> },
    cooperative: {
      label: "Co-op",
      icon: <HandshakeIcon weight="fill" className="size-4" />,
    },
    competitive: {
      label: "Competitive",
      icon: <SwordIcon weight="fill" className="size-4" />,
    },
  };

// ── Icon-only column/cell header, tooltip carries the label ──────────────────

const HeaderIcon: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex text-muted-foreground" aria-label={label}>
        {children}
      </span>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
);

const GameThumb: React.FC<{
  imageUrl?: string | null;
  gameTitle: string;
  className?: string;
}> = ({ imageUrl, gameTitle, className = "w-10 h-10" }) => {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-primary/10 shrink-0",
          className,
        )}
      >
        <Dices className="w-5 h-5 text-primary" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-md overflow-hidden shrink-0 bg-muted",
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt={gameTitle}
        fill
        sizes="40px"
        className="object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
};

// Game type pill — mobile card only, top right corner
const GameTypePill: React.FC<{ type: SessionKind }> = ({ type }) => {
  const meta = TYPE_META[type];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      {meta.icon}
      {meta.label}
    </span>
  );
};

// Game type icon — desktop table only, leading column
const SessionTypeIcon: React.FC<{ type: SessionKind }> = ({ type }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex text-muted-foreground">
        {TYPE_META[type].icon}
      </span>
    </TooltipTrigger>
    <TooltipContent>{TYPE_META[type].label}</TooltipContent>
  </Tooltip>
);

// Same dot-grid dice used across the dashboard, tinted to the muted-foreground tone
const PlayersDice: React.FC<{ count: number }> = ({ count }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="inline-flex text-muted-foreground">
        <DotsIcon value={count} className="mr-0 **:data-dot:bg-current" />
      </div>
    </TooltipTrigger>
    <TooltipContent>
      {count} {count === 1 ? "player" : "players"}
    </TooltipContent>
  </Tooltip>
);

// Small badge overlaid on an avatar/circle to mark a first play
const FirstPlayMark: React.FC = () => (
  <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-purple-500 text-white ring-2 ring-background">
    <Sparkles className="size-2" />
  </span>
);

// 1st = gold, 2nd = silver, 3rd = bronze, everyone else = neutral grey
const POSITION_BADGE_CLASS: Record<number, string> = {
  1: "bg-[conic-gradient(from_225deg,#A07010,#E8C040,#FFFACC,#E8C040,#A07010)] text-yellow-900 shadow-sm shadow-yellow-400/40",
  2: "bg-[conic-gradient(from_225deg,#686868,#C0C0C0,#F8F8F8,#C0C0C0,#686868)] text-zinc-700 shadow-sm shadow-zinc-400/40",
  3: "bg-[conic-gradient(from_225deg,#7A3008,#D07828,#FFD090,#D07828,#7A3008)] text-orange-950 shadow-sm shadow-orange-400/40",
};

const PositionBadge: React.FC<{
  position: number;
  isFirstPlay?: boolean;
}> = ({ position, isFirstPlay }) => (
  <div className="relative inline-flex shrink-0">
    <span
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
        POSITION_BADGE_CLASS[position] ?? "bg-muted text-muted-foreground",
      )}
    >
      {position}
    </span>
    {isFirstPlay && <FirstPlayMark />}
  </div>
);

// Win/loss circle for solo & cooperative sessions, matching the dashboard's outcome circle
const OutcomeBadge: React.FC<{ won: boolean }> = ({ won }) => (
  <span
    className={cn(
      "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
      won
        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
        : "bg-destructive/15 text-destructive",
    )}
  >
    {won ? "W" : "L"}
  </span>
);

// Competitive: the winning player's avatar + name, as its own row/column.
// Solo/co-op: a shared W/L badge, since there's no single winning player.
const WinnerCell: React.FC<{
  session: GameSession;
  currentUserId?: number;
}> = ({ session, currentUserId }) => {
  if (sessionType(session) !== "competitive") {
    const won = sessionWon(session);
    return (
      <div className="flex items-center gap-2">
        <OutcomeBadge won={won} />
        <span className="text-sm font-medium">{won ? "Win" : "Loss"}</span>
      </div>
    );
  }

  const winner = session.players.find((p) => p.isWinner);
  if (!winner) {
    return (
      <span className="text-muted-foreground text-sm">No winner recorded</span>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="w-7 h-7 shrink-0">
        <AvatarImage
          src={winner.image || ""}
          alt={winner.username}
          className="object-cover"
        />
        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-medium">
          {winner.firstName[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 items-center gap-1.5">
        <Trophy className="w-3 h-3 shrink-0 text-amber-500" />
        <span
          className={cn(
            "text-sm font-medium truncate",
            winner.profileId === currentUserId && "text-primary",
          )}
        >
          {winner.firstName}
        </span>
        {winner.isFirstPlay && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1 py-0 h-4 shrink-0 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
          >
            <Sparkles className="w-2.5 h-2.5 mr-0.5" />
            1st
          </Badge>
        )}
      </div>
    </div>
  );
};

const EditModeToggle: React.FC<{
  editMode: boolean;
  onToggle: (checked: boolean) => void;
  className?: string;
}> = ({ editMode, onToggle, className }) => (
  <div
    className={cn(
      "flex items-center gap-1.5 self-end rounded-lg py-1.5",
      className,
    )}
  >
    <Pencil
      className={cn(
        "w-3.5 h-3.5 transition-colors",
        editMode ? "text-primary" : "text-muted-foreground",
      )}
    />
    <Label
      htmlFor="edit-mode"
      className={cn(
        "text-xs cursor-pointer transition-colors whitespace-nowrap",
        editMode ? "text-foreground font-medium" : "text-muted-foreground",
      )}
    >
      Edit mode
    </Label>
    <Switch
      id="edit-mode"
      checked={editMode}
      onCheckedChange={onToggle}
      size="sm"
    />
  </div>
);

// ── Filter panel: time + game + players ───────────────────────────────────────

interface FilterOption {
  id: number;
  label: string;
  imageUrl?: string | null;
}

const buildGameOptions = (sessions: GameSession[]): FilterOption[] => {
  const byId = new Map<number, FilterOption>();
  for (const session of sessions) {
    if (!byId.has(session.gameId)) {
      byId.set(session.gameId, {
        id: session.gameId,
        label: session.gameTitle,
        imageUrl: session.thumbnail,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const buildPlayerOptions = (sessions: GameSession[]): FilterOption[] => {
  const byId = new Map<number, FilterOption>();
  for (const session of sessions) {
    for (const player of session.players) {
      if (!byId.has(player.profileId)) {
        byId.set(player.profileId, {
          id: player.profileId,
          label: `${player.firstName} ${player.lastName}`.trim(),
          imageUrl: player.image,
        });
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const TimeFilterChips: React.FC<{
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
}> = ({ value, onChange }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      Time
    </span>
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Time filter">
      {(Object.keys(TIME_FILTER_LABELS) as TimeFilter[]).map((filter) => (
        <button
          key={filter}
          type="button"
          aria-pressed={value === filter}
          onClick={() => onChange(filter)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
            value === filter
              ? "border-primary bg-primary text-primary-foreground"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {TIME_FILTER_LABELS[filter]}
        </button>
      ))}
    </div>
  </div>
);

const FilterMultiSelect: React.FC<{
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: FilterOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  avatarShape: "round" | "square";
  emptyMessage: string;
}> = ({
  label,
  icon,
  placeholder,
  options,
  selectedIds,
  onToggle,
  avatarShape,
  emptyMessage,
}) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, search]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </span>
        {selectedIds.length > 0 && (
          <span className="text-xs font-medium tabular-nums text-primary">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-md border px-2.5">
        <Search className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 dark:bg-transparent"
        />
      </div>

      <ScrollArea className="h-36 rounded-md border">
        <ul className="p-1" role="group" aria-label={label}>
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((option) => {
              const checked = selectedIds.includes(option.id);
              return (
                <li key={option.id}>
                  <label
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm transition-colors",
                      checked ? "bg-accent/60" : "hover:bg-accent",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => onToggle(option.id)}
                      aria-label={option.label}
                    />
                    {option.imageUrl ? (
                      <div
                        className={cn(
                          "relative size-6 shrink-0 overflow-hidden bg-muted",
                          avatarShape === "round" ? "rounded-full" : "rounded-md",
                        )}
                      >
                        <Image
                          src={option.imageUrl}
                          alt=""
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center bg-muted text-[10px] font-semibold text-muted-foreground",
                          avatarShape === "round" ? "rounded-full" : "rounded-md",
                        )}
                      >
                        {option.label[0]}
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </ScrollArea>
    </div>
  );
};

const FilterPanelBody: React.FC<{
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  gameOptions: FilterOption[];
  selectedGameIds: number[];
  onToggleGame: (id: number) => void;
  playerOptions: FilterOption[];
  selectedPlayerIds: number[];
  onTogglePlayer: (id: number) => void;
  onReset: () => void;
  activeFilterCount: number;
}> = ({
  timeFilter,
  onTimeFilterChange,
  gameOptions,
  selectedGameIds,
  onToggleGame,
  playerOptions,
  selectedPlayerIds,
  onTogglePlayer,
  onReset,
  activeFilterCount,
}) => (
  <div className="flex flex-col gap-4">
    <TimeFilterChips value={timeFilter} onChange={onTimeFilterChange} />
    <Separator />
    <FilterMultiSelect
      label="Game"
      icon={<Dices className="size-3.5" />}
      placeholder="Search games"
      options={gameOptions}
      selectedIds={selectedGameIds}
      onToggle={onToggleGame}
      avatarShape="square"
      emptyMessage="No games found"
    />
    <Separator />
    <FilterMultiSelect
      label="Players"
      icon={<Users className="size-3.5" />}
      placeholder="Search players"
      options={playerOptions}
      selectedIds={selectedPlayerIds}
      onToggle={onTogglePlayer}
      avatarShape="round"
      emptyMessage="No players found"
    />
    <Separator />
    <Button
      variant="ghost"
      size="sm"
      className="w-full text-xs text-muted-foreground hover:text-foreground"
      onClick={onReset}
      disabled={activeFilterCount === 0}
    >
      <RotateCcw className="size-3.5" />
      Reset filters
    </Button>
  </div>
);

const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions,
  currentUserId,
  emptyMessage = "No sessions found",
  delay = 0,
  showFilters = true,
  pageSize = PAGE_SIZE,
  title,
  initialTimeFilter = "past_month",
  canEdit = false,
}) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(initialTimeFilter);
  const [selectedGameIds, setSelectedGameIds] = useState<number[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [editMode, setEditMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const gameOptions = useMemo(() => buildGameOptions(sessions), [sessions]);
  const playerOptions = useMemo(() => buildPlayerOptions(sessions), [sessions]);

  const activeFilterCount =
    (timeFilter !== initialTimeFilter ? 1 : 0) +
    selectedGameIds.length +
    selectedPlayerIds.length;

  const toggleGame = (id: number) =>
    setSelectedGameIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );

  const togglePlayer = (id: number) =>
    setSelectedPlayerIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );

  const resetFilters = () => {
    setTimeFilter(initialTimeFilter);
    setSelectedGameIds([]);
    setSelectedPlayerIds([]);
  };

  // Filter sessions by time, game, and players
  const filteredSessions = useMemo(() => {
    const filterDate = getTimeFilterDate(timeFilter);

    let filtered = filterDate
      ? sessions.filter((session) => new Date(session.datePlayed) >= filterDate)
      : sessions;

    if (selectedGameIds.length > 0) {
      filtered = filtered.filter((session) =>
        selectedGameIds.includes(session.gameId),
      );
    }

    if (selectedPlayerIds.length > 0) {
      filtered = filtered.filter((session) =>
        session.players.some((p) => selectedPlayerIds.includes(p.profileId)),
      );
    }

    // Sort by datePlayed descending, then createdAt descending for same-day sessions
    return [...filtered].sort((a, b) => {
      const dateDiff =
        new Date(b.datePlayed).getTime() - new Date(a.datePlayed).getTime();
      if (dateDiff !== 0) return dateDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [sessions, timeFilter, selectedGameIds, selectedPlayerIds]);

  useEffect(() => {
    setVisibleCount(pageSize);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [timeFilter, selectedGameIds, selectedPlayerIds, pageSize]);

  const visibleSessions = filteredSessions.slice(0, visibleCount);
  const hasMore = filteredSessions.length > visibleCount;
  const isEmpty = filteredSessions.length === 0;

  // Leave edit mode if the filters reduce the list to nothing to act on.
  useEffect(() => {
    if (isEmpty) setEditMode(false);
  }, [isEmpty]);

  const showEditColumn = canEdit && editMode;

  const handleEditSession = (sessionId: string) => {
    router.push(`/session/edit/${sessionId}`);
  };

  const getWinner = (session: GameSession) => {
    return session.players.find((p) => p.isWinner);
  };

  const getCurrentUserInSession = (session: GameSession) => {
    if (!currentUserId) return null;
    return session.players.find((p) => p.profileId === currentUserId);
  };

  const filterPanelProps = {
    timeFilter,
    onTimeFilterChange: setTimeFilter,
    gameOptions,
    selectedGameIds,
    onToggleGame: toggleGame,
    playerOptions,
    selectedPlayerIds,
    onTogglePlayer: togglePlayer,
    onReset: resetFilters,
    activeFilterCount,
  };

  const filterTrigger = (
    <Button variant="outline" size="sm" className="relative gap-1.5">
      <Filter className="size-3.5" />
      Filter
      {activeFilterCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
          {activeFilterCount}
        </span>
      )}
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="h-full">
        <CardHeader>
          {showFilters ? (
            <div className="flex items-center justify-between gap-3">
              {canEdit && (
                <EditModeToggle editMode={editMode} onToggle={setEditMode} />
              )}

              {/* Filter — comprehensive popover on desktop, bottom sheet on
                  mobile. Only one overlay is ever mounted: both are Radix
                  portals with their own focus/dismiss handling, so rendering
                  both at once (even CSS-hidden) makes them fight over focus
                  and close each other instantly. */}
              <div className="ml-auto">
                {isMobile ? (
                  <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                    <SheetTrigger asChild>{filterTrigger}</SheetTrigger>
                    <SheetContent
                      side="bottom"
                      className="max-h-[85vh] overflow-y-auto rounded-t-xl"
                    >
                      <SheetHeader>
                        <SheetTitle>Filter sessions</SheetTitle>
                      </SheetHeader>
                      <div className="px-4 pb-6">
                        <FilterPanelBody {...filterPanelProps} />
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                    <PopoverTrigger asChild>{filterTrigger}</PopoverTrigger>
                    <PopoverContent align="end" className="w-96">
                      <FilterPanelBody {...filterPanelProps} />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {title ?? "Recent Sessions"}
              </CardTitle>
              {canEdit && (
                <EditModeToggle editMode={editMode} onToggle={setEditMode} />
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Dices className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">{emptyMessage}</p>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="max-h-107.5 overflow-y-auto overflow-x-auto"
            >
              {/* ---- Mobile: one card per session -------------------- */}
              <div className="space-y-3 md:hidden">
                {visibleSessions.map((session) => {
                  const winner = getWinner(session);
                  const currentUser = getCurrentUserInSession(session);
                  const isCurrentUserWinner = currentUser?.isWinner ?? false;

                  return (
                    <div
                      key={session.sessionId}
                      className={cn(
                        "rounded-lg border bg-muted/30 p-3",
                        currentUser && "bg-primary/5",
                      )}
                    >
                      {/* Game + date, type pill top right */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <GameThumb
                            imageUrl={session.thumbnail}
                            gameTitle={session.gameTitle}
                            className="size-12"
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate font-medium"
                              title={session.gameTitle}
                            >
                              {session.gameTitle}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="size-3.5" />
                              {formatDate(session.datePlayed)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                          <GameTypePill type={sessionType(session)} />
                          {showEditColumn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              aria-label={`Edit ${session.gameTitle} session`}
                              onClick={() =>
                                handleEditSession(session.sessionId)
                              }
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Winner — its own row, as in the previous design */}
                      <div className="mt-3 border-t pt-3">
                        <WinnerCell
                          session={session}
                          currentUserId={currentUserId}
                        />
                      </div>

                      {/* Stats */}
                      <div
                        className={cn(
                          "mt-3 grid gap-2 border-t pt-3 text-center",
                          currentUserId ? "grid-cols-4" : "grid-cols-2",
                        )}
                      >
                        <div>
                          <HeaderIcon label="Players">
                            <Users className="size-3.5" />
                          </HeaderIcon>
                          <div className="mt-1 flex justify-center">
                            <PlayersDice count={session.players.length} />
                          </div>
                        </div>
                        {currentUserId && (
                          <div>
                            <HeaderIcon label="Your position">
                              <Medal className="size-3.5" />
                            </HeaderIcon>
                            <div className="mt-1 flex justify-center">
                              {currentUser ? (
                                <PositionBadge
                                  position={currentUser.position}
                                  isFirstPlay={currentUser.isFirstPlay}
                                />
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <HeaderIcon label="Winning VP">
                            <Crown className="size-3.5" />
                          </HeaderIcon>
                          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                            {winner?.victoryPoints ?? "—"}
                          </p>
                        </div>
                        {currentUserId && (
                          <div>
                            <HeaderIcon label="Your VP">
                              <User className="size-3.5" />
                            </HeaderIcon>
                            <p
                              className={cn(
                                "mt-1 text-sm tabular-nums",
                                isCurrentUserWinner
                                  ? "text-amber-600 dark:text-amber-400 font-medium"
                                  : "text-foreground",
                              )}
                            >
                              {currentUser?.victoryPoints ?? "—"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ---- Desktop: table with icon-only headers ------------ */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead className="w-20" />
                      <TableHead />
                      <TableHead className="w-40">
                        <HeaderIcon label="Winner">
                          <Trophy className="size-4" />
                        </HeaderIcon>
                      </TableHead>
                      <TableHead className="w-14 text-center">
                        <HeaderIcon label="Players">
                          <Users className="size-4" />
                        </HeaderIcon>
                      </TableHead>
                      {currentUserId && (
                        <TableHead className="w-14 text-center">
                          <HeaderIcon label="Your position">
                            <Medal className="size-4" />
                          </HeaderIcon>
                        </TableHead>
                      )}
                      <TableHead className="w-16 text-right">
                        <HeaderIcon label="Winning VP">
                          <Crown className="size-4" />
                        </HeaderIcon>
                      </TableHead>
                      {currentUserId && (
                        <TableHead className="w-14 text-right">
                          <HeaderIcon label="Your VP">
                            <User className="size-4" />
                          </HeaderIcon>
                        </TableHead>
                      )}
                      {showEditColumn && (
                        <TableHead className="w-10 sticky right-0 bg-card" />
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleSessions.map((session) => {
                      const currentUser = getCurrentUserInSession(session);
                      const isCurrentUserWinner =
                        currentUser?.isWinner ?? false;

                      return (
                        <TableRow
                          key={session.sessionId}
                          className={cn(
                            "border-b transition-colors hover:bg-muted/50",
                            currentUser && "bg-primary/5",
                          )}
                        >
                          {/* Session type */}
                          <TableCell className="w-8">
                            <SessionTypeIcon type={sessionType(session)} />
                          </TableCell>

                          {/* Date */}
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(session.datePlayed)}
                          </TableCell>

                          {/* Game */}
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <GameThumb
                                imageUrl={session.thumbnail}
                                gameTitle={session.gameTitle}
                              />
                              <span
                                className="font-medium truncate max-w-30 md:max-w-48 lg:max-w-64"
                                title={session.gameTitle}
                              >
                                {session.gameTitle}
                              </span>
                            </div>
                          </TableCell>

                          {/* Winner — first of the stat-detail columns */}
                          <TableCell>
                            <WinnerCell
                              session={session}
                              currentUserId={currentUserId}
                            />
                          </TableCell>

                          {/* Players */}
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <PlayersDice count={session.players.length} />
                            </div>
                          </TableCell>

                          {/* Current user's position */}
                          {currentUserId && (
                            <TableCell className="text-center">
                              {currentUser ? (
                                <div className="flex justify-center">
                                  <PositionBadge
                                    position={currentUser.position}
                                    isFirstPlay={currentUser.isFirstPlay}
                                  />
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                          )}

                          {/* Winning VP */}
                          <TableCell className="text-right">
                            {(() => {
                              const winner = getWinner(session);
                              return winner?.victoryPoints !== null &&
                                winner?.victoryPoints !== undefined ? (
                                <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                                  {winner.victoryPoints} VP
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              );
                            })()}
                          </TableCell>

                          {/* Your VP */}
                          {currentUserId && (
                            <TableCell className="text-right">
                              {currentUser?.victoryPoints !== null &&
                              currentUser?.victoryPoints !== undefined ? (
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    isCurrentUserWinner
                                      ? "text-amber-600 dark:text-amber-400"
                                      : "text-foreground",
                                  )}
                                >
                                  {currentUser.victoryPoints} VP
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  —
                                </span>
                              )}
                            </TableCell>
                          )}

                          {/* Edit action — sticky to the right so it stays
                              reachable while the row scrolls horizontally on
                              narrow screens. Solid background occludes the
                              scrolled content beneath it. */}
                          {showEditColumn && (
                            <TableCell className="text-right sticky right-0 bg-card">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                aria-label={`Edit ${session.gameTitle} session`}
                                onClick={() =>
                                  handleEditSession(session.sessionId)
                                }
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Show more button — always at the bottom of the scroll area,
                  so the user reveals it by scrolling rather than it popping
                  into view. Hidden only when no more games remain. */}
              {hasMore && (
                <div className="mt-3 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setVisibleCount((c) => c + pageSize)}
                  >
                    Show{" "}
                    {Math.min(pageSize, filteredSessions.length - visibleCount)}{" "}
                    more
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecentSessions;
