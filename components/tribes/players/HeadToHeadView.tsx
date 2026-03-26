"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Swords, Flame, RotateCcw, Gamepad2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { type GameSession, type TribeMember, type HistStatsInterface } from "@/types/tribes";
import {
  calculateHeadToHead,
  calculateBgaWinRate,
  H2HGameResult,
  H2HMostPlayedGame,
} from "@/utils/playerStatsCalculations";
import { getCssVar } from "@/utils/chartHelpers";
import PlayerSearchSelect from "./PlayerSearchSelect";
import H2HWpaChart from "./H2HWpaChart";

// ── Types ────────────────────────────────────────────────────────────

interface HeadToHeadViewProps {
  members: TribeMember[];
  sessions: GameSession[];
  histStats: HistStatsInterface;
  userId: number;
  groupId: string;
}

interface PlayerOverall {
  gamesPlayed: number;
  wins: number;
  ties: number;
  winRate: number;
  bgaWinRate: number;
  avgWeight: number;
}

interface ComparisonRowData {
  label: string;
  p1Value: number;
  p2Value: number;
  format?: (v: number) => string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getPlayerOverall(
  sessions: GameSession[],
  profileId: number,
): PlayerOverall {
  let gamesPlayed = 0;
  let wins = 0;
  let ties = 0;
  let weightSum = 0;
  let weightCount = 0;

  sessions.forEach((session) => {
    const player = session.players.find((p) => p.profileId === profileId);
    if (!player) return;

    gamesPlayed++;
    if (player.isWinner) {
      wins++;
      const winnerCount = session.players.filter((p) => p.isWinner).length;
      if (winnerCount > 1) ties++;
    }

    if (session.gameWeight !== null) {
      weightSum += session.gameWeight;
      weightCount++;
    }
  });

  return {
    gamesPlayed,
    wins,
    ties,
    winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
    bgaWinRate: calculateBgaWinRate(sessions, profileId),
    avgWeight:
      weightCount > 0 ? parseFloat((weightSum / weightCount).toFixed(1)) : 0,
  };
}

const formatPct = (v: number) => `${v}%`;
const formatWeight = (v: number) => v.toFixed(1);

const formatShortDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

// ── Comparison Row ───────────────────────────────────────────────────

const ComparisonRow: React.FC<{
  row: ComparisonRowData;
  p1Color: string;
  p2Color: string;
  animate?: boolean;
}> = ({ row, p1Color, p2Color, animate = true }) => {
  const { label, p1Value, p2Value, format } = row;
  const maxVal = Math.max(p1Value, p2Value) || 1;
  const p1Width = (p1Value / maxVal) * 100;
  const p2Width = (p2Value / maxVal) * 100;
  const p1Wins = p1Value > p2Value;
  const p2Wins = p2Value > p1Value;
  const display = format ?? ((v: number) => String(v));

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 py-1.5">
      <span
        className={cn(
          "w-10 sm:w-12 text-right text-sm font-bold tabular-nums shrink-0",
          p1Wins ? "text-foreground" : "text-muted-foreground/60",
        )}
        style={p1Wins ? { color: p1Color } : undefined}
      >
        {display(p1Value)}
      </span>
      <div className="flex-1 flex justify-end">
        <div
          className="h-5 sm:h-6 rounded-sm"
          style={{
            width: animate ? `${p1Width}%` : "0%",
            backgroundColor: p1Color,
            opacity: p1Wins ? 1 : 0.35,
            transition: "width 600ms ease-out, opacity 300ms ease",
          }}
        />
      </div>
      <span className="w-14 sm:w-20 text-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
        {label}
      </span>
      <div className="flex-1">
        <div
          className="h-5 sm:h-6 rounded-sm"
          style={{
            width: animate ? `${p2Width}%` : "0%",
            backgroundColor: p2Color,
            opacity: p2Wins ? 1 : 0.35,
            transition: "width 600ms ease-out, opacity 300ms ease",
          }}
        />
      </div>
      <span
        className={cn(
          "w-10 sm:w-12 text-sm font-bold tabular-nums shrink-0",
          p2Wins ? "text-foreground" : "text-muted-foreground/60",
        )}
        style={p2Wins ? { color: p2Color } : undefined}
      >
        {display(p2Value)}
      </span>
    </div>
  );
};

// ── Section Divider ──────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-2 mt-1">
    <div className="h-px flex-1 bg-border" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

// ── Most Played Game Flip Card ───────────────────────────────────────

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

const MostPlayedFlipCard: React.FC<{
  game: H2HMostPlayedGame;
  p1Name: string;
  p2Name: string;
  p1Color: string;
  p2Color: string;
  p1Id: number;
  p2Id: number;
}> = ({ game, p1Name, p2Name, p1Color, p2Color, p1Id, p2Id }) => {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="relative cursor-pointer select-none h-52"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      aria-label="Most played game — tap to see recent sessions"
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ──── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          {game.gameImageUrl ? (
            <Image
              src={game.gameImageUrl}
              alt={game.gameTitle}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 300px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-white/20" />
            </div>
          )}

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

          {/* Badge */}
          <div className="absolute top-0 left-0 right-0 w-full py-1.5 flex items-center justify-center gap-1.5 text-white bg-violet-500/80">
            <Gamepad2 className="w-3 h-3" />
            <span className="text-[11px] font-black uppercase tracking-widest">
              Most Played Together
            </span>
          </div>

          {/* Centre: games count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-4xl font-black text-white leading-none">
              {game.timesPlayed}
            </p>
            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">
              games together
            </p>
          </div>

          {/* Title at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <p className="text-white font-semibold text-xs truncate leading-snug">
              {game.gameTitle}
            </p>
          </div>

          {!flipped && (
            <div className="absolute bottom-2.5 right-2.5 text-white/30">
              <RotateCcw className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* ── BACK ──── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-card border"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="p-3 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
              {game.gameImageUrl ? (
                <Image
                  src={game.gameImageUrl}
                  alt={game.gameTitle}
                  width={32}
                  height={32}
                  className="rounded object-cover w-8 h-8 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <p className="text-xs font-semibold truncate leading-tight">
                {game.gameTitle}
              </p>
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-[52px] shrink-0" />
              <span
                className="text-[9px] font-bold uppercase tracking-wider flex-1 text-right"
                style={{ color: p1Color }}
              >
                {p1Name}
              </span>
              <span className="w-4 shrink-0" />
              <span
                className="text-[9px] font-bold uppercase tracking-wider flex-1"
                style={{ color: p2Color }}
              >
                {p2Name}
              </span>
            </div>

            {/* Session rows */}
            <div className="flex-1 flex flex-col justify-center gap-2">
              {game.recentSessions.slice(0, 3).map((r: H2HGameResult) => {
                const p1Player = r.session.players.find(
                  (p) => p.profileId === p1Id,
                );
                const p2Player = r.session.players.find(
                  (p) => p.profileId === p2Id,
                );
                const p1Pos = p1Player?.position ?? null;
                const p2Pos = p2Player?.position ?? null;
                const p1Better =
                  p1Pos !== null && p2Pos !== null && p1Pos < p2Pos;
                const p2Better =
                  p1Pos !== null && p2Pos !== null && p2Pos < p1Pos;

                return (
                  <div
                    key={r.session.sessionId}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-[10px] text-muted-foreground shrink-0 w-[52px]">
                      {formatShortDate(r.session.datePlayed)}
                    </span>
                    <span
                      className="text-[11px] font-black tabular-nums flex-1 text-right"
                      style={{ color: p1Better ? p1Color : `${p1Color}55` }}
                    >
                      {p1Pos !== null ? ordinal(p1Pos) : "—"}
                    </span>
                    <span className="text-[9px] text-muted-foreground/40 shrink-0 w-4 text-center">
                      vs
                    </span>
                    <span
                      className="text-[11px] font-black tabular-nums flex-1"
                      style={{ color: p2Better ? p2Color : `${p2Color}55` }}
                    >
                      {p2Pos !== null ? ordinal(p2Pos) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1.5 border-t">
              <span className="text-[10px] text-muted-foreground">
                <span style={{ color: p1Color }}>{game.p1Wins}W</span>
                {" · "}
                <span style={{ color: p2Color }}>{game.p2Wins}W</span>
                {game.ties > 0 && ` · ${game.ties}T`}
              </span>
              <RotateCcw className="w-2.5 h-2.5 text-muted-foreground/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Win Streak Card ──────────────────────────────────────────────────

const WinStreakCard: React.FC<{
  streak: { profileId: number; streak: number } | null;
  pastStreaks: { profileId: number; streak: number }[];
  p1: TribeMember;
  p2: TribeMember;
  p1Color: string;
  p2Color: string;
}> = ({ streak, pastStreaks, p1, p2, p1Color, p2Color }) => {
  const [flipped, setFlipped] = useState(false);

  const getPlayer = (profileId: number) =>
    profileId === p1.profileId ? p1 : p2;
  const getColor = (profileId: number) =>
    profileId === p1.profileId ? p1Color : p2Color;

  if (!streak && pastStreaks.length === 0) {
    return (
      <Card className="h-52">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
          <Flame className="w-8 h-8 text-muted-foreground/30 mb-2" />
          <p className="text-xs text-muted-foreground">No active streak</p>
        </CardContent>
      </Card>
    );
  }

  const streakPlayer = streak ? getPlayer(streak.profileId) : null;
  const streakColor = streak ? getColor(streak.profileId) : p1Color;

  return (
    <div
      className="relative cursor-pointer select-none h-52"
      style={{ perspective: "1000px" }}
      onClick={() => setFlipped((f) => !f)}
      role="button"
      aria-label="Win streak — tap to see past streaks"
    >
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* ── FRONT ──── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border-2 bg-card flex flex-col"
          style={{
            backfaceVisibility: "hidden",
            borderColor: `${streakColor}50`,
          }}
        >
          {/* Ambient radial glow at top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 90% 55% at 50% 0%, ${streakColor}18, transparent)`,
            }}
          />

          {/* Badge */}
          <div
            className="flex items-center justify-center gap-1.5 py-1.5 shrink-0 border-b"
            style={{
              backgroundColor: `${streakColor}12`,
              borderColor: `${streakColor}25`,
            }}
          >
            <Flame className="w-3 h-3" style={{ color: streakColor }} />
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: streakColor }}
            >
              Current Win Streak
            </span>
          </div>

          {/* Player identity */}
          {streakPlayer ? (
            <div className="flex items-center gap-3 px-4 pt-3 shrink-0">
              <Avatar
                className="w-11 h-11 rounded-xl shrink-0"
                style={{ boxShadow: `0 0 0 2px ${streakColor}55` }}
              >
                <AvatarImage
                  src={streakPlayer.image || ""}
                  alt={streakPlayer.username}
                  className="object-cover"
                />
                <AvatarFallback
                  className="rounded-xl text-base font-black"
                  style={{
                    backgroundColor: `${streakColor}20`,
                    color: streakColor,
                  }}
                >
                  {streakPlayer.firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground leading-tight truncate">
                  {streakPlayer.firstName} {streakPlayer.lastName}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  @{streakPlayer.username}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 pt-3 shrink-0">
              <p className="text-sm font-bold text-muted-foreground">
                No active streak
              </p>
            </div>
          )}

          {/* Streak number — hero element */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <p
              className="text-7xl font-black tabular-nums leading-none"
              style={{ color: streakColor }}
            >
              {streak?.streak ?? "—"}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5">
              win streak
            </p>
          </div>

          {!flipped && (
            <div className="absolute bottom-2.5 right-2.5">
              <RotateCcw className="w-3 h-3 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* ── BACK ──── */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden bg-card border"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="p-3 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
              <Flame className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold">Past Streaks</p>
            </div>

            {pastStreaks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  No past streaks yet
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center gap-3">
                {pastStreaks.map((s, i) => {
                  const player = getPlayer(s.profileId);
                  const color = getColor(s.profileId);
                  return (
                    <div key={i} className="flex items-center gap-2.5">
                      <Avatar className="w-8 h-8 rounded-lg shrink-0">
                        <AvatarImage
                          src={player.image || ""}
                          alt={player.username}
                          className="object-cover"
                        />
                        <AvatarFallback
                          className="text-xs font-black rounded-lg"
                          style={{
                            backgroundColor: `${color}20`,
                            color,
                          }}
                        >
                          {player.firstName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight truncate">
                          {player.firstName} {player.lastName}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className="text-lg font-black tabular-nums"
                          style={{ color }}
                        >
                          {s.streak}
                        </span>
                        <Flame className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-end pt-1.5 border-t">
              <RotateCcw className="w-2.5 h-2.5 text-muted-foreground/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Empty / Select State ─────────────────────────────────────────────

const EmptyState: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay: 0.1 }}
    className="flex flex-col items-center justify-center py-16 text-center"
  >
    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/10 to-accent-2/10 flex items-center justify-center mb-5">
      <Swords className="w-10 h-10 text-primary/60" />
    </div>
    <h3 className="text-lg font-semibold mb-1">Select two players</h3>
    <p className="text-muted-foreground text-sm max-w-xs">
      Pick two tribe members above to compare their stats head-to-head.
    </p>
  </motion.div>
);

// ── Main Component ───────────────────────────────────────────────────

const HeadToHeadView: React.FC<HeadToHeadViewProps> = ({
  members,
  sessions,
  histStats,
  userId,
  groupId,
}) => {
  const [player1Id, setPlayer1Id] = useState<number | null>(userId);
  const [player2Id, setPlayer2Id] = useState<number | null>(null);
  const [p1Color, setP1Color] = useState("#22c55e");
  const [p2Color, setP2Color] = useState("#8b5cf6");

  useEffect(() => {
    const c1 = getCssVar("--accent-2");
    const c2 = getCssVar("--accent-5");
    if (c1) setP1Color(c1);
    if (c2) setP2Color(c2);
  }, []);

  const p1Member = members.find((m) => m.profileId === player1Id);
  const p2Member = members.find((m) => m.profileId === player2Id);
  const bothSelected = p1Member && p2Member && player1Id !== player2Id;

  // Overall stats per player
  const p1Overall = useMemo(
    () => (player1Id ? getPlayerOverall(sessions, player1Id) : null),
    [sessions, player1Id],
  );
  const p2Overall = useMemo(
    () => (player2Id ? getPlayerOverall(sessions, player2Id) : null),
    [sessions, player2Id],
  );

  // WPA from rolling stats
  const getWpa = (profileId: number) => {
    const rs = histStats.rollingStats.find((s) => s.profileId === profileId);
    return rs && rs.sessionsPlayed > 0
      ? rs.rollingScore / rs.sessionsPlayed
      : 0;
  };

  // H2H calculation
  const h2h = useMemo(() => {
    if (!bothSelected || !player1Id || !player2Id) return null;
    return calculateHeadToHead(sessions, player1Id, player2Id);
  }, [sessions, player1Id, player2Id, bothSelected]);

  // Build comparison rows
  const overallRows = useMemo((): ComparisonRowData[] => {
    if (!p1Overall || !p2Overall) return [];
    return [
      {
        label: "Games",
        p1Value: p1Overall.gamesPlayed,
        p2Value: p2Overall.gamesPlayed,
      },
      { label: "Wins", p1Value: p1Overall.wins, p2Value: p2Overall.wins },
      { label: "Ties", p1Value: p1Overall.ties, p2Value: p2Overall.ties },
      {
        label: "Win %",
        p1Value: p1Overall.winRate,
        p2Value: p2Overall.winRate,
        format: formatPct,
      },
      {
        label: "BGA %",
        p1Value: p1Overall.bgaWinRate,
        p2Value: p2Overall.bgaWinRate,
        format: formatPct,
      },
      {
        label: "Avg Wt",
        p1Value: p1Overall.avgWeight,
        p2Value: p2Overall.avgWeight,
        format: formatWeight,
      },
    ];
  }, [p1Overall, p2Overall]);

  const comparativeRows = useMemo((): ComparisonRowData[] => {
    if (!h2h) return [];
    const rows: ComparisonRowData[] = [
      { label: "H2H Wins", p1Value: h2h.p1H2HWins, p2Value: h2h.p2H2HWins },
      { label: "H2H Ties", p1Value: h2h.h2hTies, p2Value: h2h.h2hTies },
    ];

    // Win rate by player count
    h2h.h2hByPlayerCount.forEach((b) => {
      if (b.total === 0) return;
      const p1Rate = b.total > 0 ? Math.round((b.p1Wins / b.total) * 100) : 0;
      const p2Rate = b.total > 0 ? Math.round((b.p2Wins / b.total) * 100) : 0;
      rows.push({
        label: `${b.label} WR`,
        p1Value: p1Rate,
        p2Value: p2Rate,
        format: formatPct,
      });
    });

    // Win rate by weight
    h2h.h2hByWeight.forEach((b) => {
      if (b.total === 0) return;
      const p1Rate = b.total > 0 ? Math.round((b.p1Wins / b.total) * 100) : 0;
      const p2Rate = b.total > 0 ? Math.round((b.p2Wins / b.total) * 100) : 0;
      rows.push({
        label: `${b.label}`,
        p1Value: p1Rate,
        p2Value: p2Rate,
        format: formatPct,
      });
    });

    return rows;
  }, [h2h]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* ── Player selectors ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-2 gap-3 sm:gap-4"
      >
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Player 1
          </label>
          <PlayerSearchSelect
            members={members}
            selectedId={player1Id}
            onSelect={setPlayer1Id}
            placeholder="Player 1..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            Player 2
          </label>
          <PlayerSearchSelect
            members={members}
            selectedId={player2Id}
            onSelect={setPlayer2Id}
            placeholder="Player 2..."
          />
        </div>
      </motion.div>

      {!bothSelected && <EmptyState />}

      {bothSelected &&
        p1Member &&
        p2Member &&
        h2h &&
        player1Id &&
        player2Id && (
          <motion.div
            key={`${player1Id}-${player2Id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            {/* ── Comparison Table ───────────────────────────────── */}
            <Card>
              <CardContent className="px-4 sm:px-6 pt-5 pb-4">
                {/* Player info header */}
                <div className="mb-5 space-y-3">
                  {/* Row 1: names + swords */}
                  <div className="flex items-center justify-between gap-2">
                    {/* P1 name */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <p
                        className="text-base sm:text-2xl font-black leading-tight"
                        style={{ color: p1Color }}
                      >
                        {p1Member.firstName}{" "}
                        <span className="sm:inline">{p1Member.lastName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        @{p1Member.username}
                      </p>
                    </div>

                    {/* Center: Swords + games together */}
                    <div className="flex flex-col items-center gap-1 shrink-0 px-2">
                      <Swords className="w-5 h-5 sm:w-7 sm:h-7 text-muted-foreground/40" />
                      <div className="text-center">
                        <p className="text-xl sm:text-3xl font-black leading-none">
                          {h2h.sharedSessions.length}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
                          together
                        </p>
                      </div>
                    </div>

                    {/* P2 name */}
                    <div className="flex flex-col min-w-0 flex-1 items-end">
                      <p
                        className="text-base sm:text-2xl font-black leading-tight text-right"
                        style={{ color: p2Color }}
                      >
                        {p2Member.firstName}{" "}
                        <span className="sm:inline">{p2Member.lastName}</span>
                      </p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        @{p2Member.username}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: WPA boxes */}
                  <div className="flex items-stretch gap-2 sm:hidden">
                    <div
                      className="flex flex-col items-center justify-center py-2 px-3 rounded-xl border-2 font-black tabular-nums flex-1"
                      style={{ borderColor: p1Color, color: p1Color }}
                    >
                      <span className="text-xl leading-none">
                        {getWpa(player1Id).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">
                        WPA
                      </span>
                    </div>
                    <div
                      className="flex flex-col items-center justify-center py-2 px-3 rounded-xl border-2 font-black tabular-nums flex-1"
                      style={{ borderColor: p2Color, color: p2Color }}
                    >
                      <span className="text-xl leading-none">
                        {getWpa(player2Id).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">
                        WPA
                      </span>
                    </div>
                  </div>

                  {/* Desktop: WPA inline with names (hidden on mobile) */}
                  <div className="hidden sm:flex items-center justify-between gap-2">
                    <div
                      className="flex flex-col items-center justify-center px-3 py-2 rounded-xl border-2 font-black tabular-nums shrink-0"
                      style={{ borderColor: p1Color, color: p1Color }}
                    >
                      <span className="text-2xl leading-none">
                        {getWpa(player1Id).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">
                        WPA
                      </span>
                    </div>
                    <div className="flex-1" />
                    <div
                      className="flex flex-col items-center justify-center px-3 py-2 rounded-xl border-2 font-black tabular-nums shrink-0"
                      style={{ borderColor: p2Color, color: p2Color }}
                    >
                      <span className="text-2xl leading-none">
                        {getWpa(player2Id).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-0.5">
                        WPA
                      </span>
                    </div>
                  </div>
                </div>

                <SectionLabel label="Overall" />
                {overallRows.map((row) => (
                  <ComparisonRow
                    key={row.label}
                    row={row}
                    p1Color={p1Color}
                    p2Color={p2Color}
                  />
                ))}

                {h2h.sharedSessions.length > 0 && (
                  <>
                    <SectionLabel label="Head to Head" />
                    {comparativeRows.map((row) => (
                      <ComparisonRow
                        key={row.label}
                        row={row}
                        p1Color={p1Color}
                        p2Color={p2Color}
                      />
                    ))}
                  </>
                )}
              </CardContent>
            </Card>

            {/* ── WPA Over Time ──────────────────────────────────── */}
            <H2HWpaChart
              dailyStats={histStats.dailyPlayerStats}
              rollingStats={histStats.rollingStats}
              p1Id={player1Id}
              p2Id={player2Id}
              p1Name={p1Member.firstName}
              p2Name={p2Member.firstName}
              groupId={groupId}
            />

            {/* ── Bottom Cards: Most Played + Win Streak ─────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {h2h.mostPlayedGame ? (
                <MostPlayedFlipCard
                  game={h2h.mostPlayedGame}
                  p1Name={p1Member.firstName}
                  p2Name={p2Member.firstName}
                  p1Color={p1Color}
                  p2Color={p2Color}
                  p1Id={player1Id}
                  p2Id={player2Id}
                />
              ) : (
                <Card className="h-[195px]">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <Gamepad2 className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      No games played together
                    </p>
                  </CardContent>
                </Card>
              )}

              <WinStreakCard
                streak={h2h.currentStreak}
                pastStreaks={h2h.pastStreaks}
                p1={p1Member}
                p2={p2Member}
                p1Color={p1Color}
                p2Color={p2Color}
              />
            </div>
          </motion.div>
        )}
    </div>
  );
};

export default HeadToHeadView;
