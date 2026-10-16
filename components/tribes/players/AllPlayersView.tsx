"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Crown,
  Users,
  Trophy,
  Dices,
  TrendingUp,
  Shield,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import {
  type GameSession,
  type TribeMember,
  type HistStatsInterface,
  type MemberElo,
} from "@/types/tribes";
import { calculateBadges, BadgeInfo } from "@/utils/playerStatsCalculations";
import { eloTier, isCalibrated } from "@/utils/elo";
import { CalibratingMark, ELO_TIER_CLASS } from "@/components/GameSessionCard";
import PlayerBadge from "./PlayerBadge";

const TOP_ELO_GAMES = 3;

interface AllPlayersViewProps {
  members: TribeMember[];
  sessions: GameSession[];
  histStats: HistStatsInterface;
  onPlayerSelect: (profileId: number) => void;
}

const getRoleBadge = (roleId: number) => {
  if (roleId === 1) {
    return (
      <Badge
        variant="default"
        className="bg-accent-5 hover:bg-accent-5/90 text-white"
      >
        <Crown className="w-3 h-3 mr-1 fill-white" />
        SuperAdmin
      </Badge>
    );
  }
  if (roleId === 2) {
    return (
      <Badge
        variant="default"
        className="bg-accent-2 hover:bg-accent-2/90 text-white"
      >
        <Shield className="w-3 h-3 mr-1 fill-white" />
        Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      <Users className="w-3 h-3 mr-1" />
      Member
    </Badge>
  );
};

// One cell of the stats strip: small label over a bold value
const StatCell: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}> = ({ icon, label, value, valueClassName }) => (
  <div className="flex flex-col items-center gap-0.5 px-2 py-2">
    <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {icon}
      {label}
    </span>
    <span
      className={cn(
        "text-lg font-bold leading-tight tabular-nums",
        valueClassName,
      )}
    >
      {value}
    </span>
  </div>
);

// One of a member's highest-Elo games: thumbnail, title, Elo in its tier
const TopEloRow: React.FC<{ entry: MemberElo }> = ({ entry }) => {
  const elo = Math.round(entry.elo);
  const title = entry.gameTitle ?? "Unknown game";
  return (
    <li className="flex items-center gap-2">
      <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
        {entry.thumbnail ? (
          <Image
            src={entry.thumbnail}
            alt={title}
            fill
            sizes="24px"
            className="object-cover"
          />
        ) : (
          <Dices className="size-3.5 text-muted-foreground" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{title}</span>
      <span
        className={cn(
          "shrink-0 px-1.5 py-0.5 text-xs font-bold tabular-nums",
          ELO_TIER_CLASS[eloTier(elo)],
        )}
      >
        {elo}
        {!isCalibrated(entry.sessionsPlayed) && <CalibratingMark />}
      </span>
    </li>
  );
};

const AllPlayersView: React.FC<AllPlayersViewProps> = ({
  members,
  sessions,
  histStats,
  onPlayerSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate badges
  const badgeMap = useMemo(
    () => calculateBadges(sessions, members, histStats.memberElos),
    [sessions, members, histStats.memberElos],
  );

  // Filter members by search query
  const filteredMembers = useMemo(() => {
    const sorted = [...members].sort((a, b) => b.gamesPlayed - a.gamesPlayed);
    if (!searchQuery) return sorted;

    const q = searchQuery.toLowerCase();
    return sorted.filter(
      (m) =>
        m.username.toLowerCase().includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q),
    );
  }, [members, searchQuery]);

  // Get all badges for a member
  const getMemberBadges = (profileId: number): BadgeInfo[] => {
    return badgeMap.get(profileId) || [];
  };

  // Each member's highest-Elo games, in any Tribe, highest first
  const topElosByMember = useMemo(() => {
    const byMember = new Map<number, MemberElo[]>();
    for (const entry of [...histStats.memberElos].sort(
      (a, b) => b.elo - a.elo,
    )) {
      const list = byMember.get(entry.profileId) ?? [];
      if (list.length < TOP_ELO_GAMES) list.push(entry);
      byMember.set(entry.profileId, list);
    }
    return byMember;
  }, [histStats.memberElos]);

  // Current tribe WPA: mean score over Rated Sessions
  const getWpa = (profileId: number): string => {
    const rs = histStats.rollingStats.find((s) => s.profileId === profileId);
    return rs && rs.sessionsPlayed > 0
      ? (rs.rollingScore / rs.sessionsPlayed).toFixed(2)
      : "0.00";
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Tribe Members</h2>
          <Badge variant="outline" className="ml-2">
            {members.length} total
          </Badge>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-5"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-background outline-none focus:ring-2 focus:ring-primary/20 transition-shadow placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-muted-foreground mt-1.5 ml-1">
            {filteredMembers.length} result
            {filteredMembers.length !== 1 ? "s" : ""}
          </p>
        )}
      </motion.div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member, index) => {
          const badges = getMemberBadges(member.profileId);
          const topElos = topElosByMember.get(member.profileId) ?? [];
          return (
            <motion.div
              key={member.profileId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="h-full gap-4 hover:shadow-lg transition-all cursor-pointer hover:border-primary/20 active:scale-[0.98]"
                onClick={() => onPlayerSelect(member.profileId)}
              >
                <CardHeader className="relative">
                  {/* Badge icons (top-right) */}
                  {badges.length > 0 && (
                    <div className="absolute top-3 right-3 flex gap-1">
                      {badges.map((badge) => (
                        <PlayerBadge key={badge.type} badge={badge} size="sm" />
                      ))}
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <Avatar className="w-14 h-14 ring-2 ring-background shadow-md">
                      <AvatarImage
                        src={member.image || ""}
                        alt={member.username}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                        {member.firstName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 pr-8">
                      <CardTitle className="text-base truncate">
                        {member.firstName} {member.lastName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        @{member.username}
                      </p>
                      <div className="mt-1">{getRoleBadge(member.roleId)}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Stats strip: games, wins, current tribe WPA */}
                  <div className="grid grid-cols-3 divide-x divide-border rounded-lg border bg-muted/30">
                    <StatCell
                      icon={<Dices className="size-3 text-primary" />}
                      label="Games"
                      value={member.gamesPlayed}
                    />
                    <StatCell
                      icon={<Trophy className="size-3 text-amber-500" />}
                      label="Wins"
                      value={member.wins}
                    />
                    <StatCell
                      icon={<TrendingUp className="size-3 text-accent-4" />}
                      label="WPA"
                      value={getWpa(member.profileId)}
                      valueClassName="text-accent-4"
                    />
                  </div>

                  {/* Highest-Elo games */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Top Elo
                    </p>
                    {topElos.length > 0 ? (
                      <ul className="space-y-1.5">
                        {topElos.map((entry) => (
                          <TopEloRow key={entry.gameId} entry={entry} />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No rated games yet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredMembers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            {searchQuery ? (
              <Search className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Users className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-medium mb-2">
            {searchQuery ? "No Results" : "No Members Yet"}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try a different search term"
              : "Invite friends to join your tribe!"}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default AllPlayersView;
