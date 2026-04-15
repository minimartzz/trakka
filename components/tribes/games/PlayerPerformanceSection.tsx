"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Search,
  ChevronDown,
  Gamepad2,
  Trophy,
  CalendarDays,
  Hourglass,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  Zap,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useContainerSize } from "@/hooks/useContainerSize";
import { format, formatDistanceToNow } from "date-fns";
import { type GameSession, type TribeMember, type GameListItem } from "@/types/tribes";
import {
  buildGamePlayerOptions,
  pickDefaultPlayer,
  computePlayerGameStats,
  computeTribeGameStats,
  type GamePlayerOption,
  type PlayerGameStats,
  type TribeGameStats,
} from "./utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(p: { firstName: string; lastName: string }) {
  return `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
}

function formatDeltaVp(
  playerVal: number | null,
  tribeVal: number | null,
): { delta: number; text: string; tone: "up" | "down" | "same" } | null {
  if (playerVal === null || tribeVal === null) return null;
  const d = Math.round((playerVal - tribeVal) * 10) / 10;
  if (d === 0) return { delta: 0, text: "matches tribe", tone: "same" };
  return {
    delta: d,
    text: `${d > 0 ? "+" : ""}${d} vs tribe`,
    tone: d > 0 ? "up" : "down",
  };
}

// ─── Player Search Dropdown ───────────────────────────────────────────────────

function PlayerDropdown({
  players,
  selectedId,
  selected,
  onSelect,
}: {
  players: GamePlayerOption[];
  selectedId: number | null;
  selected: GamePlayerOption | null;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return players;
    const q = query.toLowerCase();
    return players.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q),
    );
  }, [players, query]);

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <div
        className={cn(
          "flex items-center gap-2 border rounded-lg bg-card px-3 py-2 cursor-pointer transition-all",
          open
            ? "ring-2 ring-primary/50 border-primary"
            : "hover:border-primary/40",
        )}
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <>
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players..."
              className="border-0 p-0 h-auto shadow-none focus-visible:ring-0 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </>
        ) : selected ? (
          <>
            <Avatar className="w-6 h-6 shrink-0">
              <AvatarImage src={selected.image ?? ""} alt={selected.username} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {getInitials(selected)}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm font-medium">
              {selected.firstName} {selected.lastName}
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">
            Select a player...
          </span>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 top-full mt-1.5 left-0 right-0 bg-popover border rounded-lg shadow-lg overflow-hidden"
          >
            <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No players found
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.profileId}
                    onClick={() => {
                      onSelect(p.profileId);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2.5 rounded-md text-sm transition-colors text-left",
                      p.profileId === selectedId
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarImage src={p.image ?? ""} alt={p.username} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {getInitials(p)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {p.plays} {p.plays === 1 ? "play" : "plays"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Profile banner ───────────────────────────────────────────────────────────

function ProfileBanner({
  player,
  stats,
  gameTitle,
  isSelf,
}: {
  player: GamePlayerOption;
  stats: PlayerGameStats;
  gameTitle: string;
  isSelf: boolean;
}) {
  const profileStats = [
    {
      icon: <Gamepad2 className="w-4 h-4" />,
      label: "Plays",
      value: `${stats.plays}`,
      tone: "primary" as const,
    },
    {
      icon: <Trophy className="w-4 h-4" />,
      label: "Wins",
      value: `${stats.wins}`,
      tone: "emerald" as const,
    },
    {
      icon: <CalendarDays className="w-4 h-4" />,
      label: "Last Played",
      value: stats.lastPlayed
        ? format(new Date(stats.lastPlayed), "MMM d, yyyy")
        : "—",
      tone: "slate" as const,
    },
    {
      icon: <Hourglass className="w-4 h-4" />,
      label: "Days Since Play",
      value:
        stats.daysSinceLastPlay !== null ? `${stats.daysSinceLastPlay}` : "—",
      tone: "amber" as const,
    },
    {
      icon: <Flame className="w-4 h-4" />,
      label: "Last Won",
      value: stats.lastWon
        ? formatDistanceToNow(new Date(stats.lastWon), { addSuffix: true })
        : "Never",
      tone: "rose" as const,
    },
  ];

  const toneStyles: Record<string, { bg: string; text: string; icon: string }> = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: "text-primary",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-500",
    },
    slate: {
      bg: "bg-slate-500/10",
      text: "text-slate-700 dark:text-slate-300",
      icon: "text-slate-500",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      icon: "text-amber-500",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-600 dark:text-rose-400",
      icon: "text-rose-500",
    },
  };

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-card to-[var(--accent-5)]/5">
      {/* Decorative blur */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-[var(--accent-5)]/10 blur-3xl pointer-events-none" />

      <div className="relative p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-[var(--accent-5)] blur-md opacity-60" />
            <Avatar className="relative w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-background">
              <AvatarImage src={player.image ?? ""} alt={player.username} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {getInitials(player)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="sm:hidden">
            <div className="flex items-center gap-1.5">
              <h3 className="text-lg font-bold tracking-tight truncate">
                {player.firstName} {player.lastName}
              </h3>
              {isSelf && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              @{player.username} · {gameTitle}
            </p>
          </div>
        </div>

        {/* Name + stats */}
        <div className="flex-1 min-w-0">
          <div className="hidden sm:block mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold tracking-tight truncate">
                {player.firstName} {player.lastName}
              </h3>
              {isSelf && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                  You
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              @{player.username} · playing{" "}
              <span className="font-medium text-foreground">{gameTitle}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {profileStats.map((stat) => {
              const s = toneStyles[stat.tone];
              return (
                <div
                  key={stat.label}
                  className={cn(
                    "rounded-lg px-2.5 py-2 border border-transparent",
                    s.bg,
                  )}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className={s.icon}>{stat.icon}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold truncate",
                      s.text,
                    )}
                  >
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Score stat cards with tribe delta ────────────────────────────────────────

function ScoreDeltaCard({
  label,
  icon,
  playerValue,
  tribeValue,
  tribeLabel,
  tone,
}: {
  label: string;
  icon: React.ReactNode;
  playerValue: number | null;
  tribeValue: number | null;
  tribeLabel: string;
  tone: "emerald" | "rose" | "primary";
}) {
  const delta = formatDeltaVp(playerValue, tribeValue);

  const toneMap = {
    emerald: {
      grad: "from-emerald-500/15 via-emerald-500/5 to-transparent",
      border: "border-emerald-500/25",
      icon: "text-emerald-500",
      number: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
    },
    rose: {
      grad: "from-rose-500/15 via-rose-500/5 to-transparent",
      border: "border-rose-500/25",
      icon: "text-rose-500",
      number: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
    },
    primary: {
      grad: "from-primary/15 via-primary/5 to-transparent",
      border: "border-primary/25",
      icon: "text-primary",
      number: "text-primary",
      dot: "bg-primary",
    },
  } as const;
  const t = toneMap[tone];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br",
        t.grad,
        t.border,
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
          </div>
          <span className={t.icon}>{icon}</span>
        </div>

        {/* Big number */}
        <div className="flex items-baseline gap-1 mb-3">
          <span
            className={cn(
              "text-4xl sm:text-5xl font-black tracking-tight tabular-nums leading-none",
              t.number,
            )}
          >
            {playerValue !== null ? playerValue : "—"}
          </span>
          {playerValue !== null && (
            <span className="text-xs font-semibold text-muted-foreground">VP</span>
          )}
        </div>

        {/* Delta pill */}
        {delta && tribeValue !== null ? (
          <div className="space-y-1.5">
            <DeltaPill delta={delta} />
            <p className="text-[11px] text-muted-foreground leading-snug">
              Tribe {tribeLabel}:{" "}
              <span className="font-semibold tabular-nums text-foreground/80">
                {tribeValue} VP
              </span>
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">No tribe data yet</p>
        )}
      </div>
    </div>
  );
}

function DeltaPill({
  delta,
}: {
  delta: { delta: number; text: string; tone: "up" | "down" | "same" };
}) {
  const styles = {
    up: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    down: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    same: "bg-muted text-muted-foreground",
  } as const;
  const Icon = delta.tone === "up" ? TrendingUp : delta.tone === "down" ? TrendingDown : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tabular-nums",
        styles[delta.tone],
      )}
    >
      <Icon className="w-3 h-3" />
      {delta.text}
    </span>
  );
}

// ─── Radial gauge (creative aggregates viz) ───────────────────────────────────

function RadialGauge({
  value,
  displayValue,
  label,
  sublabel,
  tribeRef,
  tribeRefLabel,
  tone,
  icon,
}: {
  value: number; // 0..1
  displayValue: string;
  label: string;
  sublabel: string;
  tribeRef: number | null; // 0..1
  tribeRefLabel: string | null;
  tone: "primary" | "violet";
  icon: React.ReactNode;
}) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const dash = circumference * clamped;
  const tribeClamped =
    tribeRef === null ? null : Math.max(0, Math.min(1, tribeRef));
  const tribeAngle = tribeClamped === null ? null : tribeClamped * 360 - 90;

  const toneMap = {
    primary: {
      from: "var(--primary)",
      to: "var(--accent-1)",
      chip: "bg-primary/10 text-primary",
    },
    violet: {
      from: "var(--accent-5)",
      to: "var(--accent-4)",
      chip: "bg-[var(--accent-5)]/10 text-[var(--accent-5)]",
    },
  } as const;
  const t = toneMap[tone];
  const gradId = `grad-${tone}`;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className={cn("p-1 rounded-md", t.chip)}>{icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={t.from} />
                <stop offset="100%" stopColor={t.to} />
              </linearGradient>
            </defs>

            {/* Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.08}
              strokeWidth={stroke}
            />

            {/* Progress */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - dash }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          </svg>

          {/* Tribe reference tick */}
          {tribeAngle !== null && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ transform: `rotate(${tribeAngle}deg)` }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2 h-3 w-[3px] rounded-full bg-foreground/70"
                style={{ top: stroke / 2 - 6 }}
              />
            </div>
          )}

          {/* Centered content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl sm:text-4xl font-black tracking-tight tabular-nums leading-none">
              {displayValue}
            </span>
          </div>
        </div>
      </div>

      {tribeRefLabel && (
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="w-2 h-0.5 rounded-full bg-foreground/70" />
          <span>{tribeRefLabel}</span>
        </div>
      )}
    </div>
  );
}

// ─── Historical play timeline (creative SVG chart) ────────────────────────────

interface TimelineEntry {
  dateISO: string;
  dateMs: number;
  isWin: boolean;
}

function PlayTimeline({
  playDates,
  winDates,
}: {
  playDates: string[];
  winDates: string[];
}) {
  const [containerRef, { width: measuredWidth }] = useContainerSize();
  const [tip, setTip] = useState<{
    x: number;
    y: number;
    dateISO: string;
    isWin: boolean;
  } | null>(null);

  const winSet = useMemo(() => new Set(winDates), [winDates]);
  const entries: TimelineEntry[] = useMemo(
    () =>
      playDates.map((d) => ({
        dateISO: d,
        dateMs: new Date(d).getTime(),
        isWin: winSet.has(d),
      })),
    [playDates, winSet],
  );

  const totalWins = winDates.length;
  const totalPlays = playDates.length;
  const winRate = totalPlays > 0 ? Math.round((totalWins / totalPlays) * 100) : 0;

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No plays recorded yet for this game.
        </p>
      </div>
    );
  }

  // Fall back to a sane width before first measurement so SSR/hydration
  // don't render a zero-width SVG.
  const W = Math.max(measuredWidth || 320, 280);
  const isNarrow = W < 480;
  const H = isNarrow ? 120 : 150;
  const padX = isNarrow ? 12 : 20;
  const padTop = 24;
  const padBottom = 36;

  const minMs = entries[0].dateMs;
  const maxMs = entries[entries.length - 1].dateMs;
  const range = Math.max(maxMs - minMs, 1);

  const xFor = (ms: number) =>
    padX + ((ms - minMs) / range) * (W - padX * 2);

  const cumulative = entries.map((_, i) => i + 1);
  const maxCum = cumulative[cumulative.length - 1];
  const baselineY = H - padBottom;
  const yFor = (c: number) =>
    baselineY - ((c - 1) / Math.max(maxCum - 1, 1)) * (baselineY - padTop);

  const areaPath =
    entries.length > 1
      ? entries
          .map((e, i) => {
            const x = xFor(e.dateMs);
            const y = yFor(cumulative[i]);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ") +
        ` L ${xFor(entries[entries.length - 1].dateMs)} ${baselineY} L ${xFor(entries[0].dateMs)} ${baselineY} Z`
      : null;

  const linePath =
    entries.length > 1
      ? entries
          .map((e, i) => {
            const x = xFor(e.dateMs);
            const y = yFor(cumulative[i]);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ")
      : null;

  // Pick a reasonable tick count given width (~80px per label)
  const tickCount = Math.min(
    entries.length,
    Math.max(2, Math.floor((W - padX * 2) / 80)),
  );
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const t = tickCount === 1 ? 0 : i / (tickCount - 1);
    const ms = minMs + t * range;
    return {
      ms,
      label: format(new Date(ms), isNarrow ? "MMM yy" : "MMM yyyy"),
    };
  });

  const winTickH = isNarrow ? 14 : 20;
  const lossTickH = isNarrow ? 8 : 10;
  const winR = isNarrow ? 3.5 : 4.5;
  const lossR = isNarrow ? 2.5 : 3;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-4 sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Play Rhythm</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{totalWins} wins</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">
              {totalPlays - totalWins} losses
            </span>
          </span>
          <span className="text-muted-foreground">{winRate}% win rate</span>
        </div>
      </div>

      <div ref={containerRef} className="relative w-full">
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block w-full"
          style={{ height: H }}
        >
          <defs>
            <linearGradient id="timeline-area" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Baseline */}
          <line
            x1={padX}
            x2={W - padX}
            y1={baselineY}
            y2={baselineY}
            stroke="currentColor"
            strokeOpacity={0.12}
            strokeDasharray="3 3"
          />

          {/* Cumulative area */}
          {areaPath && <path d={areaPath} fill="url(#timeline-area)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeOpacity={0.5}
              strokeWidth={1.5}
            />
          )}

          {/* Play dots */}
          {entries.map((e, i) => {
            const cx = xFor(e.dateMs);
            const cy = baselineY;
            const tickH = e.isWin ? winTickH : lossTickH;
            const r = e.isWin ? winR : lossR;
            return (
              <g key={`${e.dateISO}-${i}`}>
                <line
                  x1={cx}
                  x2={cx}
                  y1={cy}
                  y2={cy - tickH}
                  stroke={e.isWin ? "rgb(16 185 129)" : "currentColor"}
                  strokeOpacity={e.isWin ? 0.9 : 0.3}
                  strokeWidth={e.isWin ? 2 : 1.5}
                />
                <circle
                  cx={cx}
                  cy={cy - tickH}
                  r={r}
                  fill={e.isWin ? "rgb(16 185 129)" : "currentColor"}
                  fillOpacity={e.isWin ? 1 : 0.45}
                  className="cursor-pointer"
                  onMouseEnter={() =>
                    setTip({
                      x: cx,
                      y: cy - tickH,
                      dateISO: e.dateISO,
                      isWin: e.isWin,
                    })
                  }
                  onMouseLeave={() => setTip(null)}
                />
              </g>
            );
          })}

          {/* X-axis ticks */}
          {ticks.map((tick, i) => {
            const x = xFor(tick.ms);
            const anchor =
              i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle";
            return (
              <text
                key={i}
                x={x}
                y={baselineY + 18}
                textAnchor={anchor}
                fontSize={isNarrow ? 10 : 11}
                fill="currentColor"
                fillOpacity={0.55}
              >
                {tick.label}
              </text>
            );
          })}
        </svg>

        {tip && (
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-full pb-1"
            style={{
              left: tip.x,
              top: tip.y,
            }}
          >
            <div className="px-2 py-1 rounded-md bg-popover border shadow-md text-[11px] whitespace-nowrap">
              <span
                className={cn(
                  "font-semibold",
                  tip.isWin ? "text-emerald-500" : "text-muted-foreground",
                )}
              >
                {tip.isWin ? "Win" : "Loss"}
              </span>
              <span className="text-muted-foreground">
                {" · "}
                {format(new Date(tip.dateISO), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Aggregates section (Win Rate + WPA) ──────────────────────────────────────

function AggregatesSection({
  stats,
  tribeStats,
}: {
  stats: PlayerGameStats;
  tribeStats: TribeGameStats;
}) {
  const winRateDisplay = `${Math.round(stats.winRate * 100)}%`;
  const wpaDisplay = stats.wpa !== null ? stats.wpa.toFixed(2) : "—";

  // Map WPA (usually 0..2+) to 0..1 by clamping against a 2.0 ceiling for gauge fill.
  const wpaFill = stats.wpa !== null ? Math.min(1, stats.wpa / 2) : 0;
  const tribeWpaFill =
    tribeStats.tribeWpa !== null ? Math.min(1, tribeStats.tribeWpa / 2) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RadialGauge
        value={stats.winRate}
        displayValue={winRateDisplay}
        label="Win Rate"
        sublabel={`${stats.wins} wins in ${stats.plays} plays`}
        tribeRef={tribeStats.tribeWinRate}
        tribeRefLabel={
          tribeStats.tribeWinRate !== null
            ? `Tribe win rate: ${Math.round(tribeStats.tribeWinRate * 100)}%`
            : null
        }
        tone="primary"
        icon={<Target className="w-3.5 h-3.5" />}
      />
      <RadialGauge
        value={wpaFill}
        displayValue={wpaDisplay}
        label="WPA"
        sublabel={
          stats.wpaSessions > 0
            ? `Win Points Average · ${stats.wpaSessions} sessions`
            : "Win Points Average · no data"
        }
        tribeRef={tribeWpaFill}
        tribeRefLabel={
          tribeStats.tribeWpa !== null
            ? `Tribe WPA: ${tribeStats.tribeWpa.toFixed(2)}`
            : null
        }
        tone="violet"
        icon={<Zap className="w-3.5 h-3.5" />}
      />
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function PlayerPerformanceSection({
  sessions,
  selectedGameId,
  selectedGame,
  members,
  currentUserId,
}: {
  sessions: GameSession[];
  selectedGameId: number;
  selectedGame: GameListItem;
  members: TribeMember[];
  currentUserId: number | null;
}) {
  const players = useMemo(
    () => buildGamePlayerOptions(sessions, selectedGameId, members),
    [sessions, selectedGameId, members],
  );

  const defaultPlayer = useMemo(
    () => pickDefaultPlayer(players, currentUserId),
    [players, currentUserId],
  );

  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(
    defaultPlayer?.profileId ?? null,
  );

  const selectedPlayer = useMemo(
    () => players.find((p) => p.profileId === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  const tribeStats = useMemo(
    () => computeTribeGameStats(sessions, selectedGameId),
    [sessions, selectedGameId],
  );

  const stats = useMemo(
    () =>
      selectedPlayerId !== null
        ? computePlayerGameStats(sessions, selectedGameId, selectedPlayerId)
        : null,
    [sessions, selectedGameId, selectedPlayerId],
  );

  if (players.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Player Performance</h2>
        </div>
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No players have logged this game yet.
        </div>
      </motion.section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="space-y-5"
    >
      {/* Header + dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Player Performance</h2>
        </div>
        <PlayerDropdown
          players={players}
          selectedId={selectedPlayerId}
          selected={selectedPlayer}
          onSelect={setSelectedPlayerId}
        />
      </div>

      {selectedPlayer && stats ? (
        <motion.div
          key={selectedPlayer.profileId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-5"
        >
          {/* Plays — profile banner */}
          <ProfileBanner
            player={selectedPlayer}
            stats={stats}
            gameTitle={selectedGame.gameTitle}
            isSelf={selectedPlayer.profileId === currentUserId}
          />

          {/* Scores — stat cards with deltas */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Scores vs Tribe
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ScoreDeltaCard
                label="Highest VP"
                icon={<TrendingUp className="w-4 h-4" />}
                playerValue={stats.highestVp?.value ?? null}
                tribeValue={tribeStats.highestVp}
                tribeLabel="highest"
                tone="emerald"
              />
              <ScoreDeltaCard
                label="Lowest VP"
                icon={<TrendingDown className="w-4 h-4" />}
                playerValue={stats.lowestVp?.value ?? null}
                tribeValue={tribeStats.lowestVp}
                tribeLabel="lowest"
                tone="rose"
              />
              <ScoreDeltaCard
                label="Average VP"
                icon={<Target className="w-4 h-4" />}
                playerValue={stats.avgVp}
                tribeValue={tribeStats.avgVp}
                tribeLabel="average"
                tone="primary"
              />
            </div>
          </div>

          {/* Aggregates — win rate + WPA radial gauges */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aggregates
              </span>
            </div>
            <AggregatesSection stats={stats} tribeStats={tribeStats} />
          </div>

          {/* Historical — play timeline */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Historical
              </span>
            </div>
            <PlayTimeline
              playDates={stats.playDates}
              winDates={stats.winDates}
            />
          </div>
        </motion.div>
      ) : null}
    </motion.section>
  );
}
