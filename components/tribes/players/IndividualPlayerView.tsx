"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Gamepad2,
  Flame,
  Shield,
  Heart,
  CalendarDays,
  Award,
  Dices,
  RotateCcw,
  Trophy,
  Target,
} from "lucide-react";
import { type GameSession, type TribeMember, type HistStatsInterface } from "@/types/tribes";
import {
  calculatePlayerGameStatsDetailed,
  calculateWinsByWeight,
  calculateWinsByPlayerCount,
  calculateComparativeStats,
  calculateWinRateDaily,
  calculateHeatmapData,
  calculateBadges,
  calculateBgaWinRate,
  calculateWinRateSparkline,
  calculateBgaWinRateSparkline,
  calculateWpaSparkline,
  calculateWinRateDelta,
  calculateWpaDelta,
  getRoleLabel,
  ComparativeStat,
} from "@/utils/playerStatsCalculations";
import PlayerSearchSelect from "./PlayerSearchSelect";
import PlayHeatmap from "./PlayHeatmap";
import WinRateChart from "./WinRateChart";
import WpaChart from "./WpaChart";
import WinsByWeightChart from "./WinsByWeightChart";
import WinsByPlayerCountChart from "./WinsByPlayerCountChart";
import PlayerBadge from "./PlayerBadge";
import GameFlipCard from "./GameFlipCard";
import RecentSessions from "@/components/tribes/RecentSessions";

interface IndividualPlayerViewProps {
  members: TribeMember[];
  sessions: GameSession[];
  histStats: HistStatsInterface;
  userId: number;
  groupId: string;
  selectedPlayerId: number | null;
  onPlayerChange: (profileId: number | null) => void;
}

// ── Mini sparkline (pure SVG, no recharts overhead) ─────────────────

const Sparkline: React.FC<{ data: number[]; color?: string }> = ({
  data,
  color = "white",
}) => {
  if (data.length < 2) return <div className="h-7" />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100;
  const H = 28;
  const P = 2;

  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (W - P * 2) + P;
    const y = H - P - ((v - min) / range) * (H - P * 2);
    return [x, y] as [number, number];
  });

  const linePath = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1][0]} ${H} L ${pts[0][0]} ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-7"
    >
      <path d={areaPath} fill={color} fillOpacity="0.15" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ── Delta indicator ──────────────────────────────────────────────────

const DeltaBadge: React.FC<{
  delta: number | null;
  suffix?: string;
  decimals?: number;
}> = ({ delta, suffix = "%", decimals = 1 }) => {
  if (delta === null) {
    return <span className="text-xs text-white/40">— vs last 30d</span>;
  }
  const positive = delta >= 0;
  return (
    <span
      className={cn(
        "text-xs font-semibold flex items-center gap-0.5",
        positive ? "text-emerald-300" : "text-red-300",
      )}
    >
      {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(decimals)}
      {suffix}
      <span className="font-normal text-white/40 ml-1">vs last 30d</span>
    </span>
  );
};

// ── Flippable Win Rate card ──────────────────────────────────────────

const FlipWinRateCard: React.FC<{
  conventionalRate: number;
  bgaRate: number;
  wins: number;
  gamesPlayed: number;
  delta: { current: number | null; delta: number | null };
  sparklineConv: number[];
  sparklineBga: number[];
}> = ({
  conventionalRate,
  bgaRate,
  wins,
  gamesPlayed,
  delta,
  sparklineConv,
  sparklineBga,
}) => {
  const [flipped, setFlipped] = useState(false);

  const losses = gamesPlayed - wins;

  return (
    <div
      className="relative cursor-pointer select-none h-full"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      aria-label={`Win rate card — tap to switch to ${flipped ? "Standard" : "BGA"} view`}
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.52s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── Front: Standard Win Rate ──── */}
        <div
          className="relative rounded-xl overflow-hidden h-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="bg-gradient-to-br from-primary to-primary/70 p-4 sm:p-5 h-full">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-0.5">
                  Win Rate
                </p>
                <p className="text-xs text-white/50">Standard</p>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-[10px]">
                <RotateCcw className="w-3 h-3" />
                BGA
              </div>
            </div>

            {/* Big number */}
            <p className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none mb-1">
              {conventionalRate}
              <span className="text-2xl font-bold text-white/70">%</span>
            </p>

            {/* Record */}
            <p className="text-xs text-white/50 mb-3">
              {wins}W · {losses}L · {gamesPlayed} games
            </p>

            {/* Delta */}
            <DeltaBadge delta={delta.delta} />

            {/* Sparkline */}
            <div className="mt-3 -mx-1">
              <Sparkline data={sparklineConv} />
            </div>
          </div>
        </div>

        {/* ── Back: BGA Win Rate ──────────── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="bg-gradient-to-br from-violet-700 to-violet-500 p-4 sm:p-5 h-full">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-0.5">
                  Win Rate
                </p>
                <p className="text-xs text-white/50">BGA Formula</p>
              </div>
              <div className="flex items-center gap-1 text-white/40 text-[10px]">
                <RotateCcw className="w-3 h-3" />
                Standard
              </div>
            </div>

            {/* Big number */}
            <p className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none mb-1">
              {bgaRate}
              <span className="text-2xl font-bold text-white/70">%</span>
            </p>

            {/* Formula note */}
            <p className="text-xs text-white/50 mb-3">
              Weighted by player count
            </p>

            {/* Delta (same sessions, different metric) */}
            <DeltaBadge delta={null} />

            {/* Sparkline */}
            <div className="mt-3 -mx-1">
              <Sparkline data={sparklineBga} />
            </div>
          </div>
        </div>
      </div>

      {/* Tap hint — fades after first flip */}
      {!flipped && (
        <p className="absolute bottom-1.5 right-2.5 text-[10px] text-white/30 pointer-events-none">
          tap to flip
        </p>
      )}
    </div>
  );
};

// ── WPA Stat card ────────────────────────────────────────────────────

const WpaStatCard: React.FC<{
  wpa: number;
  gamesPlayed: number;
  delta: { current: number; delta: number | null };
  sparkline: number[];
}> = ({ wpa, gamesPlayed, delta, sparkline }) => (
  <div className="rounded-xl overflow-hidden bg-gradient-to-br from-accent-2 to-accent-2/70 h-full">
    <div className="p-4 sm:p-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-white/70 mb-0.5">
            WPA
          </p>
          <p className="text-xs text-white/50">Win Points Average</p>
        </div>
        <Target className="w-4 h-4 text-white/30" />
      </div>

      {/* Big number */}
      <p className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none mb-1">
        {wpa.toFixed(2)}
      </p>

      {/* Games played */}
      <p className="text-xs text-white/50 mb-3">{gamesPlayed} games played</p>

      {/* Delta */}
      <DeltaBadge delta={delta.delta} suffix="" decimals={2} />

      {/* Sparkline */}
      <div className="mt-3 -mx-1">
        <Sparkline data={sparkline} />
      </div>
    </div>
  </div>
);

// ── Player Banner ────────────────────────────────────────────────────

const PlayerBanner: React.FC<{
  member: TribeMember;
  badges: ReturnType<typeof calculateBadges> extends Map<number, infer V>
    ? V
    : never;
}> = ({ member, badges }) => {
  const roleLabel = getRoleLabel(member.roleId);

  const formatJoinDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <div className="flex items-start gap-4 py-1">
      {/* Avatar */}
      <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 border-2 border-border shadow-sm">
        <AvatarImage src={member.image || ""} alt={member.username} />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
          {member.firstName[0]}
          {member.lastName[0]}
        </AvatarFallback>
      </Avatar>

      {/* Info + Badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          {/* Text info */}
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black truncate leading-tight">
              {member.firstName} {member.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <span className="text-muted-foreground text-sm">
                @{member.username}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {roleLabel}
              </span>
            </div>
            {/* Stats row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-muted-foreground text-xs">
              {member.joinedAt && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Since {formatJoinDate(member.joinedAt)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Dices className="w-3 h-3" />
                {member.gamesPlayed} games
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {member.wins} wins
              </span>
            </div>
          </div>

          {/* Badges cluster — top right */}
          {badges.length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[88px] sm:max-w-none">
              {badges.map((badge) => (
                <PlayerBadge key={badge.type} badge={badge} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Section header ───────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  delay?: number;
}> = ({ icon, title, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="flex items-center gap-2 mb-4"
  >
    {icon}
    <h3 className="text-base font-semibold">{title}</h3>
  </motion.div>
);

// ── Comparative card ─────────────────────────────────────────────────

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const ComparativeCard: React.FC<{
  label: string;
  icon: React.ReactNode;
  iconColor: string;
  labelClass: string;
  stat: ComparativeStat | null;
  statLine: string;
  sessions: GameSession[];
  activePlayerId: number;
  delay?: number;
}> = ({
  label,
  icon,
  iconColor,
  labelClass,
  stat,
  statLine,
  sessions,
  activePlayerId,
  delay = 0,
}) => {
  const [flipped, setFlipped] = useState(false);

  const recentGames = useMemo(() => {
    if (!stat) return [];
    return sessions
      .filter(
        (s) =>
          s.players.some((p) => p.profileId === activePlayerId) &&
          s.players.some((p) => p.profileId === stat.profileId),
      )
      .sort((a, b) => b.datePlayed.localeCompare(a.datePlayed))
      .slice(0, 3);
  }, [sessions, activePlayerId, stat]);

  // ── Empty state ───────────────────────────────────────────────────
  if (!stat) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        className="h-[175px]"
      >
        <Card className="h-full">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center mb-2",
                iconColor,
              )}
            >
              {icon}
            </div>
            <p
              className={cn(
                "text-sm font-bold uppercase tracking-wider",
                labelClass,
              )}
            >
              {label}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Not enough data
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-[175px]"
      style={{ perspective: "1000px" }}
    >
      {/* Flip container */}
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.45s ease",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* ── FRONT ──────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={{ backfaceVisibility: "hidden" }}
        >
          <Card className="h-full hover:shadow-md transition-shadow py-4">
            <CardContent className="px-4 flex flex-col h-full gap-2">
              {/* Label + icon */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm font-black uppercase tracking-wider",
                    labelClass,
                  )}
                >
                  {label}
                </span>
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                    iconColor,
                  )}
                >
                  {icon}
                </div>
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="w-16 h-16 rounded-xl shrink-0">
                  <AvatarImage
                    src={stat.image || ""}
                    alt={stat.username}
                    className="object-cover"
                  />
                  <AvatarFallback
                    className={cn("text-2xl font-black rounded-xl", iconColor)}
                  >
                    {stat.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-2xl font-black leading-tight truncate">
                    {stat.firstName} {stat.lastName}
                  </p>
                  <p className="text-base font-semibold leading-tight truncate text-muted-foreground">
                    {`@${stat.username}`}
                  </p>
                </div>
              </div>

              {/* Stats + tap hint */}
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-muted-foreground">{statLine}</p>
                <p className="text-[10px] text-muted-foreground/50">
                  tap for games
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── BACK ───────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 cursor-pointer"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <Card className="h-full py-2">
            <CardContent className="px-4 flex flex-col h-full gap-2">
              {/* Back header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Recent Games
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn("text-xs font-semibold", labelClass)}>
                    {stat.firstName}
                  </span>
                  <RotateCcw className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>

              {/* Game rows */}
              <div className="flex flex-col gap-1.5 flex-1 justify-center">
                {recentGames.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center">
                    No games together yet
                  </p>
                ) : (
                  recentGames.map((session) => {
                    const me = session.players.find(
                      (p) => p.profileId === activePlayerId,
                    );
                    const won = me?.isWinner ?? false;
                    const winner = session.players.find((p) => p.isWinner);
                    return (
                      <div
                        key={session.sessionId}
                        className="flex items-center gap-2"
                      >
                        {/* W / L badge */}
                        <span
                          className={cn(
                            "w-5 h-5 rounded text-[10px] font-black flex items-center justify-center shrink-0",
                            won
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-red-500/15 text-red-400",
                          )}
                        >
                          {won ? "W" : "L"}
                        </span>
                        {/* Game title */}
                        <span className="flex-1 text-xs font-medium truncate">
                          {session.gameTitle}
                        </span>
                        {/* Winner + date */}
                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-0.5">
                            <Trophy className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[10px] font-semibold text-amber-500 truncate max-w-[48px]">
                              {winner?.firstName ?? "—"}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {formatShortDate(session.datePlayed)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Summary footer */}
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-[10px] text-muted-foreground">
                  {stat.wins}W · {stat.losses}L · {stat.gamesPlayed} together
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  tap to flip
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main component ───────────────────────────────────────────────────

const IndividualPlayerView: React.FC<IndividualPlayerViewProps> = ({
  members,
  sessions,
  histStats,
  userId,
  groupId,
  selectedPlayerId,
  onPlayerChange,
}) => {
  const activePlayerId = selectedPlayerId ?? userId;
  const activeMember = members.find((m) => m.profileId === activePlayerId);

  // Rolling WPA
  const playerRolling = histStats.rollingStats.find(
    (s) => s.profileId === activePlayerId,
  );
  const wpa =
    playerRolling && playerRolling.sessionsPlayed > 0
      ? playerRolling.rollingScore / playerRolling.sessionsPlayed
      : 0;

  // All computed stats
  const detailedStats = useMemo(
    () => calculatePlayerGameStatsDetailed(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const playerSessions = useMemo(
    () =>
      sessions.filter((s) =>
        s.players.some((p) => p.profileId === activePlayerId),
      ),
    [sessions, activePlayerId],
  );
  const winsByWeight = useMemo(
    () => calculateWinsByWeight(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const winsByPlayerCount = useMemo(
    () => calculateWinsByPlayerCount(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const comparative = useMemo(
    () => calculateComparativeStats(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const winRateOverTime = useMemo(
    () => calculateWinRateDaily(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const heatmapData = useMemo(
    () => calculateHeatmapData(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const badgeMap = useMemo(
    () => calculateBadges(sessions, members, histStats.rollingStats),
    [sessions, members, histStats.rollingStats],
  );

  // Banner & stat card data
  const bgaRate = useMemo(
    () => calculateBgaWinRate(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const sparklineConv = useMemo(
    () => calculateWinRateSparkline(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const sparklineBga = useMemo(
    () => calculateBgaWinRateSparkline(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const wpaSparkline = useMemo(
    () => calculateWpaSparkline(histStats.dailyPlayerStats, activePlayerId, groupId),
    [histStats.dailyPlayerStats, activePlayerId, groupId],
  );
  const winRateDelta = useMemo(
    () => calculateWinRateDelta(sessions, activePlayerId),
    [sessions, activePlayerId],
  );
  const wpaDelta = useMemo(
    () =>
      calculateWpaDelta(
        histStats.dailyPlayerStats,
        histStats.rollingStats,
        activePlayerId,
        groupId,
      ),
    [histStats.dailyPlayerStats, histStats.rollingStats, activePlayerId, groupId],
  );

  const playerBadges = badgeMap.get(activePlayerId) ?? [];

  // Empty state
  if (!activeMember) {
    return (
      <div className="p-4 sm:p-6">
        <PlayerSearchSelect
          members={members}
          selectedId={null}
          onSelect={(id) => onPlayerChange(id)}
          placeholder="Select a player to view stats..."
        />
        <div className="text-center py-16 text-muted-foreground">
          <Dices className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">Select a player</p>
          <p className="text-sm">Choose a tribe member to view their stats</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Player Selector ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <PlayerSearchSelect
          members={members}
          selectedId={activePlayerId}
          onSelect={(id) => onPlayerChange(id)}
          placeholder="Search players..."
        />
      </motion.div>

      {/* ── Player Banner ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <PlayerBanner member={activeMember} badges={playerBadges} />
      </motion.div>

      {/* ── Win Rate + WPA stat cards ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        <FlipWinRateCard
          conventionalRate={activeMember.winRate}
          bgaRate={bgaRate}
          wins={activeMember.wins}
          gamesPlayed={activeMember.gamesPlayed}
          delta={winRateDelta}
          sparklineConv={sparklineConv}
          sparklineBga={sparklineBga}
        />

        <WpaStatCard
          wpa={wpa}
          gamesPlayed={activeMember.gamesPlayed}
          delta={wpaDelta}
          sparkline={wpaSparkline}
        />
      </motion.div>

      {/* ── Game Breakdown ────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={<Gamepad2 className="w-5 h-5 text-primary" />}
          title="Game Breakdown"
          delay={0.1}
        />

        {/* Row 1: Best + Worst flip cards */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="grid grid-cols-2 gap-3 mb-4"
        >
          <GameFlipCard game={detailedStats.bestGame} variant="best" />
          <GameFlipCard game={detailedStats.worstGame} variant="worst" />
        </motion.div>

        {/* Row 2: Donut charts */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wins by Complexity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WinsByWeightChart data={winsByWeight} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wins by Player Count
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <WinsByPlayerCountChart data={winsByPlayerCount} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Row 3: Recent sessions for this player */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <RecentSessions
            sessions={playerSessions}
            currentUserId={activePlayerId}
            showFilters={false}
            pageSize={5}
          />
        </motion.div>
      </section>

      {/* ── Over Time ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={<CalendarDays className="w-5 h-5 text-primary" />}
          title="Trends"
          delay={0.15}
        />

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <WinRateChart
              dailyStats={histStats.dailyPlayerStats}
              monthlyStats={histStats.monthlyPlayerStats}
              rollingStats={histStats.rollingStats}
              profileId={activePlayerId}
              groupId={groupId}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <WpaChart
              dailyStats={histStats.dailyPlayerStats}
              rollingStats={histStats.rollingStats}
              profileId={activePlayerId}
              groupId={groupId}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Play Frequency
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <PlayHeatmap data={heatmapData} />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ── Rivalries & Friends ───────────────────────────────────── */}
      <section>
        <SectionHeader
          icon={<Flame className="w-5 h-5 text-primary" />}
          title="Rivalries & Friends"
          delay={0.2}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ComparativeCard
            label="Nemesis"
            icon={<Flame className="w-5 h-5 text-red-400" />}
            iconColor="bg-red-500/10"
            labelClass="text-red-400"
            stat={comparative.nemesis}
            statLine={
              comparative.nemesis
                ? `${comparative.nemesis.losses}L in ${comparative.nemesis.gamesPlayed} games`
                : ""
            }
            sessions={sessions}
            activePlayerId={activePlayerId}
            delay={0.25}
          />
          <ComparativeCard
            label="Dominating"
            icon={<Shield className="w-5 h-5 text-emerald-400" />}
            iconColor="bg-emerald-500/10"
            labelClass="text-emerald-400"
            stat={comparative.dominating}
            statLine={
              comparative.dominating
                ? `${comparative.dominating.wins}W in ${comparative.dominating.gamesPlayed} games`
                : ""
            }
            sessions={sessions}
            activePlayerId={activePlayerId}
            delay={0.3}
          />
          <ComparativeCard
            label="Best Buddy"
            icon={<Heart className="w-5 h-5 text-pink-400" />}
            iconColor="bg-pink-500/10"
            labelClass="text-pink-400"
            stat={comparative.bestBuddy}
            statLine={
              comparative.bestBuddy
                ? `${comparative.bestBuddy.gamesPlayed} games together`
                : ""
            }
            sessions={sessions}
            activePlayerId={activePlayerId}
            delay={0.35}
          />
        </div>
      </section>
    </div>
  );
};

export default IndividualPlayerView;
